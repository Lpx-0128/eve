import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const token = request.cookies.get('firebase-auth-token')?.value;
  const role = request.cookies.get('user-role')?.value || 'participant'; // Default to participant

  const isAuthRoute = pathname.startsWith('/login');
  const isProtectedRoute = 
    pathname.startsWith('/dashboard') || 
    pathname.startsWith('/profile') || 
    pathname.startsWith('/programmes') || 
    pathname.startsWith('/recommendations') || 
    pathname.startsWith('/graph') || 
    pathname.startsWith('/settings');

  // 1. If accessing auth routes (like /login) but already logged in -> redirect to programmes
  if (isAuthRoute && token) {
    return NextResponse.redirect(new URL('/programmes', request.url));
  }

  // 2. If accessing protected routes but NOT logged in -> redirect to /login
  if (isProtectedRoute && !token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // 3. Role-based Access Control for Dashboards (Keep for compatibility but push to /programmes if accessing root dashboard)
  if (pathname.startsWith('/dashboard') && token) {
    const validRoles = ['organiser', 'participant', 'sponsor', 'mentor'];
    const pathParts = pathname.split('/').filter(Boolean);
    const requestedRole = pathParts[1]; 

    if (requestedRole && validRoles.includes(requestedRole)) {
      if (requestedRole !== role) {
        return NextResponse.redirect(new URL(`/dashboard/${role}`, request.url));
      }
    } else if (pathname === '/dashboard' || pathname === '/dashboard/') {
      return NextResponse.redirect(new URL(`/dashboard/${role}`, request.url));
    }
  }

  // 4. Redirect root to programmes (if logged in) or login (if not)
  if (pathname === '/') {
    if (token) {
      return NextResponse.redirect(new URL('/programmes', request.url));
    }
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  // Apply middleware to all routes except API, Next.js static files, and images
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
