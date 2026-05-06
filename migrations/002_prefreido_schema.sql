-- =============================================================================
-- Migración 002 — Tabla de registros prefreído, deollier y picking
-- =============================================================================

CREATE TABLE IF NOT EXISTS registros_prefreido (
  id   SERIAL PRIMARY KEY,

  -- Información general
  fecha        DATE        NOT NULL,
  lote         VARCHAR(20) NOT NULL,
  hora_inicio  TIME        NOT NULL,
  hora_fin     TIME,

  -- Temperatura freidora entrada (150–180 °C)
  temp_freidora_entrada_1 NUMERIC(6,1), temp_freidora_entrada_2 NUMERIC(6,1),
  temp_freidora_entrada_3 NUMERIC(6,1), temp_freidora_entrada_4 NUMERIC(6,1),
  temp_freidora_entrada_5 NUMERIC(6,1),

  -- Temperatura freidora salida (150–180 °C)
  temp_freidora_salida_1 NUMERIC(6,1), temp_freidora_salida_2 NUMERIC(6,1),
  temp_freidora_salida_3 NUMERIC(6,1), temp_freidora_salida_4 NUMERIC(6,1),
  temp_freidora_salida_5 NUMERIC(6,1),

  -- Temperatura tajada salida freidora (65–80 °C)
  temp_tajada_freidora_1 NUMERIC(6,1), temp_tajada_freidora_2 NUMERIC(6,1),
  temp_tajada_freidora_3 NUMERIC(6,1), temp_tajada_freidora_4 NUMERIC(6,1),
  temp_tajada_freidora_5 NUMERIC(6,1),

  -- Temperatura tajada salida deollier (40–60 °C)
  temp_tajada_deollier_1 NUMERIC(6,1), temp_tajada_deollier_2 NUMERIC(6,1),
  temp_tajada_deollier_3 NUMERIC(6,1), temp_tajada_deollier_4 NUMERIC(6,1),
  temp_tajada_deollier_5 NUMERIC(6,1),

  -- Picking – color
  color_1 VARCHAR(50), color_2 VARCHAR(50), color_3 VARCHAR(50),
  color_4 VARCHAR(50), color_5 VARCHAR(50),

  -- Picking – sabor
  sabor_1 VARCHAR(20), sabor_2 VARCHAR(20), sabor_3 VARCHAR(20),
  sabor_4 VARCHAR(20), sabor_5 VARCHAR(20),

  -- Picking – olor
  olor_1 VARCHAR(30), olor_2 VARCHAR(30), olor_3 VARCHAR(30),
  olor_4 VARCHAR(30), olor_5 VARCHAR(30),

  -- Picking – forma
  forma_1 VARCHAR(20), forma_2 VARCHAR(20), forma_3 VARCHAR(20),
  forma_4 VARCHAR(20), forma_5 VARCHAR(20),

  -- Picking – material extraño
  mat_ext_pick_1 VARCHAR(15), mat_ext_pick_2 VARCHAR(15),
  mat_ext_pick_3 VARCHAR(15), mat_ext_pick_4 VARCHAR(15),
  mat_ext_pick_5 VARCHAR(15),

  -- IQF – temperatura túnel (debe ser ≤ -10 °C)
  temp_iqf_1 NUMERIC(6,1), temp_iqf_2 NUMERIC(6,1), temp_iqf_3 NUMERIC(6,1),
  temp_iqf_4 NUMERIC(6,1), temp_iqf_5 NUMERIC(6,1),

  -- IQF – temperatura entrada al túnel (40–80 °C)
  temp_entrada_iqf_1 NUMERIC(6,1), temp_entrada_iqf_2 NUMERIC(6,1),
  temp_entrada_iqf_3 NUMERIC(6,1), temp_entrada_iqf_4 NUMERIC(6,1),
  temp_entrada_iqf_5 NUMERIC(6,1),

  -- IQF – temperatura salida del producto (≤ -2 °C)
  temp_salida_iqf_1 NUMERIC(6,1), temp_salida_iqf_2 NUMERIC(6,1),
  temp_salida_iqf_3 NUMERIC(6,1), temp_salida_iqf_4 NUMERIC(6,1),
  temp_salida_iqf_5 NUMERIC(6,1),

  -- IQF – Brix salida (29–32)
  brix_iqf_1 NUMERIC(5,2), brix_iqf_2 NUMERIC(5,2), brix_iqf_3 NUMERIC(5,2),
  brix_iqf_4 NUMERIC(5,2), brix_iqf_5 NUMERIC(5,2),

  -- Producto terminado – peso neto (entrada libre)
  peso_neto_1 NUMERIC(7,2), peso_neto_2 NUMERIC(7,2), peso_neto_3 NUMERIC(7,2),
  peso_neto_4 NUMERIC(7,2), peso_neto_5 NUMERIC(7,2),

  -- Verificación de loteado
  lote_verificado      VARCHAR(20),           -- ej. W192026 (auto-calculado)
  verificacion_loteado VARCHAR(20),           -- CONFORME | NO CONFORME
  sellado_vertical     VARCHAR(20),           -- CONFORME | NO CONFORME
  sellado_horizontal   VARCHAR(20),           -- CONFORME | NO CONFORME
  materiales_extranos  VARCHAR(20),           -- AUSENTE  | PRESENTE

  -- Control
  estado         VARCHAR(20)  NOT NULL DEFAULT 'PENDIENTE',
  realizado_por  VARCHAR(150) NOT NULL,
  verificado_por VARCHAR(150) NOT NULL,
  observaciones  TEXT,
  created_at     TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_prefreido_fecha  ON registros_prefreido (fecha DESC);
CREATE INDEX IF NOT EXISTS idx_prefreido_lote   ON registros_prefreido (lote);
CREATE INDEX IF NOT EXISTS idx_prefreido_estado ON registros_prefreido (estado);
