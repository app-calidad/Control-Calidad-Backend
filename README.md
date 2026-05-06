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
│   ├── authController.js       # login handler
│   ├── userController.js       # users CRUD + export
│   ├── porcionadoController.js # porcionado CRUD + opciones
│   ├── prefreidoController.js  # prefreído/deollier/picking CRUD
│   └── lotesController.js      # lotes + trazabilidad
├── middlewares/
│   ├── authMiddleware.js  # Bearer token guard
│   └── errorHandler.js    # 404 + centralized errors
├── routes/
│   ├── authRoutes.js
│   ├── userRoutes.js
│   ├── porcionadoRoutes.js
│   ├── prefreidoRoutes.js
│   ├── lotesRoutes.js
│   └── index.js
├── services/
│   ├── authService.js        # admin bootstrap + login
│   ├── userService.js        # SQL access + table init
│   ├── excelService.js       # workbook builder
│   ├── porcionadoService.js  # SQL porcionado + rangos
│   ├── prefreidoService.js   # SQL prefreído + rangos
│   └── lotesService.js       # lotes_produccion + trazabilidad
├── utils/
│   ├── ApiError.js        # typed HTTP errors
│   ├── asyncHandler.js
│   ├── tokenStore.js      # in-memory sessions
│   ├── validators.js      # input validation helpers
│   └── loteUtils.js       # calcularLote / calcularLoteW
├── app.js                 # Express app wiring
└── server.js              # bootstrap + lifecycle
main.js                    # thin entry that imports src/server.js
migrations/
├── 001_initial_schema.sql
├── 002_prefreido_schema.sql
├── 003_lotes_relations.sql
└── 004_users_relations.sql
```

## Modelo de datos y relaciones

```
users
  id  ◄──────────────────────────────────────────────────────┐
                                                             │
lotes_produccion                                             │
  id          ◄────────────────────────────────────┐        │
  created_by_id  ─────────────────────────────────────────► users.id
                                                   │
  ┌─────────────────────────┐   ┌──────────────────┴──────────────────┐
  │  registros_porcionado   │   │       registros_prefreido           │
  │  lote_id ──────────────►│   │  lote_id ──────────────────────────►│
  │  realizado_por_id ─────────────────────────────────────────────► users.id
  │  verificado_por_id ────────────────────────────────────────────► users.id
  └─────────────────────────┘   └─────────────────────────────────────┘
```

### Regla de negocio para responsables

| Caso | Qué enviar en el POST |
|---|---|
| Responsable es usuario del sistema | `realizado_por: "EMIRO CEBALLOS"` **+** `realizado_por_id: 1` |
| Responsable es "Otro" (campo libre) | `realizado_por: "Nombre personalizado"` (sin `_id`) |

Las columnas `_id` son **nullable**; si no se envían el nombre de texto sigue almacenándose correctamente.

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

The `users`, `lotes_produccion`, `registros_porcionado` and `registros_prefreido` tables are created automatically on startup if they do not exist. The Express app enables CORS for every origin listed in `ALLOWED_ORIGINS` (defaults to `http://localhost:3000`).

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

- **Admin:** Las credenciales del admin se cargan en memoria al iniciar el servidor (hasheadas con `bcrypt`). El admin no está en la tabla `users`.
- **Usuarios de base de datos:** Los usuarios creados via `POST /api/auth/register` o `POST /api/users` se almacenan en PostgreSQL con su contraseña hasheada. También pueden iniciar sesión con `/api/auth/login`.
- El login verifica primero si el `username` coincide con el admin; si no, busca en la tabla `users`.
- Login devuelve un Bearer token (hex aleatorio de 32 bytes) con timestamp de expiración.
- Enviar en cada petición protegida: `Authorization: Bearer <token>` (o header `x-access-token`).

## API Reference

Base URL: `https://control-calidad-backend-1.onrender.com/api`

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

Funciona tanto para el **admin** como para cualquier **usuario registrado en la base de datos**.

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

#### `POST /api/auth/register`

Crea un usuario en la base de datos con contraseña hasheada. El usuario podrá iniciar sesión via `/api/auth/login`.

Request:

```json
{
  "username": "alice",
  "email": "alice@example.com",
  "password": "secreto123"
}
```

Response `201`:

```json
{
  "message": "Account created successfully",
  "data": {
    "id": 2,
    "username": "alice",
    "email": "alice@example.com",
    "created_at": "2026-05-06T10:00:00.000Z"
  }
}
```

Errors: `400` (validación — username, email o password inválidos; password mínimo 6 caracteres), `409` (email duplicado).

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

Requiere `Authorization: Bearer <token>`. Crea un usuario en la base de datos con contraseña hasheada.

Request:

