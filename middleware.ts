import { betterFetch } from "@better-fetch/fetch";
import type { Session, User } from "better-auth/types";
import { NextResponse, type NextRequest } from "next/server";

type SessionData = {
    session: Session;
    user: User & { role: string }; // Role might need explicit typing if not in base User
};

export default async function authMiddleware(request: NextRequest) {
	let data: SessionData | null = null;

	console.log("Middleware: Checking request to", request.nextUrl.pathname);
	console.log("Middleware: Origin", request.nextUrl.origin);
	console.log("Middleware: Has cookies", !!request.headers.get("cookie"));

	// Get the correct origin for better-auth session check
	// When behind Cloudflare tunnel/reverse proxy, use the host header instead of nextUrl.origin
	const host = request.headers.get('host') || request.headers.get('x-forwarded-host');
	const protocol = request.headers.get('x-forwarded-proto') || (request.nextUrl.protocol === 'https:' ? 'https' : 'http');
	
	// Use Cloudflare tunnel URL from env if available and matches host, otherwise construct from headers
	let baseURL: string;
	if (process.env.CLOUDFLARE_TUNNEL_URL && host && process.env.CLOUDFLARE_TUNNEL_URL.includes(host)) {
		baseURL = process.env.CLOUDFLARE_TUNNEL_URL;
	} else if (host) {
		baseURL = `${protocol}://${host}`;
	} else {
		baseURL = request.nextUrl.origin;
	}
	
	console.log("Middleware: Using baseURL for session check:", baseURL);
	
	try {
		const response = await betterFetch<SessionData>(
			"/api/auth/get-session",
			{
				baseURL: baseURL,
				headers: {
					//get the cookie from the request
					cookie: request.headers.get("cookie") || "",
				},
			},
		);
		data = response.data;
		console.log("Middleware: Session fetch successful, has data:", !!data);
		if (data) {
			console.log("Middleware: User role:", data.user.role);
		}
	} catch (error) {
		// If fetch fails (network error, timeout, etc.), treat as no session
		// This is common on mobile devices with unstable connections
		console.error("Failed to fetch session in middleware:", error);
		data = null;
	}

	if (!data) {
		console.log("Middleware: No session data, redirecting to /");
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
			console.log("Middleware: User role", userRole, "doesn't match admin, redirecting");
            return NextResponse.redirect(new URL("/", request.url));
        }
    }

    if (request.nextUrl.pathname.startsWith("/captain")) {
        if (userRole !== "captain") {
			console.log("Middleware: User role", userRole, "doesn't match captain, redirecting");
             return NextResponse.redirect(new URL("/", request.url));
        }
    }

	console.log("Middleware: Allowing access to", request.nextUrl.pathname);
	return NextResponse.next();
}

export const config = {
	matcher: ["/captain/:path*", "/admin/:path*"],
};
