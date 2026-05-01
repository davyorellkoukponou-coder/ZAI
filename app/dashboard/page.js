'use client'

import { useEffect, useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { Loader2, LogOut, Share2, Send, Trash2, Flag, Inbox, Sparkles, Copy, ExternalLink, Bell, Heart, Unlock, UserPlus, Check, X, Camera, Search } from 'lucide-react'
import { api, getToken, getUser, setToken, setUser, MOOD_TAGS, moodOf, timeRemaining, REACTION_EMOJIS } from '@/lib/zai'

export default function DashboardPage() {
  const router = useRouter()
  const [user, setU] = useState(null)
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)
  const [unread, setUnread] = useState(0)
  const [couple, setCouple] = useState({ status: 'none' })
  const [messagesToday, setMessagesToday] = useState(0)
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
      const [a, b, c] = await Promise.all([api('/messages'), api('/messages/unread-count'), api('/couples/status')])
      setMessages(a.messages || [])
      setUnread(b.unread || 0)
      if (c && c.couple) {
        setCouple(c.couple)
        setMessagesToday(c.messagesToday || 0)
      }
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
          <Button variant="ghost" onClick={() => router.push('/rules')} className="text-zinc-300 hover:text-white hidden sm:inline-flex">
            Règles
          </Button>
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
                <span className="text-violet-300 font-semibold">{user.message_count}</span> messages reçus · <span className="text-fuchsia-300 font-semibold">{user.profile_views || 0}</span> vues du lien
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

        <CoupleSection couple={couple} messagesToday={messagesToday} load={load} />

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
              <MessageCard key={m.id} m={m} user={user} onMarkRead={markRead} onReply={reply} onDelete={del} onReport={report} />
            ))}
          </div>
        )}
      </div>
    </main>
  )
}

