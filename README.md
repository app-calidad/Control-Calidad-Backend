# Control Calidad Backend

Production-ready REST backend that powers a web application for managing users. Provides admin authentication, full CRUD over users, and Excel export.

## Tech Stack

- **Runtime:** Node.js (ES Modules)
- **Framework:** Express.js 5
- **Database:** PostgreSQL (driver: `pg`)
- **Authentication:** bcrypt + in-memory session tokens (Bearer)
- **Excel:** `exceljs`
- **Config:** `dotenv`

## Project Structure

```
src/
├── config/
│   ├── db.js              # pg Pool + connection helper
│   └── env.js             # dotenv + env validation
├── controllers/
│   ├── authController.js  # login handler
│   └── userController.js  # users CRUD + export
├── middlewares/
│   ├── authMiddleware.js  # Bearer token guard
│   └── errorHandler.js    # 404 + centralized errors
├── routes/
│   ├── authRoutes.js
│   ├── userRoutes.js
│   └── index.js
├── services/
│   ├── authService.js     # admin bootstrap + login
│   ├── userService.js     # SQL access + table init
│   └── excelService.js    # workbook builder
├── utils/
│   ├── ApiError.js        # typed HTTP errors
│   ├── asyncHandler.js
│   ├── tokenStore.js      # in-memory sessions
│   └── validators.js      # input validation helpers
├── app.js                 # Express app wiring
└── server.js              # bootstrap + lifecycle
main.js                    # thin entry that imports src/server.js
```

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

Copy `.env.example` to `.env` and edit as needed:

```bash
cp .env.example .env
```

| Variable          | Required | Default                 | Description                                  |
| ----------------- | -------- | ----------------------- | -------------------------------------------- |
| `DATABASE_URL`    | yes      | —                       | PostgreSQL connection string                 |
| `PORT`            | no       | `4000`                  | HTTP port                                    |
| `ALLOWED_ORIGINS` | no       | `http://localhost:3000` | Comma-separated list used by CORS middleware |
| `ADMIN_USERNAME`  | no       | `Emiro`                 | Admin username created at startup            |
| `ADMIN_PASSWORD`  | no       | `EmiroAPP2026cc`        | Admin password (hashed in memory)            |
| `TOKEN_TTL_MS`    | no       | `86400000` (24 h)       | Session token lifetime in milliseconds       |
| `NODE_ENV`        | no       | `development`           | Node environment                             |

The `users` table is created automatically on startup if it does not exist. The Express app enables CORS for every origin listed in `ALLOWED_ORIGINS` (defaults to `http://localhost:3000`).

### 3. Run the server

```bash
# development (nodemon)
npm run dev

# production
npm start
```

On startup you should see:

```
🔌 Connecting to PostgreSQL...
✅ DB connected. Server time: ...
🔐 Admin "Emiro" ready.
🚀 Server running on http://localhost:4000
```

## Authentication

- Admin credentials are bootstrapped on startup. The password is hashed with `bcrypt` and held in memory only.
- Login returns a Bearer token (random 32-byte hex) with an expiration timestamp.
- Send it on every protected request via `Authorization: Bearer <token>` (or the `x-access-token` header).

## API Reference

Base URL: `http://localhost:4000/api`

### Health

```
GET /api/health
```

Response `200`:

```json
{ "status": "ok", "uptime": 12.34 }
```

### Auth

#### `POST /api/auth/login`

Request:

```json
{
  "username": "Emiro",
  "password": "EmiroAPP2026cc"
}
```

Response `200`:

```json
{
  "message": "Login successful",
  "token": "f4a9...e1",
  "expiresAt": "2026-05-07T00:00:00.000Z",
  "username": "Emiro"
}
```

Errors: `400` (missing fields), `401` (invalid credentials).

### Users (all require `Authorization: Bearer <token>`)

#### `GET /api/users`

Response `200`:

```json
{
  "data": [
    {
      "id": 1,
      "username": "alice",
      "email": "alice@example.com",
      "created_at": "2026-05-06T03:21:10.000Z"
    }
  ]
}
```

#### `GET /api/users/:id`

Response `200` / `404`.

#### `POST /api/users`

Request:

```json
{
  "username": "alice",
  "email": "alice@example.com"
}
```

Response `201`:

```json
{
  "data": {
    "id": 1,
    "username": "alice",
    "email": "alice@example.com",
    "created_at": "..."
  }
}
```

Errors: `400` (validation), `409` (duplicate email).

#### `PUT /api/users/:id`

Partial update (send `username`, `email`, or both). Response `200`.

Errors: `400`, `404`, `409`.

#### `DELETE /api/users/:id`

Response `200`:

```json
{ "message": "User deleted successfully" }
```

### Excel Export

#### `GET /api/users/export`

Returns an `.xlsx` file with columns **ID**, **Username**, **Email**, **Created At**.

Response headers:

```
Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet
Content-Disposition: attachment; filename="users-YYYY-MM-DD.xlsx"
```

## Example Flow (curl)

```bash
# 1. Login
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"Emiro","password":"EmiroAPP2026cc"}'

# 2. Create user (replace <TOKEN>)
curl -X POST http://localhost:4000/api/users \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <TOKEN>" \
  -d '{"username":"alice","email":"alice@example.com"}'

# 3. List users
curl http://localhost:4000/api/users \
  -H "Authorization: Bearer <TOKEN>"

# 4. Export users to Excel
curl -L http://localhost:4000/api/users/export \
  -H "Authorization: Bearer <TOKEN>" \
  -o users.xlsx
```

## HTTP Status Codes

| Code | Meaning                                 |
| ---- | --------------------------------------- |
| 200  | OK                                      |
| 201  | Created                                 |
| 400  | Bad Request (invalid input)             |
| 401  | Unauthorized (missing or invalid token) |
| 404  | Not Found                               |
| 409  | Conflict (duplicate email)              |
| 500  | Internal Server Error                   |

## Security Notes

- Passwords hashed with bcrypt (`10` salt rounds).
- Tokens are opaque random 256-bit strings, stored server-side with TTL; expired tokens are purged periodically.
- Inputs are validated and trimmed; emails are normalized to lowercase.
- `x-powered-by` header is disabled.
- `.env` is gitignored; share `.env.example` instead.
