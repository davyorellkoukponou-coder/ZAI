import { ImageResponse } from 'next/og'
import { MongoClient } from 'mongodb'

export const runtime = 'nodejs'
export const contentType = 'image/png'
export const size = { width: 1200, height: 630 }
export const alt = 'Zai · Profil anonyme'

let _client
async function getDb() {
  if (!_client) {
    _client = new MongoClient(process.env.MONGO_URL)
    await _client.connect()
  }
  return _client.db(process.env.DB_NAME || 'zai_db')
}

export default async function OG({ params }) {
  const username = (params?.username || '').toLowerCase()
  let user = null
  try {
    const db = await getDb()
    user = await db.collection('users').findOne({ username })
  } catch (e) {}

  const display = user?.username || username || 'zai'
  const count = user?.message_count ?? 0
  const bio = (user?.bio || '').slice(0, 90)
  const avatar = user?.avatar_url || `https://api.dicebear.com/7.x/thumbs/png?seed=${encodeURIComponent(display)}`

  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #1a0b2e 0%, #2d1b4e 30%, #4c1d95 60%, #7c3aed 100%)',
          color: '#ffffff',
          fontFamily: 'sans-serif',
          padding: 60,
          position: 'relative',
        }}
      >
        {/* glow blobs */}
        <div style={{ position: 'absolute', top: -100, left: -100, width: 400, height: 400, background: 'rgba(236,72,153,0.35)', borderRadius: '50%', filter: 'blur(80px)' }} />
        <div style={{ position: 'absolute', bottom: -120, right: -120, width: 500, height: 500, background: 'rgba(168,85,247,0.35)', borderRadius: '50%', filter: 'blur(80px)' }} />

        {/* logo */}
        <div style={{ position: 'absolute', top: 40, left: 50, display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 44, height: 44, borderRadius: 14, background: 'rgba(255,255,255,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, fontWeight: 800 }}>Z</div>
          <div style={{ fontSize: 30, fontWeight: 800, letterSpacing: -1 }}>Zai</div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 36, zIndex: 1 }}>
          <img src={avatar} width={170} height={170} style={{ borderRadius: '50%', border: '6px solid rgba(255,255,255,0.25)', background: 'rgba(255,255,255,0.1)' }} />
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ fontSize: 64, fontWeight: 800, letterSpacing: -2, lineHeight: 1 }}>@{display}</div>
            {bio && <div style={{ marginTop: 14, fontSize: 24, color: 'rgba(255,255,255,0.78)', maxWidth: 600 }}>{bio}</div>}
            <div style={{ marginTop: 18, display: 'flex', alignItems: 'center', gap: 10, fontSize: 26 }}>
              <span style={{ background: 'rgba(255,255,255,0.18)', padding: '6px 14px', borderRadius: 999, fontWeight: 700 }}>{count}</span>
              <span style={{ color: 'rgba(255,255,255,0.8)' }}>messages reçus</span>
            </div>
          </div>
        </div>

        <div style={{ position: 'absolute', bottom: 50, left: 0, right: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
          <div style={{ fontSize: 30, fontWeight: 700 }}>Envoie-moi un message anonyme 🕊️</div>
          <div style={{ fontSize: 18, color: 'rgba(255,255,255,0.7)', letterSpacing: 2, textTransform: 'uppercase' }}>zai · /u/{display}</div>
        </div>
      </div>
    ),
    { ...size }
  )
}
