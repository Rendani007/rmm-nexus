import { useState } from 'react';
import { SuperAdminLayout } from './SuperAdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { clearSystemCache, restartQueueWorkers } from '@/api/admin';
import { toast } from '@/hooks/use-toast';
import { RefreshCw, ServerCrash, Database, Settings } from 'lucide-react';

export const SystemHealthPage = () => {
    const [isClearingCache, setIsClearingCache] = useState(false);
    const [isRestartingQueue, setIsRestartingQueue] = useState(false);

    const handleClearCache = async () => {
        setIsClearingCache(true);
        try {
            const res = await clearSystemCache();
            toast({
                title: "Cache Cleared",
                description: res.message,
            });
        } catch (error) {
            toast({
                variant: 'destructive',
                title: 'Operation Failed',
                description: 'Failed to clear system cache.',
            });
        } finally {
            setIsClearingCache(false);
        }
    };

    const handleRestartQueue = async () => {
        setIsRestartingQueue(true);
        try {
            const res = await restartQueueWorkers();
            toast({
                title: "Workers Restarted",
                description: res.message,
            });
        } catch (error) {
            toast({
                variant: 'destructive',
                title: 'Operation Failed',
                description: 'Failed to restart queue workers.',
            });
        } finally {
            setIsRestartingQueue(false);
        }
    };

    return (
        <SuperAdminLayout>
            <div className="space-y-6">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">System Health & Maintenance</h1>
                    <p className="text-muted-foreground">
                        Global platform controls and maintenance operations.
                    </p>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Database className="w-5 h-5 text-blue-500" />
                                Application Cache
                            </CardTitle>
                            <CardDescription>
                                Clear cached views, configurations, and compiled services. 
                                Use this after deploying environment variables or if UI states seem stuck globally.
                            </CardDescription>
                        </CardHeader>
                        <CardFooter>
                            <Button variant="outline" onClick={handleClearCache} disabled={isClearingCache}>
                                {isClearingCache ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
                                Clear Cache
                            </Button>
                        </CardFooter>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Settings className="w-5 h-5 text-emerald-500" />
                                Queue Workers
                            </CardTitle>
                            <CardDescription>
                                Gracefully restart all background queue workers. 
                                Use this if background jobs (like emails or exports) are failing or hanging.
                            </CardDescription>
                        </CardHeader>
                        <CardFooter>
                            <Button variant="outline" onClick={handleRestartQueue} disabled={isRestartingQueue}>
                                {isRestartingQueue ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <ServerCrash className="mr-2 h-4 w-4" />}
                                Restart Workers
                            </Button>
                        </CardFooter>
                    </Card>
                </div>
            </div>
        </SuperAdminLayout>
    );
};
