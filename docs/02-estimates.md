# Capacity estimates

Every input below is an assumption. Change an input and redo the arithmetic to see what moves.

## Inputs

| Input | Value | Note |
| --- | --- | --- |
| Daily active users (DAU) | 10M | Assumed |
| Browse requests per active user per day | 8 | City, cinema, show, and search calls |
| Share of DAU that open a seat map | 20% | Assumed |
| Seat map views per such user | 2 per day | Assumed |
| Share of DAU that complete a booking | 5% | Assumed |
| Seats per booking | 2.5 on average | Assumed |
| Peak factor, browse | 5 times the average | Evening and release days |
| Peak factor, bookings | 20 times the average | A big release opens |

## Request rates

| Traffic | Daily count | Average per second | Peak per second |
| --- | --- | --- | --- |
| Browse | 10M x 8 = 80M | 80M / 86,400 = about 930 | 930 x 5 = about 4,600 |
| Seat map views | 10M x 20% x 2 = 4M | 4M / 86,400 = about 46 | 46 x 20 = about 930 |
| Bookings | 10M x 5% = 500K | 500K / 86,400 = about 6 | 6 x 20 = about 120 |
| Seat holds | about 1M (2 per booking, half expire) | about 12 | 12 x 20 = about 240 |

Reads outnumber bookings by more than 100 to 1. Browse can be cached heavily. The booking path cannot be cached and must be correct first.

## Catalog size

| Item | Count | How |
| --- | --- | --- |
| Cities | 1,000 | Assumed |
| Cinemas | 10,000 | Assumed |
| Screens | 50,000 | 10,000 cinemas x 5 screens |
| Shows per day | 250,000 | 50,000 screens x 5 shows |
| Live shows | 7.5M | 250,000 x 30 days ahead |

## Storage

| Data | Size | How |
| --- | --- | --- |
| Show documents | about 3.75 GB | 7.5M x 0.5 KB |
| Seat states, one row per seat | about 75 GB | 250,000 shows x 200 seats x 30 days = 1.5B rows x 50 bytes |
| Seat states, one bit per seat | about 0.19 GB | 7.5M shows x 200 bits = 25 bytes per show = 188 MB |
| Bookings per year | about 183 GB | 500K x 365 = 182.5M x 1 KB |

Storing sold seats compactly per show is about 400 times smaller than one row per seat (75 GB against 0.19 GB). Real storage has overhead, so the gap in practice is smaller. See the deep dive on seat holds.

## Cache and bandwidth

| Item | Size | How |
| --- | --- | --- |
| Hot shows in Redis | about 375 MB | 250,000 x 3 days x 0.5 KB |
| Peak browse bandwidth | about 9 MB per second, 74 Mbit per second | 4,600 requests x 2 KB |

Both fit on one modest Redis node and one network link. The risk is not size. It is many people hitting the same seats at once.

## What the seed data covers

The repo seed has 8 cities, 11 cinemas, and 132 shows (11 cinemas x 3 days x 4 shows). It is for learning the shape, not the scale.
