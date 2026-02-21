
import { auth } from "@/lib/auth";
import { NextResponse, type NextRequest } from "next/server";

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
        if (userRole !== "admin") {
			console.log("Proxy: User role", userRole, "doesn't match admin, redirecting");
            return NextResponse.redirect(new URL("/", request.url));
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
