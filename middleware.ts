// middleware.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const token = request.cookies.get('token')?.value
  const pathname = request.nextUrl.pathname

  // Public routes (no auth required)
  const publicPaths = ['/', '/signin', '/signup', '/verify-email']
  const isPublicPath = publicPaths.includes(pathname)

  // Onboarding routes
  const isOnboardingPath = pathname.startsWith('/onboarding')

  // Merchant (dashboard) routes
  const isMerchantPath = pathname.startsWith('/merchant')

  // 1) Unauthenticated users trying to hit any protected route
  if (!token && !isPublicPath && !isOnboardingPath) {
    // Redirect them to /signin (not /signup)
    return NextResponse.redirect(new URL('/signin', request.url))
  }

  // 2) Authenticated users trying to hit the auth pages
  if (token && (pathname === '/signin' || pathname === '/signup')) {
    // Send them straight to /merchant
    return NextResponse.redirect(new URL('/merchant', request.url))
  }

  // 3) All other cases (including /merchant & /onboarding if token exists)
  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all routes EXCEPT:
     *  - /api/*
     *  - Next.js internals (_next/static, _next/image)
     *  - favicon.ico
     *  - assets/*
     */
    '/((?!api|_next/static|_next/image|favicon.ico|assets).*)',
  ],
}