function MessageCard({ m, user, onMarkRead, onReply, onDelete, onReport }) {
  const mt = moodOf(m.mood_tag)
  const exp = timeRemaining(m.expires_at)
  const [replying, setReplying] = useState(false)
  const [replyText, setReplyText] = useState(m.reply || '')
  const totalReacts = Object.values(m.reactions || {}).reduce((a, b) => a + b, 0)
  
  const [hint, setHint] = useState(null)
  const [generatingStory, setGeneratingStory] = useState(false)

  const generateStory = async (e) => {
    e.stopPropagation()
    setGeneratingStory(true)
    try {
      const html2canvas = (await import('html2canvas')).default
      const element = document.getElementById(`story-${m.id}`)
      if (!element) return
      element.style.display = 'flex'
      const canvas = await html2canvas(element, { backgroundColor: '#0a0a0a', scale: 2 })
      element.style.display = 'none'
      
      canvas.toBlob(async (blob) => {
        if (!blob) return
        const file = new File([blob], `zai-story-${m.id}.png`, { type: 'image/png' })
        
        // Si le navigateur mobile supporte le partage direct d'image (ex: vers Insta/WhatsApp)
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          try {
            await navigator.share({
              files: [file],
              title: 'Zai',
            })
            toast.success('Ouverture du menu de partage...')
          } catch (err) {
            // L'utilisateur a annulé le partage, on ne fait rien
            if (err.name !== 'AbortError') fallbackDownload(canvas)
          }
        } else {
          fallbackDownload(canvas)
        }
        setGeneratingStory(false)
      }, 'image/png')
      
    } catch(err) { 
      toast.error('Erreur lors de la génération') 
      setGeneratingStory(false)
    }
  }

  const fallbackDownload = (canvas) => {
    const link = document.createElement('a')
    link.download = `zai-story-${m.id}.png`
    link.href = canvas.toDataURL('image/png')
    link.click()
    toast.success('Image téléchargée (Partage non supporté sur ce navigateur)')
  }

  const revealHint = (e) => {
    e.stopPropagation()
    if (!m.metadata) return setHint("Aucun indice trouvé.")
    const { day, slot, session_count } = m.metadata
    
    // Génère un nombre "aléatoire" mais fixe pour ce message (basé sur l'ID)
    const hintType = m.id.charCodeAt(m.id.length - 1) % 5;
    
    let text = "";
    if (session_count === 1 && hintType <= 1) {
      text = "C'est la toute première fois que cette personne visite ton profil Zai !";
    } else if (session_count > 1 && hintType <= 1) {
      text = `Ce n'est pas un(e) inconnu(e)... Cette personne t'a déjà envoyé ${session_count} messages !`;
    } else if (hintType === 2) {
      text = `Détail troublant : ce message a été écrit en cachette un ${day} (${slot}).`;
    } else if (hintType === 3) {
      text = `L'expéditeur a tapé exactement ${m.content.length} caractères. Probablement depuis son téléphone.`;
    } else {
      text = `L'envoi s'est fait un ${day} en plein(e) ${slot}. L'humeur était assumée : "${mt.label}".`;
    }
    
    setHint(`🕵️ Indice : ${text}`)
  }

  return (
    <Card
      className={`p-4 bg-white/[0.02] border-white/5 cursor-pointer transition hover:bg-white/[0.04] ${m.is_read ? 'opacity-75' : 'border-l-2 border-l-violet-500'}`}
      onClick={() => !m.is_read && onMarkRead(m.id)}
    >
      <div className="flex items-center justify-between mb-3">
        <Badge variant="outline" className={`bg-transparent border ${mt.ring} ${mt.bg} text-white`}>
          {mt.label}
        </Badge>
        <span className="text-xs text-zinc-500 flex items-center gap-1">
          {exp.label}
        </span>
      </div>
      <p className="text-zinc-200 whitespace-pre-wrap text-sm leading-relaxed mb-3">
        {m.content}
      </p>

      {m.is_replied && !replying ? (
        <div className="mt-3 pl-3 border-l-2 border-violet-500/50">
          <div className="text-xs text-violet-300 mb-1">Ta réponse publique</div>
          <div className="text-zinc-200 whitespace-pre-wrap">{m.reply}</div>
        </div>
      ) : replying ? (
        <div className="mt-3" onClick={e => e.stopPropagation()}>
          <Textarea value={replyText} onChange={e => setReplyText(e.target.value.slice(0, 500))} placeholder="Réponds publiquement…" className="bg-zinc-900 border-white/10 min-h-[80px]" />
          <div className="mt-2 flex gap-2 justify-end">
            <Button variant="ghost" size="sm" onClick={() => { setReplying(false); setReplyText(m.reply || '') }} className="text-zinc-400">Annuler</Button>
            <Button size="sm" onClick={() => { onReply(m.id, replyText); setReplying(false) }} className="bg-violet-600 hover:bg-violet-500">
              <Send className="h-3.5 w-3.5 mr-1.5" /> Publier
            </Button>
          </div>
        </div>
      ) : (
        <div className="mt-3 flex flex-wrap gap-2" onClick={e => e.stopPropagation()}>
          <Button size="sm" onClick={() => setReplying(true)} className="bg-violet-600 hover:bg-violet-500">
            <Send className="h-3.5 w-3.5 mr-1.5" /> Répondre
          </Button>
          <Button size="sm" onClick={generateStory} disabled={generatingStory} className="bg-fuchsia-600 hover:bg-fuchsia-500 text-white font-semibold">
            {generatingStory ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> : <Share2 className="h-3.5 w-3.5 mr-1.5" />}
            Partager
          </Button>
          <Button size="sm" variant="outline" onClick={revealHint} className="border-white/10 bg-white/5 hover:bg-white/10 text-zinc-300">
            <Search className="h-3.5 w-3.5 mr-1.5" /> Indices
          </Button>
          <Button size="sm" variant="outline" onClick={() => onReport(m.id)} className="border-white/10 bg-white/5 hover:bg-white/10 text-zinc-300">
            <Flag className="h-3.5 w-3.5" />
          </Button>
          <Button size="sm" variant="outline" onClick={() => onDelete(m.id)} className="border-white/10 bg-white/5 hover:bg-white/10 text-zinc-300">
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      )}

      {hint && (
        <div className="mt-3 p-2 bg-white/5 rounded text-xs text-zinc-300 border border-white/10 animate-in fade-in">
          {hint}
        </div>
      )}

      {/* Invisible element for Story Generation */}
      <div id={`story-${m.id}`} style={{ display: 'none', width: '1080px', height: '1920px', position: 'fixed', top: '-9999px', left: '-9999px', alignItems: 'center', justifyContent: 'center', backgroundColor: '#0a0a0a', flexDirection: 'column' }}>
        
        {/* The Sticker */}
        <div className="w-[850px] flex flex-col rounded-[2.5rem] overflow-hidden bg-[#121212]">
          {/* Top Half */}
          <div className="bg-gradient-to-r from-violet-500 to-fuchsia-500 px-12 py-16 flex items-center justify-center text-center">
            <span className="text-[55px] font-bold text-white leading-[1.2]">
              envoie-moi des<br/>messages anonymes !
            </span>
          </div>
          {/* Bottom Half */}
          <div className="px-16 py-32 flex items-center justify-center text-center min-h-[450px]">
            <span className="text-[60px] font-bold text-white leading-tight whitespace-pre-wrap">
              {m.content}
            </span>
          </div>
        </div>

        {/* Call to action for the link */}
        <div className="mt-20 flex justify-center w-full">
          <div className="flex items-center gap-5 px-6 py-3 rounded-full border border-violet-500/40">
            <div className="bg-fuchsia-500 p-2.5 rounded-xl flex items-center justify-center">
              <ExternalLink className="w-8 h-8 text-white" />
            </div>
            <span className="text-[40px] font-bold text-white leading-none" style={{ position: 'relative', top: '-5px' }}>
              zai.app/u/{user?.username}
            </span>
          </div>
        </div>
      </div>
    </Card>
  )
}

