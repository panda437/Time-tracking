import { withAuth } from "next-auth/middleware"
import { NextResponse } from "next/server"

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl
    const token = req.nextauth.token

    // If user is authenticated and trying to access auth pages, redirect to dashboard
    if (token && (pathname.startsWith('/auth/signin') || pathname.startsWith('/auth/signup'))) {
      return NextResponse.redirect(new URL('/dashboard', req.url))
    }

    // If user is not authenticated and trying to access protected pages, redirect to signin
    if (!token && (pathname.startsWith('/dashboard') || pathname.startsWith('/calendar') || pathname.startsWith('/goals') || pathname.startsWith('/analytics') || pathname.startsWith('/pomodoro') || pathname.startsWith('/reflection'))) {
      return NextResponse.redirect(new URL('/auth/signin', req.url))
    }

    // Add cache control headers for API routes to prevent stale data
    if (pathname.startsWith('/api/')) {
      const response = NextResponse.next()
      response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate')
      response.headers.set('Pragma', 'no-cache')
      response.headers.set('Expires', '0')
      return response
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: () => true, // Let the middleware function handle the logic
    },
  }
)

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/auth/signin',
    '/auth/signup',
    '/calendar/:path*',
    '/pomodoro/:path*',
    '/goals/:path*',
    '/analytics/:path*',
    '/reflection/:path*',
    '/feedback/:path*',
    '/api/:path*'
  ]
}
