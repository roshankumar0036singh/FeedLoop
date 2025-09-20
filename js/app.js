// app-fixed.js - Fixed Application with Better Initialization

class CampusFeedbackApp {
    constructor() {
        this.currentPage = 'dashboard';
        this.user = null;
        this.components = {};
        this.initialized = false;
        this.initializationPromise = null;
        this.data = {
            feedbacks: [],
            reports: [],
            leaderboard: [],
            achievements: [],
            stats: {}
        };
    }

    async init() {
        // Prevent multiple initializations
        if (this.initialized) return;
        if (this.initializationPromise) return this.initializationPromise;

        console.log('🚀 Initializing CampusFeedback+ 2.0 with enhanced error handling...');
        
        this.initializationPromise = this.start().catch(error => {
            console.error('❌ Critical initialization error:', error);
            this.handleInitializationError(error);
        });

        return this.initializationPromise;
    }

    async start() {
        try {
            // Wait for DOM to be fully ready
            if (document.readyState !== 'complete') {
                await new Promise(resolve => {
                    if (document.readyState === 'complete') {
                        resolve();
                    } else {
                        window.addEventListener('load', resolve, { once: true });
                    }
                });
            }

            console.log('📄 DOM fully loaded, starting app initialization...');

            // Wait for all dependencies to be loaded
            await this.waitForDependencies();

            // Hide loading screen gradually
            this.hideLoadingScreen();

            // Initialize core components
            this.setupNavigation();
            this.setupForms();
            this.initializeComponents();

            // Load data
            await this.loadStoredData();
            await this.loadInitialData();

            // Setup real-time updates
            this.setupRealtimeUpdates();

            // Load user data
            await this.loadUserData();

            // Mark as initialized
            this.initialized = true;

            console.log('✅ CampusFeedback+ initialized successfully!');
            
            // Show success notification after a brief delay
            setTimeout(() => {
                if (typeof showNotification === 'function') {
                    showNotification('🎉 Welcome to CampusFeedback+ 2.0! Your campus feedback platform is ready!', 'success', 6000);
                }
            }, 1500);
            
        } catch (error) {
            console.error('❌ Error during app initialization:', error);
            this.handleInitializationError(error);
        }
    }

    async waitForDependencies() {
        const maxWaitTime = 5000; // 5 seconds max wait
        const startTime = Date.now();
        
        const checkDependencies = () => {
            const dependencies = [
                typeof CONFIG !== 'undefined',
                typeof UTILS !== 'undefined',
                typeof notificationManager !== 'undefined',
                typeof formValidator !== 'undefined',
                typeof web3Manager !== 'undefined',
                typeof voiceManager !== 'undefined'
            ];
            
            return dependencies.every(dep => dep === true);
        };

        // Wait for dependencies with timeout
        while (!checkDependencies() && (Date.now() - startTime) < maxWaitTime) {
            await new Promise(resolve => setTimeout(resolve, 100));
        }

        if (!checkDependencies()) {
            console.warn('⚠️ Some dependencies may not be fully loaded, continuing anyway...');
        } else {
            console.log('✅ All dependencies loaded successfully');
        }
    }

    hideLoadingScreen() {
        const loadingScreen = document.getElementById('loadingScreen');
        if (loadingScreen) {
            // Gradual fade out
            loadingScreen.style.opacity = '0';
            loadingScreen.style.transition = 'opacity 0.5s ease';
            
            setTimeout(() => {
                loadingScreen.style.display = 'none';
                console.log('🎯 Loading screen hidden');
            }, 500);
        }
    }

    handleInitializationError(error) {
        console.error('🚨 Application failed to initialize:', error);
        
        // Hide loading screen even on error
        this.hideLoadingScreen();
        
        // Show error message to user
        setTimeout(() => {
            const errorMessage = this.createErrorMessage(error);
            document.body.appendChild(errorMessage);
        }, 1000);
    }

    createErrorMessage(error) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'app-error-message';
        errorDiv.innerHTML = `
            <div class="error-content">
                <div class="error-icon">
                    <i class="fas fa-exclamation-triangle"></i>
                </div>
                <h2>Initialization Error</h2>
                <p>CampusFeedback+ encountered an error during startup.</p>
                <div class="error-details">
                    <strong>Error:</strong> ${error.message || 'Unknown error'}
                </div>
                <div class="error-actions">
                    <button class="btn btn-primary" onclick="location.reload()">
                        <i class="fas fa-sync-alt"></i>
                        Reload Application
                    </button>
                    <button class="btn btn-secondary" onclick="this.closest('.app-error-message').style.display='none'">
                        <i class="fas fa-times"></i>
                        Dismiss
                    </button>
                </div>
            </div>
        `;
        
