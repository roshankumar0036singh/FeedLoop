// api.js - Fixed API Management for CampusFeedback+ 2.0

class APIManager {
    constructor() {
        this.baseURL = CONFIG.API.BASE_URL;
        this.token = this.getToken();
        this.developmentMode = CONFIG.API.DEVELOPMENT_MODE;
        
        if (this.developmentMode) {
            console.log('📡 API Manager running in development mode with mock data');
        } else {
            this.setupAxiosDefaults();
        }
    }

    setupAxiosDefaults() {
        // Set base URL
        axios.defaults.baseURL = this.baseURL;
        
        // Set common headers
        axios.defaults.headers.common['Content-Type'] = 'application/json';
        
        // Add auth token if available
        if (this.token) {
            axios.defaults.headers.common['Authorization'] = `Bearer ${this.token}`;
        }

        // Request interceptor
        axios.interceptors.request.use(
            (config) => {
                // Add timestamp to prevent caching
                config.params = {
                    ...config.params,
                    _t: Date.now()
                };
                return config;
            },
            (error) => {
                return Promise.reject(error);
            }
        );

        // Response interceptor
        axios.interceptors.response.use(
            (response) => {
                return response;
            },
            (error) => {
                // Handle common errors
                if (error.response?.status === 401) {
                    this.handleUnauthorized();
                } else if (error.response?.status === 429) {
                    showNotification('Too many requests. Please wait a moment.', 'warning');
                } else if (error.response?.status >= 500) {
                    showNotification('Server error. Please try again later.', 'error');
                }
                
                return Promise.reject(error);
            }
        );
    }

    getToken() {
        return UTILS.storage.get('auth_token');
    }

    setToken(token) {
        UTILS.storage.set('auth_token', token);
        this.token = token;
        if (!this.developmentMode) {
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        }
    }

    removeToken() {
        UTILS.storage.remove('auth_token');
        this.token = null;
        if (!this.developmentMode) {
            delete axios.defaults.headers.common['Authorization'];
        }
    }

    handleUnauthorized() {
        this.removeToken();
        showNotification('Session expired. Please login again.', 'warning');
        // Redirect to login or show login modal
        this.showLoginModal();
    }

    showLoginModal() {
        // This could trigger a login modal or redirect
        console.log('User needs to login');
    }

    // Generic API methods (will use mock data in development mode)
    async get(endpoint, params = {}) {
        if (this.developmentMode) {
            return await MOCK_API.get(endpoint, params);
        }
        
        try {
            const response = await axios.get(endpoint, { params });
            return response.data;
        } catch (error) {
            console.error('GET request failed:', error);
            throw error;
        }
    }

    async post(endpoint, data = {}) {
        if (this.developmentMode) {
            return await MOCK_API.post(endpoint, data);
        }
        
        try {
            const response = await axios.post(endpoint, data);
            return response.data;
        } catch (error) {
            console.error('POST request failed:', error);
            throw error;
        }
    }

    async put(endpoint, data = {}) {
        if (this.developmentMode) {
            return await MOCK_API.put(endpoint, data);
        }
        
        try {
            const response = await axios.put(endpoint, data);
            return response.data;
        } catch (error) {
            console.error('PUT request failed:', error);
            throw error;
        }
    }

    async delete(endpoint) {
        if (this.developmentMode) {
            return await MOCK_API.delete(endpoint);
        }
        
        try {
            const response = await axios.delete(endpoint);
            return response.data;
        } catch (error) {
            console.error('DELETE request failed:', error);
            throw error;
        }
    }

