/*
 * When each text was last practised, kept on this device.
 * Later this comes from the attempts table in Supabase, so it follows you across devices.
 */
const KEY = 'memoria-last-practiced'

export function loadLastPracticed(): Record<string, string> {
  try { return JSON.parse(localStorage.getItem(KEY) || '{}') as Record<string, string> }
  catch { return {} }
}

export function recordPracticed(skitId: string): void {
  if (!skitId) return
  try {
    const all = loadLastPracticed()
    all[skitId] = new Date().toISOString()
    localStorage.setItem(KEY, JSON.stringify(all))
  } catch { /* private mode: nothing to keep */ }
}
