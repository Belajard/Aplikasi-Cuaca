<script setup lang="ts">
import { computed, ref } from 'vue'
import {
  formatTemp,
  hourLabel,
  hourOfDay,
  periodLabels,
  periodOf,
  toneLabel,
  toneOf,
} from '../format'
import type { HourlyEntry, Period, Unit } from '../types'

const props = defineProps<{
  entries: HourlyEntry[]
  unit: Unit
  nowMs: number
  hoveredTime: number | null
  min: number
  max: number
}>()

const emit = defineEmits<{ hover: [time: number | null] }>()

type SortKey = 'time' | 'temp'

const HOUR_MS = 3_600_000
const periods = Object.keys(periodLabels) as Period[]

const sortKey = ref<SortKey>('time')
const sortDir = ref<'asc' | 'desc'>('asc')
const period = ref<Period>('all')

const rows = computed(() => {
  const list = props.entries
    .map((entry) => ({
      entry,
      time: entry.date.getTime(),
      period: periodOf(hourOfDay(entry.date)),
      tone: toneOf(entry.temperature),
    }))
    .filter((r) => period.value === 'all' || r.period === period.value)

  const dir = sortDir.value === 'asc' ? 1 : -1
  list.sort((a, b) =>
    sortKey.value === 'time'
      ? (a.time - b.time) * dir
      : (a.entry.temperature - b.entry.temperature) * dir || a.time - b.time,
  )
  return list
})

function toggleSort(key: SortKey) {
  if (sortKey.value === key) {
    sortDir.value = sortDir.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortKey.value = key
    sortDir.value = key === 'time' ? 'asc' : 'desc'
  }
}

function ariaSort(key: SortKey): 'ascending' | 'descending' | 'none' {
  if (sortKey.value !== key) return 'none'
  return sortDir.value === 'asc' ? 'ascending' : 'descending'
}

function arrow(key: SortKey): string {
  if (sortKey.value !== key) return ''
  return sortDir.value === 'asc' ? '↑' : '↓'
}

function barWidth(celsius: number): string {
  if (props.max === props.min) return '100%'
  const ratio = (celsius - props.min) / (props.max - props.min)
  return `${8 + ratio * 92}%`
}

const isCurrent = (time: number) => props.nowMs >= time && props.nowMs < time + HOUR_MS
</script>

<template>
  <div class="wrap">
    <div class="filters" role="group" aria-label="Filter waktu">
      <button
        v-for="p in periods"
        :key="p"
        type="button"
        class="chip"
        :class="{ active: period === p }"
        :aria-pressed="period === p"
        @click="period = p"
      >
        {{ periodLabels[p] }}
      </button>
    </div>

    <table class="table">
      <thead>
        <tr>
          <th scope="col" :aria-sort="ariaSort('time')">
            <button type="button" class="sort" @click="toggleSort('time')">
              Waktu <span class="arrow">{{ arrow('time') }}</span>
            </button>
          </th>
          <th scope="col" class="cond">Kondisi</th>
          <th scope="col" class="num" :aria-sort="ariaSort('temp')">
            <button type="button" class="sort" @click="toggleSort('temp')">
              <span class="arrow">{{ arrow('temp') }}</span> Suhu (°{{ unit }})
            </button>
          </th>
          <th scope="col" class="viz"><span class="sr-only">Perbandingan suhu</span></th>
        </tr>
      </thead>
      <tbody @pointerleave="emit('hover', null)">
        <tr
          v-for="r in rows"
          :key="r.time"
          :class="{ current: isCurrent(r.time), hovered: r.time === hoveredTime }"
          :data-tone="r.tone"
          @pointerenter="emit('hover', r.time)"
        >
          <td>
            <time :datetime="r.entry.date.toISOString()">{{ hourLabel(r.entry.date) }}</time>
            <span v-if="isCurrent(r.time)" class="badge">Sekarang</span>
          </td>
          <td class="cond"><span class="dot"></span>{{ toneLabel[r.tone] }}</td>
          <td class="num strong">{{ formatTemp(r.entry.temperature, unit) }}</td>
          <td class="viz" aria-hidden="true">
            <span class="bar" :style="{ width: barWidth(r.entry.temperature) }"></span>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<style scoped>
.filters {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  padding: 14px 20px;
  border-bottom: 1px solid var(--line);
}

.chip {
  padding: 4px 12px;
  border: 1px solid var(--line);
  border-radius: 999px;
  background: transparent;
  font-size: 13px;
  color: var(--muted);
  cursor: pointer;
  transition:
    border-color 0.15s,
    color 0.15s;
}

.chip:hover {
  border-color: var(--muted);
  color: var(--text);
}

.chip.active {
  border-color: var(--accent);
  background: var(--accent-soft);
  color: var(--accent);
  font-weight: 600;
}

.chip:focus-visible,
.sort:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
}

.table {
  width: 100%;
  border-collapse: collapse;
  font-variant-numeric: tabular-nums;
}

.table th {
  padding: 8px 20px;
  font-size: 12px;
  font-weight: 500;
  text-align: left;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--muted);
  border-bottom: 1px solid var(--line);
}

.sort {
  padding: 0;
  border: 0;
  background: none;
  font: inherit;
  text-transform: inherit;
  letter-spacing: inherit;
  color: inherit;
  cursor: pointer;
}

.sort:hover {
  color: var(--text);
}

.arrow {
  display: inline-block;
  min-width: 1ch;
  color: var(--accent);
}

.table td {
  padding: 9px 20px;
  border-bottom: 1px solid var(--line);
}

.table tbody tr:last-child td {
  border-bottom: none;
}

.table tbody tr.current {
  background: var(--accent-soft);
}

.table tbody tr.hovered {
  background: var(--bg);
}

.table tbody tr.current.hovered {
  background: var(--accent-soft);
  box-shadow: inset 0 0 0 1px var(--accent);
}

.num {
  text-align: right !important;
  white-space: nowrap;
}

.strong {
  font-weight: 600;
}

.cond {
  color: var(--muted);
  font-size: 14px;
  white-space: nowrap;
}

.dot {
  display: inline-block;
  width: 8px;
  height: 8px;
  margin-right: 8px;
  border-radius: 50%;
  background: var(--tone);
}

.viz {
  width: 32%;
  padding-left: 0 !important;
}

.bar {
  display: block;
  height: 8px;
  border-radius: 4px;
  background: var(--tone);
  opacity: 0.85;
  transition: width 0.25s ease;
}

.badge {
  margin-left: 10px;
  padding: 1px 8px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 600;
  color: var(--accent);
  border: 1px solid var(--accent);
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
  white-space: nowrap;
}

@media (max-width: 520px) {
  .cond {
    display: none;
  }

  .filters,
  .table th,
  .table td {
    padding-left: 14px;
    padding-right: 14px;
  }

  .viz {
    width: 40%;
  }
}
</style>
