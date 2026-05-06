// Utilidades de cálculo de lote compartidas entre todos los módulos de producción.

/**
 * Calcula el número de semana ISO y devuelve "semana-año".
 * @param {string} fechaStr  Fecha en formato 'YYYY-MM-DD'
 * @returns {string}  Ej. "19-2026"
 */
export function calcularLote(fechaStr) {
  const date   = new Date(`${fechaStr}T12:00:00Z`)
  const jan4   = new Date(Date.UTC(date.getUTCFullYear(), 0, 4))
  const start1 = new Date(jan4)
  start1.setUTCDate(jan4.getUTCDate() - ((jan4.getUTCDay() + 6) % 7))

  let week = Math.floor((date - start1) / (7 * 86400000)) + 1
  let year = date.getUTCFullYear()

  if (week < 1) {
    year -= 1
    const jan4p  = new Date(Date.UTC(year, 0, 4))
    const startP = new Date(jan4p)
    startP.setUTCDate(jan4p.getUTCDate() - ((jan4p.getUTCDay() + 6) % 7))
    const dec28p = new Date(Date.UTC(year, 11, 28))
    week = Math.floor((dec28p - startP) / (7 * 86400000)) + 1
  } else {
    const jan4n  = new Date(Date.UTC(year + 1, 0, 4))
    const startN = new Date(jan4n)
    startN.setUTCDate(jan4n.getUTCDate() - ((jan4n.getUTCDay() + 6) % 7))
    if (date >= startN) { week = 1; year += 1 }
  }

  return `${week}-${year}`
}

/**
 * Calcula el lote en formato W (sin guión).
 * @param {string} fechaStr  Fecha en formato 'YYYY-MM-DD'
 * @returns {string}  Ej. "W192026"
 */
export function calcularLoteW(fechaStr) {
  const [semana, anio] = calcularLote(fechaStr).split('-')
  return `W${semana}${anio}`
}
