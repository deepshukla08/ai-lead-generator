"""The schema's promises, asserted against a real database.

Each of these is a rule the design claims to enforce. A comment claiming it is
not evidence; a failing INSERT is.
"""

import uuid

import pytest
from sqlalchemy import select, text
from sqlalchemy.exc import DBAPIError, IntegrityError

from app.models import Campaign, Lead, ProspectCompany

WORKSPACE = uuid.UUID("00000000-0000-0000-0000-000000000001")


async def _prospect(session, domain: str) -> ProspectCompany:
    company = ProspectCompany(workspace_id=WORKSPACE, domain=domain, name=domain)
    session.add(company)
    await session.flush()
    return company


async def test_prospect_domain_is_unique_per_workspace(session) -> None:
    """The dedup key. Without it we research the same company twice."""
    await _prospect(session, "dedup-me.com")
    await session.commit()

    session.add(ProspectCompany(workspace_id=WORKSPACE, domain="dedup-me.com"))
    with pytest.raises(IntegrityError):
        await session.commit()


async def test_fit_score_outside_zero_to_hundred_is_rejected(session) -> None:
    company = await _prospect(session, f"score-{uuid.uuid4().hex}.com")
    campaign = Campaign(workspace_id=WORKSPACE, name="Q3 push")
    session.add(campaign)
    await session.flush()

    session.add(
        Lead(
            workspace_id=WORKSPACE,
            campaign_id=campaign.id,
            prospect_company_id=company.id,
            fit_score=101,
        )
    )
    with pytest.raises((IntegrityError, DBAPIError)):
        await session.commit()


async def test_same_company_can_be_a_lead_in_two_campaigns(session) -> None:
    """Fit is per-campaign: a 92 for enterprise can be a 40 for SMB."""
    company = await _prospect(session, f"multi-{uuid.uuid4().hex}.com")
    enterprise = Campaign(workspace_id=WORKSPACE, name="Enterprise")
    smb = Campaign(workspace_id=WORKSPACE, name="SMB")
    session.add_all([enterprise, smb])
    await session.flush()

    session.add_all(
        [
            Lead(
                workspace_id=WORKSPACE,
                campaign_id=enterprise.id,
                prospect_company_id=company.id,
                fit_score=92,
            ),
            Lead(
                workspace_id=WORKSPACE,
                campaign_id=smb.id,
                prospect_company_id=company.id,
                fit_score=40,
            ),
        ]
    )
    await session.commit()

    scores = (
        (
            await session.execute(
                select(Lead.fit_score).where(Lead.prospect_company_id == company.id)
            )
        )
        .scalars()
        .all()
    )
    assert sorted(scores) == [40, 92]


async def test_a_company_cannot_be_a_lead_twice_in_one_campaign(session) -> None:
    company = await _prospect(session, f"dupe-{uuid.uuid4().hex}.com")
    campaign = Campaign(workspace_id=WORKSPACE, name="Duplicate")
    session.add(campaign)
    await session.flush()

    session.add_all(
        [
            Lead(
                workspace_id=WORKSPACE,
                campaign_id=campaign.id,
                prospect_company_id=company.id,
            ),
            Lead(
                workspace_id=WORKSPACE,
                campaign_id=campaign.id,
                prospect_company_id=company.id,
            ),
        ]
    )
    with pytest.raises(IntegrityError):
        await session.commit()


async def test_updated_at_trigger_fires_on_raw_sql(session) -> None:
    """The whole point of the DB trigger: the ORM is not involved here."""
    company = await _prospect(session, f"trigger-{uuid.uuid4().hex}.com")
    await session.commit()
    before = company.updated_at

    await session.execute(
        text("UPDATE prospect_companies SET name = :n WHERE id = :i"),
        {"n": "renamed by raw sql", "i": company.id},
    )
    await session.commit()

    after = (
        await session.execute(
            text("SELECT updated_at FROM prospect_companies WHERE id = :i"),
            {"i": company.id},
        )
    ).scalar_one()
    assert after > before


async def test_deleting_a_prospect_referenced_by_a_lead_is_refused(session) -> None:
    """RESTRICT: a shared prospect must not gut another campaign's lead list."""
    company = await _prospect(session, f"restrict-{uuid.uuid4().hex}.com")
    campaign = Campaign(workspace_id=WORKSPACE, name="Restrict")
    session.add(campaign)
    await session.flush()
    session.add(
        Lead(
            workspace_id=WORKSPACE,
            campaign_id=campaign.id,
            prospect_company_id=company.id,
        )
    )
    await session.commit()

    # Postgres enforces this immediately, so the DELETE itself raises.
    with pytest.raises(IntegrityError):
        await session.execute(
            text("DELETE FROM prospect_companies WHERE id = :i"), {"i": company.id}
        )
    await session.rollback()
