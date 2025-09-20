// config.js - Fixed Configuration and Utility Functions

const CONFIG = {
    APP: {
        NAME: 'CampusFeedback+',
        VERSION: '2.0',
        DEBUG: true
    },
    
    BLOCKCHAIN: {
        ENABLED: true,
        NETWORK: {
            chainId: '0x89', // Polygon Mainnet
            chainName: 'Polygon',
            nativeCurrency: {
                name: 'MATIC',
                symbol: 'MATIC',
                decimals: 18
            },
            rpcUrls: ['https://polygon-rpc.com/', 'https://rpc.ankr.com/polygon'],
            blockExplorerUrls: ['https://polygonscan.com/']
        },
        CONTRACT: {
            SENDER_ADDRESS: '0x694B31c92E618d24D254bb10e7BF22a4a3C1151b', // Updated reward sender account
            REWARD_AMOUNT: 0.01, // 0.01 SHM per contribution
            GAS_LIMIT: 21000,
            GAS_PRICE_MULTIPLIER: 1.2 // 20% buffer for gas estimation
        },
        REWARDS: {
            FEEDBACK_AMOUNT: 0.01,
            REPORT_AMOUNT: 0.01,
            BONUS_MULTIPLIER: 1.5, // For high-quality contributions
            MAX_DAILY_REWARDS: 0.5, // Maximum SHM per user per day
            CURRENCY: 'SHM'
        }
    },
    
    AI: {
        MODERATION: {
            ENABLED: true,
            PROVIDER: 'openai',
            MAX_TOXICITY: 0.7,
            SENTIMENT_ANALYSIS: true,
            AUTO_APPROVE_THRESHOLD: 0.8
        },
        VOICE: {
            ENABLED: true,
            LANGUAGE: 'en-US',
            CONTINUOUS: true,
            INTERIM_RESULTS: true,
            MAX_ALTERNATIVES: 1,
            TIMEOUT: 30000 // 30 seconds
        },
        SUGGESTIONS: {
            ENABLED: true,
            MIN_CONTENT_LENGTH: 10,
            MAX_SUGGESTIONS: 3
        }
    },
    
    STORAGE: {
        PREFIX: 'campusfeedback_',
        VERSION: '2.0',
        ENCRYPTION: false, // Set to true for production
        SYNC_INTERVAL: 60000 // 1 minute
    },
    
    UI: {
        NOTIFICATION_DURATION: 5000,
        ANIMATION_DURATION: 300,
        LOADING_DELAY: 1000,
        MAX_NOTIFICATIONS: 5,
        THEME: 'light'
    },
    
    API: {
        BASE_URL: 'https://api.campusfeedback.com/v2',
        TIMEOUT: 10000,
        RETRY_ATTEMPTS: 3,
        CACHE_DURATION: 300000 // 5 minutes
    }
};

