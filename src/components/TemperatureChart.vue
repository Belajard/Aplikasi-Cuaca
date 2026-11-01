<script setup lang="ts">
import { computed, ref } from 'vue'
import { formatTemp, hourLabel, hourOfDay, toUnit, toneLabel, toneOf } from '../format'
import type { HourlyEntry, Unit } from '../types'

const props = defineProps<{
  entries: HourlyEntry[]
  unit: Unit
  nowMs: number
  hoveredTime: number | null
}>()

const emit = defineEmits<{ hover: [time: number | null] }>()

const W = 640
const H = 240
const pad = { top: 22, right: 16, bottom: 28, left: 44 }
const innerW = W - pad.left - pad.right
const innerH = H - pad.top - pad.bottom
const baseY = pad.top + innerH
const HOUR_MS = 3_600_000

const svg = ref<SVGSVGElement | null>(null)

const values = computed(() => props.entries.map((e) => toUnit(e.temperature, props.unit)))

const domain = computed(() => {
  const min = Math.min(...values.value)
  const max = Math.max(...values.value)
  const range = max - min
  const step = range <= 4 ? 1 : range <= 10 ? 2 : 5
  const lo = Math.floor(min / step) * step
  let hi = Math.ceil(max / step) * step
  if (hi === lo) hi += step
  const ticks: number[] = []
  for (let t = lo; t <= hi + 1e-9; t += step) ticks.push(t)
  return { lo, hi, ticks }
})

const xAt = (i: number) =>
  pad.left + (props.entries.length <= 1 ? 0 : (i / (props.entries.length - 1)) * innerW)

const yAt = (v: number) => {
  const { lo, hi } = domain.value
  return pad.top + (1 - (v - lo) / (hi - lo)) * innerH
}

const points = computed(() =>
  props.entries.map((entry, i) => ({
    entry,
    time: entry.date.getTime(),
    x: xAt(i),
    y: yAt(values.value[i]),
    tone: toneOf(entry.temperature),
  })),
)

const linePath = computed(() =>
  points.value.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' '),
)

const areaPath = computed(() => {
  const pts = points.value
  if (pts.length === 0) return ''
  const first = pts[0]
  const last = pts[pts.length - 1]
  return `${linePath.value} L${last.x.toFixed(1)},${baseY} L${first.x.toFixed(1)},${baseY} Z`
})

const xLabels = computed(() =>
  points.value
    .filter((p) => hourOfDay(p.entry.date) % 3 === 0)
    .map((p) => ({ x: p.x, text: String(hourOfDay(p.entry.date)).padStart(2, '0') })),
)

const nowX = computed(() => {
  const idx = points.value.findIndex((p) => props.nowMs >= p.time && props.nowMs < p.time + HOUR_MS)
  if (idx < 0 || points.value.length < 2) return null
  const stepX = innerW / (points.value.length - 1)
  return points.value[idx].x + ((props.nowMs - points.value[idx].time) / HOUR_MS) * stepX
})

const peak = computed(() =>
  points.value.reduce((a, b) => (b.entry.temperature > a.entry.temperature ? b : a)),
)

const hovered = computed(() => points.value.find((p) => p.time === props.hoveredTime) ?? null)

const TIP_W = 132
const TIP_H = 44

const tooltip = computed(() => {
  const p = hovered.value
  if (!p) return null
  const x = Math.min(Math.max(p.x - TIP_W / 2, pad.left), W - pad.right - TIP_W)
  const y = p.y - TIP_H - 12 < 0 ? p.y + 14 : p.y - TIP_H - 12
  return {
    x,
    y,
    title: `${hourLabel(p.entry.date)} WIB`,
    body: `${formatTemp(p.entry.temperature, props.unit)} °${props.unit} · ${toneLabel[p.tone]}`,
  }
})

const ariaLabel = computed(() => {
  const min = Math.min(...props.entries.map((e) => e.temperature))
  const max = Math.max(...props.entries.map((e) => e.temperature))
  return `Grafik suhu per jam. Terendah ${formatTemp(min, props.unit)} derajat ${props.unit}, tertinggi ${formatTemp(max, props.unit)} derajat ${props.unit}.`
})

