import React, { useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { CheckCircle2, Circle, Clock, Flame } from 'lucide-react';
import useStore from '../store/useStore';
import { motion } from 'framer-motion';

const StatCard = ({ label, value, icon: Icon, color, delay }) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay }}
        className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700"
    >
        <div className="flex items-start justify-between">
            <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{label}</p>
                <h3 className="text-3xl font-bold mt-2">{value}</h3>
            </div>
            <div className={`p-3 rounded-xl ${color}`}>
                <Icon size={24} className="text-white" />
            </div>
        </div>
    </motion.div>
);

const Dashboard = () => {
    const { stats, fetchStats, roadmap, fetchRoadmap, error, clearError, loading } = useStore();
    const [isRetrying, setIsRetrying] = React.useState(false);
    const [loadingTimeout, setLoadingTimeout] = React.useState(false);

    useEffect(() => {
        const loadData = async () => {
            await fetchStats();
            if (roadmap.length === 0) await fetchRoadmap();
        };

        loadData();
    }, []);

    // Separate effect to handle timeout
    useEffect(() => {
        if (stats || error) {
            // Data loaded or error occurred, clear timeout flag
            setLoadingTimeout(false);
            return;
        }

        // Set a timeout to detect if loading is stuck
        const timeout = setTimeout(() => {
            if (!stats && !error) {
                setLoadingTimeout(true);
            }
        }, 10000); // 10 seconds timeout

        return () => clearTimeout(timeout);
    }, [stats, error]);

    const handleRetry = async () => {
        setIsRetrying(true);
        setLoadingTimeout(false);
        clearError();
        await Promise.all([fetchStats(), fetchRoadmap()]);
        setIsRetrying(false);
    };

    // Show error state with retry button
    if (error || loadingTimeout) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6">
                <div className="text-center space-y-4">
                    <div className="text-6xl">⚠️</div>
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200">
                        {loadingTimeout ? "Connection Timeout" : "Oops! Something went wrong"}
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400 max-w-md">
                        {loadingTimeout
                            ? "The server is taking too long to respond. Please check if the backend is running."
                            : error
                        }
                    </p>
                </div>
                <button
                    onClick={handleRetry}
                    disabled={isRetrying}
                    className="px-6 py-3 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white rounded-xl font-medium transition-colors flex items-center gap-2"
                >
                    {isRetrying ? (
                        <>
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            Retrying...
                        </>
                    ) : (
                        <>
                            🔄 Try Again
                        </>
                    )}
                </button>
            </div>
        );
    }

    // Show loading state
    if (!stats) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
                <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-gray-600 dark:text-gray-400 font-medium">Loading your dashboard...</p>
            </div>
        );
    }

    // Prepare data for chart (mock weekly data for now based on roadmap)
    // In a real app, this would be aggregated from actual dates
    const chartData = [
        { name: 'Mon', completed: 2 },
        { name: 'Tue', completed: 4 },
        { name: 'Wed', completed: 1 },
        { name: 'Thu', completed: 3 },
        { name: 'Fri', completed: 5 },
        { name: 'Sat', completed: 2 },
        { name: 'Sun', completed: 0 },
    ];

    return (
        <div className="space-y-8">
            <div>
                <h2 className="text-3xl font-bold">Welcome back! 👋</h2>
                <p className="text-gray-500 dark:text-gray-400 mt-2">Here's your learning progress overview.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    label="Total Days"
                    value={stats.total_days}
                    icon={Circle}
                    color="bg-blue-500"
                    delay={0}
                />
                <StatCard
                    label="Completed"
                    value={stats.completed_days}
                    icon={CheckCircle2}
                    color="bg-green-500"
                    delay={0.1}
                />
                <StatCard
                    label="In Progress"
                    value={stats.in_progress_days}
                    icon={Clock}
                    color="bg-orange-500"
                    delay={0.2}
                />
                <StatCard
                    label="Current Streak"
                    value={`${stats.streak} Days`}
                    icon={Flame}
                    color="bg-red-500"
                    delay={0.3}
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="lg:col-span-2 bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700"
                >
                    <h3 className="text-lg font-bold mb-6">Weekly Activity</h3>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#374151" opacity={0.1} />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                                <YAxis axisLine={false} tickLine={false} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px', color: '#fff' }}
                                    cursor={{ fill: 'transparent' }}
                                />
                                <Bar dataKey="completed" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700"
                >
                    <h3 className="text-lg font-bold mb-6">Reminders</h3>
                    <div className="space-y-4">
                        <div className="p-4 rounded-xl bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-100 dark:border-yellow-900/50">
                            <div className="flex gap-3">
                                <div className="mt-1">⚠️</div>
                                <div>
                                    <h4 className="font-medium text-yellow-800 dark:text-yellow-200">Weekly Review</h4>
                                    <p className="text-sm text-yellow-600 dark:text-yellow-400 mt-1">Don't forget to review your notes this Sunday!</p>
                                </div>
                            </div>
                        </div>
                        <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-900/50">
                            <div className="flex gap-3">
                                <div className="mt-1">👔</div>
                                <div>
                                    <h4 className="font-medium text-blue-800 dark:text-blue-200">Update LinkedIn</h4>
                                    <p className="text-sm text-blue-600 dark:text-blue-400 mt-1">Share your progress for the week.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default Dashboard;
