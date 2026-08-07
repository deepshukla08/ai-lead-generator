"""Crawl a company website and turn it into knowledge sources.

Same-origin only, robots-respecting, capped. The output is plain text per page,
POSTed to the API as an ordinary knowledge source — so a scraped page is
viewable, editable and deletable exactly like an uploaded PDF, and the API
stays the only writer to the database.
"""

import asyncio
import re
from urllib.parse import urldefrag, urljoin, urlparse

import httpx
import trafilatura
from shared import get_logger

from worker.fetching import RobotsPolicy, build_client, fetch_html

log = get_logger(__name__)

# Pages that actually say what a company sells. Crawling a whole site to find
# them wastes requests and buries the useful text in blog archives.
PRIORITY_HINTS = (
    "about",
    "product",
    "solution",
    "service",
    "platform",
    "feature",
    "pricing",
    "customer",
    "case-stud",
    "case_stud",
    "success",
    "industr",
    "why-",
    "how-it-works",
    "use-case",
)

SKIP_PATTERNS = re.compile(
    r"(\.pdf|\.jpg|\.jpeg|\.png|\.gif|\.svg|\.zip|\.mp4|\.css|\.js)$"
    r"|/(blog|news|press|careers|jobs|legal|privacy|terms|cookie|login|signin|signup)(/|$)",
    re.IGNORECASE,
)

MIN_TEXT_CHARS = 200


def _normalise(url: str) -> str:
    """Drop the fragment and any trailing slash so /about and /about#top are one page."""
    clean, _ = urldefrag(url)
    return clean.rstrip("/") or clean


def _same_origin(url: str, origin: str) -> bool:
    return urlparse(url).netloc.lower() == urlparse(origin).netloc.lower()


def _extract_links(html: str, base_url: str, origin: str) -> list[str]:
    links: list[str] = []
    for match in re.finditer(r'href=["\']([^"\']+)["\']', html, re.IGNORECASE):
        absolute = _normalise(urljoin(base_url, match.group(1)))
        if not _same_origin(absolute, origin) or SKIP_PATTERNS.search(absolute):
            continue
        links.append(absolute)
    return links


def _priority(url: str) -> int:
    """Lower sorts first. Homepage first, then pages whose path looks informative."""
    path = urlparse(url).path.strip("/")
    if not path:
        return 0
    return 1 if any(hint in path.lower() for hint in PRIORITY_HINTS) else 2


def _extract_text(html: str, url: str) -> str | None:
    """Main content only.

    trafilatura strips nav, footers and cookie banners. Feeding raw HTML to an
    embedding model buries the two useful paragraphs under the same menu text
    repeated on every page, which makes every chunk look alike.
    """
    text = trafilatura.extract(
        html,
        url=url,
        include_comments=False,
        include_tables=True,
        favor_precision=True,
    )
    if not text or len(text) < MIN_TEXT_CHARS:
        return None
    return text


async def crawl(
    start_url: str, *, max_pages: int = 15, delay_seconds: float = 0.5
) -> list[tuple[str, str]]:
    """Return [(url, text)] for up to `max_pages` pages of one site."""
    origin = f"{urlparse(start_url).scheme}://{urlparse(start_url).netloc}"
    seen: set[str] = set()
    queued: list[str] = [_normalise(start_url)]
    results: list[tuple[str, str]] = []

    async with build_client() as client:
        robots = await RobotsPolicy.load(client, origin)

        while queued and len(results) < max_pages:
            queued.sort(key=_priority)
            url = queued.pop(0)
            if url in seen:
                continue
            seen.add(url)

            if not robots.allows(url):
                log.info("crawl.disallowed", url=url)
                continue

            html = await fetch_html(client, url)
            if html is None:
                continue

            text = _extract_text(html, url)
            if text:
                results.append((url, text))
                log.info("crawl.page", url=url, chars=len(text), total=len(results))

            for link in _extract_links(html, url, origin):
                if link not in seen and link not in queued:
                    queued.append(link)

            # Politeness. We are a guest on someone else's server.
            await asyncio.sleep(delay_seconds)

    return results


async def publish_pages(api_url: str, company_id: str, pages: list[tuple[str, str]]) -> int:
    """POST each page to the API as a knowledge source.

    The worker deliberately has no database access: the API validates, scopes
    to the workspace and owns every write, whether the caller is a browser or
    this job.
    """
    published = 0
    async with httpx.AsyncClient(timeout=httpx.Timeout(30.0)) as client:
        for url, text in pages:
            filename = f"{urlparse(url).path.strip('/').replace('/', '-') or 'homepage'}.txt"
            try:
                response = await client.post(
                    f"{api_url}/api/v1/companies/{company_id}/knowledge-sources",
                    data={"kind": "website", "source_url": url},
                    files={"file": (filename, text.encode("utf-8"), "text/plain")},
                )
                response.raise_for_status()
                published += 1
            except httpx.HTTPError as exc:
                log.warning("publish.failed", url=url, error=str(exc))
    return published
