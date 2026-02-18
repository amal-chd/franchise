import { useState, useEffect } from 'react';
import {
    LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
    XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area
} from 'recharts';

export default function AnalyticsTab() {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchAnalytics();
    }, []);

    const fetchAnalytics = async () => {
        try {
            setError(null);
            const res = await fetch('/api/admin/analytics?refresh=true');
            if (res.ok) {
                const json = await res.json();
                setData(json);
            } else {
                const errData = await res.json().catch(() => ({}));
                console.error('Analytics API Error:', errData);
                setError(errData.error || errData.message || `Error ${res.status}: Failed to fetch analytics`);
            }
        } catch (error: any) {
            console.error('Failed to fetch analytics', error);
            setError(error.message || 'Network error occurred');
        } finally {
            setLoading(false);
        }
    };

    if (loading) return (
        <div className="flex items-center justify-center p-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
    );

    if (error) return (
        <div className="p-8 text-center">
            <div className="inline-block p-4 rounded-lg bg-red-50 text-red-600 mb-4">
                <i className="fas fa-exclamation-circle text-2xl mb-2"></i>
                <p className="font-semibold">Failed to load analytics data</p>
                <p className="text-sm opacity-80 mt-1">{error}</p>
            </div>
            <button
                onClick={fetchAnalytics}
                className="block mx-auto mt-4 px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-full text-sm font-medium transition-colors"
            >
                Try Again
            </button>
        </div>
    );

    if (!data) return null;

    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

    return (
        <div className="space-y-8 p-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-slate-800">Dashboard Overview</h2>
                <button onClick={fetchAnalytics} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500">
                    <i className="fas fa-sync-alt"></i>
                </button>
            </div>

            {/* Key Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="Total Requests"
                    value={data.totalRequests}
                    icon="fa-users"
                    color="bg-blue-500"
                    trend="+12% from last month"
                />
                <StatCard
                    title="Active Franchises"
                    value={data.activeFranchises}
                    icon="fa-store"
                    color="bg-green-500"
                    trend="+5% new this week"
                />
                <StatCard
                    title="Pending Validation"
                    value={data.pendingVerification}
                    icon="fa-clock"
                    color="bg-amber-500"
                    trend="Requires attention"
                />
                <StatCard
                    title="Support Tickets"
                    value={data.pendingTickets}
                    icon="fa-headset"
                    color="bg-purple-500"
                    trend={`${data.repliedTickets} replied today`}
                />
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                {/* Growth Trend */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                    <h3 className="text-lg font-bold text-slate-800 mb-6">Franchise Growth</h3>
                    <div className="h-80 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={data.trends?.requests || []}>
                                <defs>
                                    <linearGradient id="colorRequests" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8} />
                                        <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748B' }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748B' }} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#1E293B', color: '#fff', borderRadius: '8px', border: 'none' }}
                                    itemStyle={{ color: '#fff' }}
                                />
                                <Area type="monotone" dataKey="value" stroke="#3B82F6" strokeWidth={3} fillOpacity={1} fill="url(#colorRequests)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Status Distribution */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                    <h3 className="text-lg font-bold text-slate-800 mb-6">Application Status</h3>
                    <div className="h-80 w-full flex items-center justify-center">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={data.trends?.statusDistribution || []}
                                    innerRadius={80}
                                    outerRadius={120}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {(data.trends?.statusDistribution || []).map((entry: any, index: number) => (
                                        <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                                <Legend verticalAlign="bottom" height={36} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Recent Activity Mock */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <h3 className="text-lg font-bold text-slate-800 mb-4">Recent Activity</h3>
                <div className="space-y-4">
                    {[1, 2, 3].map((_, i) => (
                        <div key={i} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                            <div className="flex items-center gap-4">
                                <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                                    <i className="fas fa-user-plus"></i>
                                </div>
                                <div>
                                    <p className="font-semibold text-slate-800">New franchise application received</p>
                                    <p className="text-sm text-slate-500">2 hours ago</p>
                                </div>
                            </div>
                            <span className="text-sm font-medium text-blue-600 cursor-pointer">View</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

function StatCard({ title, value, icon, color, trend }: any) {
    return (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-4">
                <div>
                    <p className="text-sm font-medium text-slate-500 uppercase tracking-wide">{title}</p>
                    <h3 className="text-3xl font-bold text-slate-800 mt-1">{value}</h3>
                </div>
                <div className={`h-12 w-12 rounded-xl ${color} bg-opacity-10 flex items-center justify-center text-xl`}>
                    <i className={`fas ${icon} text-${color.replace('bg-', '')}`}></i>
                </div>
            </div>
            <div className="flex items-center text-sm">
                <span className="text-green-500 font-medium flex items-center gap-1">
                    {trend}
                </span>
            </div>
        </div>
    );
}
