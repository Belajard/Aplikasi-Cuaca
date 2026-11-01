export interface ForecastResponse {
  latitude: number
  longitude: number
  utc_offset_seconds: number
  hourly_units: {
    time: string
    temperature_2m: string
  }
  hourly: {
    time: string[]
    temperature_2m: number[]
  }
}

export interface HourlyEntry {
  /** Waktu pengukuran sebagai objek Date (UTC, sesuai respons API). */
  date: Date
  /** Suhu 2 meter di atas tanah dalam °C. */
  temperature: number
}

export interface DayGroup {
  /** Kunci tanggal lokal Jakarta, format YYYY-MM-DD. */
  key: string
  entries: HourlyEntry[]
}

export type Unit = 'C' | 'F'
export type Tone = 'cool' | 'warm' | 'hot' | 'extreme'
export type Period = 'all' | 'dini' | 'pagi' | 'siang' | 'sore' | 'malam'