```json
{
  "username": "alice",
  "email": "alice@example.com",
  "password": "secreto123"
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

Errors: `400` (validation — password mínimo 6 caracteres), `409` (duplicate email).

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
  "realizado_por_id":  1,
  "verificado_por": "SAMIRA SARMIENTO",
  "verificado_por_id": 2,
  "observaciones":  ""
}
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

### Formato control prefreído, deollier y picking (all require `Authorization: Bearer <token>`)

#### `GET /api/prefreido/opciones`

Devuelve todas las listas de valores para los selectores del formulario.

Response `200`:

```json
{
  "temp_freidora":        [150, 150.5, "...", 180],
  "temp_tajada_freidora": [65, 65.5, "...", 80],
  "temp_tajada_deollier": [40, 40.5, "...", 60],
  "color": [
    "OPTIMO (AMARILLO A DORADO)",
    "ACEPTABLE (DORADO INTENSO)",
    "NO CONFORME (MARRON MUY OSCURO)"
  ],
  "sabor":   ["DULCE", "AMARGO"],
  "olor":    ["CARACTERISTICO", "NO CARACTERISTICO"],
  "forma":   ["ALARGADA", "REDONDA"],
  "material_extrano_pick": ["AUSENCIA", "PRESENCIA"],
  "temp_iqf":         [-40, -39.5, "...", -10],
  "temp_entrada_iqf": [40, 40.5, "...", 80],
  "temp_salida_iqf":  [-30, -29.5, "...", -2],
  "brix_iqf":         [29, 29.5, 30, 30.5, 31, 31.5, 32],
  "conformidad":          ["CONFORME", "NO CONFORME"],
  "materiales_extranos":  ["AUSENTE", "PRESENTE"],
  "responsables":         ["EMIRO CEBALLOS", "SAMIRA SARMIENTO"]
}
```

#### `POST /api/prefreido`

Request (todos los campos de medición son opcionales; los campos de control son obligatorios):

```json
{
  "fecha":        "2026-05-05",
  "hora_inicio":  "10:00",
  "hora_fin":     "12:00",

  "temp_freidora_entrada_1": 165, "temp_freidora_entrada_2": 167,
  "temp_freidora_entrada_3": 163, "temp_freidora_entrada_4": 166,
  "temp_freidora_entrada_5": 168,

  "temp_freidora_salida_1": 160, "temp_freidora_salida_2": 162,
  "temp_freidora_salida_3": 159, "temp_freidora_salida_4": 161,
  "temp_freidora_salida_5": 163,

  "temp_tajada_freidora_1": 72, "temp_tajada_freidora_2": 74,
  "temp_tajada_freidora_3": 71, "temp_tajada_freidora_4": 73,
  "temp_tajada_freidora_5": 75,

  "temp_tajada_deollier_1": 50, "temp_tajada_deollier_2": 52,
  "temp_tajada_deollier_3": 49, "temp_tajada_deollier_4": 51,
  "temp_tajada_deollier_5": 53,

  "color_1": "OPTIMO (AMARILLO A DORADO)",
  "color_2": "OPTIMO (AMARILLO A DORADO)",
  "color_3": "ACEPTABLE (DORADO INTENSO)",
  "color_4": "OPTIMO (AMARILLO A DORADO)",
  "color_5": "OPTIMO (AMARILLO A DORADO)",

  "sabor_1": "DULCE", "sabor_2": "DULCE", "sabor_3": "DULCE",
  "sabor_4": "DULCE", "sabor_5": "DULCE",

  "olor_1": "CARACTERISTICO", "olor_2": "CARACTERISTICO",
  "olor_3": "CARACTERISTICO", "olor_4": "CARACTERISTICO",
  "olor_5": "CARACTERISTICO",

  "forma_1": "ALARGADA", "forma_2": "ALARGADA", "forma_3": "REDONDA",
  "forma_4": "ALARGADA", "forma_5": "ALARGADA",

  "mat_ext_pick_1": "AUSENCIA", "mat_ext_pick_2": "AUSENCIA",
  "mat_ext_pick_3": "AUSENCIA", "mat_ext_pick_4": "AUSENCIA",
  "mat_ext_pick_5": "AUSENCIA",

  "temp_iqf_1": -18, "temp_iqf_2": -17, "temp_iqf_3": -18,
  "temp_iqf_4": -19, "temp_iqf_5": -18,

  "temp_entrada_iqf_1": 55, "temp_entrada_iqf_2": 57, "temp_entrada_iqf_3": 54,
  "temp_entrada_iqf_4": 56, "temp_entrada_iqf_5": 55,

  "temp_salida_iqf_1": -5, "temp_salida_iqf_2": -6, "temp_salida_iqf_3": -5,
  "temp_salida_iqf_4": -7, "temp_salida_iqf_5": -6,

  "brix_iqf_1": 30, "brix_iqf_2": 30.5, "brix_iqf_3": 31,
  "brix_iqf_4": 29.5, "brix_iqf_5": 30,

  "peso_neto_1": 450.0, "peso_neto_2": 452.5, "peso_neto_3": 449.0,
  "peso_neto_4": 451.0, "peso_neto_5": 450.5,

  "verificacion_loteado": "CONFORME",
  "sellado_vertical":     "CONFORME",
  "sellado_horizontal":   "CONFORME",
  "materiales_extranos":  "AUSENTE",

  "realizado_por":  "EMIRO CEBALLOS",
  "realizado_por_id":  1,
  "verificado_por": "SAMIRA SARMIENTO",
  "verificado_por_id": 2,
  "observaciones":  ""
}
```

Response `201` — devuelve el registro completo con los campos calculados automáticamente:

```json
{
  "id": 1,
  "fecha": "2026-05-05T00:00:00.000Z",
  "lote": "19-2026",
  "lote_id": 1,
  "hora_inicio": "10:00:00",
  "hora_fin": "12:00:00",
  "lote_verificado": "W192026",
  "verificacion_loteado": "CONFORME",
  "sellado_vertical":     "CONFORME",
  "sellado_horizontal":   "CONFORME",
  "materiales_extranos":  "AUSENTE",
  "estado": "CUMPLE",
  "realizado_por":  "EMIRO CEBALLOS",
  "verificado_por": "SAMIRA SARMIENTO",
  "created_at": "2026-05-05T10:05:00.000Z"
}
```

> `lote_verificado` se calcula automáticamente si no se envía (ej. `W192026`).
> `estado` es `CUMPLE` si todos los valores están en rango, `NO CUMPLE` si alguno sale, `PENDIENTE` si no hay mediciones.

#### `GET /api/prefreido?fecha=YYYY-MM-DD`

Response `200`: array de registros del día.

#### `GET /api/prefreido/:id`

Response `200` / `404`.

#### `DELETE /api/prefreido/:id` · `DELETE /api/prefreido/all`

Response `200`: `{ "message": "Registro eliminado" }` / `{ "message": "Todos los registros eliminados" }`

---

### Lotes de producción y Trazabilidad (all require `Authorization: Bearer <token>`)

> Un **lote** se crea automáticamente la primera vez que se guarda cualquier registro (porcionado o prefreído) con una fecha dada. No hace falta crearlo manualmente.

#### `GET /api/lotes`

Lista todos los lotes registrados.

Response `200`:

```json
[
  {
    "id": 1,
    "lote":   "19-2026",
    "lote_w": "W192026",
    "fecha":  "2026-05-05T00:00:00.000Z",
    "created_at": "2026-05-05T09:50:00.000Z"
  }
]
```

#### `GET /api/lotes/trazabilidad/:lote`

Devuelve todos los registros de porcionado y prefreído agrupados bajo un lote. Parámetro `:lote` en formato `19-2026`.

Response `200`:

```json
{
  "lote_id": 1,
  "lote":    "19-2026",
  "lote_w":  "W192026",
  "fecha":   "2026-05-05T00:00:00.000Z",
  "porcionados": [
    {
      "id": 1,
      "hora_inicio": "09:50:00",
      "hora_fin":    "11:00:00",
      "cuarto": 3,
      "estado": "CUMPLE",
      "realizado_por":  "EMIRO CEBALLOS",
      "verificado_por": "SAMIRA SARMIENTO",
      "created_at": "2026-05-05T09:55:00.000Z"
    }
  ],
  "prefreidos": [
    {
      "id": 1,
      "hora_inicio": "10:00:00",
      "hora_fin":    "12:00:00",
      "estado": "CUMPLE",
      "realizado_por":  "EMIRO CEBALLOS",
      "verificado_por": "SAMIRA SARMIENTO",
      "created_at": "2026-05-05T10:05:00.000Z"
    }
  ]
}
```

#### `GET /api/lotes/trazabilidad/fecha/:fecha`

Mismo resultado que el anterior pero acepta la fecha en formato `YYYY-MM-DD` y calcula el lote internamente.

```
GET /api/lotes/trazabilidad/fecha/2026-05-05
```

---

```bash
# 1. Login
curl -X POST https://control-calidad-backend-1.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"Emiro","password":"EmiroAPP2026cc"}'

# 2. Create user (replace <TOKEN>)
curl -X POST https://control-calidad-backend-1.onrender.com/api/users \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <TOKEN>" \
  -d '{"username":"alice","email":"alice@example.com"}'

# 3. List users
curl https://control-calidad-backend-1.onrender.com/api/users \
  -H "Authorization: Bearer <TOKEN>"

# 4. Export users to Excel
curl -L https://control-calidad-backend-1.onrender.com/api/users/export \
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
