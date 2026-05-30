import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

export async function middleware(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
  const isLoginPage = req.nextUrl.pathname.startsWith('/login')
  const isApi = req.nextUrl.pathname.startsWith('/api')
  const isPublic = req.nextUrl.pathname.startsWith('/_next') ||
    req.nextUrl.pathname.startsWith('/favicon') ||
    req.nextUrl.pathname.startsWith('/icon') ||
    req.nextUrl.pathname.startsWith('/apple-touch') ||
    req.nextUrl.pathname.startsWith('/manifest') ||
    req.nextUrl.pathname === '/sw.js'

  if (isPublic || isApi) return NextResponse.next()
  if (isLoginPage) {
    if (token) return NextResponse.redirect(new URL('/', req.url))
    return NextResponse.next()
  }
  if (!token) return NextResponse.redirect(new URL('/login', req.url))
  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image).*)'],
}
// Sat May 30 18:01:12 UTC 2026
