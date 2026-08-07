"""The SSRF guard.

Without this check, "scrape this URL" lets anyone reach the Docker network and
the cloud metadata endpoint through our server. These are the cases that matter.
"""

import pytest

from worker.fetching import UnsafeUrl, assert_public_http_url


@pytest.mark.parametrize(
    "url",
    [
        "http://127.0.0.1/admin",
        "http://localhost:8000/api/v1/companies",
        "http://169.254.169.254/latest/meta-data/",  # cloud metadata
        "http://10.0.0.5/internal",
        "http://192.168.1.1/",
        "http://[::1]/",
        "http://postgres:5432/",  # a compose service name
        "file:///etc/passwd",
        "ftp://example.com/",
    ],
)
def test_non_public_targets_are_refused(url: str) -> None:
    with pytest.raises(UnsafeUrl):
        assert_public_http_url(url)


def test_a_public_https_url_is_allowed() -> None:
    assert_public_http_url("https://example.com/about")


def test_unresolvable_hostnames_are_refused() -> None:
    with pytest.raises(UnsafeUrl):
        assert_public_http_url("https://no-such-host.invalid/")
