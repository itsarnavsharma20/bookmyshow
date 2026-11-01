# High-level design

## Overview

```text
Client (web, mobile)
   |
 Nginx                  TLS, routing, edge limits         (planned)
   |
 API instances          Fastify, stateless, many copies
   |--- Redis           cache, seat holds, shared rate limits   (stub)
   |--- MongoDB         source of truth                         (stub)
   |--- Elasticsearch   search copy, read only                  (stub)
   '--- Email provider  confirmation mail, behind an adapter    (stub)
```

Today every store is replaced by an in-memory repository. The API runs without any of them.

## Components

| Component | Job | Status |
| --- | --- | --- |
| Nginx | TLS, load balancing, request size limits | Planned, runs in Docker |
| API instance | Validates input, runs business rules, talks to stores | Built |
| Redis | Caches browse data, holds seats with a timer, shares rate limit counters | Stub client |
| MongoDB | Stores cities, cinemas, shows, users, bookings | Stub client |
| Elasticsearch | Fast name search with typo tolerance | Stub client |
| Email provider | Sends mail through SES or SMTP | Stub providers |

## Inside one API instance

```text
request -> helmet, cors, rate limit -> jwt -> route
        -> service (rules) -> repository (data) -> store
```

- Routes check input with a schema and call a service.
- Services hold the rules and raise errors such as not found.
- Repositories hide the store. The in-memory one can be swapped for MongoDB without touching a service.
- Startup is split into small files under `src/bootstrap/`. Each file does one job.

## Browse flow

1. Client calls `GET /v1/cinemas/:cinemaId/shows?date=2026-11-01`.
2. The service checks that the cinema exists.
3. The repository returns shows for that date, sorted by start time.
4. Planned: the repository reads Redis first and falls back to MongoDB.

## Booking flow (planned)

```text
1. GET  seat map            read sold seats and live holds
2. POST hold                Redis sets a hold per seat, 10 minute timer
3. pay                      outside this system
4. POST booking             MongoDB insert, unique per show and seat
5. release holds, send email
```

Step 4 is the safety net. Even if a hold is lost, the database refuses a second sale of the same seat.

## Search flow

1. Client calls `GET /v1/search?q=starlight`.
2. Planned: the service asks Elasticsearch. Today it scans the seed in memory.
3. Elasticsearch is filled from MongoDB. It never takes writes from the API directly.

## Failure behaviour

| Failure | What happens |
| --- | --- |
| Redis down | Browse still works, slower. New holds are refused. |
| Elasticsearch down | Search falls back or reports an error. Booking is not affected. |
| MongoDB down | Bookings stop. Cached browse data keeps working until it expires. |
| One API instance dies | Others keep serving. No state lives in an instance. |
