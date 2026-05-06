-- =============================================================================
-- Migración 004 — Relación users ↔ registros_porcionado / registros_prefreido
-- =============================================================================
-- Los campos de texto realizado_por / verificado_por se mantienen para cuando
-- el usuario selecciona "Otro" y escribe un nombre personalizado.
-- Las columnas FK son NULLABLE: si el responsable fue un usuario del sistema
-- se vincula por id; si fue "Otro", queda NULL y el nombre queda en el texto.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. registros_porcionado
-- -----------------------------------------------------------------------------
ALTER TABLE registros_porcionado
  ADD COLUMN IF NOT EXISTS realizado_por_id  INTEGER REFERENCES users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS verificado_por_id INTEGER REFERENCES users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_porcionado_realizado_por_id
  ON registros_porcionado (realizado_por_id);

CREATE INDEX IF NOT EXISTS idx_porcionado_verificado_por_id
  ON registros_porcionado (verificado_por_id);

-- -----------------------------------------------------------------------------
-- 2. registros_prefreido
-- -----------------------------------------------------------------------------
ALTER TABLE registros_prefreido
  ADD COLUMN IF NOT EXISTS realizado_por_id  INTEGER REFERENCES users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS verificado_por_id INTEGER REFERENCES users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_prefreido_realizado_por_id
  ON registros_prefreido (realizado_por_id);

CREATE INDEX IF NOT EXISTS idx_prefreido_verificado_por_id
  ON registros_prefreido (verificado_por_id);

-- -----------------------------------------------------------------------------
-- 3. lotes_produccion — quién inició el lote
-- -----------------------------------------------------------------------------
ALTER TABLE lotes_produccion
  ADD COLUMN IF NOT EXISTS created_by_id INTEGER REFERENCES users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_lotes_created_by_id
  ON lotes_produccion (created_by_id);

-- -----------------------------------------------------------------------------
-- 4. Actualizar la vista de trazabilidad para incluir los datos del usuario
-- -----------------------------------------------------------------------------
DROP VIEW IF EXISTS v_trazabilidad_lote;

CREATE VIEW v_trazabilidad_lote AS
SELECT
  l.id       AS lote_id,
  l.lote,
  l.lote_w,
  l.fecha,
  l.created_by_id,
  u_lote.username AS created_by_username,

  (
    SELECT json_agg(row_to_json(p) ORDER BY (row_to_json(p)->>'created_at'))
    FROM (
      SELECT
        rp.id, rp.hora_inicio, rp.hora_fin, rp.cuarto,
        rp.estado,
        rp.realizado_por,    rp.realizado_por_id,
        u_r.username         AS realizado_por_username,
        rp.verificado_por,   rp.verificado_por_id,
        u_v.username         AS verificado_por_username,
        rp.created_at
      FROM registros_porcionado rp
      LEFT JOIN users u_r ON u_r.id = rp.realizado_por_id
      LEFT JOIN users u_v ON u_v.id = rp.verificado_por_id
      WHERE rp.lote_id = l.id
    ) p
  ) AS porcionados,

  (
    SELECT json_agg(row_to_json(pf) ORDER BY (row_to_json(pf)->>'created_at'))
    FROM (
      SELECT
        rf.id, rf.hora_inicio, rf.hora_fin,
        rf.estado,
        rf.realizado_por,    rf.realizado_por_id,
        u_r2.username        AS realizado_por_username,
        rf.verificado_por,   rf.verificado_por_id,
        u_v2.username        AS verificado_por_username,
        rf.created_at
      FROM registros_prefreido rf
      LEFT JOIN users u_r2 ON u_r2.id = rf.realizado_por_id
      LEFT JOIN users u_v2 ON u_v2.id = rf.verificado_por_id
      WHERE rf.lote_id = l.id
    ) pf
  ) AS prefreidos

FROM lotes_produccion l
LEFT JOIN users u_lote ON u_lote.id = l.created_by_id;
