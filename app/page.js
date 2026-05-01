'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ArrowRight, Sparkles, Eye, Send, MessageCircleHeart } from 'lucide-react'
import { getUser } from '@/lib/zai'

export default function LandingPage() {
  const router = useRouter()
  const [user, setU] = useState(null)

  useEffect(() => { setU(getUser()) }, [])

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
          {user ? (
            <Button onClick={() => router.push('/dashboard')} className="bg-violet-600 hover:bg-violet-500">
              Mon dashboard
            </Button>
          ) : (
            <>
              <Button variant="ghost" onClick={() => router.push('/login')} className="text-zinc-300 hover:text-white">
                Connexion
              </Button>
              <Button onClick={() => router.push('/register')} className="bg-violet-600 hover:bg-violet-500">
                S'inscrire
              </Button>
            </>
          )}
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
            onClick={() => router.push(user ? '/dashboard' : '/register')}
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
          <Button onClick={() => router.push(user ? '/dashboard' : '/register')} className="bg-violet-600 hover:bg-violet-500">
            Commencer
          </Button>
        </div>
      </section>

      <footer className="relative z-10 border-t border-white/5 py-6 text-center text-xs text-zinc-500">
        Zai · Fait pour les vibes anonymes 🕊️
      </footer>
    </main>
  )
}
