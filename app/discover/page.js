'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Flame, Sparkles, Loader2 } from 'lucide-react'
import { api } from '@/lib/zai'

export default function DiscoverPage() {
  const router = useRouter()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api('/discover?limit=30').then(r => setUsers(r.users || [])).finally(() => setLoading(false))
  }, [])

  const top3 = users.slice(0, 3)
  const rest = users.slice(3)

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white relative">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 h-96 w-[800px] max-w-full rounded-full bg-violet-600/15 blur-3xl pointer-events-none" />

      <header className="relative z-10 max-w-5xl mx-auto px-5 py-5 flex items-center justify-between">
        <button onClick={() => router.push('/')} className="text-zinc-400 hover:text-white text-sm flex items-center gap-1">
          <ArrowLeft className="h-4 w-4" /> Zai
        </button>
        <div className="flex items-center gap-2 text-sm text-zinc-300">
          <Flame className="h-4 w-4 text-orange-400" /> Découvertes
        </div>
      </header>

      <section className="relative z-10 max-w-5xl mx-auto px-5 pt-4 pb-16">
        <h1 className="text-3xl md:text-5xl font-extrabold tracking-tighter">
          Trending sur <span className="bg-gradient-to-r from-violet-400 via-fuchsia-400 to-pink-400 bg-clip-text text-transparent">Zai</span>
        </h1>
        <p className="mt-2 text-zinc-400">Les profils qui reçoivent le plus de messages anonymes en ce moment.</p>

        {loading ? (
          <div className="py-20 grid place-items-center text-zinc-500"><Loader2 className="h-5 w-5 animate-spin" /></div>
        ) : users.length === 0 ? (
          <Card className="mt-10 bg-zinc-950/60 border-white/10 p-10 text-center">
            <Sparkles className="h-8 w-8 text-violet-400 mx-auto mb-2" />
            <div className="text-lg font-semibold">Personne n'a encore reçu de message</div>
            <div className="text-sm text-zinc-400 mt-1">Sois le premier à créer ton profil et inviter tes amis.</div>
            <Button onClick={() => router.push('/register')} className="mt-4 bg-violet-600 hover:bg-violet-500">Créer mon profil</Button>
          </Card>
        ) : (
          <>
            {/* Podium */}
            {top3.length > 0 && (
              <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
                {top3.map((u, i) => (
                  <Card
                    key={u.id}
                    onClick={() => router.push(`/u/${u.username}`)}
                    className={`relative cursor-pointer p-5 border-white/10 transition hover:border-violet-500/40 hover:scale-[1.02] ${
                      i === 0
                        ? 'bg-gradient-to-br from-violet-700/40 via-fuchsia-700/20 to-zinc-950 md:order-2 md:scale-105'
                        : i === 1
                        ? 'bg-gradient-to-br from-violet-800/30 to-zinc-950 md:order-1'
                        : 'bg-gradient-to-br from-fuchsia-800/30 to-zinc-950 md:order-3'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <Badge className="bg-white/10 border-white/20 text-white">{i === 0 ? '🥇 #1' : i === 1 ? '🥈 #2' : '🥉 #3'}</Badge>
                      <div className="text-orange-400 text-xs flex items-center gap-1"><Flame className="h-3 w-3" /> hot</div>
                    </div>
                    <div className="mt-4 flex flex-col items-center text-center">
                      <img src={u.avatar_url} alt={u.username} className="h-20 w-20 rounded-full bg-zinc-800 ring-2 ring-violet-500/40" />
                      <div className="mt-3 font-bold text-lg">@{u.username}</div>
                      {u.bio && <div className="text-xs text-zinc-400 mt-1 line-clamp-2">{u.bio}</div>}
                      <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-white/5 px-3 py-1 text-sm border border-white/10">
                        <span className="text-violet-300 font-semibold">{u.message_count}</span>
                        <span className="text-zinc-400 text-xs">messages</span>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}

            {/* Grid rest */}
            {rest.length > 0 && (
              <div className="mt-8">
                <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-3">Plus de profils</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {rest.map(u => (
                    <Card
                      key={u.id}
                      onClick={() => router.push(`/u/${u.username}`)}
                      className="cursor-pointer p-4 bg-zinc-950/60 border-white/10 hover:border-violet-500/40 hover:bg-zinc-900/60 transition text-center"
                    >
                      <img src={u.avatar_url} alt={u.username} className="h-14 w-14 rounded-full mx-auto bg-zinc-800" />
                      <div className="mt-2 font-semibold text-sm truncate">@{u.username}</div>
                      <div className="text-xs text-zinc-500 mt-0.5">
                        <span className="text-violet-300">{u.message_count}</span> msgs
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        <div className="mt-10 rounded-2xl border border-white/10 bg-white/[0.03] p-6 flex flex-col sm:flex-row items-center gap-4">
          <div className="flex-1 text-center sm:text-left">
            <div className="text-lg font-semibold">Tu veux figurer ici ?</div>
            <div className="text-zinc-400 text-sm">Crée ton profil et partage ton lien dans ta bio.</div>
          </div>
          <Button onClick={() => router.push('/register')} className="bg-violet-600 hover:bg-violet-500">Créer mon profil</Button>
        </div>
      </section>
    </main>
  )
}
