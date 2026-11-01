# Deep dives

## 1. Seat holds without double booking

The goal: two people tap the same seat at the same moment and only one gets it.

### Two layers

| Layer | Tool | Job |
| --- | --- | --- |
| Hold | Redis | Fast, temporary claim while the person pays |
| Sale | MongoDB | Permanent record, the final judge |

### Hold

- Key per seat: `hold:{showId}:{seatId}`. Value: the user id.
- Set with `SET key value NX EX 600`. NX means set only if absent. EX 600 means expire in 600 seconds (10 minutes).
- The result is atomic. One caller gets OK and the other gets nothing.
- A hold of several seats must be all or nothing. Use one Lua script that checks every key, then sets them all. If any seat is taken, set none.
- Expiry frees the seat with no cleanup job.

### Sale

- A booking inserts one `seatSales` row per seat.
- A unique index on showId and seatId makes the database refuse a second sale.
- The insert only runs if the user still owns every hold key.

### Failure cases

| Case | Result |
| --- | --- |
| Redis loses a hold early | The unique index still blocks a double sale. The loser sees a conflict at confirm time. |
| Payment is slow and the hold expires | The booking step finds no hold and fails. The user retries. |
| Redis is down | Refuse new holds. Do not fall back to the database for holds, it would not scale at peak. |
| Two instances confirm the same booking | Same booking id is idempotent. The second call returns the first result. |

### Alternative not taken

Row locks in the database for every hold. It is correct but holds a lock for up to 10 minutes per seat and does not scale at 240 holds per second.

## 2. Caching browse data

Browse is the bulk of the traffic (about 4,600 requests per second at peak).

| Data | Key | Time to live | Why |
| --- | --- | --- | --- |
| City list | `cities:list` | 1 hour | Almost never changes |
| Cinemas of a city | `cinemas:city:{cityId}` | 10 minutes | Changes rarely |
| Shows of a cinema and date | `shows:{cinemaId}:{date}` | 60 seconds | New shows can be added |
| Seat map | not cached long | 2 seconds at most | Changes with every hold |

- Pattern: cache-aside. Read Redis, on a miss read MongoDB and write to Redis.
- Writes delete the affected key, so the next read refills it.
- The cache sits inside the repository. Services do not know it exists.
- Add a short random jitter to each time to live, so keys do not all expire together.

## 3. Search

- Elasticsearch holds a read copy of cinemas and shows. Mappings are in `src/infra/elasticsearch/indices.ts`.
- MongoDB stays the source of truth. If Elasticsearch loses data, rebuild it from MongoDB.
- Sync idea: when a cinema or show changes, write an event row in the same MongoDB write, then a worker indexes it. This avoids losing an update if the process dies between two writes.
- Today the search module scans seed data in memory. It has the same input and output as the Elasticsearch version will have.

## 4. Accounts and tokens

| Topic | Choice |
| --- | --- |
| Password storage | scrypt with a random 16 byte salt, built into Node |
| Login failure | Same 401 message for a wrong password and an unknown email |
| Timing | A dummy hash is checked for unknown emails, so both paths take similar time |
| Token | JWT, signed with `JWT_SECRET`, default life 15 minutes |
| Secret | Required in production. In development a random one is made, tokens stop working on restart |
| Abuse | 5 attempts per minute on register and login |

Not built yet: refresh tokens, logout, password reset, and email verification.