function CoupleSection({ couple, messagesToday, load }) {
  const [targetUser, setTargetUser] = useState('')
  const [loading, setLoading] = useState(false)
  const [snoopTag, setSnoopTag] = useState('all')
  const [snoopedMsgs, setSnoopedMsgs] = useState([])
  const [showSnoop, setShowSnoop] = useState(false)

  async function request() {
    if (!targetUser.trim()) return
    setLoading(true)
    try { await api('/couples/request', { method: 'POST', body: JSON.stringify({ target_username: targetUser }) }); load(); toast.success('Demande envoyée !') } catch (e) { toast.error(e.message) }
    setLoading(false)
  }
  async function accept() {
    try { await api('/couples/accept', { method: 'POST' }); load(); toast.success('Demande acceptée !') } catch (e) { toast.error(e.message) }
  }
  async function reject() {
    try { await api('/couples/reject', { method: 'POST' }); load() } catch (e) { toast.error(e.message) }
  }
  async function unlink() {
    if (!confirm("Rompre l'association ?")) return
    try { await api('/couples/unlink', { method: 'DELETE' }); load() } catch (e) { toast.error(e.message) }
  }
  async function snoop() {
    try { 
      const r = await api('/couples/snoop', { method: 'POST', body: JSON.stringify({ tag: snoopTag }) })
      setSnoopedMsgs(r.messages)
      setShowSnoop(true)
    } catch (e) { toast.error(e.message) }
  }

  return (
    <Card className="mt-6 bg-gradient-to-br from-fuchsia-950/40 to-zinc-950/60 border-fuchsia-500/20 p-5">
      <div className="flex items-center gap-2 mb-4">
        <Heart className="h-5 w-5 text-fuchsia-400" />
        <h2 className="text-lg font-bold text-fuchsia-100">Duo & Secrets 🤫</h2>
      </div>

      {couple.status === 'none' && (
        <div className="flex gap-2">
          <Input placeholder="Pseudo du partenaire" value={targetUser} onChange={e => setTargetUser(e.target.value)} className="bg-zinc-900 border-white/10" />
          <Button onClick={request} disabled={loading} className="bg-fuchsia-600 hover:bg-fuchsia-500"><UserPlus className="h-4 w-4 mr-2" /> Demander</Button>
        </div>
      )}

      {couple.status === 'pending_sent' && (
        <div className="text-zinc-400 flex items-center justify-between text-sm">
          <span>Demande envoyée à <strong className="text-white">@{couple.partner_username}</strong>...</span>
          <Button variant="ghost" size="sm" onClick={reject} className="text-red-400 hover:text-red-300">Annuler</Button>
        </div>
      )}

      {couple.status === 'pending_received' && (
        <div className="flex items-center justify-between flex-wrap gap-2 text-sm">
          <span className="text-zinc-200"><strong className="text-white">@{couple.partner_username}</strong> veut s'associer avec toi.</span>
          <div className="flex gap-2">
            <Button size="sm" onClick={accept} className="bg-fuchsia-600 hover:bg-fuchsia-500"><Check className="h-4 w-4 mr-1" /> Accepter</Button>
            <Button size="sm" variant="outline" onClick={reject} className="border-white/10 hover:bg-white/5 text-zinc-300"><X className="h-4 w-4 mr-1" /> Refuser</Button>
          </div>
        </div>
      )}

      {couple.status === 'linked' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center text-sm">
            <span className="text-zinc-400">Lié(e) avec <strong className="text-fuchsia-300">@{couple.partner_username}</strong></span>
            <button onClick={unlink} className="text-xs text-zinc-500 hover:text-red-400">Séparer</button>
          </div>
          
          <div className="space-y-1">
            <div className="flex justify-between text-xs font-semibold">
              <span className="text-zinc-400">Objectif du jour</span>
              <span className={messagesToday >= 25 ? "text-fuchsia-400" : "text-zinc-400"}>{messagesToday} / 25 msgs</span>
            </div>
            <div className="h-2.5 w-full bg-zinc-900 rounded-full overflow-hidden border border-white/5">
              <div className="h-full bg-gradient-to-r from-violet-600 to-fuchsia-500 transition-all duration-500" style={{ width: `${Math.min(100, (messagesToday / 25) * 100)}%` }} />
            </div>
          </div>

          {messagesToday >= 25 ? (
            <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center p-3 bg-fuchsia-500/10 border border-fuchsia-500/20 rounded-lg">
              <select value={snoopTag} onChange={e => setSnoopTag(e.target.value)} className="bg-zinc-900 text-sm text-white border border-white/10 rounded-md p-2 flex-1 focus:ring-1 focus:ring-fuchsia-500 outline-none">
                <option value="all">Tous les tags</option>
                {MOOD_TAGS.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
              </select>
              <Button onClick={snoop} className="bg-fuchsia-600 hover:bg-fuchsia-500 font-bold shadow-lg shadow-fuchsia-900/50">
                <Unlock className="h-4 w-4 mr-2" /> Espionner !
              </Button>
            </div>
          ) : (
            <div className="text-xs text-center text-zinc-500 italic mt-2">Partage ton lien pour atteindre les 25 messages et débloquer ses secrets.</div>
          )}

          {showSnoop && (
            <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm grid place-items-center p-4 animate-in fade-in duration-200">
              <div className="bg-zinc-950 border border-fuchsia-500/30 rounded-xl max-w-md w-full p-6 shadow-2xl relative">
                <button onClick={() => setShowSnoop(false)} className="absolute top-4 right-4 text-zinc-500 hover:text-white"><X className="h-5 w-5" /></button>
                <div className="flex items-center gap-2 mb-4">
                  <Unlock className="h-6 w-6 text-fuchsia-400" />
                  <h3 className="text-xl font-bold text-white">Secrets de @{couple.partner_username}</h3>
                </div>
                {snoopedMsgs.length === 0 ? (
                  <p className="text-zinc-400 text-sm">Aucun message trouvé pour ce tag.</p>
                ) : (
                  <div className="space-y-3">
                    {snoopedMsgs.map(m => (
                      <div key={m.id} className="bg-zinc-900/50 border border-white/10 p-3 rounded-lg text-sm text-zinc-200">
                        <div className="text-xs text-fuchsia-400 mb-1 flex justify-between">
                          <span className="uppercase tracking-wider">{m.mood_tag}</span>
                          <span className="text-zinc-500">{new Date(m.created_at).toLocaleDateString()}</span>
                        </div>
                        {m.content}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </Card>
  )
}
