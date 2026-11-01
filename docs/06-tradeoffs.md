# Trade-offs and alternatives

## Design choices

| Decision | Chosen | Alternative | Why not the alternative |
| --- | --- | --- | --- |
| Seat holds | Redis with a timer | Database row locks | Locks last up to 10 minutes per seat and do not scale at peak |
| Final seat check | Unique index in the database | Trust the Redis hold alone | A lost hold would cause a double sale |
| Search | Elasticsearch copy | MongoDB text search | Weaker ranking and typo tolerance. Fine for a small catalog. |
| Source of truth | MongoDB | Elasticsearch only | No strong guarantees for booking data |
| Auth state | Stateless JWT | Server sessions in Redis | Sessions need a lookup on every call. JWT does not. |
| Password hash | scrypt (built in) | bcrypt or argon2 | They need an extra package. scrypt is strong enough here. |
| Pagination | page and limit | Cursor based | Simple to learn. Cursors are better once lists are huge or change often. |
| Sold seat storage | Compact per show | One row per seat | Hundreds of times more storage for the same facts (see the estimates) |
| Browse caching | Cache-aside with short times | Write-through | Simpler. A short stale window is fine for browse. |

## Code structure choices

| Decision | Chosen | Alternative | Why not the alternative |
| --- | --- | --- | --- |
| Folders | One folder per feature | Folders by layer (controllers, services) | One feature spreads across many folders as it grows |
| Startup | One small file per step | One big server file | It becomes long and hard to change |
| Data access | Repository per module | Call the database from services | Swapping the store would touch the rules |
| Data stores first | In-memory repositories | Real databases from day one | Slower to start, and agents here cannot touch databases |
| Third-party services | Interface plus provider files | Call the vendor SDK directly | Changing vendor would touch the whole app |
| Schemas and types | TypeBox, types from schemas | Zod | TypeBox schemas are plain JSON schema, which Fastify uses directly |
| Dev runner | Node with type stripping | tsx or ts-node | One dependency less |
| Compose files | One per service, joined by include | One large file | Hard to read past a few services |
| Seed dates | Built from today | Fixed dates | Fixed dates go stale |

## Known limits

- Users, and all other data, are lost on restart until MongoDB is connected.
- The show date filter uses the date part of `startsAt` as written. It does not convert time zones.
- Rate limits count in memory per instance until Redis is connected, so two instances allow double.
- There are no refresh tokens, so users log in again every 15 minutes.
- Search does not tolerate typos until Elasticsearch is connected.
- Telemetry is a placeholder.

## What to revisit at larger scale

- Cursor pagination for long lists.
- Splitting bookings into their own service if booking load outgrows browse.
- A queue for email and search indexing, so slow vendors never slow a request.
- Per-region deployments, since users are in one country but peak hours are shared.
