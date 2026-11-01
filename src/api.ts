import type { ForecastResponse, HourlyEntry } from './types'

const API_URL =
  'https://api.open-meteo.com/v1/forecast?latitude=-6.2&longitude=106.8&hourly=temperature_2m'

export async function fetchHourlyTemperature(): Promise<HourlyEntry[]> {
  const res = await fetch(API_URL)
  if (!res.ok) {
    throw new Error(`Server membalas dengan status ${res.status}`)
  }

  const data: ForecastResponse = await res.json()
  const { time, temperature_2m } = data.hourly

  // Tanpa parameter timezone, Open-Meteo mengirim waktu dalam GMT
  // (contoh "2026-10-25T00:00"), jadi ditandai sebagai UTC dengan akhiran "Z".
  return time.map((t, i) => ({
    date: new Date(`${t}:00Z`),
    temperature: temperature_2m[i],
  }))
}
