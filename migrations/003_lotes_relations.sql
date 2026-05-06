-- =============================================================================
-- Migración 003 — Tabla padre lotes_produccion + FK a registros hijo + vista
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Tabla padre de lotes de producción
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS lotes_produccion (
  id         SERIAL PRIMARY KEY,
  lote       VARCHAR(20) NOT NULL UNIQUE,   -- semana-año  ej. "19-2026"
  lote_w     VARCHAR(20) NOT NULL UNIQUE,   -- formato W   ej. "W192026"
  fecha      DATE        NOT NULL,
  created_at TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- -----------------------------------------------------------------------------
-- 2. Columna FK en registros_porcionado
-- -----------------------------------------------------------------------------
ALTER TABLE registros_porcionado
  ADD COLUMN IF NOT EXISTS lote_id INTEGER
    REFERENCES lotes_produccion(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_porcionado_lote_id
  ON registros_porcionado (lote_id);

-- -----------------------------------------------------------------------------
-- 3. Columna FK en registros_prefreido
-- -----------------------------------------------------------------------------
ALTER TABLE registros_prefreido
  ADD COLUMN IF NOT EXISTS lote_id INTEGER
    REFERENCES lotes_produccion(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_prefreido_lote_id
  ON registros_prefreido (lote_id);

-- -----------------------------------------------------------------------------
-- 4. Vista de trazabilidad por lote
--    Agrupa todos los registros de cada etapa productiva bajo un mismo lote.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE VIEW v_trazabilidad_lote AS
SELECT
  l.id       AS lote_id,
  l.lote,
  l.lote_w,
  l.fecha,

  (
    SELECT json_agg(row_to_json(p) ORDER BY (row_to_json(p)->>'created_at'))
    FROM (
      SELECT id, hora_inicio, hora_fin, cuarto,
             estado, realizado_por, verificado_por, created_at
      FROM registros_porcionado
      WHERE lote_id = l.id
    ) p
  ) AS porcionados,

  (
    SELECT json_agg(row_to_json(pf) ORDER BY (row_to_json(pf)->>'created_at'))
    FROM (
      SELECT id, hora_inicio, hora_fin,
             estado, realizado_por, verificado_por, created_at
      FROM registros_prefreido
      WHERE lote_id = l.id
    ) pf
  ) AS prefreidos

FROM lotes_produccion l;
