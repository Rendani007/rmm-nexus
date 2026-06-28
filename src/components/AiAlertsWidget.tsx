import { useEffect, useState } from 'react';
import { BrainCircuit, AlertTriangle, TrendingUp, CalendarDays } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { api } from '@/api/axios';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { Badge } from '@/components/ui/badge';

interface AiAlert {
  item_name: string;
  message: string;
  confidence: number;
  level: string;
}

export function AiAlertsWidget() {
  const [alerts, setAlerts] = useState<AiAlert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        const res = await api.get('/inventory/ai-alerts');
        if (res.data?.data) {
          setAlerts(res.data.data);
        }
      } catch (e) {
        console.error('Failed to load AI alerts', e);
      } finally {
        setLoading(false);
      }
    };
    fetchAlerts();
  }, []);

  if (loading) {
    return (
      <Card className="col-span-full mt-6 bg-gradient-to-br from-indigo-50 to-white dark:from-slate-900 dark:to-slate-950 border-indigo-100 dark:border-indigo-900/50">
        <CardHeader>
          <div className="flex items-center gap-2">
            <BrainCircuit className="h-5 w-5 text-indigo-500 animate-pulse" />
            <CardTitle>AI Predictive Insights</CardTitle>
          </div>
          <CardDescription>Analyzing inventory patterns...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-32 flex items-center justify-center">
            <span className="text-sm text-muted-foreground animate-pulse">Running predictive models...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (alerts.length === 0) {
    return null; // Don't show if no alerts are generated
  }

  // Format data for Recharts
  const chartData = alerts.map((a, i) => ({
    name: a.item_name.substring(0, 10) + '...',
    confidence: Math.round(a.confidence * 100)
  }));

  return (
    <Card className="col-span-full mt-6 border-indigo-200 dark:border-indigo-900 shadow-sm overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-100 dark:bg-indigo-900/50 rounded-lg">
              <BrainCircuit className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <CardTitle className="text-lg font-bold">AI Predictive Insights</CardTitle>
              <CardDescription>Smart alerts powered by machine learning</CardDescription>
            </div>
          </div>
          <Badge variant="secondary" className="bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300">
            {alerts.length} Active Alerts
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-2">
          
          {/* Alerts List */}
          <div className="lg:col-span-2 space-y-3">
            {alerts.map((alert, idx) => (
              <div key={idx} className="flex items-start gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 hover:border-indigo-200 dark:hover:border-indigo-800 transition-colors">
                <div className="mt-1 p-2 bg-amber-100 dark:bg-amber-900/30 rounded-full">
                  <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">{alert.item_name}</h4>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                    {alert.message}
                  </p>
                  <div className="flex items-center gap-4 mt-3">
                    <div className="flex items-center gap-1.5 text-xs text-indigo-600 dark:text-indigo-400 font-medium bg-indigo-50 dark:bg-indigo-950/50 px-2 py-1 rounded-md">
                      <TrendingUp className="h-3.5 w-3.5" />
                      Confidence: {Math.round(alert.confidence * 100)}%
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Chart Section */}
          <div className="flex flex-col">
            <h4 className="text-sm font-semibold mb-4 text-center text-slate-600 dark:text-slate-400">Prediction Confidence</h4>
            <div className="flex-1 min-h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                  <Tooltip 
                    cursor={{ fill: 'transparent' }}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Bar dataKey="confidence" fill="#6366f1" radius={[4, 4, 0, 0]} maxBarSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>
      </CardContent>
    </Card>
  );
}
