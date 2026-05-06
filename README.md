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
│   ├── userController.js  # users CRUD + export
│   └── porcionadoController.js # porcionado CRUD + opciones
├── middlewares/
│   ├── authMiddleware.js  # Bearer token guard
│   └── errorHandler.js    # 404 + centralized errors
├── routes/
│   ├── authRoutes.js
│   ├── porcionadoRoutes.js
│   ├── userRoutes.js
│   └── index.js
├── services/
│   ├── authService.js     # admin bootstrap + login
│   ├── porcionadoService.js # SQL porcionado + rangos + lote
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

The `users` and `registros_porcionado` tables are created automatically on startup if they do not exist. The Express app enables CORS for every origin listed in `ALLOWED_ORIGINS` (defaults to `http://localhost:3000`).

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

### Formato de Porcionado (all require `Authorization: Bearer <token>`)

#### `GET /api/porcionado/opciones`

Devuelve las opciones de los selectores (solo selección, sin escribir) para pesos, longitudes, amplitudes, grosores, brix, cuartos y responsables.

Response `200`:

```json
{
  "pesos": [32, 32.5, 33, 33.5, 34],
  "longitudes": [6, 6.25, 6.5, 6.75, 7],
  "amplitudes": [3.5, 3.6, 3.7, 3.8, 3.9, 4],
  "grosores": [2, 2.1, 2.2, 2.3, 2.4, 2.5],
  "brix": [28, 28.5, 29, 29.5, 30, 30.5, 31, 31.5, 32],
  "cuartos": [1, 2, 3, 4, 5, 6],
  "responsables": ["EMIRO CEBALLOS", "SAMIRA SARMIENTO"]
}
```

#### `POST /api/porcionado`

Request:

```json
{
  "fecha": "2026-05-05",
  "hora_inicio": "09:50",
  "hora_fin": "11:00",
  "cuarto": 3,
  "peso_1": 35,
  "peso_2": 38,
  "peso_3": 40,
  "peso_4": 33,
  "peso_5": 42,
  "longitud_1": 7,
  "longitud_2": 7.5,
  "longitud_3": 8,
  "longitud_4": 6.5,
  "longitud_5": 7,
  "amplitud_1": 3.6,
  "amplitud_2": 3.8,
  "amplitud_3": 3.7,
  "amplitud_4": 3.9,
  "amplitud_5": 3.6,
  "grosor_1": 2.1,
  "grosor_2": 2.3,
  "grosor_3": 2.2,
  "grosor_4": 2.4,
  "grosor_5": 2.1,
  "brix_1": 29,
  "brix_2": 30.5,
  "brix_3": 31,
  "brix_4": 28.5,
  "brix_5": 30,
  "realizado_por": "EMIRO CEBALLOS",
  "verificado_por": "SAMIRA SARMIENTO",
  "observaciones": ""
}
```

Response `201`:

```json
{
  "id": 1,
  "fecha": "2026-05-05T00:00:00.000Z",
  "lote": "19-2026",
  "hora_inicio": "09:50:00",
  "hora_fin": "11:00:00",
  "cuarto": 3,
  "peso_1": "35.00",
  "peso_2": "38.00",
  "peso_3": "40.00",
  "peso_4": "33.00",
  "peso_5": "42.00",
  "longitud_1": "7.00",
  "longitud_2": "7.50",
  "longitud_3": "8.00",
  "longitud_4": "6.50",
  "longitud_5": "7.00",
  "amplitud_1": "3.60",
  "amplitud_2": "3.80",
  "amplitud_3": "3.70",
  "amplitud_4": "3.90",
  "amplitud_5": "3.60",
  "grosor_1": "2.10",
  "grosor_2": "2.30",
  "grosor_3": "2.20",
  "grosor_4": "2.40",
  "grosor_5": "2.10",
  "brix_1": "29.00",
  "brix_2": "30.50",
  "brix_3": "31.00",
  "brix_4": "28.50",
  "brix_5": "30.00",
  "estado": "CUMPLE",
  "realizado_por": "EMIRO CEBALLOS",
  "verificado_por": "SAMIRA SARMIENTO",
  "observaciones": "",
  "created_at": "2026-05-06T01:10:20.000Z"
}
```

#### `GET /api/porcionado?fecha=YYYY-MM-DD`

Response `200`:

```json
[
  {
    "id": 1,
    "fecha": "2026-05-05T00:00:00.000Z",
    "lote": "19-2026",
    "estado": "CUMPLE",
    "realizado_por": "EMIRO CEBALLOS",
    "verificado_por": "SAMIRA SARMIENTO"
  }
]
```

#### `GET /api/porcionado/:id`

Response `200` / `404`.

#### `DELETE /api/porcionado/:id`

Response `200`:

```json
{ "message": "Registro eliminado" }
```

#### `DELETE /api/porcionado/all`

Response `200`:

```json
{ "message": "Todos los registros eliminados" }
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
