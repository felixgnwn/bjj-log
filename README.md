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

## Notes

- On PowerShell, use `curl.exe` instead of `curl`, which is an alias for something else.
- Malformed JSON currently returns Express's default HTML error page. A
  proper JSON error handler is planned.
- Duplicate sessions are not detected.
