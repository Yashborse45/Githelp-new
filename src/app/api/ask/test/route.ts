import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
    return NextResponse.json({
        message: "Q&A API is working!",
        timestamp: new Date().toISOString(),
        endpoints: {
            ask: "POST /api/ask - Ask a question about a project",
            history: "GET /api/ask?projectId=xxx - Get Q&A history"
        }
    });
}