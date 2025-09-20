// voice.js - Complete Voice Input System

class VoiceInputManager {
    constructor() {
        this.recognition = null;
        this.isListening = false;
        this.currentModal = null;
        this.targetField = null;
        this.transcript = '';
        this.interimTranscript = '';
        this.init();
    }

    init() {
        console.log('🎤 Voice Input Manager initializing...');
        
        // Check for speech recognition support
        if (!this.checkSupport()) {
            console.warn('🚫 Speech recognition not supported in this browser');
            return;
        }

        this.setupSpeechRecognition();
        console.log('✅ Voice input system ready');
    }

    checkSupport() {
        return !!(window.SpeechRecognition || window.webkitSpeechRecognition);
    }

    setupSpeechRecognition() {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        
        if (!SpeechRecognition) return;

        this.recognition = new SpeechRecognition();
        this.recognition.continuous = CONFIG.AI.VOICE.CONTINUOUS;
        this.recognition.interimResults = CONFIG.AI.VOICE.INTERIM_RESULTS;
        this.recognition.lang = CONFIG.AI.VOICE.LANGUAGE;
        this.recognition.maxAlternatives = CONFIG.AI.VOICE.MAX_ALTERNATIVES || 1;

        // Event listeners
        this.recognition.onstart = () => {
            console.log('🎤 Voice recognition started');
            this.isListening = true;
            this.updateModalUI('listening');
        };

        this.recognition.onresult = (event) => {
            let interimTranscript = '';
            let finalTranscript = '';

            for (let i = event.resultIndex; i < event.results.length; i++) {
                const transcript = event.results[i][0].transcript;
                if (event.results[i].isFinal) {
                    finalTranscript += transcript;
                } else {
                    interimTranscript += transcript;
                }
            }

            this.transcript += finalTranscript;
            this.interimTranscript = interimTranscript;
            
            this.updateTranscriptDisplay();
            console.log('📝 Transcript updated:', this.transcript + interimTranscript);
        };

        this.recognition.onerror = (event) => {
            console.error('🚫 Speech recognition error:', event.error);
            this.handleError(event.error);
        };

        this.recognition.onend = () => {
            console.log('🛑 Voice recognition ended');
            this.isListening = false;
            this.updateModalUI('stopped');
        };
    }

    async startListening(targetFieldId = null) {
        if (!this.recognition) {
            showNotification('🚫 Speech recognition not supported in this browser', 'error');
            return;
        }

        this.targetField = targetFieldId;
        this.transcript = '';
        this.interimTranscript = '';

        try {
            // Request microphone permission
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            stream.getTracks().forEach(track => track.stop()); // Stop the stream immediately

            this.showVoiceModal();
            this.recognition.start();
            
            // Auto-stop after timeout
            setTimeout(() => {
                if (this.isListening) {
                    this.stopListening();
                }
            }, CONFIG.AI.VOICE.TIMEOUT);

        } catch (error) {
            console.error('🚫 Microphone permission error:', error);
            this.handleError('microphone-permission');
        }
    }

    stopListening() {
        if (this.recognition && this.isListening) {
            this.recognition.stop();
        }
    }