    async upload(endpoint, formData, onProgress = null) {
        if (this.developmentMode) {
            return await MOCK_API.upload(endpoint, formData, onProgress);
        }
        
        try {
            const response = await axios.post(endpoint, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                },
                onUploadProgress: (progressEvent) => {
                    if (onProgress) {
                        const percentCompleted = Math.round(
                            (progressEvent.loaded * 100) / progressEvent.total
                        );
                        onProgress(percentCompleted);
                    }
                }
            });
            return response.data;
        } catch (error) {
            console.error('Upload failed:', error);
            throw error;
        }
    }

    // Authentication methods
    async login(email, password) {
        const data = { email, password };
        const response = await this.post(CONFIG.API.ENDPOINTS.AUTH.LOGIN, data);
        
        if (response.success && response.data.token) {
            this.setToken(response.data.token);
            UTILS.storage.set('user', response.data.user);
        }
        
        return response;
    }

    async register(userData) {
        const response = await this.post(CONFIG.API.ENDPOINTS.AUTH.REGISTER, userData);
        
        if (response.success && response.data.token) {
            this.setToken(response.data.token);
            UTILS.storage.set('user', response.data.user);
        }
        
        return response;
    }

    async logout() {
        try {
            if (!this.developmentMode) {
                await this.post(CONFIG.API.ENDPOINTS.AUTH.LOGOUT);
            }
        } catch (error) {
            console.error('Logout request failed:', error);
        } finally {
            this.removeToken();
            UTILS.storage.remove('user');
        }
    }

    async getProfile() {
        return await this.get(CONFIG.API.ENDPOINTS.AUTH.PROFILE);
    }

    // Feedback methods
    async createFeedback(feedbackData) {
        return await this.post(CONFIG.API.ENDPOINTS.FEEDBACK.CREATE, feedbackData);
    }

    async getFeedbacks(params = {}) {
        return await this.get(CONFIG.API.ENDPOINTS.FEEDBACK.LIST, params);
    }

    async updateFeedback(id, feedbackData) {
        return await this.put(`${CONFIG.API.ENDPOINTS.FEEDBACK.UPDATE}/${id}`, feedbackData);
    }

    async deleteFeedback(id) {
        return await this.delete(`${CONFIG.API.ENDPOINTS.FEEDBACK.DELETE}/${id}`);
    }

    async moderateFeedback(feedbackData) {
        return await this.post(CONFIG.API.ENDPOINTS.FEEDBACK.MODERATE, feedbackData);
    }

    // Report methods
    async createReport(reportData, files = null) {
        if (files && files.length > 0) {
            const formData = new FormData();
            
            // Add text data
            Object.keys(reportData).forEach(key => {
                formData.append(key, reportData[key]);
            });
            
            // Add files
            Array.from(files).forEach((file, index) => {
                formData.append(`images`, file);
            });
            
            return await this.upload(CONFIG.API.ENDPOINTS.REPORTS.CREATE, formData);
        } else {
            return await this.post(CONFIG.API.ENDPOINTS.REPORTS.CREATE, reportData);
        }
    }

    async getReports(params = {}) {
        return await this.get(CONFIG.API.ENDPOINTS.REPORTS.LIST, params);
    }

    async updateReport(id, reportData) {
        return await this.put(`${CONFIG.API.ENDPOINTS.REPORTS.UPDATE}/${id}`, reportData);
    }

    // AI methods
    async moderateText(text) {
        return await this.post(CONFIG.API.ENDPOINTS.AI.MODERATE, { text });
    }

    async analyzeSentiment(text) {
        return await this.post(CONFIG.API.ENDPOINTS.AI.SENTIMENT, { text });
    }

    async classifyText(text) {
        return await this.post(CONFIG.API.ENDPOINTS.AI.CLASSIFY, { text });
    }

    // Gamification methods
    async getLeaderboard(period = 'all') {
        return await this.get(CONFIG.API.ENDPOINTS.GAMIFICATION.LEADERBOARD, { period });
    }

    async getAchievements() {
        return await this.get(CONFIG.API.ENDPOINTS.GAMIFICATION.ACHIEVEMENTS);
    }

    async getUserPoints() {
        return await this.get(CONFIG.API.ENDPOINTS.GAMIFICATION.POINTS);
    }

    // Blockchain methods
    async transferReward(recipientAddress, amount, txHash) {
        return await this.post(CONFIG.API.ENDPOINTS.BLOCKCHAIN.TRANSFER, {
            recipient: recipientAddress,
            amount,
            transaction_hash: txHash
        });
    }

    async getBalance(address) {
        return await this.get(CONFIG.API.ENDPOINTS.BLOCKCHAIN.BALANCE, { address });
    }
}

// Initialize API Manager
const api = new APIManager();

