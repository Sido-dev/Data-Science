import React from 'react';
import { CheckCircle2, Circle, Clock } from 'lucide-react';

const DayCard = ({ day, onClick }) => {
    const getStatusColor = (status) => {
        switch (status) {
            case 'Completed': return 'text-green-500 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-900/50';
            case 'In Progress': return 'text-orange-500 bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-900/50';
            default: return 'text-gray-400 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700';
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'Completed': return CheckCircle2;
            case 'In Progress': return Clock;
            default: return Circle;
        }
    };

    const Icon = getStatusIcon(day.status);
    const colorClass = getStatusColor(day.status);

    return (
        <div
            onClick={onClick}
            className={`p-4 rounded-xl border cursor-pointer transition-all hover:shadow-md hover:scale-[1.02] ${colorClass} ${day.status === 'Pending' ? 'bg-white dark:bg-gray-800' : ''}`}
        >
            <div className="flex justify-between items-start mb-3">
                <span className="text-xs font-bold uppercase tracking-wider opacity-70">Day {day.day_number}</span>
                <Icon size={18} />
            </div>
            <h4 className="font-semibold text-gray-900 dark:text-gray-100 line-clamp-2">{day.topic}</h4>
            {day.is_weekend && (
                <span className="inline-block mt-2 text-[10px] font-bold px-2 py-1 rounded-full bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-300">
                    WEEKEND
                </span>
            )}
        </div>
    );
};

export default DayCard;
