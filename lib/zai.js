// Client-side helpers for Zai

export const MOOD_TAGS = [
  { id: 'crush', label: 'crush', color: '#ec4899', bg: 'bg-pink-500/15', text: 'text-pink-300', ring: 'ring-pink-500/40', solid: 'bg-pink-500' },
  { id: 'ami', label: 'ami', color: '#22c55e', bg: 'bg-green-500/15', text: 'text-green-300', ring: 'ring-green-500/40', solid: 'bg-green-500' },
  { id: 'rival', label: 'rival', color: '#ef4444', bg: 'bg-red-500/15', text: 'text-red-300', ring: 'ring-red-500/40', solid: 'bg-red-500' },
  { id: 'mystère', label: 'mystère', color: '#9ca3af', bg: 'bg-zinc-500/15', text: 'text-zinc-300', ring: 'ring-zinc-500/40', solid: 'bg-zinc-500' },
]

export function moodOf(id) {
  return MOOD_TAGS.find(m => m.id === id) || MOOD_TAGS[3]
}

export const REACTION_EMOJIS = ['🔥','😭','💀','🫶','😳']

export function avatarUrl(username) {
  return `https://api.dicebear.com/7.x/thumbs/svg?seed=${encodeURIComponent(username || 'zai')}`
}

export function getToken() {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('zai_token')
}

export function setToken(t) {
  if (typeof window === 'undefined') return
  if (t) localStorage.setItem('zai_token', t)
  else localStorage.removeItem('zai_token')
}

export function getUser() {
  if (typeof window === 'undefined') return null
  try { return JSON.parse(localStorage.getItem('zai_user') || 'null') } catch { return null }
}

export function setUser(u) {
  if (typeof window === 'undefined') return
  if (u) localStorage.setItem('zai_user', JSON.stringify(u))
  else localStorage.removeItem('zai_user')
}

export function getAnonSession() {
  if (typeof window === 'undefined') return ''
  let s = localStorage.getItem('zai_anon')
  if (!s) {
    s = 'anon_' + Math.random().toString(36).slice(2) + Date.now().toString(36)
    localStorage.setItem('zai_anon', s)
  }
  return s
}

export async function api(path, opts = {}) {
  const headers = { 'Content-Type': 'application/json', ...(opts.headers || {}) }
  const token = getToken()
  if (token) headers['Authorization'] = `Bearer ${token}`
  if (typeof window !== 'undefined') headers['X-Anon-Session'] = getAnonSession()
  const res = await fetch(`/api${path}`, { ...opts, headers })
  let data = null
  try { data = await res.json() } catch {}
  if (!res.ok) {
    const err = new Error(data?.error || `HTTP ${res.status}`)
    err.status = res.status
    throw err
  }
  return data
}

export function timeRemaining(expiresAt) {
  const ms = new Date(expiresAt).getTime() - Date.now()
  if (ms <= 0) return { label: 'expiré', urgent: true, expired: true }
  const h = Math.floor(ms / 3600000)
  const m = Math.floor((ms % 3600000) / 60000)
  if (h > 0) return { label: `${h}h${m.toString().padStart(2,'0')}`, urgent: h < 6, expired: false }
  return { label: `${m}m`, urgent: true, expired: false }
}
