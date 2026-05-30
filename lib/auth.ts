import { getServerSession } from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import { query } from './db'

export const authOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  callbacks: {
    async signIn({ user }: { user: { email?: string | null; name?: string | null; image?: string | null } }) {
      await query(`
        INSERT INTO users (email, name, avatar)
        VALUES ($1, $2, $3)
        ON CONFLICT (email) DO UPDATE SET name = $2, avatar = $3, last_login = NOW()
      `, [user.email, user.name, user.image])
      return true
    },
    async session({ session }: { session: { user?: { email?: string | null } } }) {
      if (session?.user?.email) {
        const result = await query('SELECT id FROM users WHERE email = $1', [session.user.email])
        if (result.rows[0]) {
          (session.user as { id?: string }).id = result.rows[0].id
        }
      }
      return session
    },
  },
  pages: { signIn: '/login' },
}

export async function getUserId(): Promise<string | null> {
  const session = await getServerSession(authOptions)
  const email = session?.user?.email
  if (!email) return null
  const result = await query('SELECT id FROM users WHERE email = $1', [email])
  return result.rows[0]?.id ?? null
}
