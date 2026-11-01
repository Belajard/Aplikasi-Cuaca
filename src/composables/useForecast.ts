import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { fetchHourlyTemperature } from '../api'
import { dayKey } from '../format'
import type { DayGroup, HourlyEntry } from '../types'
import { usePersisted } from './usePersisted'

export const REFRESH_INTERVAL_MS = 5 * 60 * 1000

export function useForecast() {
  const entries = ref<HourlyEntry[]>([])
  const loading = ref(true)
  const refreshing = ref(false)
  const error = ref<string | null>(null)
  const lastUpdated = ref<number | null>(null)
  const now = ref(Date.now())
  const autoRefresh = usePersisted('cuaca.autoRefresh', true)
  const nextRefreshAt = ref<number | null>(null)

  let clock: number | undefined

  const days = computed<DayGroup[]>(() => {
    const map = new Map<string, HourlyEntry[]>()
    for (const entry of entries.value) {
      const key = dayKey(entry.date)
      const list = map.get(key)
      if (list) list.push(entry)
      else map.set(key, [entry])
    }
    return [...map].map(([key, list]) => ({ key, entries: list }))
  })

  function scheduleNext() {
    nextRefreshAt.value = autoRefresh.value ? Date.now() + REFRESH_INTERVAL_MS : null
  }

  async function load() {
    if (refreshing.value) return
    refreshing.value = true
    error.value = null
    try {
      entries.value = await fetchHourlyTemperature()
      lastUpdated.value = Date.now()
    } catch (e) {
      error.value =
        e instanceof TypeError
          ? 'Tidak bisa terhubung ke server. Periksa koneksi internet Anda.'
          : e instanceof Error
            ? e.message
            : 'Terjadi kesalahan yang tidak diketahui.'
    } finally {
      loading.value = false
      refreshing.value = false
      now.value = Date.now()
      scheduleNext()
    }
  }

  function tick() {
    now.value = Date.now()
    if (autoRefresh.value && nextRefreshAt.value !== null && now.value >= nextRefreshAt.value) {
      void load()
    }
  }

  watch(autoRefresh, scheduleNext)

  onMounted(() => {
    void load()
    clock = window.setInterval(tick, 1000)
  })

  onBeforeUnmount(() => {
    window.clearInterval(clock)
  })

  return {
    entries,
    days,
    loading,
    refreshing,
    error,
    lastUpdated,
    now,
    autoRefresh,
    nextRefreshAt,
    load,
  }
}