    showVoiceModal() {
        // Remove existing modal
        this.hideVoiceModal();

        const modal = document.createElement('div');
        modal.id = 'voiceInputModal';
        modal.className = 'voice-modal';
        modal.innerHTML = `
            <div class="voice-modal-overlay" onclick="voiceManager.hideVoiceModal()"></div>
            <div class="voice-modal-content">
                <div class="voice-modal-header">
                    <h3><i class="fas fa-microphone"></i> Voice Input</h3>
                    <button class="voice-modal-close" onclick="voiceManager.hideVoiceModal()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                
                <div class="voice-modal-body">
                    <div class="voice-status" id="voiceStatus">
                        <div class="microphone-animation">
                            <div class="mic-icon">
                                <i class="fas fa-microphone"></i>
                            </div>
                            <div class="pulse-ring"></div>
                        </div>
                        <p class="status-text">Click "Start Recording" to begin</p>
                    </div>
                    
                    <div class="transcript-container" id="transcriptContainer">
                        <label>Your speech will appear here:</label>
                        <div class="transcript-display" id="transcriptDisplay">
                            <span class="transcript-final" id="transcriptFinal"></span>
                            <span class="transcript-interim" id="transcriptInterim"></span>
                        </div>
                    </div>
                    
                    <div class="voice-controls" id="voiceControls">
                        <button class="btn btn-primary" id="startRecordingBtn" onclick="voiceManager.toggleRecording()">
                            <i class="fas fa-microphone"></i>
                            Start Recording
                        </button>
                        <button class="btn btn-secondary" id="clearTranscriptBtn" onclick="voiceManager.clearTranscript()" style="display: none;">
                            <i class="fas fa-eraser"></i>
                            Clear
                        </button>
                    </div>
                    
                    <div class="voice-actions" id="voiceActions" style="display: none;">
                        <button class="btn btn-success" onclick="voiceManager.useTranscript()">
                            <i class="fas fa-check"></i>
                            Use This Text
                        </button>
                        <button class="btn btn-secondary" onclick="voiceManager.retryRecording()">
                            <i class="fas fa-redo"></i>
                            Try Again
                        </button>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        this.currentModal = modal;
        this.addVoiceStyles();

        // Show modal with animation
        setTimeout(() => {
            modal.classList.add('active');
        }, 10);
    }

    hideVoiceModal() {
        if (this.currentModal) {
            this.stopListening();
            this.currentModal.classList.remove('active');
            
            setTimeout(() => {
                if (this.currentModal && this.currentModal.parentNode) {
                    this.currentModal.parentNode.removeChild(this.currentModal);
                }
                this.currentModal = null;
            }, 300);
        }
    }

    updateModalUI(status) {
        if (!this.currentModal) return;

        const statusElement = document.getElementById('voiceStatus');
        const startBtn = document.getElementById('startRecordingBtn');
        const voiceActions = document.getElementById('voiceActions');
        const clearBtn = document.getElementById('clearTranscriptBtn');

        switch (status) {
            case 'listening':
                statusElement.classList.add('listening');
                if (startBtn) {
                    startBtn.innerHTML = '<i class="fas fa-stop"></i> Stop Recording';
                    startBtn.classList.remove('btn-primary');
                    startBtn.classList.add('btn-danger');
                }
                document.querySelector('.status-text').textContent = 'Listening... Speak now!';
                break;

            case 'stopped':
                statusElement.classList.remove('listening');
                if (startBtn) {
                    startBtn.innerHTML = '<i class="fas fa-microphone"></i> Start Recording';
                    startBtn.classList.remove('btn-danger');
                    startBtn.classList.add('btn-primary');
                }
                
                if (this.transcript.trim()) {
                    document.querySelector('.status-text').textContent = 'Recording complete. Review your text below.';
                    voiceActions.style.display = 'flex';
                    clearBtn.style.display = 'inline-block';
                } else {
                    document.querySelector('.status-text').textContent = 'No speech detected. Try again.';
                }
                break;
        }
    }

    updateTranscriptDisplay() {
        if (!this.currentModal) return;

        const finalElement = document.getElementById('transcriptFinal');
        const interimElement = document.getElementById('transcriptInterim');

        if (finalElement) {
            finalElement.textContent = this.transcript;
        }
        
        if (interimElement) {
            interimElement.textContent = this.interimTranscript;
        }

        // Show clear button if there's content
        const clearBtn = document.getElementById('clearTranscriptBtn');
        if (clearBtn && (this.transcript || this.interimTranscript)) {
            clearBtn.style.display = 'inline-block';
        }
    }

    toggleRecording() {
        if (this.isListening) {
            this.stopListening();
        } else {
            this.recognition.start();
        }
    }

    clearTranscript() {
        this.transcript = '';
        this.interimTranscript = '';
        this.updateTranscriptDisplay();
        
        document.getElementById('voiceActions').style.display = 'none';
        document.getElementById('clearTranscriptBtn').style.display = 'none';
        document.querySelector('.status-text').textContent = 'Click "Start Recording" to begin';
    }

    retryRecording() {
        this.clearTranscript();
        setTimeout(() => {
            this.recognition.start();
        }, 500);
    }

    useTranscript() {
        if (!this.transcript.trim()) {
            showNotification('⚠️ No text to use. Please record something first.', 'warning');
            return;
        }

        // Apply transcript to target field
        if (this.targetField) {
            const field = document.getElementById(this.targetField);
            if (field) {
                if (field.tagName.toLowerCase() === 'textarea' || field.tagName.toLowerCase() === 'input') {
                    field.value = this.transcript.trim();
                    field.dispatchEvent(new Event('input', { bubbles: true }));
                    field.focus();
                }
            }
        }

        showNotification('✅ Voice input applied successfully!', 'success');
        this.hideVoiceModal();
    }

    handleError(errorType) {
        this.isListening = false;
        this.updateModalUI('stopped');

        let message = '';
        let suggestion = '';

        switch (errorType) {
            case 'no-speech':
                message = 'No speech detected';
                suggestion = 'Please try speaking louder and clearer';
                break;
            case 'audio-capture':
                message = 'Microphone not accessible';
                suggestion = 'Please check your microphone permissions';
                break;
            case 'not-allowed':
            case 'microphone-permission':
                message = 'Microphone permission denied';
                suggestion = 'Please allow microphone access and try again';
                break;
            case 'network':
                message = 'Network error during voice recognition';
                suggestion = 'Please check your internet connection';
                break;
            case 'aborted':
                message = 'Voice recognition was stopped';
                break;
            default:
                message = 'Voice recognition error occurred';
                suggestion = 'Please try again or check browser compatibility';
        }

        document.querySelector('.status-text').textContent = message + (suggestion ? '. ' + suggestion : '');
        
        if (errorType !== 'aborted') {
            showNotification(`🚫 ${message}`, 'error');
            if (suggestion) {
                setTimeout(() => {
                    showNotification(`💡 ${suggestion}`, 'info');
                }, 2000);
            }
        }
    }

    addVoiceStyles() {
        if (document.getElementById('voice-input-styles')) return;

        const styles = document.createElement('style');
        styles.id = 'voice-input-styles';
        styles.textContent = `
            .voice-modal {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                z-index: 10000;
                opacity: 0;
                visibility: hidden;
                transition: all 0.3s ease;
            }

            .voice-modal.active {
                opacity: 1;
                visibility: visible;
            }

            .voice-modal-overlay {
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.7);
                backdrop-filter: blur(8px);
            }

