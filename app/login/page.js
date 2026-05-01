'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import { Loader2, ArrowLeft } from 'lucide-react'
import { toast } from 'sonner'
import { api, setToken, setUser } from '@/lib/zai'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  async function onSubmit(e) {
    e.preventDefault()
    if (loading) return
    setLoading(true)
    try {
      const r = await api('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) })
      setToken(r.token); setUser(r.user)
      toast.success(`Yo @${r.user.username} 👋`)
      router.push('/dashboard')
    } catch (e) {
      toast.error(e.message)
    } finally { setLoading(false) }
  }

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white grid place-items-center px-4 relative">
      <div className="absolute top-32 left-1/2 -translate-x-1/2 h-72 w-72 rounded-full bg-violet-600/20 blur-3xl pointer-events-none" />
      <button onClick={() => router.push('/')} className="absolute top-4 left-4 text-zinc-400 hover:text-white text-sm flex items-center gap-1"><ArrowLeft className="h-4 w-4" /> Retour</button>
      <Card className="w-full max-w-md bg-zinc-950/80 backdrop-blur border-white/10 p-7 z-10">
        <div className="flex items-center gap-2 mb-1">
          <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 grid place-items-center font-bold">Z</div>
          <span className="text-xl font-bold">Zai</span>
        </div>
        <h1 className="text-2xl font-bold mt-3">Connexion</h1>
        <p className="text-sm text-zinc-400 mt-1">Reprends là où t'en étais.</p>
        <form onSubmit={onSubmit} className="mt-5 space-y-4">
          <div>
            <Label className="text-zinc-300">Email</Label>
            <Input type="email" value={email} onChange={e => setEmail(e.target.value)} className="bg-zinc-900 border-white/10 mt-1" required />
          </div>
          <div>
            <Label className="text-zinc-300">Mot de passe</Label>
            <Input type="password" value={password} onChange={e => setPassword(e.target.value)} className="bg-zinc-900 border-white/10 mt-1" required />
          </div>
          <Button disabled={loading} type="submit" className="w-full bg-violet-600 hover:bg-violet-500 h-11">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Se connecter'}
          </Button>
        </form>
        <p className="text-sm text-zinc-400 mt-5 text-center">
          Pas encore de compte ? <button onClick={() => router.push('/register')} className="text-violet-400 hover:underline">Créer un compte</button>
        </p>
      </Card>
    </main>
  )
}
