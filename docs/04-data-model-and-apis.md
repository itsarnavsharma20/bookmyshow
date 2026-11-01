# Data model and APIs

## Collections

Ids are strings. Seed ids are readable, such as `city-mumbai`, so they are easy to follow in examples.

| Collection | Fields | Status |
| --- | --- | --- |
| cities | id, name, state, country | Built |
| cinemas | id, cityId, name, address, screens | Built |
| shows | id, cinemaId, screen, movieTitle, language, startsAt, durationMinutes, priceInr | Built |
| users | id, email, name, role, passwordHash, createdAt | Built |
| bookings | id, userId, showId, seatIds, status, priceInr, createdAt | Planned |
| seatSales | showId, seatId, bookingId | Planned |

## Notes on fields

- `startsAt` is ISO 8601 with an offset, for example `2026-11-01T17:00:00+05:30`.
- `priceInr` is whole rupees.
- `role` is `customer` or `admin`. Register always creates `customer`.
- `passwordHash` is `salt:hash` in hex. It is never returned by any route.
- Booking `status` values: `pending`, `confirmed`, `cancelled`.

## Indexes

| Collection | Index | Why |
| --- | --- | --- |
| cinemas | cityId, name | List cinemas of a city |
| shows | cinemaId, startsAt | List shows of a cinema on a date, sorted |
| users | email, unique | Login and duplicate check |
| seatSales | showId and seatId, unique | The rule that stops double booking |
| bookings | userId, createdAt | A user's booking history |

## Built routes

| Method and path | Purpose | Notes |
| --- | --- | --- |
| GET /health | Server status | Not under /v1 |
| GET /v1/cities | List cities | Query: page, limit, q |
| GET /v1/cities/:cityId | One city | 404 if unknown |
| GET /v1/cities/:cityId/cinemas | Cinemas of a city | Query: page, limit, q. 404 if the city is unknown |
| GET /v1/cinemas/:cinemaId | One cinema | |
| GET /v1/cinemas/:cinemaId/shows | Shows of a cinema | Query: date (YYYY-MM-DD), page, limit |
| GET /v1/shows/:showId | One show | |
| GET /v1/search | Search cinemas and movies | Query: q (2 or more characters), type, cityId, limit (up to 50) |
| POST /v1/auth/register | Create an account | 201, 409 if the email exists |
| POST /v1/auth/login | Get a token | 5 per minute per client |
| GET /v1/auth/me | Own profile | Needs a Bearer token |

## Planned routes

| Method and path | Purpose |
| --- | --- |
| GET /v1/shows/:showId/seats | Seat map with sold and held seats |
| POST /v1/shows/:showId/holds | Hold seats for 10 minutes |
| DELETE /v1/holds/:holdId | Release a hold early |
| POST /v1/bookings | Confirm a booking from a hold |
| GET /v1/bookings/:bookingId | One booking |
| GET /v1/auth/me/bookings | Own booking history |

## Shapes shared by all routes

List response:

```json
{ "items": [], "page": 1, "limit": 20, "total": 0, "totalPages": 1 }
```

Error response, the same for every error:

```json
{ "error": { "code": "NOT_FOUND", "message": "City city-x was not found." } }
```

| Status | Code | When |
| --- | --- | --- |
| 400 | VALIDATION_ERROR | Input fails the schema |
| 401 | UNAUTHORIZED | Missing or bad token, wrong password |
| 403 | FORBIDDEN | Role is not allowed |
| 404 | NOT_FOUND | Unknown id or route |
| 409 | CONFLICT | Duplicate email, seat already taken |
| 429 | REQUEST_ERROR | Rate limit hit |
| 500 | INTERNAL_ERROR | Anything unexpected. Details are only in the log. |

## Pagination

- Default page size is 20 and the maximum is 100.
- It uses page and limit (offset style). See the trade-offs note for when cursors are better.
