import { MongoClient } from 'mongodb'
import { v4 as uuidv4 } from 'uuid'
import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { moderate } from '@/lib/moderation'
import { Resend } from 'resend'

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null

const JWT_SECRET = process.env.JWT_SECRET || 'zai-mvp-secret-key-2025'
const DB_NAME = process.env.DB_NAME || 'zai_db'

let client
let db

async function connectToMongo() {
  if (!db) {
    client = new MongoClient(process.env.MONGO_URL)
    await client.connect()
    db = client.db(DB_NAME)
    // Indexes
    await db.collection('users').createIndex({ username: 1 }, { unique: true })
    await db.collection('users').createIndex({ email: 1 }, { unique: true })
    await db.collection('messages').createIndex({ recipient_id: 1, created_at: -1 })
    await db.collection('reactions').createIndex({ message_id: 1, session_id: 1, emoji: 1 }, { unique: true })
  }
  return db
}

function handleCORS(response) {
  response.headers.set('Access-Control-Allow-Origin', process.env.CORS_ORIGINS || '*')
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Anon-Session')
  response.headers.set('Access-Control-Allow-Credentials', 'true')
  return response
}

export async function OPTIONS() {
  return handleCORS(new NextResponse(null, { status: 200 }))
}

function strip(obj) {
  if (!obj) return obj
  if (Array.isArray(obj)) return obj.map(strip)
  const { _id, password_hash, ...rest } = obj
  return rest
}

function getAuthUser(request) {
  const auth = request.headers.get('authorization') || ''
  const token = auth.replace('Bearer ', '').trim()
  if (!token) return null
  try {
    return jwt.verify(token, JWT_SECRET)
  } catch (e) {
    return null
  }
}

function generateMetadata(sessionId, recipientId, prevCount) {
  const now = new Date()
  const days = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi']
  const day = days[now.getDay()]
  const h = now.getHours()
  let slot = 'nuit'
  if (h >= 5 && h < 12) slot = 'matin'
  else if (h >= 12 && h < 18) slot = 'après-midi'
  else if (h >= 18 && h < 23) slot = 'soir'
  const ord = (n) => {
    if (n === 1) return '1er'
    return `${n}ème`
  }
  let parts = [`Reçu un ${day} ${slot}`]
  if (prevCount > 0) {
    parts.push(`${ord(prevCount + 1)} message de cette personne`)
  } else {
    parts.push(`1er message de cette personne`)
  }
  return { day, slot, session_count: prevCount + 1, label: parts.join(' · ') }
}

