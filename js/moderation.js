// moderation.js - AI Content Moderation System

class ModerationSystem {
    constructor() {
        this.enabled = CONFIG.AI.MODERATION.ENABLED;
        this.toxicityThreshold = CONFIG.AI.MODERATION.MAX_TOXICITY;
        this.cache = new Map();
        this.init();
    }

    init() {
        console.log('🤖 AI Moderation System initialized');
        console.log('🛡️ Toxicity threshold:', this.toxicityThreshold);
    }

    async moderateContent(content, type = 'text') {
        if (!this.enabled) {
            return {
                approved: true,
                confidence: 1.0,
                reason: 'Moderation disabled'
            };
        }

        try {
            // Check cache first
            const cacheKey = this.generateCacheKey(content);
            if (this.cache.has(cacheKey)) {
                console.log('📋 Using cached moderation result');
                return this.cache.get(cacheKey);
            }

            console.log('🔍 Moderating content:', content.substring(0, 50) + '...');

            // Simulate AI moderation (in production, you'd call a real AI service)
            const result = await this.simulateModeration(content, type);

            // Cache the result
            this.cache.set(cacheKey, result);

            // Clean cache if it gets too large
            if (this.cache.size > 100) {
                const firstKey = this.cache.keys().next().value;
                this.cache.delete(firstKey);
            }

            return result;

        } catch (error) {
            console.error('❌ Moderation error:', error);
            
            // Fail safely - approve content if moderation fails
            return {
                approved: true,
                confidence: 0.5,
                reason: 'Moderation service unavailable',
                error: error.message
            };
        }
    }

    async simulateModeration(content, type) {
        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000));

        // Basic keyword-based content filtering
        const bannedWords = [
            'spam', 'scam', 'fake', 'hate', 'offensive',
            'inappropriate', 'violent', 'harassment'
        ];

        const suspiciousPatterns = [
            /(.)\1{10,}/, // Repeated characters
            /[A-Z]{20,}/, // All caps long text
            /@\w+\.(com|net|org)/g, // Email patterns
            /https?:\/\/\S+/g, // URL patterns
            /\d{10,}/, // Long numbers (phone numbers)
        ];

        let toxicityScore = 0;
        const issues = [];

        // Check for banned words
        const lowerContent = content.toLowerCase();
        bannedWords.forEach(word => {
            if (lowerContent.includes(word)) {
                toxicityScore += 0.3;
                issues.push(`Contains potentially harmful word: "${word}"`);
            }
        });

        // Check for suspicious patterns
        suspiciousPatterns.forEach((pattern, index) => {
            if (pattern.test(content)) {
                toxicityScore += 0.2;
                switch (index) {
                    case 0:
                        issues.push('Contains excessive repeated characters');
                        break;
                    case 1:
                        issues.push('Contains excessive capital letters');
                        break;
                    case 2:
                        issues.push('Contains email addresses');
                        break;
                    case 3:
                        issues.push('Contains URLs');
                        break;
                    case 4:
                        issues.push('Contains phone numbers');
                        break;
                }
            }
        });

        // Check content length and structure
        if (content.length < 5) {
            toxicityScore += 0.1;
            issues.push('Content is too short');
        }

        if (content.split(' ').length < 3) {
            toxicityScore += 0.1;
            issues.push('Content lacks proper structure');
        }

        // Simulate sentiment analysis
        const positiveWords = ['good', 'great', 'excellent', 'amazing', 'helpful', 'useful', 'love', 'like'];
        const negativeWords = ['bad', 'terrible', 'awful', 'hate', 'horrible', 'worst', 'disgusting'];

        let sentimentScore = 0;
        positiveWords.forEach(word => {
            if (lowerContent.includes(word)) sentimentScore += 0.1;
        });
        negativeWords.forEach(word => {
            if (lowerContent.includes(word)) sentimentScore -= 0.1;
        });

        // Adjust toxicity based on sentiment (very negative content gets higher toxicity)
        if (sentimentScore < -0.3) {
            toxicityScore += 0.2;
            issues.push('Content has very negative sentiment');
        }

        // Determine if content should be approved
        const approved = toxicityScore < this.toxicityThreshold;
        const confidence = Math.max(0, Math.min(1, 1 - toxicityScore));

        const result = {
            approved: approved,
            confidence: confidence,
            toxicityScore: Math.round(toxicityScore * 100) / 100,
            issues: issues,
            sentiment: sentimentScore > 0 ? 'positive' : sentimentScore < 0 ? 'negative' : 'neutral',
            reason: approved ? 'Content approved' : 'Content flagged for review',
            suggestions: this.generateSuggestions(content, issues)
        };

        console.log('🤖 Moderation result:', {
            approved: result.approved,
            confidence: result.confidence,
            toxicityScore: result.toxicityScore,
            sentiment: result.sentiment
        });

        return result;
    }

    generateSuggestions(content, issues) {
        const suggestions = [];

        if (issues.some(issue => issue.includes('short'))) {
            suggestions.push('Try to provide more detailed feedback');
        }

        if (issues.some(issue => issue.includes('capital'))) {
            suggestions.push('Consider using normal capitalization');
        }

        if (issues.some(issue => issue.includes('repeated'))) {
            suggestions.push('Remove repeated characters for better readability');
        }

        if (issues.some(issue => issue.includes('negative'))) {
            suggestions.push('Consider providing constructive feedback');
        }

        if (issues.some(issue => issue.includes('email') || issue.includes('URL'))) {
            suggestions.push('Personal contact information is not necessary');
        }

        return suggestions;
    }

    generateCacheKey(content) {
        // Simple hash function for caching
        let hash = 0;
        for (let i = 0; i < content.length; i++) {
            const char = content.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32bit integer
        }
        return hash.toString();
    }

    displayModerationResult(result, containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        if (!result.approved) {
            container.innerHTML = `
                <div class="moderation-warning">
                    <div class="warning-header">
                        <i class="fas fa-exclamation-triangle"></i>
                        <span>Content Review Required</span>
                    </div>
                    <div class="warning-content">
                        <p><strong>Issues found:</strong></p>
                        <ul>
                            ${result.issues.map(issue => `<li>${issue}</li>`).join('')}
                        </ul>
                        ${result.suggestions.length > 0 ? `
                            <p><strong>Suggestions:</strong></p>
                            <ul>
                                ${result.suggestions.map(suggestion => `<li>${suggestion}</li>`).join('')}
                            </ul>
                        ` : ''}
                        <p><small>Confidence: ${Math.round(result.confidence * 100)}%</small></p>
                    </div>
                </div>
            `;
            container.style.display = 'block';
        } else if (result.suggestions.length > 0) {
            container.innerHTML = `
                <div class="moderation-suggestions">
                    <div class="suggestions-header">
                        <i class="fas fa-lightbulb"></i>
                        <span>AI Suggestions</span>
                    </div>
                    <div class="suggestions-content">
                        <ul>
                            ${result.suggestions.map(suggestion => `<li>${suggestion}</li>`).join('')}
                        </ul>
                        <p><small>Sentiment: ${result.sentiment} • Confidence: ${Math.round(result.confidence * 100)}%</small></p>
                    </div>
                </div>
            `;
            container.style.display = 'block';
        } else {
            container.style.display = 'none';
        }
    }

    clearModerationDisplay(containerId) {
        const container = document.getElementById(containerId);
        if (container) {
            container.innerHTML = '';
            container.style.display = 'none';
        }
    }

    // Enhanced moderation with real-time feedback
    async moderateWithFeedback(content, containerId, type = 'text') {
        const result = await this.moderateContent(content, type);
        
        if (containerId) {
            this.displayModerationResult(result, containerId);
        }

        // Return both the result and user-friendly messages
        return {
            ...result,
            message: result.approved ? 
                '✅ Content looks good!' : 
                `⚠️ ${result.reason}`,
            canSubmit: result.approved || result.confidence > 0.7
        };
    }

    // Batch moderation for multiple texts
    async moderateBatch(contents) {
        const results = await Promise.all(
            contents.map(content => this.moderateContent(content))
        );

        return {
            results: results,
            allApproved: results.every(r => r.approved),
            averageConfidence: results.reduce((sum, r) => sum + r.confidence, 0) / results.length
        };
    }

    // Get moderation statistics
    getStats() {
        return {
            cacheSize: this.cache.size,
            enabled: this.enabled,
            threshold: this.toxicityThreshold
        };
    }

    // Clear moderation cache
    clearCache() {
        this.cache.clear();
        console.log('🧹 Moderation cache cleared');
    }
}

