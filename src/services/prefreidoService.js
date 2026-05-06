import { query } from '../config/db.js'
import { ApiError } from '../utils/ApiError.js'
import { calcularLote, calcularLoteW } from '../utils/loteUtils.js'
import { getOrCreateLote } from './lotesService.js'

// ─── Helpers ─────────────────────────────────────────────────────────────────

const range = (start, end, step) => {
  const result = []
  for (let v = start; v <= end + 1e-9; v = parseFloat((v + step).toFixed(4))) {
    result.push(parseFloat(v.toFixed(4)))
  }
  return result
}

// ─── Opciones predefinidas para los dropdowns del frontend ──────────────────

export const OPCIONES = {
  // Freidora – temperatura entrada y salida (150–180 °C)
  temp_freidora: range(150, 180, 0.5),

  // Temperatura tajada salida freidora (65–80 °C)
  temp_tajada_freidora: range(65, 80, 0.5),

  // Temperatura tajada salida deollier (40–60 °C)
  temp_tajada_deollier: range(40, 60, 0.5),

  // Presentación – picking
  color: [
    'OPTIMO (AMARILLO A DORADO)',
    'ACEPTABLE (DORADO INTENSO)',
    'NO CONFORME (MARRON MUY OSCURO)',
  ],
  sabor: ['DULCE', 'AMARGO'],
  olor: ['CARACTERISTICO', 'NO CARACTERISTICO'],
  forma: ['ALARGADA', 'REDONDA'],
  material_extrano_pick: ['AUSENCIA', 'PRESENCIA'],

  // IQF – temperatura túnel (debe ser ≤ -10 °C)
  temp_iqf: range(-40, -10, 0.5),

  // IQF – temperatura de entrada al túnel (40–80 °C)
  temp_entrada_iqf: range(40, 80, 0.5),

  // IQF – temperatura de salida del producto (-2 °C o más frío)
  temp_salida_iqf: range(-30, -2, 0.5),

  // Brix salida IQF (29–32)
  brix_iqf: range(29, 32, 0.5),

  // Verificaciones binarias
  conformidad: ['CONFORME', 'NO CONFORME'],
  materiales_extranos: ['AUSENTE', 'PRESENTE'],

  // Responsables
  responsables: ['EMIRO CEBALLOS', 'SAMIRA SARMIENTO'],
}

// ─── Estado automático ───────────────────────────────────────────────────────

function calcularEstado(data) {
  const checks = []

  for (let i = 1; i <= 5; i++) {
    // Temperaturas freidora entrada / salida (150–180)
    const tfe = data[`temp_freidora_entrada_${i}`]
    const tfs = data[`temp_freidora_salida_${i}`]
    if (tfe != null) checks.push(tfe >= 150 && tfe <= 180)
    if (tfs != null) checks.push(tfs >= 150 && tfs <= 180)

    // Temperatura tajada freidora (65–80)
    const ttf = data[`temp_tajada_freidora_${i}`]
    if (ttf != null) checks.push(ttf >= 65 && ttf <= 80)

    // Temperatura tajada deollier (40–60)
    const ttd = data[`temp_tajada_deollier_${i}`]
    if (ttd != null) checks.push(ttd >= 40 && ttd <= 60)

    // Color picking
    const color = data[`color_${i}`]
    if (color) checks.push(color !== 'NO CONFORME (MARRON MUY OSCURO)')

    // Olor
    const olor = data[`olor_${i}`]
    if (olor) checks.push(olor === 'CARACTERISTICO')

    // Material extraño picking
    const matPick = data[`mat_ext_pick_${i}`]
    if (matPick) checks.push(matPick === 'AUSENCIA')

    // IQF – temperatura túnel (≤ -10)
    const tiqf = data[`temp_iqf_${i}`]
    if (tiqf != null) checks.push(tiqf <= -10)

    // IQF – temperatura entrada (40–80)
    const teiqf = data[`temp_entrada_iqf_${i}`]
    if (teiqf != null) checks.push(teiqf >= 40 && teiqf <= 80)

    // IQF – temperatura salida (≤ -2)
    const tsiqf = data[`temp_salida_iqf_${i}`]
    if (tsiqf != null) checks.push(tsiqf <= -2)

    // Brix IQF (29–32)
    const brix = data[`brix_iqf_${i}`]
    if (brix != null) checks.push(brix >= 29 && brix <= 32)
  }

  // Verificaciones
  const verLoteado = data.verificacion_loteado
  const selV       = data.sellado_vertical
  const selH       = data.sellado_horizontal
  const matExt     = data.materiales_extranos
  if (verLoteado) checks.push(verLoteado === 'CONFORME')
  if (selV)       checks.push(selV === 'CONFORME')
  if (selH)       checks.push(selH === 'CONFORME')
  if (matExt)     checks.push(matExt === 'AUSENTE')

  if (checks.length === 0) return 'PENDIENTE'
  return checks.every(Boolean) ? 'CUMPLE' : 'NO CUMPLE'
}

