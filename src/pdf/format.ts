// src/pdf/format.ts

/** Энергетическая ценность из Б/Ж/У */
export function calcEnergy(p?: number | null, f?: number | null, c?: number | null): { kcal: number; kJ: number } {
  const proteins = Number(p ?? 0)
  const fats = Number(f ?? 0)
  const carbs = Number(c ?? 0)
  const kcal = Math.round(proteins * 4 + fats * 9 + carbs * 4)
  const kJ = Math.round(kcal * 4.184)
  return { kcal, kJ }
}

export function calcEnergyText(p?: number | null, f?: number | null, c?: number | null): string {
  const { kcal, kJ } = calcEnergy(p, f, c)
  return `${kcal} ккал / ${kJ} кДж`
}

/** Дата в формате DD.MM.YYYY (если задана) */
export function formatDate(d?: string | Date | null): string | undefined {
  if (!d) return undefined
  const date = typeof d === 'string' ? new Date(d) : d
  if (isNaN(date.getTime())) return undefined
  const dd = String(date.getDate()).padStart(2, '0')
  const mm = String(date.getMonth() + 1).padStart(2, '0')
  const yy = String(date.getFullYear())
  return `${dd}.${mm}.${yy}`
}