async function handleRoute(request, { params }) {
  const path = (params?.path) || []
  const route = `/${path.join('/')}`
  const method = request.method

  try {
    const db = await connectToMongo()

    // ---------- AUTH ----------
    if (route === '/auth/register' && method === 'POST') {
      const body = await request.json()
      const username = (body.username || '').trim().toLowerCase()
      const email = (body.email || '').trim().toLowerCase()
      const password = body.password || ''
      if (!username || !email || !password) {
        return handleCORS(NextResponse.json({ error: 'Champs manquants' }, { status: 400 }))
      }
      if (!/^[a-z0-9_]{3,20}$/.test(username)) {
        return handleCORS(NextResponse.json({ error: 'Username: 3-20 caractères, a-z 0-9 _' }, { status: 400 }))
      }
      if (password.length < 6) {
        return handleCORS(NextResponse.json({ error: 'Mot de passe trop court (min 6)' }, { status: 400 }))
      }
      const exists = await db.collection('users').findOne({ $or: [{ username }, { email }] })
      if (exists) {
        return handleCORS(NextResponse.json({ error: 'Username ou email déjà utilisé' }, { status: 409 }))
      }
      const password_hash = await bcrypt.hash(password, 10)
      const user = {
        id: uuidv4(),
        username,
        email,
        password_hash,
        bio: '',
        avatar_url: `https://api.dicebear.com/7.x/thumbs/svg?seed=${encodeURIComponent(username)}`,
        message_count: 0,
        created_at: new Date(),
      }
      await db.collection('users').insertOne(user)
      const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '30d' })
      return handleCORS(NextResponse.json({ token, user: strip(user) }))
    }

    if (route === '/auth/login' && method === 'POST') {
      const body = await request.json()
      const email = (body.email || '').trim().toLowerCase()
      const password = body.password || ''
      const user = await db.collection('users').findOne({ email })
      if (!user) return handleCORS(NextResponse.json({ error: 'Identifiants invalides' }, { status: 401 }))
      const ok = await bcrypt.compare(password, user.password_hash)
      if (!ok) return handleCORS(NextResponse.json({ error: 'Identifiants invalides' }, { status: 401 }))
      const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '30d' })
      return handleCORS(NextResponse.json({ token, user: strip(user) }))
    }

    if (route === '/auth/me' && method === 'GET') {
      const auth = getAuthUser(request)
      if (!auth) return handleCORS(NextResponse.json({ error: 'Non authentifié' }, { status: 401 }))
      const user = await db.collection('users').findOne({ id: auth.id })
      if (!user) return handleCORS(NextResponse.json({ error: 'Utilisateur introuvable' }, { status: 404 }))
      return handleCORS(NextResponse.json({ user: strip(user) }))
    }

    // ---------- USERS ----------
    if (route === '/users/check-username' && method === 'GET') {
      const url = new URL(request.url)
      const u = (url.searchParams.get('username') || '').trim().toLowerCase()
      if (!u || !/^[a-z0-9_]{3,20}$/.test(u)) {
        return handleCORS(NextResponse.json({ available: false, valid: false }))
      }
      const exists = await db.collection('users').findOne({ username: u })
      return handleCORS(NextResponse.json({ available: !exists, valid: true }))
    }

    // GET /users/profile/:username (public)
    if (path[0] === 'users' && path[1] === 'profile' && path[2] && method === 'GET') {
      const username = path[2].toLowerCase()
      const user = await db.collection('users').findOne({ username })
      if (!user) return handleCORS(NextResponse.json({ error: 'Profil introuvable' }, { status: 404 }))
      return handleCORS(NextResponse.json({
        user: {
          id: user.id,
          username: user.username,
          bio: user.bio || '',
          avatar_url: user.avatar_url,
          message_count: user.message_count || 0,
        }
      }))
    }

    // PATCH /users/me (update bio)
    if (route === '/users/me' && method === 'PATCH') {
      const auth = getAuthUser(request)
      if (!auth) return handleCORS(NextResponse.json({ error: 'Non authentifié' }, { status: 401 }))
      const body = await request.json()
      const update = {}
      if (typeof body.bio === 'string') update.bio = body.bio.slice(0, 160)
      await db.collection('users').updateOne({ id: auth.id }, { $set: update })
      const user = await db.collection('users').findOne({ id: auth.id })
      return handleCORS(NextResponse.json({ user: strip(user) }))
    }

    // ---------- MESSAGES ----------
    // POST /messages/send  (anonymous)
    if (route === '/messages/send' && method === 'POST') {
      const body = await request.json()
      const recipient_username = (body.recipient_username || '').trim().toLowerCase()
      const content = (body.content || '').trim()
      const mood_tag = body.mood_tag
      const session_id = request.headers.get('x-anon-session') || body.session_id || uuidv4()
      if (!recipient_username || !content) {
        return handleCORS(NextResponse.json({ error: 'Champs manquants' }, { status: 400 }))
      }
      if (content.length > 300) {
        return handleCORS(NextResponse.json({ error: 'Message trop long (max 300)' }, { status: 400 }))
      }
      if (!['crush', 'ami', 'rival', 'mystère'].includes(mood_tag)) {
        return handleCORS(NextResponse.json({ error: 'Mood tag invalide' }, { status: 400 }))
      }
      const mod = moderate(content)
      if (!mod.ok) {
        return handleCORS(NextResponse.json({ error: mod.reason }, { status: 400 }))
      }
      const recipient = await db.collection('users').findOne({ username: recipient_username })
      if (!recipient) return handleCORS(NextResponse.json({ error: 'Destinataire introuvable' }, { status: 404 }))
      // count previous messages from same anon session to same recipient
      const prevCount = await db.collection('messages').countDocuments({ recipient_id: recipient.id, 'metadata.session_id': session_id })
      const meta = generateMetadata(session_id, recipient.id, prevCount)
      const message = {
        id: uuidv4(),
        recipient_id: recipient.id,
        recipient_username: recipient.username,
        content,
        mood_tag,
        metadata: { ...meta, session_id },
        reply: null,
        is_replied: false,
        is_read: false,
        is_reported: false,
        expires_at: new Date(Date.now() + 48 * 60 * 60 * 1000),
        created_at: new Date(),
      }
      await db.collection('messages').insertOne(message)
      await db.collection('users').updateOne({ id: recipient.id }, { $inc: { message_count: 1 } })

      // Envoi de l'email via Resend
      if (resend && recipient.email) {
        try {
          const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
          await resend.emails.send({
            from: 'Zai <notifications@resend.dev>', // resend.dev for testing, use own domain in prod
            to: recipient.email,
            subject: `Zai · Tu as reçu un nouveau message [${mood_tag}]`,
            html: `
              <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; background: #0a0a0a; color: #fff; padding: 40px; border-radius: 12px;">
                <h1 style="color: #8b5cf6;">Nouveau message anonyme 🕊️</h1>
                <p style="color: #a1a1aa;">Humeur : <strong>${mood_tag}</strong></p>
                <div style="background: #18181b; padding: 20px; border-radius: 8px; font-size: 16px; margin: 20px 0; border: 1px solid #27272a;">
                  ${content}
                </div>
                <p style="color: #71717a; font-size: 14px;">${meta.label}</p>
                <a href="${appUrl}/dashboard" style="display: inline-block; background: #8b5cf6; color: white; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: bold; margin-top: 20px;">Ouvrir mon dashboard</a>
              </div>
            `
          })
        } catch (err) {
          console.error("Erreur Resend:", err)
        }
      }

      return handleCORS(NextResponse.json({ ok: true, session_id }))
    }

    // GET /messages  (auth, dashboard list)
    if (route === '/messages' && method === 'GET') {
      const auth = getAuthUser(request)
      if (!auth) return handleCORS(NextResponse.json({ error: 'Non authentifié' }, { status: 401 }))
      // delete expired
      await db.collection('messages').deleteMany({ recipient_id: auth.id, expires_at: { $lt: new Date() } })
      const msgs = await db.collection('messages').find({ recipient_id: auth.id }).sort({ created_at: -1 }).toArray()
      // attach reactions per message
      const ids = msgs.map(m => m.id)
      const reacts = await db.collection('reactions').find({ message_id: { $in: ids } }).toArray()
      const byMsg = {}
      for (const r of reacts) {
        byMsg[r.message_id] = byMsg[r.message_id] || {}
        byMsg[r.message_id][r.emoji] = (byMsg[r.message_id][r.emoji] || 0) + 1
      }
      const out = msgs.map(m => ({ ...strip(m), reactions: byMsg[m.id] || {} }))
      return handleCORS(NextResponse.json({ messages: out }))
    }

    // GET /messages/unread-count
    if (route === '/messages/unread-count' && method === 'GET') {
      const auth = getAuthUser(request)
      if (!auth) return handleCORS(NextResponse.json({ error: 'Non authentifié' }, { status: 401 }))
      await db.collection('messages').deleteMany({ recipient_id: auth.id, expires_at: { $lt: new Date() } })
      const count = await db.collection('messages').countDocuments({ recipient_id: auth.id, is_read: false })
      const total = await db.collection('messages').countDocuments({ recipient_id: auth.id })
      return handleCORS(NextResponse.json({ unread: count, total }))
    }

    // POST /messages/:id/read
    if (path[0] === 'messages' && path[1] && path[2] === 'read' && method === 'POST') {
      const auth = getAuthUser(request)
      if (!auth) return handleCORS(NextResponse.json({ error: 'Non authentifié' }, { status: 401 }))
      const id = path[1]
      await db.collection('messages').updateOne({ id, recipient_id: auth.id }, { $set: { is_read: true } })
      return handleCORS(NextResponse.json({ ok: true }))
    }

    // POST /messages/:id/reply
    if (path[0] === 'messages' && path[1] && path[2] === 'reply' && method === 'POST') {
      const auth = getAuthUser(request)
      if (!auth) return handleCORS(NextResponse.json({ error: 'Non authentifié' }, { status: 401 }))
      const body = await request.json()
      const reply = (body.reply || '').trim().slice(0, 500)
      if (!reply) return handleCORS(NextResponse.json({ error: 'Réponse vide' }, { status: 400 }))
      const id = path[1]
      const r = await db.collection('messages').updateOne(
        { id, recipient_id: auth.id },
        { $set: { reply, is_replied: true, is_read: true, replied_at: new Date() } }
      )
      if (r.matchedCount === 0) return handleCORS(NextResponse.json({ error: 'Introuvable' }, { status: 404 }))
      return handleCORS(NextResponse.json({ ok: true }))
    }

    // POST /messages/:id/report
    if (path[0] === 'messages' && path[1] && path[2] === 'report' && method === 'POST') {
      const auth = getAuthUser(request)
      if (!auth) return handleCORS(NextResponse.json({ error: 'Non authentifié' }, { status: 401 }))
      const id = path[1]
      await db.collection('messages').updateOne({ id, recipient_id: auth.id }, { $set: { is_reported: true } })
      return handleCORS(NextResponse.json({ ok: true }))
    }

    // DELETE /messages/:id
    if (path[0] === 'messages' && path[1] && path.length === 2 && method === 'DELETE') {
      const auth = getAuthUser(request)
      if (!auth) return handleCORS(NextResponse.json({ error: 'Non authentifié' }, { status: 401 }))
      const id = path[1]
      await db.collection('messages').deleteOne({ id, recipient_id: auth.id })
      await db.collection('reactions').deleteMany({ message_id: id })
      return handleCORS(NextResponse.json({ ok: true }))
    }

    // GET /messages/public/:username  (public replied thread)
    if (path[0] === 'messages' && path[1] === 'public' && path[2] && method === 'GET') {
      const username = path[2].toLowerCase()
      const user = await db.collection('users').findOne({ username })
      if (!user) return handleCORS(NextResponse.json({ messages: [] }))
      // remove expired
      await db.collection('messages').deleteMany({ recipient_id: user.id, expires_at: { $lt: new Date() } })
      const msgs = await db.collection('messages')
        .find({ recipient_id: user.id, is_replied: true })
        .sort({ replied_at: -1, created_at: -1 })
        .limit(50)
        .toArray()
      const ids = msgs.map(m => m.id)
      const reacts = await db.collection('reactions').find({ message_id: { $in: ids } }).toArray()
      const byMsg = {}
      for (const r of reacts) {
        byMsg[r.message_id] = byMsg[r.message_id] || {}
        byMsg[r.message_id][r.emoji] = (byMsg[r.message_id][r.emoji] || 0) + 1
      }
      const sessionId = request.headers.get('x-anon-session') || ''
      const mine = sessionId
        ? await db.collection('reactions').find({ message_id: { $in: ids }, session_id: sessionId }).toArray()
        : []
      const myMap = {}
      for (const r of mine) {
        myMap[r.message_id] = myMap[r.message_id] || {}
        myMap[r.message_id][r.emoji] = true
      }
      const out = msgs.map(m => ({
        id: m.id,
        content: m.content,
        mood_tag: m.mood_tag,
        reply: m.reply,
        replied_at: m.replied_at,
        created_at: m.created_at,
        metadata: { label: m.metadata?.label || '' },
        reactions: byMsg[m.id] || {},
        my_reactions: myMap[m.id] || {},
      }))
      return handleCORS(NextResponse.json({ messages: out }))
    }

    // POST /messages/:id/react  { emoji, session_id }
    if (path[0] === 'messages' && path[1] && path[2] === 'react' && method === 'POST') {
      const id = path[1]
      const body = await request.json()
      const emoji = body.emoji
      const session_id = request.headers.get('x-anon-session') || body.session_id
      const allowed = ['🔥','😭','💀','🫶','😳']
      if (!allowed.includes(emoji) || !session_id) {
        return handleCORS(NextResponse.json({ error: 'Invalide' }, { status: 400 }))
      }
      const msg = await db.collection('messages').findOne({ id })
      if (!msg || !msg.is_replied) return handleCORS(NextResponse.json({ error: 'Introuvable' }, { status: 404 }))
      // toggle
      const existing = await db.collection('reactions').findOne({ message_id: id, session_id, emoji })
      if (existing) {
        await db.collection('reactions').deleteOne({ _id: existing._id })
      } else {
        await db.collection('reactions').insertOne({
          id: uuidv4(),
          message_id: id,
          session_id,
          emoji,
          created_at: new Date(),
        })
      }
      const all = await db.collection('reactions').find({ message_id: id }).toArray()
      const counts = {}
      for (const r of all) counts[r.emoji] = (counts[r.emoji] || 0) + 1
      return handleCORS(NextResponse.json({ ok: true, reactions: counts, toggled: !existing }))
    }

    // GET /discover  (public, top profiles)
    if (route === '/discover' && method === 'GET') {
      const url = new URL(request.url)
      const limit = Math.min(parseInt(url.searchParams.get('limit') || '24', 10), 50)
      const users = await db.collection('users')
        .find({ message_count: { $gt: 0 } })
        .project({ _id: 0, password_hash: 0, email: 0 })
        .sort({ message_count: -1, created_at: -1 })
        .limit(limit)
        .toArray()
      // also fetch a few "newcomers" if not enough
      let trending = users
      if (users.length < limit) {
        const fillIds = users.map(u => u.id)
        const newcomers = await db.collection('users')
          .find({ id: { $nin: fillIds } })
          .project({ _id: 0, password_hash: 0, email: 0 })
          .sort({ created_at: -1 })
          .limit(limit - users.length)
          .toArray()
        trending = [...users, ...newcomers]
      }
      return handleCORS(NextResponse.json({ users: trending }))
    }

    // Health
    if ((route === '/' || route === '/root') && method === 'GET') {
      return handleCORS(NextResponse.json({ message: 'Zai API ok' }))
    }

    return handleCORS(NextResponse.json({ error: `Route ${route} not found` }, { status: 404 }))
  } catch (error) {
    console.error('API Error:', error)
    return handleCORS(NextResponse.json({ error: 'Internal server error', details: String(error?.message || error) }, { status: 500 }))
  }
}

export const GET = handleRoute
export const POST = handleRoute
export const PUT = handleRoute
export const DELETE = handleRoute
export const PATCH = handleRoute