// ─── Crear tabla ─────────────────────────────────────────────────────────────

export const ensurePrefreidoTable = async () => {
  await query(`
    CREATE TABLE IF NOT EXISTS registros_prefreido (
      id   SERIAL PRIMARY KEY,

      -- Información general
      fecha        DATE        NOT NULL,
      lote         VARCHAR(20) NOT NULL,
      hora_inicio  TIME        NOT NULL,
      hora_fin     TIME,

      -- Sección: Temperatura freidora entrada (150–180 °C)
      temp_freidora_entrada_1 NUMERIC(6,1), temp_freidora_entrada_2 NUMERIC(6,1),
      temp_freidora_entrada_3 NUMERIC(6,1), temp_freidora_entrada_4 NUMERIC(6,1),
      temp_freidora_entrada_5 NUMERIC(6,1),

      -- Sección: Temperatura freidora salida (150–180 °C)
      temp_freidora_salida_1 NUMERIC(6,1), temp_freidora_salida_2 NUMERIC(6,1),
      temp_freidora_salida_3 NUMERIC(6,1), temp_freidora_salida_4 NUMERIC(6,1),
      temp_freidora_salida_5 NUMERIC(6,1),

      -- Sección: Temperatura tajada salida freidora (65–80 °C)
      temp_tajada_freidora_1 NUMERIC(6,1), temp_tajada_freidora_2 NUMERIC(6,1),
      temp_tajada_freidora_3 NUMERIC(6,1), temp_tajada_freidora_4 NUMERIC(6,1),
      temp_tajada_freidora_5 NUMERIC(6,1),

      -- Sección: Temperatura tajada salida deollier (40–60 °C)
      temp_tajada_deollier_1 NUMERIC(6,1), temp_tajada_deollier_2 NUMERIC(6,1),
      temp_tajada_deollier_3 NUMERIC(6,1), temp_tajada_deollier_4 NUMERIC(6,1),
      temp_tajada_deollier_5 NUMERIC(6,1),

      -- Sección: Picking – color
      color_1 VARCHAR(50), color_2 VARCHAR(50), color_3 VARCHAR(50),
      color_4 VARCHAR(50), color_5 VARCHAR(50),

      -- Sección: Picking – sabor
      sabor_1 VARCHAR(20), sabor_2 VARCHAR(20), sabor_3 VARCHAR(20),
      sabor_4 VARCHAR(20), sabor_5 VARCHAR(20),

      -- Sección: Picking – olor
      olor_1 VARCHAR(30), olor_2 VARCHAR(30), olor_3 VARCHAR(30),
      olor_4 VARCHAR(30), olor_5 VARCHAR(30),

      -- Sección: Picking – forma
      forma_1 VARCHAR(20), forma_2 VARCHAR(20), forma_3 VARCHAR(20),
      forma_4 VARCHAR(20), forma_5 VARCHAR(20),

      -- Sección: Picking – material extraño
      mat_ext_pick_1 VARCHAR(15), mat_ext_pick_2 VARCHAR(15),
      mat_ext_pick_3 VARCHAR(15), mat_ext_pick_4 VARCHAR(15),
      mat_ext_pick_5 VARCHAR(15),

      -- Sección: IQF – temperatura túnel (≤ -10 °C)
      temp_iqf_1 NUMERIC(6,1), temp_iqf_2 NUMERIC(6,1), temp_iqf_3 NUMERIC(6,1),
      temp_iqf_4 NUMERIC(6,1), temp_iqf_5 NUMERIC(6,1),

      -- Sección: IQF – temperatura entrada (40–80 °C)
      temp_entrada_iqf_1 NUMERIC(6,1), temp_entrada_iqf_2 NUMERIC(6,1),
      temp_entrada_iqf_3 NUMERIC(6,1), temp_entrada_iqf_4 NUMERIC(6,1),
      temp_entrada_iqf_5 NUMERIC(6,1),

      -- Sección: IQF – temperatura salida (≤ -2 °C)
      temp_salida_iqf_1 NUMERIC(6,1), temp_salida_iqf_2 NUMERIC(6,1),
      temp_salida_iqf_3 NUMERIC(6,1), temp_salida_iqf_4 NUMERIC(6,1),
      temp_salida_iqf_5 NUMERIC(6,1),

      -- Sección: IQF – Brix salida (29–32)
      brix_iqf_1 NUMERIC(5,2), brix_iqf_2 NUMERIC(5,2), brix_iqf_3 NUMERIC(5,2),
      brix_iqf_4 NUMERIC(5,2), brix_iqf_5 NUMERIC(5,2),

      -- Sección: Producto terminado – peso neto (entrada libre)
      peso_neto_1 NUMERIC(7,2), peso_neto_2 NUMERIC(7,2), peso_neto_3 NUMERIC(7,2),
      peso_neto_4 NUMERIC(7,2), peso_neto_5 NUMERIC(7,2),

      -- Sección: Verificación de loteado
      lote_verificado    VARCHAR(20),
      verificacion_loteado VARCHAR(20),
      sellado_vertical     VARCHAR(20),
      sellado_horizontal   VARCHAR(20),
      materiales_extranos  VARCHAR(20),

      -- Control
      estado         VARCHAR(20)  NOT NULL DEFAULT 'PENDIENTE',
      realizado_por  VARCHAR(150) NOT NULL,
      verificado_por VARCHAR(150) NOT NULL,
      observaciones  TEXT,
      created_at     TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `)
}

