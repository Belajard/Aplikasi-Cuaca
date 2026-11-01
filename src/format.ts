import type { Period, Tone, Unit } from './types'

export const TZ = 'Asia/Jakarta'

const dayKeyFmt = new Intl.DateTimeFormat('en-CA', { timeZone: TZ })
const hourFmt = new Intl.DateTimeFormat('id-ID', {
  timeZone: TZ,
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
})
const hourOnlyFmt = new Intl.DateTimeFormat('en-GB', {
  timeZone: TZ,
  hour: '2-digit',
  hourCycle: 'h23',
})
const weekdayFmt = new Intl.DateTimeFormat('id-ID', { timeZone: TZ, weekday: 'short' })
const dayMonthFmt = new Intl.DateTimeFormat('id-ID', { timeZone: TZ, day: 'numeric', month: 'short' })
const longDateFmt = new Intl.DateTimeFormat('id-ID', {
  timeZone: TZ,
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
})
const numberFmt = new Intl.NumberFormat('id-ID', {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
})

export const dayKey = (d: Date) => dayKeyFmt.format(d)
export const hourLabel = (d: Date) => hourFmt.format(d)
export const hourOfDay = (d: Date) => Number.parseInt(hourOnlyFmt.format(d), 10)
export const weekdayShort = (d: Date) => weekdayFmt.format(d)
export const dayMonth = (d: Date) => dayMonthFmt.format(d)
export const longDate = (d: Date) => longDateFmt.format(d)
export const clockLabel = (ms: number) => hourFmt.format(new Date(ms))

export function toUnit(celsius: number, unit: Unit): number {
  return unit === 'C' ? celsius : (celsius * 9) / 5 + 32
}

export function formatTemp(celsius: number, unit: Unit): string {
  return numberFmt.format(toUnit(celsius, unit))
}

/** Selisih suhu (tanpa tanda), sudah disesuaikan dengan satuan. */
export function formatDelta(celsiusDiff: number, unit: Unit): string {
  const value = unit === 'C' ? celsiusDiff : (celsiusDiff * 9) / 5
  return numberFmt.format(Math.abs(value))
}

export function toneOf(celsius: number): Tone {
  if (celsius < 26) return 'cool'
  if (celsius < 30) return 'warm'
  if (celsius < 33) return 'hot'
  return 'extreme'
}

export const toneLabel: Record<Tone, string> = {
  cool: 'Sejuk',
  warm: 'Hangat',
  hot: 'Panas',
  extreme: 'Terik',
}

export const periodLabels: Record<Period, string> = {
  all: 'Semua',
  dini: 'Dini hari',
  pagi: 'Pagi',
  siang: 'Siang',
  sore: 'Sore',
  malam: 'Malam',
}

export function periodOf(hour: number): Exclude<Period, 'all'> {
  if (hour < 6) return 'dini'
  if (hour < 12) return 'pagi'
  if (hour < 16) return 'siang'
  if (hour < 19) return 'sore'
  return 'malam'
}

export function relativeTime(from: number, to: number): string {
  const sec = Math.max(0, Math.round((to - from) / 1000))
  if (sec < 10) return 'baru saja'
  if (sec < 60) return `${sec} detik lalu`
  const min = Math.floor(sec / 60)
  if (min < 60) return `${min} menit lalu`
  return `${Math.floor(min / 60)} jam lalu`
}

export function countdown(ms: number): string {
  const total = Math.max(0, Math.ceil(ms / 1000))
  const m = Math.floor(total / 60)
  const s = total % 60
  return `${m}:${String(s).padStart(2, '0')}`
}