function onPointer(ev: PointerEvent) {
  const el = svg.value
  const n = props.entries.length
  if (!el || n === 0) return
  const rect = el.getBoundingClientRect()
  const x = ((ev.clientX - rect.left) / rect.width) * W
  const idx = Math.round(((x - pad.left) / innerW) * (n - 1))
  const clamped = Math.min(Math.max(idx, 0), n - 1)
  emit('hover', props.entries[clamped].date.getTime())
}
</script>

<template>
  <svg
    ref="svg"
    class="chart"
    :viewBox="`0 0 ${W} ${H}`"
    role="img"
    :aria-label="ariaLabel"
    @pointermove="onPointer"
    @pointerdown="onPointer"
    @pointerleave="emit('hover', null)"
  >
    <g class="grid">
      <g v-for="t in domain.ticks" :key="t">
        <line :x1="pad.left" :x2="W - pad.right" :y1="yAt(t)" :y2="yAt(t)" />
        <text :x="pad.left - 8" :y="yAt(t)" class="y-label" dominant-baseline="middle">
          {{ Math.round(t) }}°
        </text>
      </g>
    </g>

    <text v-for="l in xLabels" :key="l.x" :x="l.x" :y="H - 8" class="x-label">{{ l.text }}</text>

    <path :d="areaPath" class="area" />
    <path :d="linePath" class="line" />

    <g v-if="nowX !== null" class="now">
      <line :x1="nowX" :x2="nowX" :y1="pad.top - 6" :y2="baseY" />
      <text :x="nowX" :y="pad.top - 9" class="now-label">Sekarang</text>
    </g>

    <circle
      v-for="p in points"
      :key="p.time"
      :cx="p.x"
      :cy="p.y"
      r="3"
      class="dot"
      :data-tone="p.tone"
    />

    <text :x="peak.x" :y="peak.y - 10" class="peak-label" :data-tone="peak.tone">
      {{ formatTemp(peak.entry.temperature, unit) }}°
    </text>

    <g v-if="hovered" class="hover" :data-tone="hovered.tone">
      <line :x1="hovered.x" :x2="hovered.x" :y1="pad.top" :y2="baseY" class="cross" />
      <circle :cx="hovered.x" :cy="hovered.y" r="6" class="ring" />
      <g v-if="tooltip" :transform="`translate(${tooltip.x}, ${tooltip.y})`">
        <rect :width="TIP_W" :height="TIP_H" rx="8" class="tip-bg" />
        <text x="10" y="17" class="tip-title">{{ tooltip.title }}</text>
        <text x="10" y="34" class="tip-body">{{ tooltip.body }}</text>
      </g>
    </g>
  </svg>
</template>

<style scoped>
.chart {
  display: block;
  width: 100%;
  height: auto;
  touch-action: pan-y;
  user-select: none;
  cursor: crosshair;
}

.grid line {
  stroke: var(--line);
  stroke-width: 1;
}

.y-label,
.x-label {
  font-size: 11px;
  fill: var(--muted);
  font-variant-numeric: tabular-nums;
}

.y-label {
  text-anchor: end;
}

.x-label {
  text-anchor: middle;
}

.area {
  fill: var(--text);
  opacity: 0.05;
}

.line {
  fill: none;
  stroke: var(--text);
  stroke-width: 1.75;
  stroke-linejoin: round;
  stroke-linecap: round;
  opacity: 0.8;
}

.dot {
  fill: var(--tone);
  stroke: var(--surface);
  stroke-width: 1.5;
}

.peak-label {
  font-size: 11px;
  font-weight: 600;
  text-anchor: middle;
  fill: var(--tone);
}

.now line {
  stroke: var(--accent);
  stroke-width: 1;
  stroke-dasharray: 3 3;
}

.now-label {
  font-size: 10px;
  font-weight: 600;
  text-anchor: middle;
  fill: var(--accent);
}

.cross {
  stroke: var(--muted);
  stroke-width: 1;
}

.ring {
  fill: var(--tone);
  stroke: var(--surface);
  stroke-width: 2.5;
}

.tip-bg {
  fill: var(--text);
}

.tip-title {
  font-size: 11px;
  fill: var(--surface);
  opacity: 0.7;
}

.tip-body {
  font-size: 13px;
  font-weight: 600;
  fill: var(--surface);
  font-variant-numeric: tabular-nums;
}
</style>
