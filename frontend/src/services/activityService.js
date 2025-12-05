// Activity Tracking Service
export const activityService = {
    // Generate session ID
    getSessionId() {
        let sessionId = sessionStorage.getItem('session_id');
        if (!sessionId) {
            sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            sessionStorage.setItem('session_id', sessionId);
        }
        return sessionId;
    },

    // Get device/browser metadata
    getMetadata() {
        return JSON.stringify({
            userAgent: navigator.userAgent,
            language: navigator.language,
            screenResolution: `${window.screen.width}x${window.screen.height}`,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            timestamp: new Date().toISOString()
        });
    },

    // Log activity
    async logActivity(userId, activityType, additionalData = {}) {
        try {
            const metadata = {
                ...JSON.parse(this.getMetadata()),
                ...additionalData
            };

            const response = await fetch(`http://localhost:8000/api/activity?user_id=${userId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    activity_type: activityType,
                    session_id: this.getSessionId(),
                    meta_info: JSON.stringify(metadata)
                })
            });

            if (!response.ok) {
                console.error('Failed to log activity:', response.statusText);
            }

            return await response.json();
        } catch (error) {
            console.error('Activity logging error:', error);
        }
    },

    // Get user activities
    async getUserActivities(userId, limit = 50, activityType = null) {
        try {
            let url = `http://localhost:8000/api/activity/${userId}?limit=${limit}`;
            if (activityType) {
                url += `&activity_type=${activityType}`;
            }

            const response = await fetch(url);
            return await response.json();
        } catch (error) {
            console.error('Error fetching activities:', error);
            return [];
        }
    },

    // Get activity stats
    async getActivityStats(userId) {
        try {
            const response = await fetch(`http://localhost:8000/api/activity/${userId}/stats`);
            return await response.json();
        } catch (error) {
            console.error('Error fetching activity stats:', error);
            return null;
        }
    },

    // Get active sessions
    async getActiveSessions(userId) {
        try {
            const response = await fetch(`http://localhost:8000/api/activity/${userId}/sessions`);
            return await response.json();
        } catch (error) {
            console.error('Error fetching sessions:', error);
            return null;
        }
    },

    // Track login
    async trackLogin(userId) {
        return this.logActivity(userId, 'login');
    },

    // Track logout
    async trackLogout(userId) {
        return this.logActivity(userId, 'logout');
    },

    // Track task view
    async trackTaskView(userId, taskId) {
        return this.logActivity(userId, 'task_viewed', { task_id: taskId });
    },

    // Track task update
    async trackTaskUpdate(userId, taskId, action) {
        return this.logActivity(userId, 'task_updated', { task_id: taskId, action });
    }
};