// Enhanced Mock data for development
const MOCK_DATA = {
    user: {
        id: '1',
        name: 'John Doe',
        email: 'john@example.com',
        points: 150.450,
        level: 2,
        achievements: ['first-feedback', 'helpful-contributor'],
        feedbackCount: 12,
        reportCount: 5
    },
    feedbacks: [
        {
            id: '1',
            title: 'Excellent Computer Science Course',
            content: 'This course was very informative and well-structured. The professor explained complex concepts clearly.',
            category: 'academic',
            author: 'Anonymous',
            rating: 5,
            timestamp: Date.now() - 86400000,
            sentiment: 'positive',
            status: 'approved'
        },
        {
            id: '2',
            title: 'Cafeteria Food Quality Needs Improvement',
            content: 'The food quality in the main cafeteria could be improved. More healthy options would be appreciated.',
            category: 'food',
            author: 'Jane Smith',
            rating: 3,
            timestamp: Date.now() - 172800000,
            sentiment: 'neutral',
            status: 'approved'
        },
        {
            id: '3',
            title: 'Great Library Facilities',
            content: 'The new library wing has excellent study spaces and the staff is very helpful.',
            category: 'infrastructure',
            author: 'Mike Johnson',
            rating: 5,
            timestamp: Date.now() - 259200000,
            sentiment: 'positive',
            status: 'approved'
        }
    ],
    reports: [
        {
            id: '1',
            title: 'Broken Light in Library Reading Section',
            description: 'The main overhead light in the reading section is flickering constantly and needs replacement.',
            location: 'Main Library, Reading Section A',
            type: 'maintenance',
            urgency: 'medium',
            author: 'Mike Johnson',
            timestamp: Date.now() - 43200000,
            status: 'pending',
            images: []
        },
        {
            id: '2',
            title: 'Parking Lot Pothole',
            description: 'Large pothole in the student parking lot that could damage vehicles.',
            location: 'Student Parking Lot, Section B',
            type: 'maintenance',
            urgency: 'high',
            author: 'Sarah Wilson',
            timestamp: Date.now() - 86400000,
            status: 'in_progress',
            images: []
        }
    ],
    leaderboard: [
        { id: '1', name: 'Alice Smith', points: 500.123, level: 5, rank: 1 },
        { id: '2', name: 'Bob Johnson', points: 350.456, level: 3, rank: 2 },
        { id: '3', name: 'Carol Davis', points: 200.789, level: 2, rank: 3 },
        { id: '4', name: 'David Wilson', points: 175.234, level: 2, rank: 4 },
        { id: '5', name: 'Eva Brown', points: 150.567, level: 1, rank: 5 }
    ],
    achievements: [
        {
            id: 'first-feedback',
            title: 'First Feedback',
            description: 'Submitted your first feedback',
            icon: '🎉',
            earned: true,
            points: 10
        },
        {
            id: 'helpful-contributor',
            title: 'Helpful Contributor',
            description: 'Received 5 helpful votes',
            icon: '⭐',
            earned: true,
            points: 25
        },
        {
            id: 'voice-user',
            title: 'Voice User',
            description: 'Used voice input for feedback',
            icon: '🎤',
            earned: false,
            points: 15
        },
        {
            id: 'super-reporter',
            title: 'Super Reporter',
            description: 'Submit 10 reports',
            icon: '🚀',
            earned: false,
            points: 50
        },
        {
            id: 'blockchain-pioneer',
            title: 'Blockchain Pioneer',
            description: 'Connected wallet and received SHM rewards',
            icon: '⛓️',
            earned: false,
            points: 100
        }
    ]
};

