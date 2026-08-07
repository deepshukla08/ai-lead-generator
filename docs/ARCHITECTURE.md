# Architecture — Phase 1

What exists today, and why it is shaped this way. No business logic has been written yet;
this document is the frame that the later phases hang off.

---

## 1. The product in one paragraph

A company teaches AgentSDR about itself by uploading its own documents. AgentSDR builds a
structured, reusable knowledge base from them. From then on, everything happens through
chat: find companies, research them, qualify them, explain the opportunity, find the buyer,
write the outreach, and wait for a human to approve it. Email generation is the last and
least interesting step. The value is the judgement in front of it.

## 2. Services

Four deployables, plus three pieces of infrastructure.

| Service | Language | Owns | Talks to |
|---|---|---|---|
| `frontend` | TypeScript | Chat UI, lead explorer, approval queue | `api` (REST/SSE) |
| `api` | Python | HTTP contract, Postgres, file storage, job enqueue | Postgres, Redis, `ai-service` |
| `ai-service` | Python | LangGraph agents, prompts, tools, RAG, LLM providers | Postgres (vectors), Langfuse, external APIs |
| `worker` | Python | Long-running jobs | Redis, `ai-service` (HTTP), Postgres |
| Postgres 16 + pgvector | — | Relational data **and** embeddings | — |
| Redis 7 | — | Job queue, and later a cache | — |
| Langfuse v2 | — | Traces, cost, latency for every LLM call | Postgres |

### Why `api` and `ai-service` are separate processes

They fail differently and scale differently. The AI service pulls in `torch`,
`sentence-transformers` and the LangChain tree — a slow build, a large image, and a
process that will occasionally hang on a stuck LLM call. The API is small and must stay
responsive. Keeping them apart means a wedged agent cannot take the product down, and
`ai-service` can move to a GPU host without dragging the HTTP layer along.

The cost is a network hop and serialisation. Worth it.

### Why `worker` calls `ai-service` over HTTP instead of importing it

Importing would fuse the two into one dependency graph — one `pip install`, one image, one
deploy, and a circular import the first time the AI service wants to enqueue a job. HTTP
keeps the arrow pointing one way: `worker → ai-service`. Either can be replaced without
touching the other.

### Why only `api` writes to Postgres

One writer means one place to add row-level tenancy, one place for migrations, one audit
surface. `ai-service` reads and writes vectors — an isolated concern — but relational
writes go through the API. When multi-tenancy arrives, the change lands in one service.

## 3. Data

**One Postgres instance, two databases.** `agentsdr` for the product, `langfuse` for
observability. Langfuse v2 was chosen over v3 deliberately: v3 requires ClickHouse, MinIO
and its own Redis, which triples local resource use for a feature we consume, not operate.

**pgvector, not a separate vector database.** Every retrieval in this product is filtered
by relational facts — this company's knowledge base, this campaign, this industry. In a
standalone vector store that means keeping two systems in sync and post-filtering results.
In Postgres it is a `WHERE` clause and a join, inside one transaction. Pinecone or Qdrant
only start paying off at a scale that is far away, and the migration is contained: the
retriever is one interface.

**Embeddings run locally.** `all-MiniLM-L6-v2`, 384 dimensions, on CPU. Free, no API key,
no rate limit, no data leaving the machine — which matters because we are embedding
customers' internal documents. `EMBEDDING_DIM` is configurable because swapping the model
means a schema change to the vector column, and that should be a config decision, not a
code hunt.

## 4. Provider abstractions — the three that exist, and the ones that do not

Three swaps are certain, so the seams are planned now:

- **LLM** — Gemini / Groq / OpenRouter. Selected by `LLM_PROVIDER`. Cost, rate limits and
  model quality all change; the agents must not care.
- **Storage** — local disk now (`/data/storage`), S3 later. Only the path handling differs.
- **Email** — Gmail SMTP now, Resend later. Deliverability forces this move eventually.

Everything else gets a concrete implementation until a second implementation actually
exists. An interface with one implementation is a guess about the future written in code.

## 5. Multi-tenancy — the deliberate omission

The MVP assumes one workspace, one company, no auth. That is a scoping decision, not an
oversight, and the cost of reversing it has been kept low:

