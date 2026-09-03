class AuthManager {
    constructor() {
        this.user = null;
        this.token = null;
        this.isAuthenticated = false;
        this.onAuthChange = null;
        
        this.checkAuth();
    }

    async register(username, email, password) {
        try {
            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, email, password })
            });
            
            const data = await response.json();
            if (response.ok) {
                this.user = data.user;
                this.token = data.token;
                this.isAuthenticated = true;
                localStorage.setItem('token', data.token);
                if (this.onAuthChange) this.onAuthChange(this.user);
                return { success: true, user: data.user };
            } else {
                return { success: false, error: data.error };
            }
        } catch (error) {
            return { success: false, error: 'Network error' };
        }
    }

    async login(username, password) {
        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });
            
            const data = await response.json();
            if (response.ok) {
                this.user = data.user;
                this.token = data.token;
                this.isAuthenticated = true;
                localStorage.setItem('token', data.token);
                if (this.onAuthChange) this.onAuthChange(this.user);
                return { success: true, user: data.user };
            } else {
                return { success: false, error: data.error };
            }
        } catch (error) {
            return { success: false, error: 'Network error' };
        }
    }

    async logout() {
        try {
            await fetch('/api/auth/logout', { method: 'POST' });
        } catch (error) {
            console.error('Logout error:', error);
        }
        
        this.user = null;
        this.token = null;
        this.isAuthenticated = false;
        localStorage.removeItem('token');
        if (this.onAuthChange) this.onAuthChange(null);
    }

    async checkAuth() {
        const token = localStorage.getItem('token');
        if (!token) return;
        
        try {
            const response = await fetch('/api/auth/me', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (response.ok) {
                const data = await response.json();
                this.user = data.user;
                this.token = token;
                this.isAuthenticated = true;
                if (this.onAuthChange) this.onAuthChange(this.user);
            } else {
                localStorage.removeItem('token');
            }
        } catch (error) {
            console.error('Auth check error:', error);
        }
    }

    async saveGameResult(score, survivalTime, difficulty, deaths) {
        if (!this.isAuthenticated) {
            return { success: false, error: 'Not authenticated' };
        }
        
        try {
            const response = await fetch('/api/leaderboard/save', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.token}`
                },
                body: JSON.stringify({ score, survivalTime, difficulty, deaths })
            });
            
            const data = await response.json();
            return { success: response.ok, data };
        } catch (error) {
            return { success: false, error: 'Network error' };
        }
    }
}

export default AuthManager;