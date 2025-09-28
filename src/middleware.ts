import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// Define public routes that don't require authentication
const isPublicRoute = createRouteMatcher([
    "/", // landing page
    "/login(.*)",
    "/register(.*)",
    "/api/webhooks(.*)",
    "/favicon.ico",
    "/_next/image(.*)",
    "/_next/static(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
    const url = req.nextUrl.clone();
    const path = url.pathname;

    const isLoginPath = path === "/login" || path.startsWith("/login/");
    const isRegisterPath = path === "/register" || path.startsWith("/register/");
    const isAuthPage = isLoginPath || isRegisterPath;

    const { userId } = await auth();

    // If signed in and visiting an auth page, redirect to dashboard
    if (userId && isAuthPage) {
        const returnTo = url.searchParams.get("returnTo");
        url.search = ""; // clear params
        url.pathname = returnTo && returnTo.startsWith("/") ? returnTo : "/dashboard";
        return NextResponse.redirect(url);
    }

    // If not signed in and trying to access a protected route, redirect to login
    if (!userId && !isPublicRoute(req)) {
        const returnTo = encodeURIComponent(path + (url.search || ""));
        url.pathname = "/login";
        url.search = `returnTo=${returnTo}`;
        return NextResponse.redirect(url);
    }

    return NextResponse.next();
});

export const config = {
    matcher: [
        "/((?!.+\\..+|_next).*)", // all paths except files with extensions and _next assets
        "/", // root
        "/(api|trpc)(.*)", // API & tRPC
    ],
};
