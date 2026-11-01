# Requirements

## The problem

Design a movie ticket booking system like BookMyShow. People pick a city, find a cinema and a show, choose seats, and pay.

The hard part is not browsing. It is selling each seat exactly once when thousands of people want the same seats at the same time.

## Functional requirements

| # | Requirement | Status |
| --- | --- | --- |
| F1 | List cities | Built |
| F2 | List cinemas in a city | Built |
| F3 | List shows of a cinema, filtered by date | Built |
| F4 | Search cinemas and movies by name | Built, in memory |
| F5 | Register, log in, see own profile | Built, in memory |
| F6 | See the seat map of a show | Planned |
| F7 | Hold seats for a short time while paying | Planned |
| F8 | Confirm a booking after payment | Planned |
| F9 | Send a confirmation email | Planned, provider is a stub |
| F10 | Cancel a booking | Planned |

## Out of scope for now

- Payment gateway integration. A payment result is assumed to arrive as an event.
- Refund rules and dynamic pricing.
- Movie catalog, reviews, and ratings.
- Admin tools for cinemas to add shows.
- Mobile push notifications.

## Non-functional requirements

All numbers are targets I assumed for learning. They are not measured.

| # | Requirement | Target |
| --- | --- | --- |
| N1 | No double booking | A seat is sold to at most one booking. Strong consistency on this path. |
| N2 | Browse availability | 99.9% monthly for read routes. |
| N3 | Browse latency | p95 under 200 ms for city, cinema, and show lists. |
| N4 | Seat hold time | 10 minutes, then the seat is free again. |
| N5 | Peak load | Handle 5 times the average read rate and 20 times the average booking rate. |
| N6 | Search freshness | A new show appears in search within 1 minute. |
| N7 | Security | Passwords are hashed. Login routes are rate limited. No secrets in code. |

## Assumptions

- Users are in India. Show times use India time (+05:30).
- Prices are whole rupees.
- A booking has 1 to 6 seats for one show.
- Browse data changes rarely. Seat state changes constantly.