1. Every table gets a `workspace_id` column when the schema is written in Phase 2 — even
   though only one value will ever be stored in it during the MVP. Adding a column later
   is cheap; back-filling one across a live database with foreign keys is not.
2. All database access flows through the API, so tenant scoping is enforced in one layer.
3. Repositories take the workspace as a parameter from the start, defaulting to the single
   MVP workspace. The signature never has to change.
4. Auth becomes FastAPI dependencies on the router — additive, not a refactor.

## 6. The agent layer (Phase 3+, sketched here)

A supervisor routes chat to specialists rather than one large prompt doing everything.
Specialists are testable in isolation, retryable in isolation, and traceable in isolation.

```
Supervisor
├── Company Knowledge   — what we sell, from our documents
├── Knowledge           — parse, chunk, embed uploads
├── Prospecting         — find candidate companies
├── Research            — investigate one company
├── Qualification       — fit score + confidence + evidence
├── Opportunity         — how our product helps this company specifically
├── Contact             — find the right buyer
├── Outreach            — subject, email, LinkedIn, follow-up
├── Critic              — factuality, quality, compliance gate
└── Campaign            — execution and metrics
```

Every node will declare: purpose, inputs, outputs, dependencies, tools, failure handling,
retry strategy, logging. Two rules are non-negotiable — **no fabricated emails**, and
**no claim without evidence**. When evidence is insufficient the agent says so; that is a
valid, useful answer and the Critic enforces it.

## 7. Observability

Langfuse traces every agent, prompt, LLM call, tool call, latency, cost, retry and error.
This is instrumentation from day one, not something bolted on after a bad demo. When a
lead is scored 91 and the user asks why, the trace is the answer.

## 8. Local development

`docker compose up` runs everything except the frontend. Python source is bind-mounted and
both Python services run with `--reload`, so editing a file restarts the process in about a
second. The frontend runs on the host with `npm run dev` — hot reload through a Windows
bind mount is slow enough to be worth the inconsistency.

Docker images install dependencies from the manifest before copying source, so editing
code does not re-run `pip install`.

## 9. Decisions log

| Decision | Alternative | Reason |
|---|---|---|
| pgvector | Pinecone / Qdrant | Filtered retrieval, one transaction, one system |
| Langfuse v2 | Langfuse v3 | v3 needs ClickHouse + MinIO for no local benefit |
| ARQ | Celery | Async-native, Redis-only, a fraction of the config |
| HTTP worker → ai-service | Shared imports | One-way dependency, independent deploys |
| Local embeddings | OpenAI embeddings | Free, private, no rate limit |
| Frontend outside compose | Everything in compose | Windows bind-mount hot reload is too slow |
| `workspace_id` from day one | Add it with auth | Adding a column is cheap; back-filling is not |
| Ruff for lint + format | Black + Flake8 + isort | One tool, one config, much faster |
| `prospect_company` split from `lead` | One table | Research once, reuse across campaigns; fit is only meaningful per campaign |
| VARCHAR + CHECK enums | Native Postgres enums | `ALTER TYPE` is painful to write and impossible to reverse |
| `updated_at` DB trigger | ORM `onupdate` | ORM-level hooks do not fire for bulk UPDATE or raw SQL |
| UUID PKs, `gen_random_uuid()` | BIGINT identity | Safe to expose in URLs, generated identically by ORM and raw SQL |
| JSONB for agent output | Normalised columns | Shape churns with every prompt change; we read it whole, never filter inside |

## 10. Phase plan

| Phase | Delivers |
|---|---|
| **1 ✅** | Foundation: services, Docker, Postgres + pgvector, Redis, Langfuse, health path |
| **2 ✅** | 14-table schema, Alembic migrations, storage abstraction, onboarding API |
| 3 | Knowledge pipeline: parse → chunk → embed → retrieve. Company Knowledge Agent |
| 4 | LangGraph supervisor, chat API with streaming, chat UI |
| 5 | Prospecting, Research, Qualification, Opportunity agents |
| 6 | Contact discovery, Outreach generation, Critic |
| 7 | Approval queue, email sending, campaign tracking, analytics |