// Initialize moderation system
let moderationSystem;

document.addEventListener('DOMContentLoaded', () => {
    moderationSystem = new ModerationSystem();
    
    // Add moderation styles
    if (!document.getElementById('moderation-styles')) {
        const styles = document.createElement('style');
        styles.id = 'moderation-styles';
        styles.textContent = `
            .moderation-warning,
            .moderation-suggestions {
                margin-top: 1rem;
                padding: 1rem;
                border-radius: 0.5rem;
                border-left: 4px solid;
                background: rgba(255, 255, 255, 0.9);
                backdrop-filter: blur(4px);
                box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
            }

            .moderation-warning {
                border-left-color: #ef4444;
                background-color: rgba(239, 68, 68, 0.05);
                color: #7f1d1d;
            }

            .moderation-suggestions {
                border-left-color: #f59e0b;
                background-color: rgba(245, 158, 11, 0.05);
                color: #78350f;
            }

            .warning-header,
            .suggestions-header {
                display: flex;
                align-items: center;
                gap: 0.5rem;
                font-weight: 600;
                margin-bottom: 0.75rem;
                font-size: 0.875rem;
            }

            .warning-content,
            .suggestions-content {
                font-size: 0.875rem;
                line-height: 1.5;
            }

            .moderation-warning ul,
            .moderation-suggestions ul {
                margin: 0.5rem 0;
                padding-left: 1.25rem;
            }

            .moderation-warning li,
            .moderation-suggestions li {
                margin: 0.25rem 0;
            }

            .moderation-warning small,
            .moderation-suggestions small {
                opacity: 0.8;
                font-size: 0.75rem;
            }
        `;
        document.head.appendChild(styles);
    }
});

// Global moderation function
async function moderateText(text, containerId = null) {
    if (moderationSystem) {
        return await moderationSystem.moderateWithFeedback(text, containerId);
    }
    
    // Fallback if moderation system not initialized
    return {
        approved: true,
        confidence: 1.0,
        reason: 'Moderation system not available',
        message: '✅ Content accepted',
        canSubmit: true
    };
}

// Export for global use
window.moderationSystem = moderationSystem;
window.moderateText = moderateText;