// Enhanced Mock API responses for development
const MOCK_API = {
    async get(endpoint, params) {
        console.log('🔄 Mock GET:', endpoint, params);
        
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, Math.random() * 1000 + 300));
        
        if (endpoint.includes('feedback')) {
            return { success: true, data: { feedbacks: MOCK_DATA.feedbacks, total: MOCK_DATA.feedbacks.length } };
        } else if (endpoint.includes('reports')) {
            return { success: true, data: { reports: MOCK_DATA.reports, total: MOCK_DATA.reports.length } };
        } else if (endpoint.includes('leaderboard')) {
            return { success: true, data: { leaderboard: MOCK_DATA.leaderboard } };
        } else if (endpoint.includes('achievements')) {
            return { success: true, data: { achievements: MOCK_DATA.achievements } };
        } else if (endpoint.includes('profile')) {
            return { success: true, data: { user: MOCK_DATA.user } };
        } else if (endpoint.includes('balance')) {
            return { success: true, data: { balance: '15.678' } };
        }
        
        return { success: true, data: {} };
    },

    async post(endpoint, data) {
        console.log('📤 Mock POST:', endpoint, data);
        
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, Math.random() * 1500 + 500));
        
        if (endpoint.includes('moderate')) {
            // Enhanced AI moderation simulation
            const text = data.text.toLowerCase();
            const badWords = ['bad', 'hate', 'stupid', 'awful', 'terrible', 'sucks', 'damn', 'crap'];
            const isFoul = badWords.some(word => text.includes(word));
            
            return {
                success: true,
                data: {
                    is_appropriate: !isFoul,
                    confidence: 0.95,
                    flags: isFoul ? ['inappropriate_language'] : [],
                    suggestions: isFoul ? [
                        'Consider using more constructive language',
                        'Focus on specific issues rather than general criticism'
                    ] : []
                }
            };
        } else if (endpoint.includes('sentiment')) {
            // Enhanced sentiment analysis simulation
            const text = data.text.toLowerCase();
            let sentiment = 'neutral';
            let confidence = 0.85;
            
            const positiveWords = ['great', 'good', 'excellent', 'amazing', 'wonderful', 'fantastic', 'love', 'like'];
            const negativeWords = ['bad', 'terrible', 'awful', 'hate', 'dislike', 'poor', 'worst'];
            
            const positiveCount = positiveWords.filter(word => text.includes(word)).length;
            const negativeCount = negativeWords.filter(word => text.includes(word)).length;
            
            if (positiveCount > negativeCount) {
                sentiment = 'positive';
                confidence = Math.min(0.95, 0.7 + (positiveCount * 0.1));
            } else if (negativeCount > positiveCount) {
                sentiment = 'negative';
                confidence = Math.min(0.95, 0.7 + (negativeCount * 0.1));
            }
            
            return {
                success: true,
                data: {
                    sentiment,
                    confidence,
                    scores: {
                        positive: sentiment === 'positive' ? confidence : (1 - confidence) / 2,
                        neutral: sentiment === 'neutral' ? confidence : (1 - confidence) / 2,
                        negative: sentiment === 'negative' ? confidence : (1 - confidence) / 2
                    }
                }
            };
        } else if (endpoint.includes('feedback')) {
            // Add feedback
            const newFeedback = {
                id: Date.now().toString(),
                ...data,
                author: data.isAnonymous ? 'Anonymous' : MOCK_DATA.user.name,
                timestamp: Date.now(),
                status: 'approved',
                sentiment: 'positive'
            };
            MOCK_DATA.feedbacks.unshift(newFeedback);
            
            return { success: true, data: { feedback: newFeedback }, message: 'Feedback submitted successfully!' };
        } else if (endpoint.includes('reports')) {
            // Add report
            const newReport = {
                id: Date.now().toString(),
                ...data,
                author: MOCK_DATA.user.name,
                timestamp: Date.now(),
                status: 'pending'
            };
            MOCK_DATA.reports.unshift(newReport);
            
            return { success: true, data: { report: newReport }, message: 'Report submitted successfully!' };
        } else if (endpoint.includes('login')) {
            // Simulate login
            if (data.email && data.password) {
                return {
                    success: true,
                    data: {
                        token: 'mock-jwt-token-' + Date.now(),
                        user: MOCK_DATA.user
                    },
                    message: 'Login successful!'
                };
            } else {
                throw new Error('Invalid credentials');
            }
        } else if (endpoint.includes('blockchain/transfer')) {
            // Simulate blockchain transfer
            return {
                success: true,
                data: {
                    transaction_hash: '0xdemo' + Date.now(),
                    amount: data.amount,
                    recipient: data.recipient
                },
                message: 'Demo reward transferred successfully!'
            };
        }
        
        return { success: true, data: {}, message: 'Operation completed successfully!' };
    },

    async put(endpoint, data) {
        console.log('🔄 Mock PUT:', endpoint, data);
        await new Promise(resolve => setTimeout(resolve, 800));
        return { success: true, data: {}, message: 'Update successful!' };
    },

    async delete(endpoint) {
        console.log('🗑️ Mock DELETE:', endpoint);
        await new Promise(resolve => setTimeout(resolve, 500));
        return { success: true, message: 'Deletion successful!' };
    },

    async upload(endpoint, formData, onProgress) {
        console.log('📁 Mock UPLOAD:', endpoint);
        
        // Simulate upload progress
        if (onProgress) {
            for (let i = 0; i <= 100; i += 10) {
                await new Promise(resolve => setTimeout(resolve, 100));
                onProgress(i);
            }
        }
        
        return { success: true, data: { files: ['image1.jpg', 'image2.jpg'] }, message: 'Upload successful!' };
    }
};

// Export API manager globally
window.api = api;
window.MOCK_DATA = MOCK_DATA;

console.log('📡 API Manager initialized', CONFIG.APP.DEVELOPMENT_MODE ? '(Development Mode)' : '(Production Mode)');