import ProfileClient from './profile-client'
import { MongoClient } from 'mongodb'

export async function generateMetadata({ params }) {
  const username = (params?.username || '').toLowerCase()
  let user = null
  try {
    if (process.env.MONGO_URL) {
      const c = new MongoClient(process.env.MONGO_URL)
      await c.connect()
      const db = c.db(process.env.DB_NAME || 'zai_db')
      user = await db.collection('users').findOne({ username })
      await c.close()
    }
  } catch (e) {}
  const title = user ? `@${user.username} · Zai` : `@${username} · Zai`
  const description = user
    ? `${user.message_count} messages reçus · Envoie-moi un message anonyme sur Zai.`
    : 'Envoie-moi un message anonyme sur Zai.'
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'profile',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
  }
}

export default function ProfilePage(props) {
  return <ProfileClient />
}
