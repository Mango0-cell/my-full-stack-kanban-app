import { NextRequest, NextResponse } from 'next/server';

export function proxy(req: NextRequest) {
  const token = req.cookies.get('kanban_token')?.value;
  const { pathname } = req.nextUrl;

  // Never intercept API routes — let them pass through to the rewrite proxy
  if (pathname.startsWith('/api')) {
    return NextResponse.next();
  }

  const isAuthPage = pathname.startsWith('/login') || pathname.startsWith('/register');
  const isPublicPage = pathname === '/' || isAuthPage;

  if (!token && !isPublicPage) {
    return NextResponse.redirect(new URL('/login', req.url));
  }
  if (token && isAuthPage) {
    return NextResponse.redirect(new URL('/board', req.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