// ─── Grupos de campos numéricos ───────────────────────────────────────────────

const NUMERIC_GROUPS = [
  'temp_freidora_entrada',
  'temp_freidora_salida',
  'temp_tajada_freidora',
  'temp_tajada_deollier',
  'temp_iqf',
  'temp_entrada_iqf',
  'temp_salida_iqf',
  'brix_iqf',
  'peso_neto',
]

const TEXT_GROUPS = ['color', 'sabor', 'olor', 'forma', 'mat_ext_pick']

const ALL_MEASUREMENT_FIELDS = [
  ...NUMERIC_GROUPS.flatMap((g) => Array.from({ length: 5 }, (_, i) => `${g}_${i + 1}`)),
  ...TEXT_GROUPS.flatMap((g) => Array.from({ length: 5 }, (_, i) => `${g}_${i + 1}`)),
]

const VERIFICATION_FIELDS = [
  'lote_verificado',
  'verificacion_loteado',
  'sellado_vertical',
  'sellado_horizontal',
  'materiales_extranos',
]

// ─── CRUD ─────────────────────────────────────────────────────────────────────

export const listarRegistros = async ({ fecha } = {}) => {
  if (fecha) {
    const { rows } = await query(
      'SELECT * FROM registros_prefreido WHERE fecha = $1 ORDER BY created_at DESC',
      [fecha],
    )
    return rows
  }
  const { rows } = await query(
    'SELECT * FROM registros_prefreido ORDER BY created_at DESC',
  )
  return rows
}

export const obtenerRegistro = async (id) => {
  const { rows } = await query(
    'SELECT * FROM registros_prefreido WHERE id = $1',
    [id],
  )
  if (!rows[0]) throw ApiError.notFound('Registro no encontrado')
  return rows[0]
}

export const crearRegistro = async (data) => {
  const {
    fecha,
    hora_inicio,
    hora_fin = null,
    realizado_por,
    verificado_por,
    realizado_por_id  = null,
    verificado_por_id = null,
    observaciones = null,
  } = data

  if (!fecha)          throw ApiError.badRequest('El campo fecha es obligatorio')
  if (!hora_inicio)    throw ApiError.badRequest('El campo hora_inicio es obligatorio')
  if (!realizado_por)  throw ApiError.badRequest('El campo realizado_por es obligatorio')
  if (!verificado_por) throw ApiError.badRequest('El campo verificado_por es obligatorio')

  const loteRecord      = await getOrCreateLote(fecha, realizado_por_id)
  const lote            = loteRecord.lote
  const lote_id         = loteRecord.id
  const lote_verificado = data.lote_verificado ?? calcularLoteW(fecha)
  const estado          = calcularEstado({ ...data, lote_verificado })

  const measurementValues = ALL_MEASUREMENT_FIELDS.map((f) => data[f] ?? null)
  const verValues         = VERIFICATION_FIELDS.map((f) =>
    f === 'lote_verificado' ? lote_verificado : (data[f] ?? null),
  )

  const cols = [
    'fecha', 'lote', 'lote_id', 'hora_inicio', 'hora_fin',
    ...ALL_MEASUREMENT_FIELDS,
    ...VERIFICATION_FIELDS,
    'estado', 'realizado_por', 'realizado_por_id', 'verificado_por', 'verificado_por_id', 'observaciones',
  ]
  const values = [
    fecha, lote, lote_id, hora_inicio, hora_fin,
    ...measurementValues,
    ...verValues,
    estado, realizado_por, realizado_por_id, verificado_por, verificado_por_id, observaciones,
  ]
  const placeholders = values.map((_, i) => `$${i + 1}`).join(', ')

  const { rows } = await query(
    `INSERT INTO registros_prefreido (${cols.join(', ')})
     VALUES (${placeholders})
     RETURNING *`,
    values,
  )
  return rows[0]
}

export const eliminarRegistro = async (id) => {
  const { rowCount } = await query(
    'DELETE FROM registros_prefreido WHERE id = $1',
    [id],
  )
  if (rowCount === 0) throw ApiError.notFound('Registro no encontrado')
  return true
}

export const eliminarTodosLosRegistros = async () => {
  await query('DELETE FROM registros_prefreido')
  return true
}
