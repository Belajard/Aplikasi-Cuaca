<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import CurrentCard from './components/CurrentCard.vue'
import DayTabs from './components/DayTabs.vue'
import HourlyTable from './components/HourlyTable.vue'
import TemperatureChart from './components/TemperatureChart.vue'
import { useForecast } from './composables/useForecast'
import { usePersisted } from './composables/usePersisted'
import { downloadDayCsv } from './export'
import { countdown, dayKey, formatTemp, hourLabel, longDate, relativeTime } from './format'
import type { HourlyEntry, Unit } from './types'

const {
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
} = useForecast()

const unit = usePersisted<Unit>('cuaca.unit', 'C')
const selectedKey = ref('')
const hoveredTime = ref<number | null>(null)

const todayKey = computed(() => dayKey(new Date(now.value)))

watch(
  days,
  (list) => {
    if (list.length === 0) return
    if (!list.some((d) => d.key === selectedKey.value)) {
      selectedKey.value = list.some((d) => d.key === todayKey.value) ? todayKey.value : list[0].key
    }
  },
  { immediate: true },
)

watch(selectedKey, () => {
  hoveredTime.value = null
})

const selectedDay = computed(() => days.value.find((d) => d.key === selectedKey.value))

const range = computed(() => {
  const list = selectedDay.value?.entries ?? []
  if (list.length === 0) return null
  const temps = list.map((e) => e.temperature)
  const avg = temps.reduce((a, b) => a + b, 0) / temps.length
  const low = list.reduce((a, b) => (b.temperature < a.temperature ? b : a))
  const high = list.reduce((a, b) => (b.temperature > a.temperature ? b : a))
  return { low, high, avg }
})

const currentIndex = computed(() =>
  entries.value.findIndex((e) => {
    const start = e.date.getTime()
    return now.value >= start && now.value < start + 3_600_000
  }),
)
const current = computed<HourlyEntry | null>(() => entries.value[currentIndex.value] ?? null)
const next = computed<HourlyEntry | null>(() => entries.value[currentIndex.value + 1] ?? null)

const peak = computed<HourlyEntry | null>(() => {
  const c = current.value
  if (!c) return null
  const same = entries.value.filter((e) => dayKey(e.date) === dayKey(c.date))
  return same.reduce((a, b) => (b.temperature > a.temperature ? b : a))
})

const updatedText = computed(() =>
  lastUpdated.value === null ? '' : `Diperbarui ${relativeTime(lastUpdated.value, now.value)}`,
)

const nextText = computed(() =>
  autoRefresh.value && nextRefreshAt.value !== null
    ? `Segarkan otomatis dalam ${countdown(nextRefreshAt.value - now.value)}`
    : 'Segarkan otomatis mati',
)

function exportCsv() {
  if (selectedDay.value) downloadDayCsv(selectedDay.value)
}
</script>

<template>
  <main class="page">
    <header class="head">
      <div>
        <p class="eyebrow">Jakarta · -6,2 / 106,8</p>
        <h1>Suhu per jam</h1>
      </div>

      <button type="button" class="btn" :disabled="refreshing" @click="load">
        <svg
          class="ico"
          :class="{ spin: refreshing }"
          viewBox="0 0 24 24"
          width="16"
          height="16"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
        >
          <path d="M20 11a8 8 0 1 0-2.3 5.7" />
          <path d="M20 4v7h-7" />
        </svg>
        {{ refreshing ? 'Memuat…' : 'Segarkan' }}
      </button>
    </header>

    <div class="toolbar">
      <p class="status" role="status">
        <span v-if="updatedText">{{ updatedText }}</span>
        <span v-if="updatedText" class="dot" aria-hidden="true">·</span>
        <span>{{ nextText }}</span>
      </p>

      <div class="controls">
        <label class="switch">
          <input v-model="autoRefresh" type="checkbox" />
          <span class="track" aria-hidden="true"></span>
          <span>Otomatis</span>
        </label>

        <div class="seg" role="group" aria-label="Satuan suhu">
          <button type="button" :class="{ on: unit === 'C' }" :aria-pressed="unit === 'C'" @click="unit = 'C'">
            °C
          </button>
          <button type="button" :class="{ on: unit === 'F' }" :aria-pressed="unit === 'F'" @click="unit = 'F'">
            °F
          </button>
        </div>
      </div>
    </div>

    <p v-if="loading" class="state" role="status">Memuat data…</p>

    <div v-else-if="error && entries.length === 0" class="state" role="alert">
      <p>Data tidak bisa dimuat. {{ error }}</p>
      <button type="button" class="btn" @click="load">Coba lagi</button>
    </div>

    <template v-else-if="selectedDay && range">
      <p v-if="error" class="banner" role="alert">
        Gagal menyegarkan. {{ error }} Yang tampil adalah data terakhir yang berhasil dimuat.
      </p>

      <CurrentCard v-if="current && peak" :current="current" :next="next" :peak="peak" :unit="unit" />

      <DayTabs v-model="selectedKey" :days="days" :today-key="todayKey" :unit="unit" />

      <section class="card">
        <div class="card-head">
          <h2>{{ longDate(selectedDay.entries[0].date) }}</h2>
          <button type="button" class="link" @click="exportCsv">Unduh CSV</button>
        </div>

        <dl class="stats">
          <div>
            <dt>Terendah</dt>
            <dd>{{ formatTemp(range.low.temperature, unit) }}<span>°{{ unit }}</span></dd>
            <p class="at">pukul {{ hourLabel(range.low.date) }}</p>
          </div>
          <div>
            <dt>Tertinggi</dt>
            <dd>{{ formatTemp(range.high.temperature, unit) }}<span>°{{ unit }}</span></dd>
            <p class="at">pukul {{ hourLabel(range.high.date) }}</p>
          </div>
          <div>
            <dt>Rata-rata</dt>
            <dd>{{ formatTemp(range.avg, unit) }}<span>°{{ unit }}</span></dd>
            <p class="at">{{ selectedDay.entries.length }} jam</p>
          </div>
        </dl>

        <TemperatureChart
          :entries="selectedDay.entries"
          :unit="unit"
          :now-ms="now"
          :hovered-time="hoveredTime"
          @hover="hoveredTime = $event"
        />

        <HourlyTable
          :entries="selectedDay.entries"
          :unit="unit"
          :now-ms="now"
          :hovered-time="hoveredTime"
          :min="range.low.temperature"
          :max="range.high.temperature"
          @hover="hoveredTime = $event"
        />
      </section>

      <p class="source">
        Sumber data:
        <a href="https://open-meteo.com/" target="_blank" rel="noopener">Open-Meteo</a>
      </p>
    </template>
  </main>
