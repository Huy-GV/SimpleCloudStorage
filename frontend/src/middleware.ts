import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { JWT_COOKIE_KEY } from './data/constants'

export function middleware(request: NextRequest) {
    if (request.nextUrl.pathname.startsWith("/auth/sign-out")) {
        request.cookies.delete(JWT_COOKIE_KEY);
        return NextResponse.redirect(new URL('/auth/sign-in', request.url));
    }

    const token = request.cookies.get(JWT_COOKIE_KEY)?.value
    if (!token && !request.nextUrl.pathname.startsWith("/auth")) {
        return NextResponse.redirect(new URL('/auth/sign-in', request.url));
    }

    return NextResponse.next()
}

export const config = {
    matcher: ['/((?!api|_next/static|_next/image|.*\\.png$).*)'],
}
