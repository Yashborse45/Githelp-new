/**
 * Health monitoring system for external services
 */

import { Octokit } from "octokit";
import { embedTexts } from "./gemini";
import { getPineconeClient } from "./pinecone";

// Simple health check result interface
export interface HealthCheckResult {
    healthy: boolean;
    service: string;
    latency?: number;
    error?: string;
}

export interface SystemHealthReport {
    overall: 'healthy' | 'degraded' | 'unhealthy';
    services: HealthCheckResult[];
    timestamp: string;
}

// Simple health check function
async function healthCheck(name: string, checkFn: () => Promise<void>): Promise<HealthCheckResult> {
    const start = Date.now();
    try {
        await checkFn();
        return {
            healthy: true,
            service: name,
            latency: Date.now() - start
        };
    } catch (error) {
        return {
            healthy: false,
            service: name,
            latency: Date.now() - start,
            error: error instanceof Error ? error.message : String(error)
        };
    }
}

/**
 * Check GitHub API health
 */
async function checkGitHubHealth(): Promise<void> {
    const token = process.env.GITHUB_TOKEN;
    if (!token) {
        throw new Error('GitHub token not configured');
    }

    const octokit = new Octokit({ auth: token });

    // Simple API call to check connectivity
    await octokit.rest.users.getAuthenticated();
}

/**
 * Check Pinecone health
 */
async function checkPineconeHealth(): Promise<void> {
    const client = await getPineconeClient();

    // Simple operation to check connectivity
    await client.listIndexes();
}

/**
 * Check Gemini health
 */
async function checkGeminiHealth(): Promise<void> {
    // Test with a small embedding operation
    const result = await embedTexts(['health check']);

    if (!result || result.length === 0) {
        throw new Error('Gemini embedding test failed');
    }
}

/**
 * Perform comprehensive health check of all services
 */
export async function performHealthCheck(): Promise<SystemHealthReport> {
    const checks = [
        { name: 'GitHub', checkFn: checkGitHubHealth },
        { name: 'Pinecone', checkFn: checkPineconeHealth },
        { name: 'Gemini', checkFn: checkGeminiHealth },
    ];

    const results = await Promise.all(
        checks.map(check => healthCheck(check.name, check.checkFn))
    );

    // Determine overall health
    const healthyCount = results.filter((r: HealthCheckResult) => r.healthy).length;
    let overall: 'healthy' | 'degraded' | 'unhealthy';

    if (healthyCount === results.length) {
        overall = 'healthy';
    } else if (healthyCount > 0) {
        overall = 'degraded';
    } else {
        overall = 'unhealthy';
    }

    return {
        overall,
        services: results,
        timestamp: new Date().toISOString()
    };
}

/**
 * Monitor service health continuously
 */
export class HealthMonitor {
    private monitoringInterval: NodeJS.Timeout | null = null;
    private lastHealthReport: SystemHealthReport | null = null;

    start(intervalMs = 300000): void { // 5 minutes default
        if (this.monitoringInterval) {
            console.warn('Health monitoring already started');
            return;
        }

        console.log(`Starting health monitoring with ${intervalMs}ms interval`);

        // Initial check
        this.checkHealth();

        // Periodic checks
        this.monitoringInterval = setInterval(() => {
            this.checkHealth();
        }, intervalMs);
    }

    stop(): void {
        if (this.monitoringInterval) {
            clearInterval(this.monitoringInterval);
            this.monitoringInterval = null;
            console.log('Health monitoring stopped');
        }
    }

    getLastReport(): SystemHealthReport | null {
        return this.lastHealthReport;
    }

    private async checkHealth(): Promise<void> {
        try {
            this.lastHealthReport = await performHealthCheck();

            // Log unhealthy services
            const unhealthyServices = this.lastHealthReport.services.filter(s => !s.healthy);
            if (unhealthyServices.length > 0) {
                console.warn('Unhealthy services detected:', unhealthyServices.map(s => s.service));
            }

        } catch (error) {
            console.error('Health check failed:', error);
        }
    }
}

// Global health monitor instance
export const globalHealthMonitor = new HealthMonitor();
