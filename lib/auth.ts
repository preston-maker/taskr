import { NextAuthOptions } from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import { query } from './db'

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  callbacks: {
    async signIn({ user }) {
      if (!user.email) return false
      await query(`
        INSERT INTO users (email, name, avatar)
        VALUES ($1, $2, $3)
        ON CONFLICT (email) DO UPDATE SET name = $2, avatar = $3, last_login = NOW()
      `, [user.email, user.name ?? null, user.image ?? null])
      return true
    },
    async session({ session, token }) {
      if (session?.user?.email) {
        const result = await query('SELECT id FROM users WHERE email = $1', [session.user.email])
        if (result.rows[0]) {
          (session.user as { id?: string; email?: string | null; name?: string | null; image?: string | null }).id = result.rows[0].id
        }
      }
      return session
    },
  },
  pages: { signIn: '/login' },
}

export async function getUserId(): Promise<string | null> {
  const { getServerSession } = await import('next-auth')
  const session = await getServerSession(authOptions)
  const email = session?.user?.email
  if (!email) return null
  const result = await query('SELECT id FROM users WHERE email = $1', [email])
  return result.rows[0]?.id ?? null
}
