import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const activeRole = request.cookies.get('active_role')?.value
  const userEmail  = request.cookies.get('user_email')?.value

  // Protect admin routes
  if (pathname.startsWith('/admin')) {
    if (!userEmail || activeRole !== 'admin') {
      return NextResponse.redirect(new URL('/auth/admin', request.url))
    }
  }

  // Protect student dashboard
  if (pathname.startsWith('/dashboard')) {
    if (!userEmail) {
      return NextResponse.redirect(new URL('/auth/login', request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*', '/dashboard/:path*'],
}