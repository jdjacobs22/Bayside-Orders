import { betterFetch } from "@better-fetch/fetch";
import type { Session, User } from "better-auth/types";
import { NextResponse, type NextRequest } from "next/server";

type SessionData = {
    session: Session;
    user: User & { role: string }; // Role might need explicit typing if not in base User
};

export default async function authMiddleware(request: NextRequest) {
	const { data } = await betterFetch<SessionData>(
		"/api/auth/get-session",
		{
			baseURL: request.nextUrl.origin,
			headers: {
				//get the cookie from the request
				cookie: request.headers.get("cookie") || "",
			},
		},
	);

	if (!data) {
        // Redirect to landing if trying to access protected routes
        if (request.nextUrl.pathname.startsWith("/captain") || request.nextUrl.pathname.startsWith("/admin")) {
		    return NextResponse.redirect(new URL("/", request.url));
        }
        return NextResponse.next();
	}

    // Role checks
    const userRole = data.user.role;

    if (request.nextUrl.pathname.startsWith("/admin")) {
        if (userRole !== "admin") {
            return NextResponse.redirect(new URL("/", request.url));
        }
    }

    if (request.nextUrl.pathname.startsWith("/captain")) {
        if (userRole !== "captain") {
             return NextResponse.redirect(new URL("/", request.url));
        }
    }

	return NextResponse.next();
}

export const config = {
	matcher: ["/captain/:path*", "/admin/:path*"],
};
