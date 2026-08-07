"""The onboarding flow, end to end through HTTP."""

PDF = ("brochure.pdf", b"%PDF-1.4 fake but well formed enough", "application/pdf")


def _create_company(client, name: str = "Acme Robotics") -> dict:
    response = client.post(
        "/api/v1/companies",
        json={
            "name": name,
            "website": "https://acme.example",
            "description": "We build warehouse robots.",
            "icp_description": "Mid-market logistics operators in the EU.",
        },
    )
    assert response.status_code == 201, response.text
    return response.json()


def test_create_and_read_current_profile(client) -> None:
    created = _create_company(client)
    assert created["status"] == "onboarding"
    assert created["product_knowledge"] == {}

    current = client.get("/api/v1/companies/current")
    assert current.status_code == 200
    assert current.json()["id"] == created["id"]


def test_blank_name_is_rejected(client) -> None:
    response = client.post("/api/v1/companies", json={"name": "   "})
    assert response.status_code == 422


def test_upload_registers_a_pending_knowledge_source(client) -> None:
    company = _create_company(client, "Upload Co")

    response = client.post(
        f"/api/v1/companies/{company['id']}/knowledge-sources",
        data={"kind": "brochure"},
        files={"file": PDF},
    )
    assert response.status_code == 201, response.text
    source = response.json()
    assert source["kind"] == "brochure"
    assert source["status"] == "pending"
    assert source["original_filename"] == "brochure.pdf"
    assert source["size_bytes"] == len(PDF[1])

    listed = client.get(f"/api/v1/companies/{company['id']}/knowledge-sources")
    assert [s["id"] for s in listed.json()] == [source["id"]]


def test_unsupported_content_type_is_rejected(client) -> None:
    company = _create_company(client, "Reject Co")
    response = client.post(
        f"/api/v1/companies/{company['id']}/knowledge-sources",
        data={"kind": "brochure"},
        files={"file": ("payload.exe", b"MZ...", "application/x-msdownload")},
    )
    assert response.status_code == 422


def test_oversized_upload_is_rejected(client) -> None:
    from app.core.config import get_settings

    company = _create_company(client, "Big File Co")
    oversized = b"x" * (get_settings().max_upload_bytes + 1)
    response = client.post(
        f"/api/v1/companies/{company['id']}/knowledge-sources",
        data={"kind": "documentation"},
        files={"file": ("huge.txt", oversized, "text/plain")},
    )
    assert response.status_code in (413, 422)


def test_edit_profile_updates_only_the_fields_sent(client) -> None:
    company = _create_company(client, "Editable Co")

    response = client.patch(
        f"/api/v1/companies/{company['id']}",
        json={"description": "Rewritten description."},
    )
    assert response.status_code == 200, response.text
    updated = response.json()
    assert updated["description"] == "Rewritten description."
    # Untouched fields survive a partial update.
    assert updated["name"] == "Editable Co"
    assert updated["icp_description"] == company["icp_description"]


def test_delete_removes_the_source_and_its_file(client, tmp_path) -> None:
    company = _create_company(client, "Deletable Co")
    created = client.post(
        f"/api/v1/companies/{company['id']}/knowledge-sources",
        data={"kind": "brochure"},
        files={"file": PDF},
    ).json()

    stored = list(tmp_path.rglob("*.pdf"))
    assert len(stored) == 1

    response = client.delete(
        f"/api/v1/companies/{company['id']}/knowledge-sources/{created['id']}"
    )
    assert response.status_code == 204

    assert list(tmp_path.rglob("*.pdf")) == []
    listed = client.get(f"/api/v1/companies/{company['id']}/knowledge-sources").json()
    assert listed == []


def test_deleting_a_source_from_another_company_is_404(client) -> None:
    """The id alone must not be enough — it has to belong to that company."""
    owner = _create_company(client, "Owner Co")
    other = _create_company(client, "Other Co")
    source = client.post(
        f"/api/v1/companies/{owner['id']}/knowledge-sources",
        data={"kind": "brochure"},
        files={"file": PDF},
    ).json()

    response = client.delete(
        f"/api/v1/companies/{other['id']}/knowledge-sources/{source['id']}"
    )
    assert response.status_code == 404


def test_upload_to_an_unknown_company_is_404(client) -> None:
    response = client.post(
        "/api/v1/companies/00000000-0000-0000-0000-0000000000ff/knowledge-sources",
        data={"kind": "brochure"},
        files={"file": PDF},
    )
    assert response.status_code == 404
