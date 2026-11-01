<script setup lang="ts">
import { computed } from 'vue'
import { formatDelta, formatTemp, hourLabel, toneLabel, toneOf } from '../format'
import type { HourlyEntry, Unit } from '../types'

const props = defineProps<{
  current: HourlyEntry
  next: HourlyEntry | null
  peak: HourlyEntry
  unit: Unit
}>()

const tone = computed(() => toneOf(props.current.temperature))

const trend = computed(() => {
  if (!props.next) return null
  const diff = props.next.temperature - props.current.temperature
  if (Math.abs(diff) < 0.1) return 'Stabil dalam satu jam ke depan'
  return `${diff > 0 ? 'Naik' : 'Turun'} ${formatDelta(diff, props.unit)}° dalam satu jam`
})
</script>

<template>
  <section class="now" :data-tone="tone" aria-label="Suhu saat ini">
    <div>
      <p class="label">Sekarang · {{ hourLabel(current.date) }} WIB</p>
      <p class="temp">
        {{ formatTemp(current.temperature, unit) }}<span>°{{ unit }}</span>
      </p>
    </div>
    <div class="side">
      <span class="chip">{{ toneLabel[tone] }}</span>
      <p v-if="trend">{{ trend }}</p>
      <p>
        Puncak hari ini {{ formatTemp(peak.temperature, unit) }}° pukul {{ hourLabel(peak.date) }}
      </p>
    </div>
  </section>
</template>

<style scoped>
.now {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  margin-bottom: 20px;
  padding: 20px 24px;
  border: 1px solid var(--line);
  border-left: 5px solid var(--tone);
  border-radius: 14px;
  background: var(--surface);
}

.label {
  margin: 0;
  font-size: 13px;
  color: var(--muted);
}

.temp {
  margin: 0;
  font-size: 56px;
  line-height: 1.05;
  font-weight: 650;
  letter-spacing: -0.03em;
  font-variant-numeric: tabular-nums;
}

.temp span {
  margin-left: 4px;
  font-size: 22px;
  font-weight: 500;
  letter-spacing: 0;
  color: var(--muted);
}

.side {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 4px;
  text-align: right;
  font-size: 14px;
  color: var(--muted);
}

.side p {
  margin: 0;
}

.chip {
  margin-bottom: 4px;
  padding: 2px 12px;
  border-radius: 999px;
  font-size: 13px;
  font-weight: 600;
  color: var(--tone);
  border: 1px solid var(--tone);
}

@media (max-width: 480px) {
  .now {
    flex-direction: column;
    align-items: flex-start;
    padding: 18px;
  }

  .side {
    align-items: flex-start;
    text-align: left;
  }

  .temp {
    font-size: 48px;
  }
}
</style>
