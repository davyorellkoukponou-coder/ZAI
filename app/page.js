'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { ArrowRight, Sparkles, Eye, Send, MessageCircleHeart, Copy, Share2, ExternalLink, Inbox, Check, MessageSquare, Bell } from 'lucide-react'
import { getUser, getToken, api, avatarUrl } from '@/lib/zai'
import { toast } from 'sonner'

// ─── HOME FOR LOGGED-IN USERS ───
function LoggedInHome({ user }) {
  const router = useRouter()
  const [stats, setStats] = useState({ messages: 0, unread: 0, views: 0 })
  const [copied, setCopied] = useState(false)
  const link = `zai.app/u/${user.username}`
  const fullLink = `${typeof window !== 'undefined' ? window.location.origin : ''}/u/${user.username}`

  useEffect(() => {
    async function loadStats() {
      try {
        const [msgs, unread] = await Promise.all([
          api('/messages'),
          api('/messages/unread-count'),
        ])
        setStats({
          messages: msgs.messages?.length || 0,
          unread: unread.unread || 0,
          views: user.profile_views || 0,
        })
      } catch {}
    }
    loadStats()
  }, [user])

  function copyLink() {
    navigator.clipboard.writeText(fullLink)
    setCopied(true)
    toast.success('Lien copié !')
    setTimeout(() => setCopied(false), 2000)
  }

  async function shareLink() {
    if (navigator.share) {
      try {
        await navigator.share({ title: 'Zai', text: 'Envoie-moi un message anonyme 🤫', url: fullLink })
      } catch {}
    } else {
      copyLink()
    }
  }

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white relative overflow-hidden">
      {/* Glow */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-violet-600/30 blur-3xl" />
        <div className="absolute top-1/2 -right-32 h-80 w-80 rounded-full bg-fuchsia-600/20 blur-3xl" />
      </div>

      <div className="relative z-10 max-w-lg mx-auto px-4 pt-8 pb-20">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 grid place-items-center font-bold">Z</div>
            <span className="text-xl font-bold tracking-tight">Zai</span>
          </div>
          <Button variant="ghost" onClick={() => router.push('/dashboard')} className="text-zinc-300 hover:text-white text-sm">
            <Inbox className="h-4 w-4 mr-1.5" />
            Dashboard
            {stats.unread > 0 && (
              <span className="ml-2 bg-violet-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">{stats.unread}</span>
            )}
          </Button>
        </div>

        {/* Welcome */}
        <div className="flex items-center gap-4 mb-8">
          <img src={avatarUrl(user.username)} alt={user.username} className="h-16 w-16 rounded-full bg-zinc-800 ring-4 ring-violet-500/30" />
          <div>
            <h1 className="text-2xl font-bold">Salut @{user.username} 👋</h1>
            <p className="text-sm text-zinc-400 mt-0.5">Voici ton espace perso.</p>
          </div>
        </div>

        {/* Link CTA — the main focus */}
        <Card className="bg-gradient-to-br from-violet-600/20 to-fuchsia-600/20 border-violet-500/30 p-6 shadow-2xl mb-5">
          <div className="text-sm text-zinc-300 mb-1 font-medium">Ton lien personnel</div>
          <div className="flex items-center gap-2 mt-2">
            <div className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm font-mono text-violet-300 truncate">
              {link}
            </div>
            <Button onClick={copyLink} className="bg-white/10 hover:bg-white/20 border border-white/10 h-[46px] w-[46px] p-0 rounded-xl shrink-0">
              {copied ? <Check className="h-4 w-4 text-green-400" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
          <div className="flex gap-2 mt-3">
            <Button onClick={shareLink} className="flex-1 bg-white text-black hover:bg-zinc-200 font-bold rounded-xl h-12">
              <Share2 className="h-4 w-4 mr-2" /> Partager mon lien
            </Button>
            <Button onClick={() => router.push(`/u/${user.username}/share`)} variant="outline" className="border-white/20 bg-white/5 hover:bg-white/10 rounded-xl h-12 px-4">
              <ExternalLink className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-xs text-zinc-400 mt-3 text-center">Mets ce lien dans ta bio Insta, TikTok ou partage-le en story 🔥</p>
        </Card>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-3 mb-5">
          {[
            { label: 'Messages', value: stats.messages, Icon: MessageSquare, bg: 'bg-violet-500/15', color: 'text-violet-400' },
            { label: 'Non lus', value: stats.unread, Icon: Bell, bg: 'bg-fuchsia-500/15', color: 'text-fuchsia-400' },
            { label: 'Vues profil', value: stats.views, Icon: Eye, bg: 'bg-pink-500/15', color: 'text-pink-400' },
          ].map(s => (
            <Card key={s.label} className="bg-zinc-950/70 border-white/10 p-4 text-center">
              <div className={`mx-auto h-10 w-10 rounded-full ${s.bg} grid place-items-center mb-2`}>
                <s.Icon className={`h-5 w-5 ${s.color}`} />
              </div>
              <div className="text-2xl font-bold">{s.value}</div>
              <div className="text-[11px] text-zinc-500 mt-0.5">{s.label}</div>
            </Card>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="space-y-3">
          <Button
            onClick={() => router.push('/dashboard')}
            className="w-full bg-violet-600 hover:bg-violet-500 h-12 rounded-xl text-base font-semibold justify-between px-5"
          >
            <span className="flex items-center gap-2">
              <Inbox className="h-5 w-5" /> Voir mes messages
            </span>
            {stats.unread > 0 && (
              <span className="bg-white/20 text-white text-xs font-bold px-2 py-0.5 rounded-full">{stats.unread} nouveau{stats.unread > 1 ? 'x' : ''}</span>
            )}
          </Button>
          <Button
            onClick={() => router.push(`/u/${user.username}`)}
            variant="outline"
            className="w-full border-white/10 bg-white/5 hover:bg-white/10 h-12 rounded-xl text-base font-medium justify-start gap-2 px-5"
          >
            <Eye className="h-5 w-5 text-zinc-400" /> Voir mon profil public
          </Button>
        </div>

        {/* Footer tip */}
        <div className="mt-10 text-center text-xs text-zinc-500">
          Plus tu partages ton lien, plus tu reçois de messages 🚀
        </div>
      </div>
    </main>
  )
}

// ─── LANDING PAGE FOR VISITORS ───
function LandingPage() {
  const router = useRouter()

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white relative overflow-hidden">
      {/* glow background */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-violet-600/30 blur-3xl" />
        <div className="absolute top-1/2 -right-32 h-[500px] w-[500px] rounded-full bg-fuchsia-600/20 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-80 w-80 rounded-full bg-purple-700/20 blur-3xl" />
      </div>

      <nav className="relative z-10 flex items-center justify-between px-5 py-5 md:px-10">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 grid place-items-center font-bold">Z</div>
          <span className="text-xl font-bold tracking-tight">Zai</span>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" onClick={() => router.push('/rules')} className="text-zinc-300 hover:text-white hidden sm:inline-flex">
            Règles
          </Button>
          <Button variant="ghost" onClick={() => router.push('/login')} className="text-zinc-300 hover:text-white">
            Connexion
          </Button>
          <Button onClick={() => router.push('/register')} className="bg-violet-600 hover:bg-violet-500">
            S'inscrire
          </Button>
        </div>
      </nav>

      <section className="relative z-10 flex flex-col items-center text-center px-5 pt-12 md:pt-24 pb-20">
        <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-zinc-300 mb-6">
          <Sparkles className="h-3 w-3 text-violet-400" />
          Messages 100% anonymes · expiration 48h
        </div>
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tighter leading-[1.05] max-w-4xl">
          Dis ce que tu penses.<br />
          <span className="bg-gradient-to-r from-violet-400 via-fuchsia-400 to-pink-400 bg-clip-text text-transparent">
            Sans te dévoiler.
          </span>
        </h1>
        <p className="mt-6 max-w-xl text-zinc-400 text-lg">
          Reçois des messages anonymes de ton crush, tes amis, tes rivaux ou de purs mystères. Réponds publiquement, garde le mystère.
        </p>
        <div className="mt-8 flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <Button
            onClick={() => router.push('/register')}
            size="lg"
            className="bg-violet-600 hover:bg-violet-500 text-white px-8 h-12 text-base"
          >
            Créer mon profil <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
          <Button
            onClick={() => {
              const u = prompt("Username de la personne à qui envoyer un message :")
              if (u) router.push(`/u/${u.trim().toLowerCase()}`)
            }}
            size="lg"
            variant="outline"
            className="border-white/15 bg-white/5 hover:bg-white/10 h-12 text-base"
          >
            Envoyer un message anonyme
          </Button>
        </div>
      </section>

      <section className="relative z-10 px-5 pb-24 max-w-5xl mx-auto">
        <div className="grid md:grid-cols-3 gap-4">
          {[
            { icon: Sparkles, n: '01', t: 'Crée ton profil', d: 'Choisis un username unique. On te génère un avatar.' },
            { icon: Send, n: '02', t: 'Partage ton lien', d: 'Sur Insta, TikTok, WhatsApp. Ton lien zai.app/u/toi.' },
            { icon: MessageCircleHeart, n: '03', t: 'Reçois & réponds', d: 'Messages anonymes en direct. Tu réponds publiquement.' },
          ].map((s, i) => (
            <div key={i} className="group rounded-2xl border border-white/10 bg-gradient-to-b from-white/5 to-transparent p-6 hover:border-violet-500/40 transition">
              <div className="flex items-center justify-between mb-6">
                <div className="text-zinc-500 text-xs font-mono">{s.n}</div>
                <s.icon className="h-5 w-5 text-violet-400" />
              </div>
              <h3 className="text-xl font-semibold">{s.t}</h3>
              <p className="text-zinc-400 mt-2 text-sm">{s.d}</p>
            </div>
          ))}
        </div>

        <div className="mt-10 rounded-2xl border border-white/10 bg-white/[0.03] p-6 md:p-8 flex flex-col md:flex-row items-center gap-6">
          <div className="flex -space-x-3">
            {['crush','ami','rival','mystère'].map((m, i) => (
              <div key={m} className="h-10 w-10 rounded-full grid place-items-center text-sm font-semibold ring-2 ring-[#0a0a0a]"
                style={{ background: ['#ec4899','#22c55e','#ef4444','#9ca3af'][i] }}>
                {m[0].toUpperCase()}
              </div>
            ))}
          </div>
          <div className="flex-1 text-center md:text-left">
            <div className="text-lg font-semibold">4 humeurs. 0 identité révélée.</div>
            <div className="text-zinc-400 text-sm">crush · ami · rival · mystère — l'expéditeur choisit le ton, jamais son nom.</div>
          </div>
          <Button onClick={() => router.push('/register')} className="bg-violet-600 hover:bg-violet-500">
            Commencer
          </Button>
        </div>
      </section>

      <footer className="relative z-10 border-t border-white/5 py-8 text-center text-xs text-zinc-500 flex flex-col items-center gap-2">
        <p>Zai · Fait pour les vibes anonymes 🕊️</p>
        <Link href="/rules" className="text-violet-400 hover:text-violet-300 transition">Règles & Sécurité (Anti-Harcèlement)</Link>
      </footer>
    </main>
  )
}

// ─── MAIN ENTRY ───
export default function HomePage() {
  const [user, setU] = useState(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const u = getUser()
    const t = getToken()
    if (u && t) setU(u)
    setReady(true)
  }, [])

  if (!ready) return <main className="min-h-screen bg-[#0a0a0a]" />

  return user ? <LoggedInHome user={user} /> : <LandingPage />
}