</template>

<style scoped>
.page {
  max-width: 680px;
  margin: 0 auto;
  padding: 40px 20px 64px;
}

.head {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 14px;
}

.eyebrow {
  margin: 0 0 6px;
  font-size: 13px;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--muted);
}

h1 {
  margin: 0;
  font-size: 32px;
  line-height: 1.15;
  font-weight: 650;
  letter-spacing: -0.02em;
}

.btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 9px 16px;
  border: 1px solid var(--line);
  border-radius: 10px;
  background: var(--surface);
  cursor: pointer;
  font-weight: 550;
  transition: border-color 0.15s;
}

.btn:hover:not(:disabled) {
  border-color: var(--accent);
}

.btn:disabled {
  color: var(--muted);
  cursor: default;
}

.btn:focus-visible,
.link:focus-visible,
.seg button:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
}

.ico.spin {
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 10px 16px;
  margin-bottom: 20px;
  padding-bottom: 14px;
  border-bottom: 1px solid var(--line);
}

.status {
  margin: 0;
  font-size: 13px;
  color: var(--muted);
  font-variant-numeric: tabular-nums;
}

.dot {
  margin: 0 6px;
}

.controls {
  display: flex;
  align-items: center;
  gap: 16px;
}

.switch {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: var(--muted);
  cursor: pointer;
  user-select: none;
}

.switch input {
  position: absolute;
  opacity: 0;
  pointer-events: none;
}

.track {
  position: relative;
  width: 32px;
  height: 18px;
  border-radius: 999px;
  background: var(--line);
  transition: background 0.2s;
}

.track::after {
  content: '';
  position: absolute;
  top: 2px;
  left: 2px;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: #fff;
  box-shadow: 0 1px 2px rgb(0 0 0 / 0.25);
  transition: transform 0.2s;
}

.switch input:checked + .track {
  background: var(--accent);
}

.switch input:checked + .track::after {
  transform: translateX(14px);
}

.switch input:focus-visible + .track {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
}

.seg {
  display: inline-flex;
  padding: 3px;
  border: 1px solid var(--line);
  border-radius: 10px;
  background: var(--surface);
}

.seg button {
  padding: 4px 12px;
  border: 0;
  border-radius: 7px;
  background: transparent;
  color: var(--muted);
  font-size: 13px;
  font-weight: 550;
  cursor: pointer;
}

.seg button.on {
  background: var(--accent-soft);
  color: var(--accent);
}

.state {
  padding: 32px 0;
  color: var(--muted);
}

.banner {
  margin: 0 0 16px;
  padding: 10px 14px;
  border: 1px solid var(--accent);
  border-radius: 10px;
  background: var(--accent-soft);
  font-size: 14px;
}

.card {
  border: 1px solid var(--line);
  border-radius: 14px;
  background: var(--surface);
  overflow: hidden;
}

.card-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
  padding: 18px 20px 0;
}

.card-head h2 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  text-transform: capitalize;
}

.link {
  padding: 0;
  border: 0;
  background: none;
  color: var(--accent);
  font-size: 13px;
  font-weight: 550;
  cursor: pointer;
}

.link:hover {
  text-decoration: underline;
}

.stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  margin: 0;
  padding: 16px 20px 8px;
}

.stats div + div {
  padding-left: 16px;
  border-left: 1px solid var(--line);
}

.stats dt {
  font-size: 13px;
  color: var(--muted);
}

.stats dd {
  margin: 2px 0 0;
  font-size: 24px;
  font-weight: 650;
  letter-spacing: -0.01em;
  font-variant-numeric: tabular-nums;
}

.stats dd span {
  margin-left: 2px;
  font-size: 14px;
  font-weight: 500;
  color: var(--muted);
}

.at {
  margin: 0;
  font-size: 12px;
  color: var(--muted);
}

.source {
  margin: 16px 0 0;
  font-size: 13px;
  color: var(--muted);
}

.source a {
  color: inherit;
}

@media (max-width: 520px) {
  .page {
    padding-top: 28px;
  }

  h1 {
    font-size: 26px;
  }

  .card-head,
  .stats {
    padding-left: 14px;
    padding-right: 14px;
  }

  .stats dd {
    font-size: 20px;
  }
}
</style>
