import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // For Phase 0-7, we implement a dev bypass.
  // In a real app, this would verify Firebase Auth tokens.
  const isDevBypassEnabled = true;

  // Protect dashboard routes
  if (pathname.startsWith('/dashboard')) {
    if (!isDevBypassEnabled) {
      // In a real app, check for token cookie
      const token = request.cookies.get('firebase-auth-token');
      if (!token) {
        return NextResponse.redirect(new URL('/login', request.url));
      }
    }
  }

  // Redirect root to login (or dashboard if already "logged in")
  if (pathname === '/') {
    if (isDevBypassEnabled) {
      // Redirect to a default dashboard for dev testing
      return NextResponse.redirect(new URL('/dashboard/organiser', request.url));
    }
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
