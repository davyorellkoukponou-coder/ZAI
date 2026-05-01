'use client'

import { useEffect, useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { Loader2, LogOut, Share2, Send, Trash2, Flag, Inbox, Sparkles, Copy, ExternalLink, Bell } from 'lucide-react'
import { api, getToken, getUser, setToken, setUser, MOOD_TAGS, moodOf, timeRemaining, REACTION_EMOJIS } from '@/lib/zai'

export default function DashboardPage() {
  const router = useRouter()
  const [user, setU] = useState(null)
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)
  const [unread, setUnread] = useState(0)
  const [filter, setFilter] = useState('all') // all|unread|replied
  const [bio, setBio] = useState('')
  const [savingBio, setSavingBio] = useState(false)

  // protect route
  useEffect(() => {
    if (!getToken()) { router.push('/login'); return }
    const u = getUser(); if (u) { setU(u); setBio(u.bio || '') }
    api('/auth/me').then(r => { setU(r.user); setUser(r.user); setBio(r.user.bio || '') }).catch(() => {
      setToken(null); setUser(null); router.push('/login')
    })
  }, [router])

  async function load() {
    try {
      const [a, b] = await Promise.all([api('/messages'), api('/messages/unread-count')])
      setMessages(a.messages || [])
      setUnread(b.unread || 0)
    } catch (e) {
      if (e.status === 401) { setToken(null); router.push('/login') }
    } finally { setLoading(false) }
  }

  useEffect(() => {
    if (!user) return
    load()
    const i = setInterval(load, 5000)
    return () => clearInterval(i)
  }, [user])

  // tick to update timers
  const [, setTick] = useState(0)
  useEffect(() => { const i = setInterval(() => setTick(t => t + 1), 30000); return () => clearInterval(i) }, [])

  function logout() {
    setToken(null); setUser(null); router.push('/')
  }

  async function markRead(id) {
    try { await api(`/messages/${id}/read`, { method: 'POST' }); load() } catch {}
  }
  async function reply(id, text) {
    if (!text.trim()) return
    try { await api(`/messages/${id}/reply`, { method: 'POST', body: JSON.stringify({ reply: text }) }); toast.success('Réponse publiée'); load() }
    catch (e) { toast.error(e.message) }
  }
  async function del(id) {
    if (!confirm('Supprimer ce message ?')) return
    try { await api(`/messages/${id}`, { method: 'DELETE' }); load() } catch (e) { toast.error(e.message) }
  }
  async function report(id) {
    try { await api(`/messages/${id}/report`, { method: 'POST' }); toast.success('Message signalé') } catch (e) { toast.error(e.message) }
  }
  async function saveBio() {
    setSavingBio(true)
    try { const r = await api('/users/me', { method: 'PATCH', body: JSON.stringify({ bio }) }); setUser(r.user); setU(r.user); toast.success('Bio mise à jour') }
    catch (e) { toast.error(e.message) }
    finally { setSavingBio(false) }
  }

  const sorted = useMemo(() => {
    const arr = [...messages].sort((a, b) => {
      if (a.is_read !== b.is_read) return a.is_read ? 1 : -1
      return new Date(b.created_at) - new Date(a.created_at)
    })
    if (filter === 'unread') return arr.filter(m => !m.is_read)
    if (filter === 'replied') return arr.filter(m => m.is_replied)
    return arr
  }, [messages, filter])

  const moodStats = useMemo(() => {
    const stats = { crush: 0, ami: 0, rival: 0, 'mystère': 0 }
    messages.forEach(m => {
      if (stats[m.mood_tag] !== undefined) stats[m.mood_tag]++
    })
    return stats
  }, [messages])

  if (!user) return <main className="min-h-screen grid place-items-center bg-[#0a0a0a] text-zinc-400"><Loader2 className="h-5 w-5 animate-spin" /></main>

  const profileLink = (typeof window !== 'undefined' ? window.location.origin : '') + '/u/' + user.username

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white">
      <header className="sticky top-0 z-30 backdrop-blur bg-[#0a0a0a]/80 border-b border-white/5">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center gap-3">
          <button onClick={() => router.push('/')} className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-500 grid place-items-center font-bold text-sm">Z</div>
            <span className="font-bold">Zai</span>
          </button>
          <div className="relative ml-1">
            <Inbox className="h-5 w-5 text-zinc-300" />
            {unread > 0 && (
              <span className={`absolute -top-2 -right-2 min-w-[18px] h-[18px] px-1 rounded-full bg-violet-600 text-[10px] font-bold grid place-items-center ${unread > 0 ? 'animate-pulse' : ''}`}>{unread}</span>
            )}
          </div>
          <div className="flex-1" />
          <Button variant="outline" onClick={() => router.push(`/u/${user.username}/share`)} className="border-white/15 bg-white/5 hover:bg-white/10 hidden sm:inline-flex">
            <Share2 className="h-4 w-4 mr-2" /> Partager
          </Button>
          <Button variant="ghost" onClick={logout} className="text-zinc-400 hover:text-white">
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 pt-6 pb-20">
        {/* Profile card */}
        <Card className="bg-gradient-to-br from-violet-900/30 to-zinc-950/60 border-white/10 p-5">
          <div className="flex items-center gap-4">
            <img src={user.avatar_url} alt={user.username} className="h-16 w-16 rounded-full bg-zinc-800 ring-2 ring-violet-500/40" />
            <div className="flex-1 min-w-0">
              <div className="text-xs text-zinc-400">Ton profil</div>
              <div className="text-xl font-bold truncate">@{user.username}</div>
              <div className="text-xs text-zinc-400 mt-0.5">
                <span className="text-violet-300 font-semibold">{user.message_count}</span> messages reçus
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={() => router.push(`/u/${user.username}/share`)} className="border-white/15 bg-white/5 hover:bg-white/10 sm:hidden">
              <Share2 className="h-4 w-4" />
            </Button>
          </div>
          <div className="mt-4 flex flex-col sm:flex-row gap-2">
            <Input value={bio} onChange={e => setBio(e.target.value.slice(0, 160))} placeholder="Ajoute une bio (160 max)" className="bg-zinc-900 border-white/10" />
            <div className="flex gap-2">
              <Button onClick={saveBio} disabled={savingBio} variant="outline" className="border-white/15 bg-white/5 hover:bg-white/10">
                {savingBio ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Sauver'}
              </Button>
              <Button onClick={() => { navigator.clipboard.writeText(profileLink); toast.success('Lien copié') }} className="bg-violet-600 hover:bg-violet-500">
                <Copy className="h-4 w-4 mr-2" /> Copier lien
              </Button>
            </div>
          </div>
          <div className="mt-3 flex items-center gap-2 text-xs text-zinc-500 font-mono">
            <span className="truncate">{profileLink}</span>
            <button onClick={() => window.open(profileLink, '_blank')} className="text-zinc-400 hover:text-white"><ExternalLink className="h-3.5 w-3.5" /></button>
          </div>
        </Card>

        {/* Stats */}
        {messages.length > 0 && (
          <div className="mt-4 grid grid-cols-4 gap-2">
            {MOOD_TAGS.map(mt => (
              <div key={mt.id} className={`rounded-xl border ${mt.ring} bg-zinc-950/40 p-3 text-center flex flex-col items-center justify-center`}>
                <div className={`text-xl sm:text-2xl font-bold ${mt.text}`}>{moodStats[mt.id] || 0}</div>
                <div className="text-[9px] sm:text-[10px] uppercase tracking-wider text-zinc-500 mt-1">{mt.label}</div>
              </div>
            ))}
          </div>
        )}

        {/* Filters */}
        <div className="flex items-center justify-between mt-6 mb-3">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Bell className="h-4 w-4 text-violet-400" /> Boîte de réception
          </h2>
          <div className="flex gap-1 bg-zinc-900 p-0.5 rounded-lg border border-white/5">
            {[
              { k: 'all', l: 'Tous' },
              { k: 'unread', l: `Non lus${unread ? ` · ${unread}` : ''}` },
              { k: 'replied', l: 'Répondus' },
            ].map(t => (
              <button key={t.k} onClick={() => setFilter(t.k)} className={`px-3 py-1 text-xs rounded-md transition ${filter === t.k ? 'bg-violet-600 text-white' : 'text-zinc-400 hover:text-white'}`}>{t.l}</button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="py-12 text-center text-zinc-500"><Loader2 className="h-5 w-5 animate-spin mx-auto" /></div>
        ) : sorted.length === 0 ? (
          <Card className="bg-zinc-950/60 border-white/10 p-10 text-center">
            <Sparkles className="h-8 w-8 text-violet-400 mx-auto mb-2" />
            <div className="text-lg font-semibold">Pas encore de messages</div>
            <div className="text-sm text-zinc-400 mt-1">Partage ton lien pour recevoir des messages anonymes.</div>
            <Button onClick={() => router.push(`/u/${user.username}/share`)} className="mt-4 bg-violet-600 hover:bg-violet-500">
              <Share2 className="h-4 w-4 mr-2" /> Partager mon lien
            </Button>
          </Card>
        ) : (
          <div className="space-y-3">
            {sorted.map(m => (
              <MessageCard key={m.id} m={m} onMarkRead={markRead} onReply={reply} onDelete={del} onReport={report} />
            ))}
          </div>
        )}
      </div>
    </main>
  )
}

function MessageCard({ m, onMarkRead, onReply, onDelete, onReport }) {
  const mt = moodOf(m.mood_tag)
  const exp = timeRemaining(m.expires_at)
  const [replying, setReplying] = useState(false)
  const [replyText, setReplyText] = useState(m.reply || '')
  const totalReacts = Object.values(m.reactions || {}).reduce((a, b) => a + b, 0)

  return (
    <Card
      onClick={() => { if (!m.is_read) onMarkRead(m.id) }}
      className={`relative bg-zinc-950/70 border p-4 transition cursor-default animate-in fade-in slide-in-from-top-1 duration-300 ${
        !m.is_read ? 'border-violet-500/50 ring-1 ring-violet-500/30 shadow-lg shadow-violet-900/20' : 'border-white/10'
      }`}
    >
      {!m.is_read && (
        <div className="absolute -top-1 -left-1 flex items-center gap-1">
          <span className="h-2.5 w-2.5 rounded-full bg-violet-500 animate-ping absolute" />
          <span className="h-2.5 w-2.5 rounded-full bg-violet-500 relative" />
        </div>
      )}
      <div className="flex items-center justify-between flex-wrap gap-2 mb-2">
        <div className="flex items-center gap-2 flex-wrap">
          <Badge className={`${mt.bg} ${mt.text} border ${mt.ring} ring-1`}>{mt.label}</Badge>
          {!m.is_read && <Badge className="bg-violet-500/20 text-violet-200 border border-violet-500/40">Nouveau</Badge>}
          <span className="text-xs text-zinc-500">{m.metadata?.label}</span>
        </div>
        <div className={`text-xs font-mono ${exp.urgent ? 'text-red-400' : 'text-zinc-500'}`}>
          ⏳ {exp.label}
        </div>
      </div>
      <div className="text-zinc-100 text-[15px] leading-relaxed whitespace-pre-wrap">{m.content}</div>

      {totalReacts > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {REACTION_EMOJIS.map(e => {
            const c = m.reactions?.[e] || 0
            if (!c) return null
            return <span key={e} className="px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-xs">{e} {c}</span>
          })}
        </div>
      )}

      {m.is_replied && !replying ? (
        <div className="mt-3 pl-3 border-l-2 border-violet-500/50">
          <div className="text-xs text-violet-300 mb-1">Ta réponse publique</div>
          <div className="text-zinc-200 whitespace-pre-wrap">{m.reply}</div>
          <button onClick={() => setReplying(true)} className="text-xs text-zinc-400 hover:text-white mt-2">Modifier</button>
        </div>
      ) : replying ? (
        <div className="mt-3">
          <Textarea value={replyText} onChange={e => setReplyText(e.target.value.slice(0, 500))} placeholder="Réponds publiquement…" className="bg-zinc-900 border-white/10 min-h-[80px]" />
          <div className="mt-2 flex gap-2 justify-end">
            <Button variant="ghost" size="sm" onClick={() => { setReplying(false); setReplyText(m.reply || '') }} className="text-zinc-400">Annuler</Button>
            <Button size="sm" onClick={() => { onReply(m.id, replyText); setReplying(false) }} className="bg-violet-600 hover:bg-violet-500">
              <Send className="h-3.5 w-3.5 mr-1.5" /> Publier
            </Button>
          </div>
        </div>
      ) : (
        <div className="mt-3 flex flex-wrap gap-2">
          <Button size="sm" onClick={() => setReplying(true)} className="bg-violet-600 hover:bg-violet-500">
            <Send className="h-3.5 w-3.5 mr-1.5" /> Répondre publiquement
          </Button>
          <Button size="sm" variant="outline" onClick={() => onReport(m.id)} className="border-white/10 bg-white/5 hover:bg-white/10 text-zinc-300">
            <Flag className="h-3.5 w-3.5 mr-1.5" /> Signaler
          </Button>
          <Button size="sm" variant="outline" onClick={() => onDelete(m.id)} className="border-white/10 bg-white/5 hover:bg-white/10 text-zinc-300">
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      )}
    </Card>
  )
}
