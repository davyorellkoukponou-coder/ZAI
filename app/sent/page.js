'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { ArrowLeft } from 'lucide-react'
import { Suspense } from 'react'

function SentContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const to = searchParams.get('to') || 'cet utilisateur'

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white flex flex-col relative px-4 py-8">
      {/* Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 h-96 w-96 rounded-full bg-violet-600/20 blur-3xl pointer-events-none" />

      <button onClick={() => router.push(`/u/${to}`)} className="relative z-10 text-zinc-400 hover:text-white text-sm flex items-center gap-1 w-fit mb-12">
        <ArrowLeft className="h-4 w-4" /> Retour
      </button>

      <div className="flex-1 flex flex-col items-center justify-center max-w-md mx-auto w-full relative z-10 -mt-20">
        <div className="text-6xl mb-6 animate-in zoom-in duration-500">🤫</div>
        <h1 className="text-3xl font-extrabold text-center mb-2 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-150">
          Message envoyé !
        </h1>
        <p className="text-zinc-400 text-center mb-10 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-300">
          Ton secret est bien gardé. @{to} ne saura jamais que c'est toi.
        </p>

        {/* Viral CTA Card */}
        <Card className="w-full bg-gradient-to-br from-violet-600/20 to-fuchsia-600/20 border-violet-500/30 p-8 text-center shadow-2xl animate-in fade-in slide-in-from-bottom-8 duration-700 delay-500">
          <h2 className="text-2xl font-bold text-white mb-2">Et toi ?</h2>
          <p className="text-zinc-300 mb-8">
            Que pensent tes amis de toi ? Crée ton propre profil Zai et découvre tes messages secrets.
          </p>
          <Button 
            onClick={() => router.push('/register')} 
            className="w-full bg-white text-black hover:bg-zinc-200 font-bold rounded-xl h-14 text-lg shadow-[0_0_30px_-5px_rgba(255,255,255,0.3)]"
          >
            Créer mon lien Zai 🚀
          </Button>
          <button 
            onClick={() => router.push(`/u/${to}`)} 
            className="mt-6 text-sm text-zinc-500 hover:text-white transition"
          >
            Non merci, envoyer un autre message
          </button>
        </Card>
      </div>
    </main>
  )
}

export default function SentPage() {
  return (
    <Suspense fallback={<main className="min-h-screen bg-[#0a0a0a]" />}>
      <SentContent />
    </Suspense>
  )
}
