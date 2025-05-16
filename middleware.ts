import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('token')?.value;
  const pathname = request.nextUrl.pathname;

  // Public paths that don't require authentication
  const publicPaths = ['/', '/signin', '/signup', '/verify-email'];
  const isPublicPath = publicPaths.includes(pathname);
  
  // Onboarding paths
  const isOnboardingPath = pathname.startsWith('/onboarding');
  
  // Merchant paths
  const isMerchantPath = pathname.startsWith('/merchant');

  // If no token and trying to access protected route
  if (!token && !isPublicPath && !isOnboardingPath) {
    return NextResponse.redirect(new URL('/signup', request.url));
  }

  // If has token and trying to access public auth pages (signin/signup)
  if (token && (pathname === '/signin' || pathname === '/signup')) {
    // We need to check user status, but since middleware can't make async calls easily,
    // we'll let the pages handle the redirect based on onboarding status
    return NextResponse.next();
  }

  // If has token and trying to access merchant area
  if (token && isMerchantPath) {
    // Let the merchant pages handle onboarding checks
    return NextResponse.next();
  }

  // If has token and trying to access onboarding
  if (token && isOnboardingPath) {
    // Let the onboarding pages handle completion checks
    return NextResponse.next();
  }

  // Allow requests to continue
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - assets (static assets)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|assets).*)',
  ],
};