import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;

  // 0. Skip if it's an internal rewrite to avoid loops
  if (searchParams.get('internal')) {
    return NextResponse.next();
  }

  const token = request.cookies.get('firebase-auth-token')?.value;
  const role = request.cookies.get('user-role')?.value || 'participant'; // Default to participant

  const roleBasePathMap: Record<string, string> = {
    'organiser': 'organiser',
    'participant': 'participants',
    'sponsor': 'sponsors',
    'mentor': 'mentors',
  };
  const userBasePath = roleBasePathMap[role] || 'participants';
  const userId = request.cookies.get('user-id')?.value;
  const pathPrefix = userId || userBasePath; // Fallback if user-id cookie is somehow missing

  const isAuthRoute = pathname.startsWith('/login');
  // Consider routes protected if they fall under the old structure, new structure, or just root pages
  const isProtectedRoute = 
    pathname.startsWith('/profile') || 
    pathname.startsWith('/programmes') || 
    pathname.startsWith('/recommendations') || 
    pathname.startsWith('/graph') || 
    pathname.startsWith('/settings') ||
    pathname.startsWith('/organiser') ||
    pathname.startsWith('/participants') ||
    pathname.startsWith('/sponsors') ||
    pathname.startsWith('/mentors');

  // 1. If accessing auth routes (like /login) but already logged in -> redirect to their dashboard or programmes
  if (isAuthRoute && token) {
    return NextResponse.redirect(new URL(`/${pathPrefix}/profile`, request.url));
  }

  // 2. If accessing protected routes but NOT logged in -> redirect to /login
  if (isProtectedRoute && !token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // 3. Prevent accessing invalid pages and enforce <user_id>/page_name
  if (token) {
    const allBasePaths = Object.values(roleBasePathMap);
    const pathParts = pathname.split('/').filter(Boolean);
    const firstSegment = pathParts[0];

    if (firstSegment) {
      // 3A. If they access the raw audience path (e.g., /participants/programmes), force redirect to /<user_id>/programmes
      if (allBasePaths.includes(firstSegment)) {
        const remainingPath = pathParts.slice(1).join('/');
        return NextResponse.redirect(new URL(`/${pathPrefix}/${remainingPath || 'profile'}`, request.url));
      }

      // 3B. If they access a path starting with their userId, REWRITE it internally to the actual Next.js route
      if (userId && firstSegment === userId) {
        const remainingPath = pathParts.slice(1).join('/') || 'profile';
        const sharedRoutes = ['profile', 'recommendations', 'settings'];
        const firstRemainingSegment = remainingPath.split('/')[0];

        // Add internal=true to the internal URL to skip middleware on the next run
        const internalUrl = sharedRoutes.includes(firstRemainingSegment)
          ? new URL(`/${remainingPath}`, request.url)
          : new URL(`/${userBasePath}/${remainingPath}`, request.url);
        
        internalUrl.searchParams.set('internal', 'true');
        return NextResponse.rewrite(internalUrl);
      }

      // 3C. If they try to access ANOTHER user's path (or old root dashboard/programmes), redirect to their own.
      // We can identify a potential foreign user ID if it's long and alphanumeric, but to be safe,
      // if it's an old protected route at the root level, we redirect.
      const legacyProtectedRoots = ['profile', 'programmes', 'recommendations', 'graph', 'settings'];
      if (legacyProtectedRoots.includes(firstSegment)) {
        const remainingPath = pathParts.slice(1).join('/');
        // Filter out double slashes for root paths
        const constructedPath = `/${pathPrefix}/${firstSegment}${remainingPath ? `/${remainingPath}` : ''}`;
        return NextResponse.redirect(new URL(constructedPath, request.url));
      }
      
      // If it's a foreign user ID (not their own, not a legacy root, not a public asset)
      // Assuming user IDs are typically > 10 chars. Let's strictly restrict if it doesn't match their userId.
      if (userId && firstSegment !== userId && firstSegment.length > 20) {
        return NextResponse.redirect(new URL(`/${userId}/profile`, request.url));
      }
    }
  }

  // 4. Redirect root to their specific programmes (if logged in) or login (if not)
  if (pathname === '/') {
    if (token) {
      return NextResponse.redirect(new URL(`/${pathPrefix}/profile`, request.url));
    }
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  // Apply middleware to all routes except API, Next.js static files, and images
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
