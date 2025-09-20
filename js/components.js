// components.js - Enhanced notification and form validation systems

// Notification System
class NotificationManager {
    constructor() {
        this.container = null;
        this.notifications = [];
        this.init();
    }

    init() {
        // Create notification container if it doesn't exist
        this.container = document.getElementById('notificationContainer');
        if (!this.container) {
            this.container = document.createElement('div');
            this.container.id = 'notificationContainer';
            this.container.className = 'notification-container';
            document.body.appendChild(this.container);
        }
        
        console.log('📢 Notification system initialized');
    }

    show(message, type = 'info', duration = 5000) {
        const notification = this.createNotification(message, type, duration);
        this.container.appendChild(notification);
        this.notifications.push(notification);

        // Auto remove after duration
        if (duration > 0) {
            setTimeout(() => {
                this.remove(notification);
            }, duration);
        }

        // Remove old notifications if too many
        if (this.notifications.length > 5) {
            this.remove(this.notifications[0]);
        }

        return notification;
    }

    createNotification(message, type, duration) {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        
        const icons = {
            success: 'fas fa-check-circle',
            error: 'fas fa-exclamation-circle',
            warning: 'fas fa-exclamation-triangle',
            info: 'fas fa-info-circle'
        };

        const colors = {
            success: '#10b981',
            error: '#ef4444',
            warning: '#f59e0b',
            info: '#06b6d4'
        };

        notification.innerHTML = `
            <div class="notification-icon" style="color: ${colors[type]};">
                <i class="${icons[type]}"></i>
            </div>
            <div class="notification-content">
                ${message}
            </div>
            <button class="notification-close" onclick="notificationManager.remove(this.parentElement)">
                <i class="fas fa-times"></i>
            </button>
        `;

        // Add click to dismiss
        notification.addEventListener('click', (e) => {
            if (!e.target.closest('.notification-close')) {
                this.remove(notification);
            }
        });

        return notification;
    }

    remove(notification) {
        if (notification && notification.parentNode) {
            notification.style.animation = 'notificationSlideOut 0.3s ease forwards';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
                const index = this.notifications.indexOf(notification);
                if (index > -1) {
                    this.notifications.splice(index, 1);
                }
            }, 300);
        }
    }

    clear() {
        this.notifications.forEach(notification => this.remove(notification));
    }
}

// Form Validation System
class FormValidator {
    constructor() {
        this.rules = {};
        this.customMessages = {};
        this.init();
    }

    init() {
        console.log('✅ Form validation system initialized');
        this.addGlobalStyles();
    }

    addGlobalStyles() {
        if (document.getElementById('form-validator-styles')) return;
        
        const styles = document.createElement('style');
        styles.id = 'form-validator-styles';
        styles.textContent = `
            @keyframes notificationSlideOut {
                from {
                    opacity: 1;
                    transform: translateX(0);
                }
                to {
                    opacity: 0;
                    transform: translateX(100%);
                }
            }
            
            .form-group.has-error input,
            .form-group.has-error select,
            .form-group.has-error textarea {
                border-color: #ef4444;
                box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
            }
            
            .form-group.has-success input,
            .form-group.has-success select,
            .form-group.has-success textarea {
                border-color: #10b981;
                box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.1);
            }
        `;
        document.head.appendChild(styles);
    }

    // Validate a single field
    validateField(field, rules, value) {
        const errors = [];
        
        if (!value) value = '';
        value = value.toString().trim();

        // Required validation
        if (rules.required && !value) {
            errors.push(this.getMessage(field, 'required', `${field} is required`));
        }

        if (value) { // Only validate other rules if value exists
            // Length validations
            if (rules.minLength && value.length < rules.minLength) {
                errors.push(this.getMessage(field, 'minLength', `${field} must be at least ${rules.minLength} characters`));
            }

            if (rules.maxLength && value.length > rules.maxLength) {
                errors.push(this.getMessage(field, 'maxLength', `${field} must not exceed ${rules.maxLength} characters`));
            }

            // Pattern validation
            if (rules.pattern && !rules.pattern.test(value)) {
                errors.push(this.getMessage(field, 'pattern', rules.message || `${field} format is invalid`));
            }

            // Email validation
            if (rules.type === 'email') {
                const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailPattern.test(value)) {
                    errors.push(this.getMessage(field, 'email', 'Please enter a valid email address'));
                }
            }

            // Number validation
            if (rules.type === 'number') {
                if (isNaN(value)) {
                    errors.push(this.getMessage(field, 'number', `${field} must be a valid number`));
                } else {
                    const numValue = parseFloat(value);
                    if (rules.min !== undefined && numValue < rules.min) {
                        errors.push(this.getMessage(field, 'min', `${field} must be at least ${rules.min}`));
                    }
                    if (rules.max !== undefined && numValue > rules.max) {
                        errors.push(this.getMessage(field, 'max', `${field} must not exceed ${rules.max}`));
                    }
                }
            }
        }

