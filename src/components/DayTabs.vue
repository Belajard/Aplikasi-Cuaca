<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import { dayMonth, formatTemp, weekdayShort } from '../format'
import type { DayGroup, Unit } from '../types'

const props = defineProps<{
  days: DayGroup[]
  modelValue: string
  todayKey: string
  unit: Unit
}>()

const emit = defineEmits<{ 'update:modelValue': [key: string] }>()

const root = ref<HTMLElement | null>(null)

const items = computed(() =>
  props.days.map((d) => ({
    key: d.key,
    first: d.entries[0].date,
    max: Math.max(...d.entries.map((e) => e.temperature)),
  })),
)

watch(
  () => props.modelValue,
  async () => {
    await nextTick()
    root.value
      ?.querySelector<HTMLElement>('.tab.active')
      ?.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' })
  },
)
</script>

<template>
  <nav ref="root" class="tabs" aria-label="Pilih tanggal">
    <button
      v-for="item in items"
      :key="item.key"
      type="button"
      class="tab"
      :class="{ active: item.key === modelValue }"
      :aria-pressed="item.key === modelValue"
      @click="emit('update:modelValue', item.key)"
    >
      <span class="day">{{ item.key === todayKey ? 'Hari ini' : weekdayShort(item.first) }}</span>
      <span class="date">{{ dayMonth(item.first) }}</span>
      <span class="max">maks {{ formatTemp(item.max, unit) }}°</span>
    </button>
  </nav>
</template>

<style scoped>
.tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
  padding-bottom: 6px;
  overflow-x: auto;
  scrollbar-width: thin;
}

.tab {
  flex: 0 0 auto;
  min-width: 92px;
  padding: 10px 14px;
  display: flex;
  flex-direction: column;
  gap: 1px;
  border: 1px solid var(--line);
  border-radius: 12px;
  background: var(--surface);
  text-align: left;
  line-height: 1.3;
  cursor: pointer;
  transition:
    border-color 0.15s,
    background-color 0.15s;
}

.tab:hover {
  border-color: var(--muted);
}

.tab:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
}

.day {
  font-size: 12px;
  color: var(--muted);
  text-transform: capitalize;
}

.date {
  font-size: 15px;
  font-weight: 600;
}

.max {
  margin-top: 2px;
  font-size: 12px;
  color: var(--muted);
  font-variant-numeric: tabular-nums;
}

.tab.active {
  border-color: var(--accent);
  background: var(--accent-soft);
}

.tab.active .day {
  color: var(--accent);
}
</style>
