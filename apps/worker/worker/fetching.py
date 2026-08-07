"""HTTP fetching with the guards a server-side fetcher must have.

Two of these are not optional. Without the address check, "scrape this URL" is
an SSRF hole that reaches the Docker network and cloud metadata endpoints.
Without robots.txt, we are a badly behaved bot on someone else's server.
"""

import ipaddress
import socket
from urllib.parse import urljoin, urlparse
from urllib.robotparser import RobotFileParser

import httpx
from shared import get_logger

log = get_logger(__name__)

USER_AGENT = "AgentSDR/0.1 (+https://github.com/deepshukla08/ai-lead-generator)"
TIMEOUT = httpx.Timeout(15.0, connect=8.0)
MAX_BYTES = 5 * 1024 * 1024


class UnsafeUrl(Exception):
    """The URL resolves somewhere a server-side fetcher must not go."""


def assert_public_http_url(url: str) -> None:
    """Reject anything that is not a public http(s) address.

    Resolves the hostname first: `http://localhost.evil.com` can resolve to
    127.0.0.1, so checking the literal string is not enough.
    """
    parsed = urlparse(url)
    if parsed.scheme not in ("http", "https"):
        raise UnsafeUrl(f"unsupported scheme: {parsed.scheme!r}")
    if not parsed.hostname:
        raise UnsafeUrl("missing hostname")

    try:
        infos = socket.getaddrinfo(parsed.hostname, None)
    except socket.gaierror as exc:
        raise UnsafeUrl(f"cannot resolve {parsed.hostname}") from exc

    for info in infos:
        address = ipaddress.ip_address(info[4][0])
        if (
            address.is_private
            or address.is_loopback
            or address.is_link_local  # 169.254.169.254 — cloud metadata
            or address.is_reserved
            or address.is_multicast
            or address.is_unspecified
        ):
            raise UnsafeUrl(f"{parsed.hostname} resolves to a non-public address ({address})")


class RobotsPolicy:
    """robots.txt for one origin, fetched once."""

    def __init__(self, origin: str, parser: RobotFileParser | None) -> None:
        self._origin = origin
        self._parser = parser

    @classmethod
    async def load(cls, client: httpx.AsyncClient, origin: str) -> "RobotsPolicy":
        parser = RobotFileParser()
        try:
            response = await client.get(urljoin(origin, "/robots.txt"))
            if response.status_code == 200:
                parser.parse(response.text.splitlines())
            else:
                # No robots.txt means no restrictions, which is the standard reading.
                parser.parse([])
        except httpx.HTTPError:
            log.warning("robots.unreachable", origin=origin)
            parser.parse([])
        return cls(origin, parser)

    def allows(self, url: str) -> bool:
        return self._parser is None or self._parser.can_fetch(USER_AGENT, url)


def build_client() -> httpx.AsyncClient:
    return httpx.AsyncClient(
        headers={"User-Agent": USER_AGENT},
        timeout=TIMEOUT,
        follow_redirects=True,
        max_redirects=5,
    )


async def fetch_html(client: httpx.AsyncClient, url: str) -> str | None:
    """Returns HTML, or None when the response is not usable."""
    assert_public_http_url(url)
    try:
        response = await client.get(url)
    except httpx.HTTPError as exc:
        log.warning("fetch.failed", url=url, error=str(exc))
        return None

    if response.status_code != 200:
        return None
    if "html" not in response.headers.get("content-type", ""):
        return None
    if len(response.content) > MAX_BYTES:
        log.warning("fetch.too_large", url=url, bytes=len(response.content))
        return None
    return response.text
