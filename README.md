# BJJ Training Log

A small TypeScript/Node project for logging BJJ training sessions and seeing
how well each position works for me. It has a CLI and an HTTP API that share
the same Postgres-backed storage.

## Setup

```
npm install
cp .env.example .env     # on Windows: copy .env.example .env
npm run db:up            # starts Postgres in Docker
npm run db:migrate       # creates the sessions table
```

## Run

| Command                     | What it does                                           |
| --------------------------- | ------------------------------------------------------ |
| `npm start`                 | Interactive CLI (log, view, summary)                   |
| `npm run api`               | API server on http://localhost:3000 (restarts on save) |
| `npm run check`             | Type-check without running                             |
| `npm run db:up` / `db:down` | Start / stop the local Postgres container              |

## Configuration

Set in `.env` (see `.env.example`). Invalid or missing values stop the app at startup.

| Variable       | Default         | Meaning                                                         |
| -------------- | --------------- | --------------------------------------------------------------- |
| `DATABASE_URL` | none (required) | Postgres connection string                                      |
| `PORT`         | `3000`          | API port                                                        |
| `NODE_ENV`     | `development`   | `development` gives readable logs, anything else gives JSON     |
| `LOG_LEVEL`    | `info`          | `fatal`, `error`, `warn`, `info`, `debug`, `trace`, or `silent` |

Every API response includes an `x-request-id` header, and the same id appears in
the logs for that request. Send your own `x-request-id` to trace a request.

## API

### `GET /sessions`

Returns every logged session, oldest first, each with an `id`.

```
curl.exe http://localhost:3000/sessions
```

### `GET /summary`

Returns, per position (lowercased and trimmed), how many sessions and how many
worked. "partly" counts as worked. The most-practised position comes first.

```
curl.exe http://localhost:3000/summary
```

```json
[{ "position": "closed guard", "total": 3, "worked": 2 }]
```

### `POST /sessions`

Adds a session. All fields are required and must be non-empty text.
`result` must be `yes`, `no`, or `partly` (case-insensitive).

```
curl.exe -i -X POST http://localhost:3000/sessions -H "Content-Type: application/json" -d "@examples/good-session.json"
```

| Status | Meaning                                                            |
| ------ | ------------------------------------------------------------------ |
| `201`  | Created. The saved session, with its `id`, is in the body.         |
| `400`  | Invalid input. The body lists every problem: `{ "errors": [...] }` |
| `500`  | The server could not save the session.                             |

Example of a rejected request:

```
curl.exe -i -X POST http://localhost:3000/sessions -H "Content-Type: application/json" -d "@examples/bad-session.json"
```

### `PUT /sessions/:id`

Replaces every field of one session. The body is the same as `POST`.

```
curl.exe -i -X PUT http://localhost:3000/sessions/1 -H "Content-Type: application/json" -d "@examples/update-session.json"
```

| Status | Meaning                                    |
| ------ | ------------------------------------------ |
| `200`  | Updated. The saved session is in the body. |
| `400`  | Invalid id or invalid body.                |
| `404`  | No session with that id.                   |

### `DELETE /sessions/:id`

```
curl.exe -i -X DELETE http://localhost:3000/sessions/1
```

| Status | Meaning                  |
| ------ | ------------------------ |
| `204`  | Deleted. No body.        |
| `400`  | Invalid id.              |
| `404`  | No session with that id. |

## Notes

- On PowerShell, use `curl.exe` instead of `curl`, which is an alias for something else.
- Malformed JSON currently returns Express's default HTML error page. A
  proper JSON error handler is planned.
- Duplicate sessions are not detected.
