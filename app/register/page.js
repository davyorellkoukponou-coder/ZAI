'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import { Check, X, Loader2, ArrowLeft } from 'lucide-react'
import { toast } from 'sonner'
import { api, setToken, setUser, avatarUrl } from '@/lib/zai'

export default function RegisterPage() {
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [available, setAvailable] = useState(null) // null | true | false
  const [checking, setChecking] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!username) { setAvailable(null); return }
    if (!/^[a-z0-9_]{3,20}$/.test(username)) { setAvailable(false); return }
    setChecking(true)
    const t = setTimeout(async () => {
      try {
        const r = await api(`/users/check-username?username=${encodeURIComponent(username)}`)
        setAvailable(r.available && r.valid)
      } catch { setAvailable(null) }
      finally { setChecking(false) }
    }, 350)
    return () => clearTimeout(t)
  }, [username])

  async function onSubmit(e) {
    e.preventDefault()
    if (loading) return
    setLoading(true)
    try {
      const r = await api('/auth/register', { method: 'POST', body: JSON.stringify({ username, email, password }) })
      setToken(r.token); setUser(r.user)
      toast.success('Bienvenue sur Zai 🕊️')
      router.push('/dashboard')
    } catch (e) {
      toast.error(e.message)
    } finally { setLoading(false) }
  }

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white grid place-items-center px-4 py-8 relative">
      <div className="absolute top-32 left-1/2 -translate-x-1/2 h-72 w-72 rounded-full bg-violet-600/20 blur-3xl pointer-events-none" />
      <button onClick={() => router.push('/')} className="absolute top-4 left-4 text-zinc-400 hover:text-white text-sm flex items-center gap-1"><ArrowLeft className="h-4 w-4" /> Retour</button>

      <Card className="w-full max-w-md bg-zinc-950/80 backdrop-blur border-white/10 p-7 z-10">
        <div className="flex items-center gap-2 mb-1">
          <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 grid place-items-center font-bold">Z</div>
          <span className="text-xl font-bold">Zai</span>
        </div>
        <h1 className="text-2xl font-bold mt-3">Crée ton compte</h1>
        <p className="text-sm text-zinc-400 mt-1">Choisis ton username, on génère ton avatar.</p>

        <form onSubmit={onSubmit} className="mt-5 space-y-4">
          <div>
            <Label className="text-zinc-300">Username</Label>
            <div className="relative mt-1">
              <Input
                value={username}
                onChange={e => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                placeholder="ton_username"
                className="bg-zinc-900 border-white/10 pr-10"
                maxLength={20}
                required
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                {checking && <Loader2 className="h-4 w-4 animate-spin text-zinc-500" />}
                {!checking && available === true && <Check className="h-4 w-4 text-green-400" />}
                {!checking && available === false && <X className="h-4 w-4 text-red-400" />}
              </div>
            </div>
            <p className="text-xs text-zinc-500 mt-1">3–20 caractères · a-z 0-9 _</p>
            {username && available === true && (
              <div className="mt-3 flex items-center gap-3 rounded-lg bg-white/5 p-3 border border-white/10">
                <img src={avatarUrl(username)} alt="avatar" className="h-12 w-12 rounded-full bg-zinc-800" />
                <div>
                  <div className="text-sm text-zinc-300">Ton lien sera</div>
                  <div className="font-mono text-sm text-violet-300">zai/u/{username}</div>
                </div>
              </div>
            )}
          </div>
          <div>
            <Label className="text-zinc-300">Email</Label>
            <Input type="email" value={email} onChange={e => setEmail(e.target.value)} className="bg-zinc-900 border-white/10 mt-1" required />
          </div>
          <div>
            <Label className="text-zinc-300">Mot de passe</Label>
            <Input type="password" value={password} onChange={e => setPassword(e.target.value)} className="bg-zinc-900 border-white/10 mt-1" minLength={6} required />
          </div>
          <Button disabled={loading || !available} type="submit" className="w-full bg-violet-600 hover:bg-violet-500 h-11">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Créer mon profil'}
          </Button>
        </form>
        <p className="text-sm text-zinc-400 mt-5 text-center">
          Déjà un compte ? <button onClick={() => router.push('/login')} className="text-violet-400 hover:underline">Se connecter</button>
        </p>
      </Card>
    </main>
  )
}
