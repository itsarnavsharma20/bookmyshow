# System Design Learn

A personal repo for learning system design through case studies.

## Case studies

| Case study | Status |
| --- | --- |
| [Bookmyshow](Bookmyshow/) | In progress: API boilerplate and design notes written, booking flow not built |

## How each case study is organised

1. Requirements (functional and non-functional)
2. Capacity estimates
3. High-level design
4. Data model and APIs
5. Deep dives on key components
6. Trade-offs and alternatives

## Bookmyshow API boilerplate

A small Fastify and TypeScript API. Data lives in memory for now. MongoDB, Redis, and Elasticsearch clients are placeholders.

| Command | What it does |
| --- | --- |
| `npm run dev` | Starts the server with auto-restart. |
| `npm run typecheck` | Checks types. |
| `npm run lint` | Runs Oxlint. |
| `npm test` | Runs the tests in `test/`. |
| `node scripts/check-env.ts` | Checks the environment settings. |
| `node scripts/seed.ts` | Dry run of seeding, until MongoDB is connected. |

Routes, all under `/v1` except health:

| Route | What it returns |
| --- | --- |
| `GET /health` | Server status. |
| `GET /v1/cities`, `GET /v1/cities/:cityId` | Cities. |
| `GET /v1/cities/:cityId/cinemas`, `GET /v1/cinemas/:cinemaId` | Cinemas. |
| `GET /v1/cinemas/:cinemaId/shows?date=`, `GET /v1/shows/:showId` | Shows. |
| `GET /v1/search?q=` | Cinemas and movies by name. |
| `POST /v1/auth/register`, `POST /v1/auth/login`, `GET /v1/auth/me` | Accounts and JWT login. |

Code layout:

- `src/bootstrap/`: one file per startup step.
- `src/modules/`: one folder per feature, with its own types, schema, routes, service, repository, and seed.
- `src/infra/`: data store clients.
- `src/integrations/`: third-party services, such as email.

Design notes for the Bookmyshow case study:

1. [Requirements](docs/01-requirements.md)
2. [Capacity estimates](docs/02-estimates.md)
3. [High-level design](docs/03-high-level-design.md)
4. [Data model and APIs](docs/04-data-model-and-apis.md)
5. [Deep dives](docs/05-deep-dives.md)
6. [Trade-offs and alternatives](docs/06-tradeoffs.md)

## Using AI agents in this repo

All agents (Claude Code, Codex, Cursor, Antigravity, Grok) share one set of rules and hooks.

- Guardrails: [.agents/rules/guardrails.md](.agents/rules/guardrails.md). No git, no deletes, no database access, no leaving this folder, and nothing runs without approval.
- Rules: [AGENTS.md](AGENTS.md) and [.agents/rules/](.agents/rules/)
- Hooks: [.agents/hooks/](.agents/hooks/). Test them with `node .agents/hooks/test/run.js`.

Tool folders like `.claude/`, `.cursor/`, and `.codex/` only point to these shared files. See [agent-setup.md](.agents/rules/agent-setup.md) for how each tool loads them.
