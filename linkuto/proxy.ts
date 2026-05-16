import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const token = request.cookies.get('firebase-auth-token')?.value;
  const role = request.cookies.get('user-role')?.value || 'participant'; // Default to participant

  const isAuthRoute = pathname.startsWith('/login');
  const isDashboardRoute = pathname.startsWith('/dashboard');

  // 1. If accessing auth routes (like /login) but already logged in -> redirect to their specific dashboard
  if (isAuthRoute && token) {
    return NextResponse.redirect(new URL(`/dashboard/${role}`, request.url));
  }

  // 2. If accessing protected routes but NOT logged in -> redirect to /login
  if ((isDashboardRoute || pathname === '/profile') && !token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // 3. Role-based Access Control for Dashboards
  if (isDashboardRoute && token) {
    // Array of valid roles mapped to dashboard paths
    const validRoles = ['organiser', 'participant', 'sponsor', 'mentor'];
    
    // Check if the current path is trying to access a specific role dashboard
    const pathParts = pathname.split('/').filter(Boolean);
    const requestedRole = pathParts[1]; // /dashboard/{requestedRole}

    if (requestedRole && validRoles.includes(requestedRole)) {
      // If they are trying to access a role dashboard that is NOT their own, redirect them back to their own
      if (requestedRole !== role) {
        return NextResponse.redirect(new URL(`/dashboard/${role}`, request.url));
      }
    } else if (pathname === '/dashboard' || pathname === '/dashboard/') {
      // If they just go to /dashboard, push them to their specific role dashboard
      return NextResponse.redirect(new URL(`/dashboard/${role}`, request.url));
    }
  }

  // 4. Redirect root to dashboard (if logged in) or login (if not)
  if (pathname === '/') {
    if (token) {
      return NextResponse.redirect(new URL(`/dashboard/${role}`, request.url));
    }
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  // Apply middleware to all routes except API, Next.js static files, and images
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
