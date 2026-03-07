/**
 * proxy.ts (Auth Middleware)
 * 
 * Provides centralized authentication and role-based access control (RBAC).
 * This middleware intercepts requests to protected routes (/admin and /captain)
 * and verifies the user's session and role.
 */
import { auth } from "@/lib/auth";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Middleware function to enforce authentication and role restrictions.
 * 
 * Logic:
 * 1. Checks for a valid session via better-auth.
 * 2. If no session, redirects users trying to access /admin or /captain back to the landing page (/).
 * 3. If session found, verifies that users accessing /admin have the 'admin' role.
 * 4. Verifies that users accessing /captain have the 'captain' role.
 * 5. Unauthorized role access results in a redirect to the landing page.
 * 
 * @param request - The incoming Next.js request object.
 * @returns A NextResponse (redirect or next).
 */
export default async function authMiddleware(request: NextRequest) {
	console.log("Proxy: Checking request to", request.nextUrl.pathname);

	const session = await auth.api.getSession({
		headers: request.headers,
	});

	console.log("Proxy: Session check successful, has data:", !!session);

	if (!session) {
		console.log("Proxy: No session data, redirecting to /");
        // Redirect to landing if trying to access protected routes
        if (request.nextUrl.pathname.startsWith("/captain") || request.nextUrl.pathname.startsWith("/admin")) {
		    return NextResponse.redirect(new URL("/", request.url));
        }
        return NextResponse.next();
	}

    // Role checks
    const userRole = session.user.role;
    console.log("Proxy: User role:", userRole);

    if (request.nextUrl.pathname.startsWith("/admin")) {
        // Allow both admin and representante to access admin routes
        if (userRole !== "admin" && userRole !== "representante") {
			console.log("Proxy: User role", userRole, "doesn't match admin or representante, redirecting");
            return NextResponse.redirect(new URL("/", request.url));
        }

        // Block representante from restricted routes
        const isRestrictedRoute = request.nextUrl.pathname.startsWith("/admin/users") || 
                                  request.nextUrl.pathname.startsWith("/admin/add-user") ||
                                  request.nextUrl.pathname.startsWith("/admin/print");
        
        if (userRole === "representante" && isRestrictedRoute) {
            console.log("Proxy: Representante blocked from restricted admin route", request.nextUrl.pathname);
            return NextResponse.redirect(new URL("/admin", request.url));
        }
    }

    if (request.nextUrl.pathname.startsWith("/captain")) {
        if (userRole !== "captain") {
			console.log("Proxy: User role", userRole, "doesn't match captain, redirecting");
             return NextResponse.redirect(new URL("/", request.url));
        }
    }

	console.log("Proxy: Allowing access to", request.nextUrl.pathname);
	return NextResponse.next();
}

export const config = {
	matcher: ["/captain/:path*", "/admin/:path*"],
};
