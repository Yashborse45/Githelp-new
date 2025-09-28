import { auth as clerkAuth } from "@clerk/nextjs/server";
import { NextRequest } from "next/server";

// Simple wrapper that mirrors the previous `auth()` usage. Clerk's server `auth()` returns
// an object with userId and sessionId when a user is authenticated.
export const auth = async () => {
    // clerkAuth is synchronous and reads cookies; return a small object for compatibility
    const res = clerkAuth();
    return res;
};

// Create handlers for NextAuth-style API routes
export const handlers = {
    GET: async (req: NextRequest) => {
        // Handle GET requests for auth
        return new Response("Auth GET handler", { status: 200 });
    },
    POST: async (req: NextRequest) => {
        // Handle POST requests for auth  
        return new Response("Auth POST handler", { status: 200 });
    }
};
