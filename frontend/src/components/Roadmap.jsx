import React, { useEffect, useState } from 'react';
import useStore from '../store/useStore';
import DayCard from './DayCard';
import DayDetail from './DayDetail';

const Roadmap = () => {
    const { roadmap, fetchRoadmap, loading, error, clearError } = useStore();
    const [selectedDay, setSelectedDay] = useState(null);
    const [filter, setFilter] = useState('all'); // all, pending, completed
    const [isRetrying, setIsRetrying] = useState(false);

    useEffect(() => {
        fetchRoadmap();
    }, []);

    const handleRetry = async () => {
        setIsRetrying(true);
        clearError();
        await fetchRoadmap();
        setIsRetrying(false);
    };

    // Show error state with retry button
    if (error) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6">
                <div className="text-center space-y-4">
                    <div className="text-6xl">⚠️</div>
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200">
                        Failed to load roadmap
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400 max-w-md">
                        {error}
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

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
                <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-gray-600 dark:text-gray-400 font-medium">Loading roadmap...</p>
            </div>
        );
    }

    // Group by month
    const months = [
        "Month 1: Python + SQL",
        "Month 2: Statistics + Power BI",
        "Month 3: Machine Learning",
        "Month 4: Deep Learning + NLP",
        "Month 5: GenAI + Streamlit + APIs",
        "Month 6: RAG + Capstone + Interview"
    ];

    const groupedRoadmap = roadmap.reduce((acc, day) => {
        const m = day.month;
        if (!acc[m]) acc[m] = [];
        acc[m].push(day);
        return acc;
    }, {});

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <h2 className="text-3xl font-bold">Your Journey</h2>
                <select
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                    className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-2"
                >
                    <option value="all">All Tasks</option>
                    <option value="Pending">Pending</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Completed">Completed</option>
                </select>
            </div>

            <div className="space-y-12">
                {months.map((monthTitle, index) => {
                    const monthNum = index + 1;
                    const days = groupedRoadmap[monthNum] || [];
                    const filteredDays = days.filter(d => filter === 'all' || d.status === filter);

                    if (filteredDays.length === 0) return null;

                    return (
                        <div key={monthNum} className="relative">
                            <div className="sticky top-0 z-10 bg-gray-50 dark:bg-gray-900 py-4 mb-4 border-b border-gray-200 dark:border-gray-800">
                                <h3 className="text-xl font-bold text-blue-600 dark:text-blue-400">{monthTitle}</h3>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                {filteredDays.map(day => (
                                    <DayCard
                                        key={day.id}
                                        day={day}
                                        onClick={() => setSelectedDay(day)}
                                    />
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>

            {selectedDay && (
                <DayDetail
                    day={selectedDay}
                    onClose={() => setSelectedDay(null)}
                />
            )}
        </div>
    );
};

export default Roadmap;
