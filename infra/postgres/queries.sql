-- Scratch queries for local development.
-- Open in VS Code with the PostgreSQL extension, pick the `agentsdr` database
-- in the connection bar, put the cursor in a statement and press Ctrl+Shift+E.

-- ---------------------------------------------------------------- overview --

-- Which tables actually have data?
SELECT relname AS table_name, n_live_tup AS rows
FROM pg_stat_user_tables
ORDER BY n_live_tup DESC, relname;

-- Which migration is applied?
SELECT * FROM alembic_version;

-- --------------------------------------------------------------- onboarding --

SELECT id, name, website, status, product_knowledge, created_at
FROM company_profiles;

SELECT ks.id, cp.name AS company, ks.kind, ks.status,
       ks.original_filename, ks.size_bytes, ks.storage_key
FROM knowledge_sources ks
JOIN company_profiles cp ON cp.id = ks.company_profile_id
ORDER BY ks.created_at DESC;

-- Chunks per source (fills up in Phase 3).
SELECT ks.original_filename, count(kc.id) AS chunks
FROM knowledge_sources ks
LEFT JOIN knowledge_chunks kc ON kc.knowledge_source_id = ks.id
GROUP BY ks.original_filename;

-- ------------------------------------------------------------------- leads --

-- The lead explorer query: best fits first, with the company attached.
SELECT pc.name, pc.domain, l.fit_score, l.confidence, l.status,
       l.qualification_reason
FROM leads l
JOIN prospect_companies pc ON pc.id = l.prospect_company_id
WHERE l.fit_score >= 85
ORDER BY l.fit_score DESC;

-- The same company scored differently per campaign — the reason lead and
-- prospect_company are separate tables.
SELECT pc.domain, c.name AS campaign, l.fit_score
FROM leads l
JOIN prospect_companies pc ON pc.id = l.prospect_company_id
JOIN campaigns c ON c.id = l.campaign_id
ORDER BY pc.domain, l.fit_score DESC;

-- --------------------------------------------------------------- approvals --

SELECT ed.id, pc.name AS company, ct.full_name, ct.email, ct.email_status,
       ed.subject, ed.status, ed.revision
FROM email_drafts ed
JOIN leads l ON l.id = ed.lead_id
JOIN prospect_companies pc ON pc.id = l.prospect_company_id
LEFT JOIN contacts ct ON ct.id = ed.contact_id
WHERE ed.status = 'pending'
ORDER BY ed.created_at;

-- ------------------------------------------------------------ what happened --

SELECT created_at, kind, message
FROM timeline_events
ORDER BY created_at DESC
LIMIT 50;

SELECT agent_name, status, count(*),
       avg(extract(epoch FROM finished_at - started_at)) AS avg_seconds
FROM agent_executions
GROUP BY agent_name, status
ORDER BY agent_name;

-- ---------------------------------------------------------------- schema --

-- Columns of one table.
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'leads'
ORDER BY ordinal_position;

-- Every foreign key and its delete rule.
SELECT tc.table_name, kcu.column_name, ccu.table_name AS references, rc.delete_rule
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu ON kcu.constraint_name = tc.constraint_name
JOIN information_schema.constraint_column_usage ccu ON ccu.constraint_name = tc.constraint_name
JOIN information_schema.referential_constraints rc ON rc.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
ORDER BY tc.table_name;
