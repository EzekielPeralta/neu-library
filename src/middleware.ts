import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const activeRole = request.cookies.get('active_role')?.value
  const userEmail  = request.cookies.get('user_email')?.value

  // Protect admin routes only
  if (pathname.startsWith('/admin')) {
    if (!userEmail || activeRole !== 'admin') {
      return NextResponse.redirect(new URL('/auth/admin', request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*'],
}