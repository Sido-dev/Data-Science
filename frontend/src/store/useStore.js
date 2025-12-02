import { create } from 'zustand'
import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || '';

// Helper function to retry API calls
const retryWithBackoff = async (fn, retries = 3, delay = 1000) => {
    try {
        return await fn();
    } catch (error) {
        if (retries === 0) throw error;

        console.log(`Retrying... (${retries} attempts left)`);
        await new Promise(resolve => setTimeout(resolve, delay));
        return retryWithBackoff(fn, retries - 1, delay * 1.5);
    }
};

const useStore = create((set, get) => ({
    roadmap: [],
    stats: null,
    loading: false,
    error: null,
    user: JSON.parse(localStorage.getItem('user')) || null,

    login: async (email) => {
        try {
            const res = await axios.post(`${API_URL}/api/login`, { email });
            const user = res.data;
            localStorage.setItem('user', JSON.stringify(user));
            set({ user });
            // Fetch data for the logged-in user
            get().fetchRoadmap();
            get().fetchStats();
        } catch (error) {
            console.error("Login failed", error);
            // Fallback for offline/demo if backend fails (optional, but good for robustness)
            // For now, we want to enforce backend usage for the "journey" feature.
            set({ error: "Login failed. Please try again." });
        }
    },

    logout: () => {
        localStorage.removeItem('user');
        set({ user: null, roadmap: [], stats: null });
    },

    fetchRoadmap: async () => {
        const { user } = get();
        if (!user) return;

        set({ loading: true, error: null });
        try {
            const res = await retryWithBackoff(() => axios.get(`${API_URL}/api/roadmap`, {
                params: { user_id: user.id }
            }));
            set({ roadmap: res.data, loading: false, error: null });
        } catch (error) {
            console.error("Failed to fetch roadmap", error);
            const errorMessage = error.response?.data?.detail || error.message || "Failed to load roadmap";
            set({ loading: false, error: errorMessage });
        }
    },

    fetchStats: async () => {
        const { user } = get();
        if (!user) return;

        set({ error: null });
        try {
            const res = await retryWithBackoff(() => axios.get(`${API_URL}/api/stats`, {
                params: { user_id: user.id }
            }));
            set({ stats: res.data, error: null });
        } catch (error) {
            console.error("Failed to fetch stats", error);
            const errorMessage = error.response?.data?.detail || error.message || "Failed to load statistics";
            set({ error: errorMessage });
        }
    },

    updateDay: async (dayId, data) => {
        try {
            const res = await retryWithBackoff(() => axios.put(`${API_URL}/api/roadmap/${dayId}`, data));
            set(state => ({
                roadmap: state.roadmap.map(d => d.id === dayId ? res.data : d)
            }));
            get().fetchStats(); // Refresh stats
        } catch (error) {
            console.error("Failed to update day", error);
            const errorMessage = error.response?.data?.detail || error.message || "Failed to update task";
            set({ error: errorMessage });
        }
    },

    clearError: () => {
        set({ error: null });
    }
}))

export default useStore