            .voice-modal-content {
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%) scale(0.8);
                background: white;
                border-radius: 20px;
                box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
                width: 90%;
                max-width: 500px;
                max-height: 90vh;
                overflow: hidden;
                transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
            }

            .voice-modal.active .voice-modal-content {
                transform: translate(-50%, -50%) scale(1);
            }

            .voice-modal-header {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                padding: 20px 24px;
                display: flex;
                align-items: center;
                justify-content: space-between;
            }

            .voice-modal-header h3 {
                margin: 0;
                font-size: 20px;
                font-weight: 600;
                display: flex;
                align-items: center;
                gap: 10px;
            }

            .voice-modal-close {
                background: none;
                border: none;
                color: white;
                font-size: 24px;
                cursor: pointer;
                padding: 5px;
                border-radius: 50%;
                width: 36px;
                height: 36px;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: all 0.2s;
            }

            .voice-modal-close:hover {
                background: rgba(255, 255, 255, 0.1);
                transform: scale(1.1);
            }

            .voice-modal-body {
                padding: 32px 24px;
                text-align: center;
            }

            .voice-status {
                margin-bottom: 32px;
                position: relative;
            }

            .microphone-animation {
                position: relative;
                display: inline-block;
                margin-bottom: 20px;
            }

            .mic-icon {
                width: 80px;
                height: 80px;
                border-radius: 50%;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                display: flex;
                align-items: center;
                justify-content: center;
                color: white;
                font-size: 32px;
                position: relative;
                z-index: 2;
                box-shadow: 0 8px 32px rgba(102, 126, 234, 0.3);
            }

            .pulse-ring {
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                width: 80px;
                height: 80px;
                border-radius: 50%;
                background: transparent;
                border: 3px solid rgba(102, 126, 234, 0.3);
                opacity: 0;
            }

            .voice-status.listening .pulse-ring {
                animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
            }

            @keyframes pulse {
                0% {
                    opacity: 1;
                    transform: translate(-50%, -50%) scale(1);
                }
                100% {
                    opacity: 0;
                    transform: translate(-50%, -50%) scale(2);
                }
            }

            .status-text {
                font-size: 18px;
                color: #4a5568;
                margin: 0;
                font-weight: 500;
            }

            .transcript-container {
                margin: 24px 0;
                text-align: left;
            }

            .transcript-container label {
                display: block;
                margin-bottom: 8px;
                font-weight: 600;
                color: #2d3748;
                font-size: 14px;
            }

            .transcript-display {
                min-height: 100px;
                max-height: 200px;
                overflow-y: auto;
                padding: 16px;
                border: 2px solid #e2e8f0;
                border-radius: 12px;
                background: #f7fafc;
                font-size: 16px;
                line-height: 1.6;
                color: #2d3748;
                white-space: pre-wrap;
                word-wrap: break-word;
            }

            .transcript-display:empty::before {
                content: 'Your speech will appear here...';
                color: #a0aec0;
                font-style: italic;
            }

            .transcript-final {
                color: #2d3748;
            }

            .transcript-interim {
                color: #718096;
                font-style: italic;
            }

            .voice-controls,
            .voice-actions {
                display: flex;
                gap: 12px;
                justify-content: center;
                margin-top: 24px;
                flex-wrap: wrap;
            }

            .voice-actions {
                border-top: 1px solid #e2e8f0;
                padding-top: 24px;
                margin-top: 24px;
            }

            @media (max-width: 480px) {
                .voice-modal-content {
                    width: 95%;
                    margin: 20px;
                }

                .voice-modal-body {
                    padding: 24px 16px;
                }

                .mic-icon {
                    width: 64px;
                    height: 64px;
                    font-size: 24px;
                }

                .pulse-ring {
                    width: 64px;
                    height: 64px;
                }

                .voice-controls,
                .voice-actions {
                    flex-direction: column;
                    gap: 8px;
                }

                .btn {
                    width: 100%;
                    justify-content: center;
                }
            }
        `;

        document.head.appendChild(styles);
    }
}

// Initialize voice manager
let voiceManager;

document.addEventListener('DOMContentLoaded', () => {
    voiceManager = new VoiceInputManager();
});

// Global function for starting voice input
function startVoiceInput(targetFieldId = null) {
    if (voiceManager) {
        voiceManager.startListening(targetFieldId);
    } else {
        showNotification('🚫 Voice input system not ready', 'error');
    }
}

// Export for global use
window.voiceManager = voiceManager;
window.startVoiceInput = startVoiceInput;