        // Add error message styles
        this.addErrorMessageStyles();
        
        return errorDiv;
    }

    addErrorMessageStyles() {
        if (document.getElementById('error-message-styles')) return;
        
        const styles = document.createElement('style');
        styles.id = 'error-message-styles';
        styles.textContent = `
            .app-error-message {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.8);
                backdrop-filter: blur(8px);
                z-index: 10000;
                display: flex;
                align-items: center;
                justify-content: center;
                animation: fadeIn 0.3s ease;
            }
            
            .error-content {
                background: white;
                padding: 2rem;
                border-radius: 16px;
                box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
                max-width: 500px;
                width: 90%;
                text-align: center;
            }
            
            .error-icon {
                font-size: 3rem;
                color: #ef4444;
                margin-bottom: 1rem;
            }
            
            .error-content h2 {
                color: #1f2937;
                margin-bottom: 1rem;
            }
            
            .error-content p {
                color: #6b7280;
                margin-bottom: 1.5rem;
            }
            
            .error-details {
                background: #f3f4f6;
                padding: 1rem;
                border-radius: 8px;
                margin-bottom: 1.5rem;
                text-align: left;
                font-family: monospace;
                font-size: 0.875rem;
                word-break: break-word;
            }
            
            .error-actions {
                display: flex;
                gap: 1rem;
                justify-content: center;
            }
            
            @media (max-width: 480px) {
                .error-actions {
                    flex-direction: column;
                }
                .error-actions .btn {
                    width: 100%;
                }
            }
        `;
        document.head.appendChild(styles);
    }

    async loadStoredData() {
        try {
            console.log('📂 Loading stored data from localStorage...');
            
            // Safely load stored feedbacks
            if (typeof UTILS !== 'undefined' && UTILS.storage) {
                this.data.feedbacks = UTILS.storage.getFeedbacks() || [];
                this.data.reports = UTILS.storage.getReports() || [];
                
                console.log('📝 Loaded', this.data.feedbacks.length, 'feedbacks from storage');
                console.log('🚩 Loaded', this.data.reports.length, 'reports from storage');
            } else {
                console.warn('⚠️ UTILS.storage not available, using empty data');
                this.data.feedbacks = [];
                this.data.reports = [];
            }
            
            // Update display
            this.displayFeedbacks();
            this.displayReports();
            
        } catch (error) {
            console.error('Error loading stored data:', error);
            // Continue with empty data
            this.data.feedbacks = [];
            this.data.reports = [];
        }
    }

    setupNavigation() {
        try {
            console.log('🧭 Setting up navigation...');
            
            // Navigation links
            const navLinks = document.querySelectorAll('.nav-link[data-page]');
            navLinks.forEach(link => {
                // Remove existing listeners to prevent duplicates
                link.replaceWith(link.cloneNode(true));
            });
            
            // Re-select after cloning
            const newNavLinks = document.querySelectorAll('.nav-link[data-page]');
            newNavLinks.forEach(link => {
                link.addEventListener('click', (e) => {
                    e.preventDefault();
                    const page = link.dataset.page;
                    this.navigateToPage(page);
                });
            });

            // Hamburger menu
            const hamburger = document.getElementById('hamburger');
            const navMenu = document.getElementById('navMenu');
            if (hamburger && navMenu) {
                // Remove existing listener
                hamburger.replaceWith(hamburger.cloneNode(true));
                
                // Add new listener
                const newHamburger = document.getElementById('hamburger');
                newHamburger.addEventListener('click', () => {
                    navMenu.classList.toggle('active');
                    newHamburger.classList.toggle('active');
                });
            }

            // Quick action buttons
            document.addEventListener('click', (e) => {
                const actionBtn = e.target.closest('[data-page]');
                if (actionBtn && !e.target.closest('.nav-link')) {
                    const page = actionBtn.dataset.page;
                    if (page) {
                        this.navigateToPage(page);
                    }
                }
            });
            
            console.log('✅ Navigation setup complete');
            
        } catch (error) {
            console.error('Error setting up navigation:', error);
        }
    }

    navigateToPage(pageName) {
        try {
            console.log('📄 Navigating to page:', pageName);
            
            // Update navigation state
            document.querySelectorAll('.nav-link').forEach(link => {
                link.classList.remove('active');
            });
            
            const activeLink = document.querySelector(`[data-page="${pageName}"]`);
            if (activeLink) {
                activeLink.classList.add('active');
            }

            // Show/hide pages
            document.querySelectorAll('.page').forEach(page => {
                page.classList.remove('active');
            });
            
            const targetPage = document.getElementById(`${pageName}Page`);
            if (targetPage) {
                targetPage.classList.add('active');
                this.currentPage = pageName;
                
                // Load page-specific data
                this.loadPageData(pageName);
            } else {
                console.warn('⚠️ Target page not found:', `${pageName}Page`);
            }

            // Close mobile menu
            const navMenu = document.getElementById('navMenu');
            const hamburger = document.getElementById('hamburger');
            if (navMenu && hamburger) {
                navMenu.classList.remove('active');
                hamburger.classList.remove('active');
            }
            
        } catch (error) {
            console.error('Error navigating to page:', error);
        }
    }

    async loadPageData(pageName) {
        try {
            switch (pageName) {
                case 'dashboard':
                    await this.loadDashboardData();
                    break;
                case 'feedback':
                    await this.loadFeedbackData();
                    break;
                case 'reports':
                    await this.loadReportsData();
                    break;
                case 'leaderboard':
                    await this.loadLeaderboardData();
                    break;
                case 'profile':
                    await this.loadProfileData();
                    break;
            }
        } catch (error) {
            console.error(`Error loading ${pageName} data:`, error);
            if (typeof showNotification === 'function') {
                showNotification(`Error loading ${pageName} data`, 'error');
            }
        }
    }

    setupForms() {
        try {
            console.log('📝 Setting up forms with enhanced validation...');
            
            // Setup feedback form
            this.setupFeedbackForm();
            
            // Setup report form
            this.setupReportForm();
            
            // Setup star ratings
            this.setupStarRatings();
            
            console.log('✅ Forms setup complete');
            
        } catch (error) {
            console.error('Error setting up forms:', error);
        }
    }

    setupFeedbackForm() {
        const feedbackForm = document.getElementById('feedbackForm');
        if (!feedbackForm) {
            console.warn('⚠️ Feedback form not found');
            return;
        }

        // Define validation rules
        const feedbackRules = {
            feedbackCategory: { required: true },
            feedbackTitle: { required: true, minLength: 5, maxLength: 100 },
            feedbackContent: { required: true, minLength: 10, maxLength: 2000 }
        };

        // Setup real-time validation
        if (typeof formValidator !== 'undefined' && formValidator) {
            formValidator.setupRealTimeValidation(feedbackForm, feedbackRules);
        }

        // Remove existing listener and add new one
        feedbackForm.replaceWith(feedbackForm.cloneNode(true));
        const newFeedbackForm = document.getElementById('feedbackForm');
        newFeedbackForm.addEventListener('submit', (e) => this.handleFeedbackSubmit(e));
    }

    setupReportForm() {
        const reportForm = document.getElementById('reportForm');
        if (!reportForm) {
            console.warn('⚠️ Report form not found');
            return;
        }

        // Define validation rules
        const reportRules = {
            reportType: { required: true },
            reportTitle: { required: true, minLength: 5, maxLength: 100 },
            reportLocation: { required: true, minLength: 3, maxLength: 200 },
            reportDescription: { required: true, minLength: 10, maxLength: 2000 }
        };

        // Setup real-time validation
        if (typeof formValidator !== 'undefined' && formValidator) {
            formValidator.setupRealTimeValidation(reportForm, reportRules);
        }

        // Remove existing listener and add new one
        reportForm.replaceWith(reportForm.cloneNode(true));
        const newReportForm = document.getElementById('reportForm');
        newReportForm.addEventListener('submit', (e) => this.handleReportSubmit(e));
    }

    setupStarRatings() {
        const starRatings = document.querySelectorAll('.star-rating');
        starRatings.forEach(rating => {
            const stars = rating.querySelectorAll('.star');
            stars.forEach((star, index) => {
                // Remove existing listeners
                star.replaceWith(star.cloneNode(true));
            });
            
            // Re-select and add listeners
            const newStars = rating.querySelectorAll('.star');
            newStars.forEach((star, index) => {
                star.addEventListener('click', () => {
                    const value = index + 1;
                    rating.dataset.rating = value;
                    
                    // Update visual state
                    newStars.forEach((s, i) => {
                        if (i < value) {
                            s.classList.add('active');
                        } else {
                            s.classList.remove('active');
                        }
                    });
                    
                    // Update rating text
                    const ratingText = rating.nextElementSibling;
                    if (ratingText && ratingText.classList.contains('rating-text')) {
                        const labels = ['Very Poor', 'Poor', 'Fair', 'Good', 'Excellent'];
                        ratingText.textContent = labels[value - 1] || 'Click to rate';
                    }

                    // Clear rating validation error if exists
                    if (typeof formValidator !== 'undefined' && formValidator) {
                        formValidator.clearFieldError('rating');
                    }
                });
            });
        });
    }

    initializeComponents() {
        try {
            console.log('🧩 Initializing components...');
            
            // Initialize file upload for reports
            const reportImages = document.getElementById('reportImages');
            if (reportImages && typeof FileUpload !== 'undefined') {
                this.components.fileUpload = new FileUpload(reportImages.parentElement, {
                    onUpload: (files) => {
                        console.log('📁 Files selected:', files.length);
                    },
                    onError: (message) => {
                        if (typeof showNotification === 'function') {
                            showNotification(message, 'error');
                        }
                    }
                });
            }
            
            console.log('✅ Components initialized');
            
        } catch (error) {
            console.error('Error initializing components:', error);
        }
    }

    async loadInitialData() {
        try {
            console.log('📊 Loading initial dashboard data...');
            
            // Load dashboard stats
            await this.loadStats();
            
            // Load recent activity
            await this.loadRecentActivity();
            
            // Load achievements
            await this.loadAchievements();
            
            console.log('✅ Initial data loaded');
            
        } catch (error) {
            console.error('Error loading initial data:', error);
        }
    }

    async loadStats() {
        try {
            // Calculate real stats from stored data
            const stats = {
                totalFeedbacks: this.data.feedbacks.length,
                averageRating: this.calculateAverageRating(),
                activeUsers: this.getUniqueUsers(),
                totalRewards: this.calculateTotalRewards()
            };

            this.updateStatsDisplay(stats);
            this.data.stats = stats;
            
            console.log('📈 Stats loaded:', stats);
            
        } catch (error) {
            console.error('Error loading stats:', error);
            // Show default stats
            this.updateStatsDisplay({
                totalFeedbacks: 0,
                averageRating: '0.0',
                activeUsers: 0,
                totalRewards: '0.000 SHM'
            });
        }
    }

    calculateAverageRating() {
        if (this.data.feedbacks.length === 0) return '0.0';
        
        const totalRating = this.data.feedbacks.reduce((sum, feedback) => {
            return sum + (feedback.rating || 0);
        }, 0);
        
        return (totalRating / this.data.feedbacks.length).toFixed(1);
    }

    getUniqueUsers() {
        const users = new Set();
        this.data.feedbacks.forEach(f => users.add(f.author || 'Anonymous'));
        this.data.reports.forEach(r => users.add(r.author || 'Anonymous'));
        return users.size;
    }

    calculateTotalRewards() {
        const totalSubmissions = this.data.feedbacks.length + this.data.reports.length;
        if (typeof UTILS !== 'undefined' && UTILS.formatCurrency) {
            return UTILS.formatCurrency(totalSubmissions * 0.01);
        }
        return `${(totalSubmissions * 0.01).toFixed(3)} SHM`;
    }

    updateStatsDisplay(stats) {
        const elements = {
            totalFeedbacks: document.getElementById('totalFeedbacks'),
            averageRating: document.getElementById('averageRating'),
            activeUsers: document.getElementById('activeUsers'),
            totalRewards: document.getElementById('totalRewards')
        };

        Object.keys(elements).forEach(key => {
            if (elements[key]) {
                elements[key].textContent = stats[key];
            }
        });
    }

    async loadRecentActivity() {
        try {
            const activities = [];
            
            // Add recent feedbacks
            this.data.feedbacks.slice(0, 3).forEach(feedback => {
                activities.push({
                    type: 'feedback',
                    message: `New feedback: "${feedback.title || 'Untitled'}"`,
                    time: feedback.timestamp || Date.now(),
                    icon: 'fas fa-comment'
                });
            });
            
            // Add recent reports
            this.data.reports.slice(0, 3).forEach(report => {
                activities.push({
                    type: 'report',
                    message: `New report: "${report.title || 'Untitled'}"`,
                    time: report.timestamp || Date.now(),
                    icon: 'fas fa-flag'
                });
            });
            
            // Sort by timestamp
            activities.sort((a, b) => b.time - a.time);
            
            this.displayRecentActivity(activities.slice(0, 5));
            
        } catch (error) {
            console.error('Error loading recent activity:', error);
            this.displayRecentActivity([]);
        }
    }

    displayRecentActivity(activities) {
        const container = document.getElementById('recentActivity');
        if (!container) return;

        if (activities.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-inbox"></i>
                    <p>No recent activity. Submit your first feedback or report!</p>
                </div>
            `;
            return;
        }

        const formatDate = (timestamp) => {
            if (typeof UTILS !== 'undefined' && UTILS.formatDate) {
                return UTILS.formatDate(timestamp);
            }
            return new Date(timestamp).toLocaleDateString();
        };

        container.innerHTML = activities.map(activity => `
            <div class="activity-item">
                <div class="activity-icon">
                    <i class="${activity.icon}"></i>
                </div>
                <div class="activity-content">
                    <p>${activity.message}</p>
                    <small>${formatDate(activity.time)}</small>
                </div>
            </div>
        `).join('');
    }

    // Safe form submission handlers with comprehensive error handling
    async handleFeedbackSubmit(e) {
        e.preventDefault();
        
        try {
            const form = e.target;
            
            // Get form data safely
            const feedbackData = {
                category: this.getFieldValue('feedbackCategory'),
                title: this.getFieldValue('feedbackTitle').trim(),
                content: this.getFieldValue('feedbackContent').trim(),
                rating: parseInt(document.querySelector('.star-rating')?.dataset?.rating) || 0,
                anonymous: document.getElementById('anonymousFeedback')?.checked || false
            };

            console.log('📝 Submitting feedback:', feedbackData);

            // Validate form
            if (!this.validateFeedbackData(feedbackData, form)) {
                return;
            }

            // Show loading state
            this.setFormLoading(form, true);

            try {
                // Create feedback object
                const newFeedback = {
                    id: this.generateId(),
                    ...feedbackData,
                    author: feedbackData.anonymous ? 'Anonymous' : (this.user?.name || 'Campus User'),
                    timestamp: Date.now(),
                    status: 'approved',
                    sentiment: 'positive',
                    blockchain_reward: null
                };

                console.log('💾 Saving feedback...');
                
                // Save feedback
                this.saveFeedback(newFeedback);
                
                // Update displays
                this.displayFeedbacks();
                await this.loadStats();
                await this.loadRecentActivity();
                
                // Show success
                if (typeof showNotification === 'function') {
                    showNotification('✅ Feedback submitted successfully!', 'success');
                }
                
                // Send blockchain reward if available
                this.sendBlockchainReward(newFeedback);
                
                // Clear form
                this.clearFeedbackForm(form);
                
            } catch (error) {
                console.error('❌ Error submitting feedback:', error);
                if (typeof showNotification === 'function') {
                    showNotification('Error submitting feedback. Please try again.', 'error');
                }
            } finally {
                // Restore button state
                this.setFormLoading(form, false);
            }
            
        } catch (error) {
            console.error('❌ Critical error in feedback submission:', error);
            if (typeof showNotification === 'function') {
                showNotification('A critical error occurred. Please refresh and try again.', 'error');
            }
        }
    }

    // Helper methods for safer operations
    getFieldValue(fieldId) {
        const field = document.getElementById(fieldId);
        return field ? field.value : '';
    }

    generateId() {
        if (typeof UTILS !== 'undefined' && UTILS.generateId) {
            return UTILS.generateId();
        }
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    validateFeedbackData(data, form) {
        const errors = [];
        
        if (!data.category) errors.push('Category is required');
        if (!data.title || data.title.length < 5) errors.push('Title must be at least 5 characters');
        if (!data.content || data.content.length < 10) errors.push('Content must be at least 10 characters');
        if (!data.rating || data.rating === 0) errors.push('Please provide a rating');
        
        if (errors.length > 0) {
            if (typeof showNotification === 'function') {
                showNotification('Please fix the form errors: ' + errors.join(', '), 'warning');
            }
            return false;
        }
        
        return true;
    }

    saveFeedback(feedback) {
        // Add to current data
        this.data.feedbacks.unshift(feedback);
        
        // Save to storage if available
        if (typeof UTILS !== 'undefined' && UTILS.storage) {
            UTILS.storage.saveFeedback(feedback);
        } else {
            console.warn('⚠️ UTILS.storage not available, feedback only stored in memory');
        }
    }

    async sendBlockchainReward(submission) {
        try {
            if (typeof web3Manager !== 'undefined' && web3Manager && web3Manager.isConnected) {
                console.log('💰 Attempting to send blockchain reward...');
                const txHash = await web3Manager.sendReward(web3Manager.account);
                
                if (txHash) {
                    submission.blockchain_reward = txHash;
                    this.saveFeedback(submission); // Re-save with tx hash
                    
                    if (typeof showNotification === 'function') {
                        showNotification(`🎉 Reward sent! You earned 0.01 SHM tokens!`, 'success', 8000);
                    }
                }
            } else {
                if (typeof showNotification === 'function') {
                    showNotification('💡 Connect your wallet to earn blockchain rewards!', 'info');
                }
            }
        } catch (error) {
            console.error('Error sending blockchain reward:', error);
        }
    }

    setFormLoading(form, isLoading) {
        const submitBtn = form.querySelector('button[type="submit"]');
        if (!submitBtn) return;
        
        if (isLoading) {
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Submitting...';
        } else {
            submitBtn.disabled = false;
            const originalText = submitBtn.dataset.originalText || '<i class="fas fa-paper-plane"></i> Submit';
            submitBtn.innerHTML = originalText;
        }
    }

    clearFeedbackForm(form) {
        form.reset();
        
        // Reset star rating
        const starRating = document.querySelector('.star-rating');
        if (starRating) {
            starRating.dataset.rating = '0';
            starRating.querySelectorAll('.star').forEach(star => star.classList.remove('active'));
        }
        
        // Reset rating text
        const ratingText = document.querySelector('.rating-text');
        if (ratingText) {
            ratingText.textContent = 'Click to rate';
        }
    }

    // Similar implementations for other methods...
    displayFeedbacks() {
        const container = document.getElementById('feedbacksList');
        if (!container) return;

        if (this.data.feedbacks.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-comments"></i>
                    <p>No feedbacks yet. Be the first to share your thoughts!</p>
                </div>
            `;
            return;
        }

        const formatDate = (timestamp) => {
            if (typeof UTILS !== 'undefined' && UTILS.formatDate) {
                return UTILS.formatDate(timestamp);
            }
            return new Date(timestamp).toLocaleDateString();
        };

        container.innerHTML = this.data.feedbacks.map(feedback => `
            <div class="feedback-item">
                <div class="feedback-header">
                    <h4>${feedback.title || 'Untitled Feedback'}</h4>
                    <div class="feedback-meta">
                        <span class="badge badge-primary">${feedback.category || 'General'}</span>
                        <span>${feedback.author || 'Anonymous'}</span>
                        <span>${formatDate(feedback.timestamp)}</span>
                        ${feedback.blockchain_reward ? `
                            <span class="badge badge-success">
                                <i class="fas fa-check-circle"></i> Rewarded
                            </span>
                        ` : ''}
                    </div>
                </div>
                <div class="feedback-rating">
                    ${this.renderStars(feedback.rating)}
                </div>
                <div class="feedback-content">
                    ${this.truncateText(feedback.content, 200)}
                </div>
            </div>
        `).join('');
    }

    renderStars(rating) {
        let stars = '';
        for (let i = 1; i <= 5; i++) {
            stars += `<span class="star ${i <= rating ? 'active' : ''}">★</span>`;
        }
        return `<div class="star-rating readonly">${stars}</div>`;
    }

    truncateText(text, maxLength = 100) {
        if (!text) return '';
        if (typeof UTILS !== 'undefined' && UTILS.truncateText) {
            return UTILS.truncateText(text, maxLength);
        }
        return text.length <= maxLength ? text : text.substr(0, maxLength) + '...';
    }

    displayReports() {
        const container = document.getElementById('reportsList');
        if (!container) return;

        if (this.data.reports.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-flag"></i>
                    <p>No reports yet. Report issues to help improve our campus!</p>
                </div>
            `;
            return;
        }

        // Similar implementation as displayFeedbacks but for reports
        container.innerHTML = this.data.reports.map(report => `
            <div class="report-item">
                <div class="report-header">
                    <h4>${report.title || 'Untitled Report'}</h4>
                    <div class="report-meta">
                        <span class="badge badge-warning">${report.urgency || 'medium'} urgency</span>
                        <span class="badge badge-secondary">${report.type || 'general'}</span>
                        <span>${report.location || 'Unknown location'}</span>
                    </div>
                </div>
                <div class="report-content">
                    ${this.truncateText(report.description, 200)}
                </div>
            </div>
        `).join('');
    }

    setupRealtimeUpdates() {
        // Setup periodic data refresh
        setInterval(() => {
            if (this.currentPage === 'dashboard') {
                this.loadStats();
            }
        }, 30000); // Refresh every 30 seconds
    }

    async loadUserData() {
        try {
            // Create default user if none exists
            this.user = {
                id: this.generateId(),
                name: 'Campus User',
                email: 'user@campus.edu',
                points: 0,
                level: 1,
                achievements: [],
                joinDate: Date.now()
            };
            
            console.log('👤 User data loaded:', this.user);
        } catch (error) {
            console.error('Error loading user data:', error);
        }
    }

    // Placeholder methods for other functionality
    async handleReportSubmit(e) {
        e.preventDefault();
        console.log('🚩 Report submission placeholder - implement similar to feedback');
        if (typeof showNotification === 'function') {
            showNotification('Report submission functionality will be implemented', 'info');
        }
    }

    async loadDashboardData() {
        await this.loadStats();
        await this.loadRecentActivity();
    }

    async loadFeedbackData() {
        this.displayFeedbacks();
    }

    async loadReportsData() {
        this.displayReports();
    }

    async loadLeaderboardData() {
        console.log('🏆 Loading leaderboard data...');
    }

    async loadProfileData() {
        console.log('👤 Loading profile data...');
    }

    async loadAchievements() {
        console.log('🏅 Loading achievements...');
    }
}

// Global functions
function clearForm() {
    const feedbackForm = document.getElementById('feedbackForm');
    if (feedbackForm && window.app) {
        window.app.clearFeedbackForm(feedbackForm);
        if (typeof showNotification === 'function') {
            showNotification('Form cleared successfully', 'info');
        }
    }
}

function clearReportForm() {
    const reportForm = document.getElementById('reportForm');
    if (reportForm) {
        reportForm.reset();
        if (typeof showNotification === 'function') {
            showNotification('Report form cleared successfully', 'info');
        }
    }
}

function editProfile() {
    if (typeof showNotification === 'function') {
        showNotification('Profile editing feature coming soon!', 'info');
    }
}

// Initialize application with enhanced error handling
let app;

// Enhanced initialization with multiple fallback strategies
function initializeApp() {
    if (app && app.initialized) {
        console.log('✅ App already initialized');
        return;
    }
    
    try {
        console.log('🚀 Creating CampusFeedback+ application instance...');
        app = new CampusFeedbackApp();
        
        // Initialize the app
        app.init().catch(error => {
            console.error('🚨 App initialization failed:', error);
        });
        
        // Export globally
        window.app = app;
        
    } catch (error) {
        console.error('🚨 Critical error creating app instance:', error);
        
        // Show fallback error message
        setTimeout(() => {
            if (typeof showNotification === 'function') {
                showNotification('🚨 Application failed to start. Please refresh the page.', 'error');
            } else {
                alert('CampusFeedback+ failed to start. Please refresh the page.');
            }
        }, 2000);
    }
}

// Multiple initialization strategies
document.addEventListener('DOMContentLoaded', initializeApp);

// Fallback initialization
if (document.readyState === 'complete') {
    initializeApp();
} else if (document.readyState === 'interactive') {
    setTimeout(initializeApp, 100);
}

// Final fallback
setTimeout(() => {
    if (!app || !app.initialized) {
        console.log('⏰ Final fallback initialization attempt...');
        initializeApp();
    }
}, 3000);

// Export for global use
window.app = app;
window.initializeApp = initializeApp;