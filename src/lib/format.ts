export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('es-DO', {
    style: 'currency',
    currency: 'DOP',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

export function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat('es-DO', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

export function formatHorseCountLabel(horseCount: number): string {
  return horseCount >= 5 ? '5 o mas caballos' : `${horseCount} caballos`
}

export function formatPositionLabel(position: number): string {
  return `${position}. posicion`
}
