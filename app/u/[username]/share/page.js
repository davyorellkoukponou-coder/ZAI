'use client'

import { useEffect, useRef, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { ArrowLeft, Copy, Download, Loader2, LayoutTemplate } from 'lucide-react'
import { toast } from 'sonner'
import { api } from '@/lib/zai'
import { QRCodeSVG } from 'qrcode.react'

export default function SharePage() {
  const { username } = useParams()
  const router = useRouter()
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [downloading, setDownloading] = useState(false)
  const [format, setFormat] = useState('square') // 'square' | 'story'
  const cardRef = useRef(null)

  useEffect(() => {
    api(`/users/profile/${username}`)
      .then(r => setProfile(r.user))
      .catch(() => setProfile(null))
      .finally(() => setLoading(false))
  }, [username])

  const profileUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/u/${username}`
      : `/u/${username}`

  async function download() {
    if (!cardRef.current) return
    setDownloading(true)
    try {
      const html2canvas = (await import('html2canvas')).default
      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: '#0a0a0a',
        scale: 2,
        useCORS: true,
        logging: false,
      })
      const url = canvas.toDataURL('image/png')
      const a = document.createElement('a')
      a.href = url
      a.download = `zai-${username}-${format}.png`
      a.click()
      toast.success('Image téléchargée 🎉')
    } catch {
      toast.error('Erreur téléchargement')
    } finally {
      setDownloading(false)
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
      <main className="min-h-screen grid place-items-center bg-[#0a0a0a] text-white">
        Profil introuvable
      </main>
    )
  }

  const isSquare = format === 'square'

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white px-4 py-6">
      <button
        onClick={() => router.back()}
        className="text-zinc-400 hover:text-white text-sm flex items-center gap-1 mb-6"
      >
        <ArrowLeft className="h-4 w-4" /> Retour
      </button>

      <div className="max-w-md mx-auto">
        <h1 className="text-2xl font-bold mb-1">Partage ton profil</h1>
        <p className="text-zinc-400 text-sm mb-5">
          Télécharge l'image et partage-la dans ta bio Insta, story ou status WhatsApp.
        </p>

        {/* Format toggle */}
        <div className="flex gap-2 mb-5">
          <button
            onClick={() => setFormat('square')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl border text-sm font-medium transition ${
              isSquare
                ? 'bg-violet-600 border-violet-500 text-white'
                : 'border-white/15 bg-white/5 text-zinc-400 hover:text-white'
            }`}
          >
            <LayoutTemplate className="h-4 w-4" /> Post carré 1:1
          </button>
          <button
            onClick={() => setFormat('story')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl border text-sm font-medium transition ${
              !isSquare
                ? 'bg-violet-600 border-violet-500 text-white'
                : 'border-white/15 bg-white/5 text-zinc-400 hover:text-white'
            }`}
          >
            <LayoutTemplate className="h-4 w-4 rotate-90" /> Story 9:16
          </button>
        </div>

        {/* ── Square card ── */}
        {isSquare && (
          <div className="relative">
            <div
              ref={cardRef}
              className="aspect-square w-full rounded-3xl overflow-hidden relative"
              style={{
                background:
                  'linear-gradient(135deg, #1a0b2e 0%, #2d1b4e 30%, #4c1d95 60%, #7c3aed 100%)',
              }}
            >
              <div
                className="absolute inset-0 opacity-30"
                style={{
                  backgroundImage:
                    'radial-gradient(circle at 20% 20%, rgba(236,72,153,0.5), transparent 40%), radial-gradient(circle at 80% 80%, rgba(168,85,247,0.5), transparent 40%)',
                }}
              />
              <div className="relative z-10 h-full flex flex-col items-center justify-between p-6 text-center">
                {/* Logo */}
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-xl bg-white/15 backdrop-blur grid place-items-center font-bold text-white">
                    Z
                  </div>
                  <span className="text-xl font-extrabold tracking-tight">Zai</span>
                </div>
                {/* Profile */}
                <div className="flex flex-col items-center gap-3">
                  <img
                    src={profile.avatar_url}
                    alt={profile.username}
                    crossOrigin="anonymous"
                    className="h-24 w-24 rounded-full bg-white/15 ring-4 ring-white/20"
                  />
                  <div className="text-2xl font-extrabold tracking-tight">@{profile.username}</div>
                  <div className="text-sm text-white/80">{profile.message_count} messages reçus</div>
                </div>
                {/* QR */}
                <div className="flex flex-col items-center gap-3">
                  <div className="bg-white p-2.5 rounded-xl">
                    <QRCodeSVG value={profileUrl} size={88} bgColor="#ffffff" fgColor="#1a0b2e" level="M" />
                  </div>
                  <div className="text-sm font-semibold">Envoie-moi un message anonyme 🕊️</div>
                  <div className="text-[10px] uppercase tracking-widest text-white/70 font-mono">
                    zai · /u/{profile.username}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Story 9:16 card ── */}
        {!isSquare && (
          <div className="relative flex justify-center">
            <div
              ref={cardRef}
              style={{
                width: '100%',
                maxWidth: 360,
                aspectRatio: '9/16',
                borderRadius: 24,
                overflow: 'hidden',
                background:
                  'linear-gradient(180deg, #0f0523 0%, #1a0b2e 25%, #2d1b4e 55%, #7c3aed 100%)',
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '32px 24px',
                textAlign: 'center',
              }}
            >
              {/* Glow blobs */}
              <div
                style={{
                  position: 'absolute',
                  top: '10%',
                  left: '-20%',
                  width: '60%',
                  height: '30%',
                  background: 'rgba(236,72,153,0.3)',
                  borderRadius: '50%',
                  filter: 'blur(60px)',
                }}
              />
              <div
                style={{
                  position: 'absolute',
                  bottom: '15%',
                  right: '-20%',
                  width: '70%',
                  height: '30%',
                  background: 'rgba(168,85,247,0.4)',
                  borderRadius: '50%',
                  filter: 'blur(60px)',
                }}
              />

              {/* Logo top */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, zIndex: 1 }}>
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 12,
                    background: 'rgba(255,255,255,0.18)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 20,
                    fontWeight: 800,
                    color: 'white',
                  }}
                >
                  Z
                </div>
                <span style={{ fontSize: 22, fontWeight: 800, color: 'white', letterSpacing: -0.5 }}>
                  Zai
                </span>
              </div>

              {/* Middle — profile */}
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 16,
                  zIndex: 1,
                  flex: 1,
                  justifyContent: 'center',
                }}
              >
                <img
                  src={profile.avatar_url}
                  alt={profile.username}
                  crossOrigin="anonymous"
                  style={{
                    width: 100,
                    height: 100,
                    borderRadius: '50%',
                    border: '4px solid rgba(255,255,255,0.25)',
                    background: 'rgba(255,255,255,0.1)',
                  }}
                />
                <div style={{ color: 'white', fontSize: 28, fontWeight: 800, letterSpacing: -1 }}>
                  @{profile.username}
                </div>
                {profile.bio && (
                  <div
                    style={{
                      color: 'rgba(255,255,255,0.7)',
                      fontSize: 15,
                      maxWidth: 260,
                      lineHeight: 1.5,
                    }}
                  >
                    {profile.bio}
                  </div>
                )}
                <div
                  style={{
                    background: 'rgba(255,255,255,0.15)',
                    borderRadius: 999,
                    padding: '8px 20px',
                    color: 'white',
                    fontSize: 16,
                    fontWeight: 600,
                  }}
                >
                  {profile.message_count} messages reçus
                </div>
              </div>

              {/* Bottom — QR + CTA */}
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 12,
                  zIndex: 1,
                }}
              >
                <div style={{ background: 'white', padding: 10, borderRadius: 16 }}>
                  <QRCodeSVG value={profileUrl} size={100} bgColor="#ffffff" fgColor="#1a0b2e" level="M" />
                </div>
                <div style={{ color: 'white', fontSize: 16, fontWeight: 700 }}>
                  Envoie-moi un message anonyme 🕊️
                </div>
                <div
                  style={{
                    color: 'rgba(255,255,255,0.6)',
                    fontSize: 11,
                    letterSpacing: 2,
                    textTransform: 'uppercase',
                    fontFamily: 'monospace',
                  }}
                >
                  zai · /u/{profile.username}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Action buttons */}
        <div className="mt-5 grid grid-cols-2 gap-2">
          <Button
            onClick={download}
            disabled={downloading}
            className="bg-violet-600 hover:bg-violet-500 h-11"
          >
            {downloading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" /> Télécharger PNG
              </>
            )}
          </Button>
          <Button
            onClick={() => {
              navigator.clipboard.writeText(profileUrl)
              toast.success('Lien copié')
            }}
            variant="outline"
            className="border-white/15 bg-white/5 hover:bg-white/10 h-11"
          >
            <Copy className="h-4 w-4 mr-2" /> Copier lien
          </Button>
        </div>

        <Card className="mt-5 bg-zinc-950/60 border-white/10 p-4 text-xs text-zinc-400">
          <div className="font-semibold text-zinc-300 mb-1">💡 Astuce</div>
          Mets le lien dans ta bio Instagram ou TikTok. Le format Story est parfait pour les highlights
          Insta.
        </Card>
      </div>
    </main>
  )
}