        return errors;
    }

    // Validate entire form
    validateForm(formData, validationRules) {
        const errors = {};
        let isValid = true;

        Object.keys(validationRules).forEach(field => {
            const rules = validationRules[field];
            const value = formData[field];
            const fieldErrors = this.validateField(field, rules, value);

            if (fieldErrors.length > 0) {
                errors[field] = fieldErrors;
                isValid = false;
            }
        });

        return { isValid, errors };
    }

    // Show field error
    showFieldError(fieldId, errorMessage) {
        const field = document.getElementById(fieldId);
        if (!field) return;

        const formGroup = field.closest('.form-group');
        const errorElement = formGroup.querySelector(`#${fieldId}Error`) || formGroup.querySelector('.error-message');

        if (errorElement) {
            errorElement.textContent = errorMessage;
            errorElement.classList.add('show');
        }

        // Add error styling
        formGroup.classList.add('has-error');
        formGroup.classList.remove('has-success');
        field.classList.add('invalid');
    }

    // Clear field error
    clearFieldError(fieldId) {
        const field = document.getElementById(fieldId);
        if (!field) return;

        const formGroup = field.closest('.form-group');
        const errorElement = formGroup.querySelector(`#${fieldId}Error`) || formGroup.querySelector('.error-message');

        if (errorElement) {
            errorElement.textContent = '';
            errorElement.classList.remove('show');
        }

        // Remove error styling
        formGroup.classList.remove('has-error');
        field.classList.remove('invalid');
    }

    // Show field success
    showFieldSuccess(fieldId) {
        const field = document.getElementById(fieldId);
        if (!field) return;

        const formGroup = field.closest('.form-group');
        
        // Clear error first
        this.clearFieldError(fieldId);
        
        // Add success styling
        formGroup.classList.add('has-success');
    }

    // Clear all form errors
    clearFormErrors(form) {
        const formGroups = form.querySelectorAll('.form-group');
        formGroups.forEach(group => {
            group.classList.remove('has-error', 'has-success');
            const errorElements = group.querySelectorAll('.error-message');
            errorElements.forEach(element => {
                element.textContent = '';
                element.classList.remove('show');
            });
        });

        const invalidFields = form.querySelectorAll('.invalid');
        invalidFields.forEach(field => field.classList.remove('invalid'));
    }

    // Display all form errors
    displayFormErrors(errors) {
        Object.keys(errors).forEach(field => {
            const fieldErrors = errors[field];
            if (fieldErrors && fieldErrors.length > 0) {
                this.showFieldError(field, fieldErrors[0]);
            }
        });
    }

    // Get custom message
    getMessage(field, rule, defaultMessage) {
        if (this.customMessages[field] && this.customMessages[field][rule]) {
            return this.customMessages[field][rule];
        }
        return defaultMessage;
    }

    // Set custom messages
    setCustomMessages(messages) {
        this.customMessages = { ...this.customMessages, ...messages };
    }

    // Real-time validation setup
    setupRealTimeValidation(form, rules) {
        Object.keys(rules).forEach(fieldName => {
            const field = form.querySelector(`#${fieldName}`);
            if (field) {
                // Add blur validation
                field.addEventListener('blur', () => {
                    const value = field.value;
                    const fieldRules = rules[fieldName];
                    const fieldErrors = this.validateField(fieldName, fieldRules, value);

                    if (fieldErrors.length > 0) {
                        this.showFieldError(fieldName, fieldErrors[0]);
                    } else {
                        this.clearFieldError(fieldName);
                        if (value.trim()) {
                            this.showFieldSuccess(fieldName);
                        }
                    }
                });

                // Clear error on input
                field.addEventListener('input', () => {
                    const formGroup = field.closest('.form-group');
                    if (formGroup.classList.contains('has-error')) {
                        // Only clear error, don't show success until blur
                        this.clearFieldError(fieldName);
                    }
                });
            }
        });
    }
}

// File Upload Component
class FileUpload {
    constructor(container, options = {}) {
        this.container = container;
        this.options = {
            maxFiles: options.maxFiles || 5,
            maxSize: options.maxSize || 10 * 1024 * 1024, // 10MB
            allowedTypes: options.allowedTypes || ['image/jpeg', 'image/png', 'image/gif'],
            onUpload: options.onUpload || (() => {}),
            onError: options.onError || (() => {}),
            ...options
        };
        this.files = [];
        this.init();
    }

