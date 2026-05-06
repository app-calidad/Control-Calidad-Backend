-- =============================================================================
-- Migración 001 — Esquema inicial
-- Ejecutar una sola vez en la base de datos de producción/staging
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Tabla de usuarios
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
  id         SERIAL PRIMARY KEY,
  username   VARCHAR(100) NOT NULL,
  email      VARCHAR(150) NOT NULL UNIQUE,
  created_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- -----------------------------------------------------------------------------
-- 2. Tabla de registros de control porcionado
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS registros_porcionado (
  id             SERIAL PRIMARY KEY,

  -- Información general
  fecha          DATE        NOT NULL,
  lote           VARCHAR(20) NOT NULL,   -- semana-año ej. 19-2026
  hora_inicio    TIME        NOT NULL,
  hora_fin       TIME,
  cuarto         SMALLINT    NOT NULL CHECK (cuarto BETWEEN 1 AND 6),

  -- Peso tajada al ingreso del freído (32–45 g)
  peso_1         NUMERIC(6,2), peso_2 NUMERIC(6,2), peso_3 NUMERIC(6,2),
  peso_4         NUMERIC(6,2), peso_5 NUMERIC(6,2),

  -- Longitud (6–9 cm)
  longitud_1     NUMERIC(5,2), longitud_2 NUMERIC(5,2), longitud_3 NUMERIC(5,2),
  longitud_4     NUMERIC(5,2), longitud_5 NUMERIC(5,2),

  -- Amplitud (3.5–4 cm)
  amplitud_1     NUMERIC(5,2), amplitud_2 NUMERIC(5,2), amplitud_3 NUMERIC(5,2),
  amplitud_4     NUMERIC(5,2), amplitud_5 NUMERIC(5,2),

  -- Grosor (2–2.5 cm)
  grosor_1       NUMERIC(5,2), grosor_2 NUMERIC(5,2), grosor_3 NUMERIC(5,2),
  grosor_4       NUMERIC(5,2), grosor_5 NUMERIC(5,2),

  -- Grados Brix platano (28–32)
  brix_1         NUMERIC(5,2), brix_2 NUMERIC(5,2), brix_3 NUMERIC(5,2),
  brix_4         NUMERIC(5,2), brix_5 NUMERIC(5,2),

  -- Control y responsables
  estado         VARCHAR(20)  NOT NULL DEFAULT 'PENDIENTE',  -- CUMPLE | NO CUMPLE | PENDIENTE
  realizado_por  VARCHAR(150) NOT NULL,
  verificado_por VARCHAR(150) NOT NULL,
  observaciones  TEXT,

  created_at     TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- -----------------------------------------------------------------------------
-- 3. Índices recomendados
-- -----------------------------------------------------------------------------

-- Consultas frecuentes por fecha (filtro del frontend)
CREATE INDEX IF NOT EXISTS idx_porcionado_fecha
  ON registros_porcionado (fecha DESC);

-- Consultas por lote de producción
CREATE INDEX IF NOT EXISTS idx_porcionado_lote
  ON registros_porcionado (lote);

-- Consultas por estado (CUMPLE / NO CUMPLE)
CREATE INDEX IF NOT EXISTS idx_porcionado_estado
  ON registros_porcionado (estado);