// Enhanced utility functions
const UTILS = {
    // Generate unique ID
    generateId: () => {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    },

    // Format date with more options
    formatDate: (timestamp, format = 'relative') => {
        const date = new Date(timestamp);
        const now = new Date();
        const diff = now.getTime() - date.getTime();
        
        if (format === 'relative') {
            if (diff < 60000) { // Less than 1 minute
                return 'Just now';
            } else if (diff < 3600000) { // Less than 1 hour
                const minutes = Math.floor(diff / 60000);
                return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
            } else if (diff < 86400000) { // Less than 1 day
                const hours = Math.floor(diff / 3600000);
                return `${hours} hour${hours > 1 ? 's' : ''} ago`;
            } else if (diff < 604800000) { // Less than 1 week
                const days = Math.floor(diff / 86400000);
                return `${days} day${days > 1 ? 's' : ''} ago`;
            } else {
                return date.toLocaleDateString();
            }
        } else if (format === 'full') {
            return date.toLocaleString();
        } else if (format === 'date') {
            return date.toLocaleDateString();
        } else if (format === 'time') {
            return date.toLocaleTimeString();
        } else {
            return date.toISOString();
        }
    },

    // Enhanced currency formatting
    formatCurrency: (amount, currency = 'SHM', decimals = 3) => {
        const num = parseFloat(amount) || 0;
        return `${num.toFixed(decimals)} ${currency}`;
    },

    // Format large numbers
    formatNumber: (num) => {
        if (num >= 1000000) {
            return (num / 1000000).toFixed(1) + 'M';
        } else if (num >= 1000) {
            return (num / 1000).toFixed(1) + 'K';
        } else {
            return num.toString();
        }
    },

    // Truncate text with smart word breaking
    truncateText: (text, maxLength = 100, useWordBreak = true) => {
        if (!text || text.length <= maxLength) return text || '';
        
        if (useWordBreak) {
            const truncated = text.substr(0, maxLength);
            const lastSpace = truncated.lastIndexOf(' ');
            if (lastSpace > maxLength * 0.7) {
                return truncated.substr(0, lastSpace) + '...';
            }
        }
        
        return text.substr(0, maxLength) + '...';
    },

    // Enhanced local storage utilities
    storage: {
        get: (key) => {
            try {
                const item = localStorage.getItem(CONFIG.STORAGE.PREFIX + key);
                if (!item) return null;
                
                const parsed = JSON.parse(item);
                // Handle new format with timestamp and version
                if (parsed && typeof parsed === 'object' && 'value' in parsed) {
                    return parsed.value;
                }
                // Handle old format
                return parsed;
            } catch (error) {
                console.error('Error reading from storage:', error);
                return null;
            }
        },

        set: (key, value) => {
            try {
                const data = {
                    value: value,
                    timestamp: Date.now(),
                    version: CONFIG.STORAGE.VERSION
                };
                localStorage.setItem(CONFIG.STORAGE.PREFIX + key, JSON.stringify(data));
                return true;
            } catch (error) {
                console.error('Error writing to storage:', error);
                return false;
            }
        },

        remove: (key) => {
            try {
                localStorage.removeItem(CONFIG.STORAGE.PREFIX + key);
                return true;
            } catch (error) {
                console.error('Error removing from storage:', error);
                return false;
            }
        },

        clear: () => {
            try {
                Object.keys(localStorage).forEach(key => {
                    if (key.startsWith(CONFIG.STORAGE.PREFIX)) {
                        localStorage.removeItem(key);
                    }
                });
                return true;
            } catch (error) {
                console.error('Error clearing storage:', error);
                return false;
            }
        },

        // Enhanced feedback storage
        getFeedbacks: () => {
            const data = UTILS.storage.get('feedbacks');
            return Array.isArray(data) ? data : [];
        },

        saveFeedback: (feedback) => {
            if (!feedback || typeof feedback !== 'object') {
                console.error('Invalid feedback data');
                return false;
            }

            const feedbacks = UTILS.storage.getFeedbacks();
            const existingIndex = feedbacks.findIndex(f => f.id === feedback.id);
            
            if (existingIndex >= 0) {
                feedbacks[existingIndex] = {
                    ...feedbacks[existingIndex],
                    ...feedback,
                    updatedAt: Date.now()
                };
            } else {
                feedbacks.unshift({
                    ...feedback,
                    createdAt: Date.now()
                });
            }
            
            return UTILS.storage.set('feedbacks', feedbacks);
        },

        deleteFeedback: (id) => {
            if (!id) return false;
            
            const feedbacks = UTILS.storage.getFeedbacks();
            const filteredFeedbacks = feedbacks.filter(f => f.id !== id);
            return UTILS.storage.set('feedbacks', filteredFeedbacks);
        },

        // Enhanced report storage
        getReports: () => {
            const data = UTILS.storage.get('reports');
            return Array.isArray(data) ? data : [];
        },

        saveReport: (report) => {
            if (!report || typeof report !== 'object') {
                console.error('Invalid report data');
                return false;
            }

            const reports = UTILS.storage.getReports();
            const existingIndex = reports.findIndex(r => r.id === report.id);
            
            if (existingIndex >= 0) {
                reports[existingIndex] = {
                    ...reports[existingIndex],
                    ...report,
                    updatedAt: Date.now()
                };
            } else {
                reports.unshift({
                    ...report,
                    createdAt: Date.now()
                });
            }
            
            return UTILS.storage.set('reports', reports);
        },

        deleteReport: (id) => {
            if (!id) return false;
            
            const reports = UTILS.storage.getReports();
            const filteredReports = reports.filter(r => r.id !== id);
            return UTILS.storage.set('reports', filteredReports);
        },

        // User statistics
        getUserStats: () => {
            const data = UTILS.storage.get('user_stats');
            return data || {
                totalFeedbacks: 0,
                totalReports: 0,
                totalRewards: 0,
                joinDate: Date.now(),
                lastActiveDate: Date.now(),
                achievements: [],
                level: 1,
                points: 0
            };
        },

        updateUserStats: (stats) => {
            if (!stats || typeof stats !== 'object') {
                console.error('Invalid user stats data');
                return false;
            }
            
            return UTILS.storage.set('user_stats', {
                ...stats,
                lastActiveDate: Date.now()
            });
        }
    },

    // Enhanced validation utilities
    validation: {
        isEmail: (email) => {
            if (!email || typeof email !== 'string') return false;
            const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            return pattern.test(email);
        },

        isPhoneNumber: (phone) => {
            if (!phone || typeof phone !== 'string') return false;
            const pattern = /^[\+]?[1-9][\d]{0,15}$/;
            return pattern.test(phone);
        },

        isURL: (url) => {
            if (!url || typeof url !== 'string') return false;
            try {
                new URL(url);
                return true;
            } catch {
                return false;
            }
        },

        sanitizeHTML: (str) => {
            if (!str || typeof str !== 'string') return '';
            const div = document.createElement('div');
            div.textContent = str;
            return div.innerHTML;
        },

        validateContentLength: (content, minLength = 10, maxLength = 2000) => {
            if (!content || typeof content !== 'string') return false;
            const length = content.trim().length;
            return length >= minLength && length <= maxLength;
        },

        hasOffensiveContent: (text) => {
            if (!text || typeof text !== 'string') return false;
            const offensiveWords = ['spam', 'scam', 'fake', 'hate', 'offensive'];
            const lowerText = text.toLowerCase();
            return offensiveWords.some(word => lowerText.includes(word));
        }
    },

    // Enhanced blockchain utilities
    blockchain: {
        formatAddress: (address) => {
            if (!address || typeof address !== 'string') return '';
            return `${address.substr(0, 6)}...${address.substr(-4)}`;
        },

        formatTxHash: (hash) => {
            if (!hash || typeof hash !== 'string') return '';
            return `${hash.substr(0, 10)}...${hash.substr(-8)}`;
        },

        isValidAddress: (address) => {
            if (!address || typeof address !== 'string') return false;
            return /^0x[a-fA-F0-9]{40}$/.test(address);
        },

        getExplorerUrl: (address, type = 'address') => {
            if (!address) return '';
            const baseUrl = CONFIG.BLOCKCHAIN.NETWORK.blockExplorerUrls[0];
            return `${baseUrl}/${type}/${address}`;
        },

        calculateGasCost: (gasUsed, gasPrice) => {
            if (!gasUsed || !gasPrice) return '0';
            return parseFloat(gasUsed * gasPrice / 1e18).toFixed(6);
        },

        formatWei: (weiAmount, unit = 'ether') => {
            if (!weiAmount) return '0';
            // Simple conversion (in real app, you'd use web3.utils.fromWei)
            const conversionRates = {
                wei: 1,
                gwei: 1e9,
                ether: 1e18
            };
            return (weiAmount / conversionRates[unit]).toFixed(6);
        }
    },

    // Enhanced performance utilities
    debounce: (func, wait, immediate = false) => {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                timeout = null;
                if (!immediate) func(...args);
            };
            const callNow = immediate && !timeout;
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
            if (callNow) func(...args);
        };
    },

    throttle: (func, limit) => {
        let inThrottle;
        return function executedFunction(...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    },

    // Cache utility
    cache: {
        data: new Map(),
        
        set: (key, value, ttl = 300000) => { // 5 minutes default
            if (!key) return false;
            UTILS.cache.data.set(key, {
                value: value,
                expiry: Date.now() + ttl
            });
            return true;
        },
        
        get: (key) => {
            if (!key) return null;
            const item = UTILS.cache.data.get(key);
            if (item && Date.now() < item.expiry) {
                return item.value;
            }
            UTILS.cache.data.delete(key);
            return null;
        },
        
        clear: () => {
            UTILS.cache.data.clear();
        },
        
        size: () => {
            return UTILS.cache.data.size;
        }
    },

    // Animation utilities
    fadeIn: (element, duration = 300) => {
        if (!element) return;
        element.style.opacity = '0';
        element.style.display = 'block';
        
        let start = null;
        const animate = (timestamp) => {
            if (!start) start = timestamp;
            const progress = timestamp - start;
            const opacity = Math.min(progress / duration, 1);
            
            element.style.opacity = opacity.toString();
            
            if (progress < duration) {
                requestAnimationFrame(animate);
            }
        };
        
        requestAnimationFrame(animate);
    },

    fadeOut: (element, duration = 300, callback = null) => {
        if (!element) return;
        let start = null;
        const animate = (timestamp) => {
            if (!start) start = timestamp;
            const progress = timestamp - start;
            const opacity = Math.max(1 - progress / duration, 0);
            
            element.style.opacity = opacity.toString();
            
            if (progress < duration) {
                requestAnimationFrame(animate);
            } else {
                element.style.display = 'none';
                if (callback && typeof callback === 'function') {
                    callback();
                }
            }
        };
        
        requestAnimationFrame(animate);
    },

    slideDown: (element, duration = 300) => {
        if (!element) return;
        element.style.height = '0px';
        element.style.overflow = 'hidden';
        element.style.display = 'block';
        
        const targetHeight = element.scrollHeight + 'px';
        
        let start = null;
        const animate = (timestamp) => {
            if (!start) start = timestamp;
            const progress = Math.min((timestamp - start) / duration, 1);
            
            element.style.height = (progress * element.scrollHeight) + 'px';
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                element.style.height = 'auto';
                element.style.overflow = 'visible';
            }
        };
        
        requestAnimationFrame(animate);
    },

    // Enhanced error handling
    handleError: (error, context = 'Unknown', notify = true) => {
        // Safe error handling to prevent null/undefined errors
        const safeError = error || new Error('Unknown error occurred');
        
        const errorInfo = {
            message: safeError.message || 'An unexpected error occurred',
            context: context,
            timestamp: Date.now(),
            stack: CONFIG.APP.DEBUG ? safeError.stack : undefined,
            userAgent: navigator.userAgent
        };
        
        console.error(`[${context}] Error:`, errorInfo);
        
        if (CONFIG.APP.DEBUG) {
            console.trace();
        }
        
        // Store error for debugging
        try {
            const errors = UTILS.storage.get('error_log') || [];
            errors.unshift(errorInfo);
            // Keep only last 50 errors
            UTILS.storage.set('error_log', errors.slice(0, 50));
        } catch (storageError) {
            console.warn('Could not store error log:', storageError);
        }
        
        if (notify && typeof showNotification === 'function') {
            showNotification(`Error: ${errorInfo.message}`, 'error');
        }
        
        return errorInfo;
    },

    // Reward calculation utilities
    rewards: {
        calculateReward: (type, quality = 'normal') => {
            const baseAmount = type === 'feedback' ? 
                CONFIG.BLOCKCHAIN.REWARDS.FEEDBACK_AMOUNT : 
                CONFIG.BLOCKCHAIN.REWARDS.REPORT_AMOUNT;
            
            if (quality === 'high') {
                return baseAmount * CONFIG.BLOCKCHAIN.REWARDS.BONUS_MULTIPLIER;
            }
            
            return baseAmount;
        },
        
        canReceiveReward: (userId, dailyTotal = 0) => {
            return dailyTotal < CONFIG.BLOCKCHAIN.REWARDS.MAX_DAILY_REWARDS;
        },
        
        getTotalRewards: () => {
            try {
                const feedbacks = UTILS.storage.getFeedbacks();
                const reports = UTILS.storage.getReports();
                
                const feedbackRewards = feedbacks
                    .filter(f => f && f.blockchain_reward)
                    .reduce((sum, f) => sum + CONFIG.BLOCKCHAIN.REWARDS.FEEDBACK_AMOUNT, 0);
                
                const reportRewards = reports
                    .filter(r => r && r.blockchain_reward)
                    .reduce((sum, r) => sum + CONFIG.BLOCKCHAIN.REWARDS.REPORT_AMOUNT, 0);
                
                return feedbackRewards + reportRewards;
            } catch (error) {
                console.error('Error calculating total rewards:', error);
                return 0;
            }
        }
    },

    // Utility to check browser capabilities
    capabilities: {
        hasWebRTC: () => !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia),
        hasSpeechRecognition: () => !!(window.SpeechRecognition || window.webkitSpeechRecognition),
        hasNotifications: () => 'Notification' in window,
        hasServiceWorker: () => 'serviceWorker' in navigator,
        hasLocalStorage: () => {
            try {
                localStorage.setItem('test', 'test');
                localStorage.removeItem('test');
                return true;
            } catch {
                return false;
            }
        },
        hasWebGL: () => {
            try {
                const canvas = document.createElement('canvas');
                return !!(canvas.getContext('webgl') || canvas.getContext('experimental-webgl'));
            } catch {
                return false;
            }
        }
    }
};

