'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { Send, Loader2, Share2, Lock, ArrowLeft, Compass } from 'lucide-react'
import { api, MOOD_TAGS, moodOf, REACTION_EMOJIS, getUser } from '@/lib/zai'

export default function ProfileClient() {
  const { username } = useParams()
  const router = useRouter()
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [content, setContent] = useState('')
  const [mood, setMood] = useState('mystère')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [thread, setThread] = useState([])
  const [me, setMe] = useState(null)

  useEffect(() => { setMe(getUser()) }, [])

  async function loadProfile() {
    try {
      const r = await api(`/users/profile/${username}`)
      setProfile(r.user)
    } catch {
      setProfile(null)
    } finally {
      setLoading(false)
    }
  }

  async function loadThread() {
    try {
      const r = await api(`/messages/public/${username}`)
      setThread(r.messages || [])
    } catch {}
  }

  useEffect(() => {
    if (!username) return
    loadProfile()
    loadThread()
    
    // View tracking
    const viewKey = `viewed_${username}`
    if (!sessionStorage.getItem(viewKey)) {
      api(`/users/profile/${username}/view`, { method: 'POST' }).catch(() => {})
      sessionStorage.setItem(viewKey, 'true')
    }
  }, [username])

  // Poll thread every 5s
  useEffect(() => {
    if (!username) return
    const i = setInterval(loadThread, 5000)
    return () => clearInterval(i)
  }, [username])

  async function send() {
    if (!content.trim() || sending) return
    setSending(true)
    try {
      await api('/messages/send', {
        method: 'POST',
        body: JSON.stringify({ recipient_username: username, content, mood_tag: mood }),
      })
      setSent(true)
      setContent('')
      setProfile(p => p ? { ...p, message_count: (p.message_count || 0) + 1 } : p)
    } catch (e) {
      toast.error(e.message)
    } finally {
      setSending(false)
    }
  }

  async function react(id, emoji) {
    try {
      const r = await api(`/messages/${id}/react`, {
        method: 'POST',
        body: JSON.stringify({ emoji }),
      })
      setThread(t =>
        t.map(m =>
          m.id === id
            ? { ...m, reactions: r.reactions, my_reactions: { ...m.my_reactions, [emoji]: r.toggled } }
            : m
        )
      )
    } catch (e) {
      toast.error(e.message)
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen grid place-items-center bg-[#0a0a0a] text-zinc-400">
        <Loader2 className="h-5 w-5 animate-spin" />
      </main>
    )
  }

  if (!profile) {
    return (
      <main className="min-h-screen grid place-items-center bg-[#0a0a0a] text-white text-center px-4">
        <div>
          <div className="text-6xl mb-4">👻</div>
          <h1 className="text-2xl font-bold">Profil introuvable</h1>
          <p className="text-zinc-400 mt-2">@{username} n'existe pas sur Zai.</p>
          <Button className="mt-6 bg-violet-600 hover:bg-violet-500" onClick={() => router.push('/')}>
            Retour à l'accueil
          </Button>
        </div>
      </main>
    )
  }

  const isOwner = me?.username === profile.username

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white relative pb-20">
      {/* Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 h-96 w-[700px] max-w-full rounded-full bg-violet-600/20 blur-3xl pointer-events-none" />

      <div className="relative z-10 max-w-xl mx-auto px-4 pt-6">
        {/* Nav */}
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => router.push('/')}
            className="text-zinc-400 hover:text-white text-sm flex items-center gap-1"
          >
            <ArrowLeft className="h-4 w-4" /> Zai
          </button>
          <button
            onClick={() => router.push('/discover')}
            className="text-zinc-400 hover:text-white text-sm flex items-center gap-1"
          >
            <Compass className="h-4 w-4" /> Découvrir
          </button>
        </div>

        {/* Profile header */}
        <Card className="bg-gradient-to-b from-violet-900/30 to-zinc-950/60 border-white/10 p-6 text-center">
          <img
            src={profile.avatar_url}
            alt={profile.username}
            className="h-24 w-24 rounded-full mx-auto bg-zinc-800 ring-4 ring-violet-500/30"
          />
          <h1 className="text-2xl font-bold mt-3">@{profile.username}</h1>
          {profile.bio && <p className="text-zinc-400 text-sm mt-1">{profile.bio}</p>}
          <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-white/5 px-3 py-1 text-sm border border-white/10">
            <span className="text-violet-300 font-semibold">{profile.message_count}</span>
            <span className="text-zinc-400">messages reçus</span>
          </div>
        </Card>

        {/* Owner actions */}
        {isOwner && (
          <div className="mt-3 flex gap-2">
            <Button
              variant="outline"
              onClick={() => router.push('/dashboard')}
              className="flex-1 border-white/15 bg-white/5 hover:bg-white/10"
            >
              Mon dashboard
            </Button>
            <Button
              variant="outline"
              onClick={() => router.push(`/u/${profile.username}/share`)}
              className="flex-1 border-white/15 bg-white/5 hover:bg-white/10"
            >
              <Share2 className="h-4 w-4 mr-2" /> Partager
            </Button>
          </div>
        )}

        {/* Send form */}
        <Card className="mt-5 bg-zinc-950/70 border-white/10 p-5">
          {sent ? (
            <div className="py-6 text-center animate-in fade-in zoom-in duration-300">
              <div className="text-4xl mb-2">🤫</div>
              <div className="text-lg font-bold">Message envoyé secrètement !</div>
              
              {/* Viral Loop CTA */}
              <div className="mt-5 p-5 bg-gradient-to-br from-violet-600/20 to-fuchsia-600/20 border border-violet-500/30 rounded-2xl w-full text-center shadow-xl">
                <h4 className="text-lg font-bold text-white mb-1">Et toi, que pensent tes amis de toi ?</h4>
                <p className="text-sm text-zinc-300 mb-4">Crée ton profil Zai et reçois des messages anonymes.</p>
                <Button onClick={() => router.push('/register')} className="w-full bg-white text-black hover:bg-zinc-200 font-bold rounded-xl h-11 shadow-[0_0_20px_-5px_rgba(255,255,255,0.4)]">
                  Créer mon lien Zai 🚀
                </Button>
              </div>
              
              <button
                className="mt-4 text-sm text-zinc-400 hover:text-white transition"
                onClick={() => setSent(false)}
              >
                Envoyer un autre message
              </button>
            </div>
          ) : (
            <>
              <div className="text-sm text-zinc-300 mb-2">Choisis ton humeur</div>
              <div className="flex gap-2 flex-wrap mb-3">
                {MOOD_TAGS.map(m => (
                  <button
                    key={m.id}
                    onClick={() => setMood(m.id)}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium border transition ${
                      mood === m.id
                        ? `${m.bg} ${m.text} border-current ring-1 ${m.ring}`
                        : 'border-white/10 text-zinc-400 hover:text-white hover:border-white/20'
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
              <Textarea
                value={content}
                onChange={e => setContent(e.target.value.slice(0, 300))}
                placeholder={`Écris quelque chose d'anonyme à @${profile.username}…`}
                className="bg-zinc-900 border-white/10 min-h-[120px] resize-none"
              />
              <div className="flex justify-between items-center mt-3">
                <div className="text-xs text-zinc-500">{content.length}/300 · 100% anonyme</div>
                <Button
                  onClick={send}
                  disabled={!content.trim() || sending}
                  className="bg-violet-600 hover:bg-violet-500"
                >
                  {sending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" /> Envoyer
                    </>
                  )}
                </Button>
              </div>
            </>
          )}
        </Card>

        {/* Public thread */}
        <div className="mt-8">
          <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-3">
            Réponses publiques
          </h2>
          {thread.length === 0 ? (
            <Card className="bg-zinc-950/60 border-white/10 p-6 text-center text-zinc-500 text-sm">
              Aucune réponse publique pour l'instant.
            </Card>
          ) : (
            <div className="space-y-3">
              {thread.map(m => {
                const mt = moodOf(m.mood_tag)
                return (
                  <Card
                    key={m.id}
                    className="bg-zinc-950/60 border-white/10 p-4 animate-in fade-in slide-in-from-bottom-2 duration-300"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <Badge className={`${mt.bg} ${mt.text} border ${mt.ring} ring-1`}>{mt.label}</Badge>
                      <span className="text-xs text-zinc-500">{m.metadata?.label}</span>
                    </div>

                    {/* Blurred message content */}
                    <div className="relative group">
                      <div
                        className={isOwner ? '' : 'select-none blur-[6px] hover:blur-[5px] transition-all'}
                        title={isOwner ? '' : `Seul @${profile.username} peut lire ce message`}
                      >
                        <div className="text-zinc-200 text-[15px] leading-relaxed">{m.content}</div>
                      </div>
                      {!isOwner && (
                        <div className="pointer-events-none absolute inset-0 grid place-items-center">
                          <div className="flex items-center gap-1 text-[11px] text-zinc-400 bg-black/40 backdrop-blur px-2 py-1 rounded-full border border-white/10">
                            <Lock className="h-3 w-3" /> Seul @{profile.username} peut lire
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Public reply */}
                    <div className="mt-3 pl-3 border-l-2 border-violet-500/40">
                      <div className="text-xs text-violet-300 mb-1">@{profile.username} a répondu</div>
                      <div className="text-zinc-100 whitespace-pre-wrap">{m.reply}</div>
                    </div>

                    {/* Reactions */}
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {REACTION_EMOJIS.map(e => {
                        const count = m.reactions?.[e] || 0
                        const mine = !!m.my_reactions?.[e]
                        return (
                          <button
                            key={e}
                            onClick={() => react(m.id, e)}
                            className={`px-2.5 py-1 rounded-full text-sm transition border ${
                              mine
                                ? 'bg-violet-500/20 border-violet-500/50'
                                : 'bg-white/5 border-white/10 hover:bg-white/10'
                            }`}
                          >
                            <span>{e}</span>
                            {count > 0 && <span className="ml-1.5 text-xs text-zinc-300">{count}</span>}
                          </button>
                        )
                      })}
                    </div>
                  </Card>
                )
              })}
            </div>
          )}
        </div>

        <div className="mt-10 text-center text-xs text-zinc-500">
          Propulsé par{' '}
          <button onClick={() => router.push('/')} className="text-violet-400 hover:underline">
            Zai
          </button>{' '}
          · Reçois aussi des messages anonymes
        </div>
      </div>
    </main>
  )
}
