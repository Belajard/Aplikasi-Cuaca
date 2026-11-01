import { dayKey, hourLabel } from './format'
import type { DayGroup } from './types'

/** Mengunduh data satu hari sebagai CSV. Waktu dalam WIB, suhu dalam °C. */
export function downloadDayCsv(day: DayGroup): void {
  const lines = ['time,temperature_2m']
  for (const e of day.entries) {
    const time = `${dayKey(e.date)} ${hourLabel(e.date).replace('.', ':')}`
    lines.push(`${time},${e.temperature}`)
  }

  const blob = new Blob([lines.join('\n') + '\n'], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `suhu-jakarta-${day.key}.csv`
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}
