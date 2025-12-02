import React, { useState, useEffect } from 'react';
import { X, Save, Trash2 } from 'lucide-react';
import Editor from '@monaco-editor/react';
import useStore from '../store/useStore';

const DayDetail = ({ day, onClose }) => {
    const { updateDay } = useStore();
    const [status, setStatus] = useState(day.status);
    const [notes, setNotes] = useState(day.notes || '');
    const [code, setCode] = useState(day.code_snippet || '// Write your code here...');
    const [isSaving, setIsSaving] = useState(false);

    const handleSave = async () => {
        setIsSaving(true);
        await updateDay(day.id, {
            ...day,
            status,
            notes,
            code_snippet: code
        });
        setIsSaving(false);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-gray-900 w-full max-w-4xl max-h-[90vh] rounded-2xl shadow-2xl overflow-hidden flex flex-col">

                {/* Header */}
                <div className="p-6 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center bg-gray-50 dark:bg-gray-800/50">
                    <div>
                        <span className="text-sm font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">Day {day.day_number}</span>
                        <h2 className="text-2xl font-bold mt-1">{day.topic}</h2>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors">
                        <X size={24} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">

                    {/* Status Selection */}
                    <div className="flex gap-4">
                        {['Pending', 'In Progress', 'Completed'].map((s) => (
                            <button
                                key={s}
                                onClick={() => setStatus(s)}
                                className={`flex-1 py-3 rounded-xl font-medium transition-all ${status === s
                                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'
                                        : 'bg-gray-100 dark:bg-gray-800 text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700'
                                    }`}
                            >
                                {s}
                            </button>
                        ))}
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[500px]">
                        {/* Notes */}
                        <div className="flex flex-col gap-2">
                            <label className="font-semibold text-gray-700 dark:text-gray-300">Notes</label>
                            <textarea
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                className="flex-1 w-full p-4 rounded-xl bg-gray-50 dark:bg-gray-800 border-none focus:ring-2 focus:ring-blue-500 resize-none"
                                placeholder="Jot down your learnings..."
                            />
                        </div>

                        {/* Code Editor */}
                        <div className="flex flex-col gap-2">
                            <label className="font-semibold text-gray-700 dark:text-gray-300">Code Snippet</label>
                            <div className="flex-1 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700">
                                <Editor
                                    height="100%"
                                    defaultLanguage="python"
                                    theme="vs-dark"
                                    value={code}
                                    onChange={(value) => setCode(value)}
                                    options={{
                                        minimap: { enabled: false },
                                        fontSize: 14,
                                        scrollBeyondLastLine: false,
                                    }}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-gray-200 dark:border-gray-800 flex justify-end gap-3 bg-gray-50 dark:bg-gray-800/50">
                    <button
                        onClick={onClose}
                        className="px-6 py-2 rounded-lg font-medium text-gray-600 hover:bg-gray-200 dark:text-gray-300 dark:hover:bg-gray-700 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="px-6 py-2 rounded-lg font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors flex items-center gap-2 shadow-lg shadow-blue-500/30"
                    >
                        <Save size={18} />
                        {isSaving ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>

            </div>
        </div>
    );
};

export default DayDetail;
