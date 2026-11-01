import { ref, watch, type Ref } from 'vue'

/** Ref yang nilainya disimpan di localStorage agar pengaturan bertahan setelah halaman dimuat ulang. */
export function usePersisted<T>(key: string, fallback: T): Ref<T> {
  let initial = fallback
  try {
    const raw = localStorage.getItem(key)
    if (raw !== null) initial = JSON.parse(raw) as T
  } catch {
    // localStorage tidak tersedia atau isinya rusak: pakai nilai bawaan.
  }

  const state = ref(initial) as Ref<T>
  watch(state, (value) => {
    try {
      localStorage.setItem(key, JSON.stringify(value))
    } catch {
      // Abaikan: pengaturan hanya tidak tersimpan.
    }
  })
  return state
}