// Global error handler
window.addEventListener('error', (event) => {
    UTILS.handleError(event.error, 'Global Error Handler');
});

// Global unhandled promise rejection handler
window.addEventListener('unhandledrejection', (event) => {
    UTILS.handleError(event.reason, 'Unhandled Promise Rejection');
    event.preventDefault();
});

// Log system initialization
console.log('⚙️ Enhanced configuration and utilities loaded');
console.log('📱 App:', CONFIG.APP.NAME, 'v' + CONFIG.APP.VERSION);
console.log('⛓️ Blockchain:', CONFIG.BLOCKCHAIN.ENABLED ? 'ENABLED' : 'DISABLED');
console.log('💰 Reward Account:', CONFIG.BLOCKCHAIN.CONTRACT.SENDER_ADDRESS);
console.log('🪙 Reward Amount:', CONFIG.BLOCKCHAIN.REWARDS.FEEDBACK_AMOUNT, CONFIG.BLOCKCHAIN.REWARDS.CURRENCY);
console.log('🤖 AI Moderation:', CONFIG.AI.MODERATION.ENABLED ? 'ENABLED' : 'DISABLED');
console.log('🎤 Voice Input:', CONFIG.AI.VOICE.ENABLED ? 'ENABLED' : 'DISABLED');

// Browser capability check
try {
    const capabilities = Object.entries(UTILS.capabilities).map(([key, check]) => ({
        feature: key,
        supported: check()
    }));

    console.log('🔍 Browser Capabilities:', capabilities);
} catch (capabilityError) {
    console.warn('Error checking browser capabilities:', capabilityError);
}

// Export for global use
window.CONFIG = CONFIG;
window.UTILS = UTILS;