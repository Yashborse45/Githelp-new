import { NextResponse } from "next/server";
import { performHealthCheck } from "../../../server/health-monitor";

export async function GET() {
    try {
        const healthReport = await performHealthCheck();

        return NextResponse.json(healthReport, {
            status: healthReport.overall === 'healthy' ? 200 :
                healthReport.overall === 'degraded' ? 206 : 503
        });
    } catch (error) {
        console.error('Health check failed:', error);

        return NextResponse.json({
            overall: 'unhealthy',
            services: [],
            timestamp: new Date().toISOString(),
            error: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 503 });
    }
}