    init() {
        this.setupFileInput();
        this.setupPreview();
    }

    setupFileInput() {
        const fileInput = this.container.querySelector('input[type="file"]');
        if (fileInput) {
            fileInput.addEventListener('change', (e) => {
                this.handleFiles(e.target.files);
            });
        }

        // Setup drag and drop
        const fileLabel = this.container.querySelector('.file-label');
        if (fileLabel) {
            fileLabel.addEventListener('dragover', (e) => {
                e.preventDefault();
                fileLabel.classList.add('drag-over');
            });

            fileLabel.addEventListener('dragleave', (e) => {
                e.preventDefault();
                fileLabel.classList.remove('drag-over');
            });

            fileLabel.addEventListener('drop', (e) => {
                e.preventDefault();
                fileLabel.classList.remove('drag-over');
                this.handleFiles(e.dataTransfer.files);
            });
        }
    }

    setupPreview() {
        this.previewContainer = this.container.querySelector('.image-preview');
        if (!this.previewContainer) {
            this.previewContainer = document.createElement('div');
            this.previewContainer.className = 'image-preview';
            this.container.appendChild(this.previewContainer);
        }
    }

    handleFiles(fileList) {
        const newFiles = Array.from(fileList);
        
        // Check file limit
        if (this.files.length + newFiles.length > this.options.maxFiles) {
            this.options.onError(`Maximum ${this.options.maxFiles} files allowed`);
            return;
        }

        // Validate and add files
        newFiles.forEach(file => {
            if (this.validateFile(file)) {
                this.addFile(file);
            }
        });

        this.updatePreview();
        this.options.onUpload(this.files);
    }

    validateFile(file) {
        // Check file type
        if (!this.options.allowedTypes.includes(file.type)) {
            this.options.onError(`File type ${file.type} is not allowed`);
            return false;
        }

        // Check file size
        if (file.size > this.options.maxSize) {
            const maxSizeMB = this.options.maxSize / (1024 * 1024);
            this.options.onError(`File size must not exceed ${maxSizeMB}MB`);
            return false;
        }

        return true;
    }

    addFile(file) {
        const fileObj = {
            id: Date.now() + Math.random(),
            file: file,
            name: file.name,
            size: file.size,
            type: file.type,
            url: URL.createObjectURL(file)
        };

        this.files.push(fileObj);
    }

    removeFile(fileId) {
        const index = this.files.findIndex(f => f.id === fileId);
        if (index > -1) {
            // Revoke object URL to free memory
            URL.revokeObjectURL(this.files[index].url);
            this.files.splice(index, 1);
            this.updatePreview();
            this.options.onUpload(this.files);
        }
    }

    updatePreview() {
        if (!this.previewContainer) return;

        if (this.files.length === 0) {
            this.previewContainer.innerHTML = '';
            return;
        }

        this.previewContainer.innerHTML = this.files.map(fileObj => `
            <div class="file-preview-item">
                <div class="file-preview-image">
                    <img src="${fileObj.url}" alt="${fileObj.name}" loading="lazy">
                </div>
                <div class="file-preview-info">
                    <span class="file-name">${fileObj.name}</span>
                    <span class="file-size">${this.formatFileSize(fileObj.size)}</span>
                </div>
                <button type="button" class="file-remove" onclick="this.closest('.form-container').fileUpload?.removeFile('${fileObj.id}')">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `).join('');
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    getFiles() {
        return this.files.map(f => f.file);
    }

    clear() {
        this.files.forEach(fileObj => {
            URL.revokeObjectURL(fileObj.url);
        });
        this.files = [];
        this.updatePreview();
        
        // Clear file input
        const fileInput = this.container.querySelector('input[type="file"]');
        if (fileInput) {
            fileInput.value = '';
        }
    }
}

// Initialize global instances
let notificationManager;
let formValidator;

document.addEventListener('DOMContentLoaded', () => {
    notificationManager = new NotificationManager();
    formValidator = new FormValidator();
    
    console.log('🧩 Components initialized successfully');
});

// Global notification function
function showNotification(message, type = 'info', duration = 5000) {
    if (notificationManager) {
        return notificationManager.show(message, type, duration);
    } else {
        // Fallback to console if notification system not ready
        console.log(`[${type.toUpperCase()}] ${message}`);
    }
}

// Export for global use
window.notificationManager = notificationManager;
window.formValidator = formValidator;
window.showNotification = showNotification;
window.FileUpload = FileUpload;