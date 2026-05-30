export { default } from 'next-auth/middleware'

export const config = {
  matcher: ['/((?!login|api/auth|_next/static|_next/image|favicon|icon|apple-touch|manifest|sw.js).*)'],
}
