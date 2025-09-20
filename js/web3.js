// web3-stable.js - Stable Web3 Integration with Connection Loop Prevention

class Web3ManagerStable {
    constructor() {
        this.web3 = null;
        this.account = null;
        this.isConnected = false;
        this.isConnecting = false;
        this.isInitialized = false;
        this.enabled = true;
        this.demoMode = false;
        this.rewardPoolAddress = '0x694B31c92E618d24D254bb10e7BF22a4a3C1151b';
        this.transactionHistory = [];
        this.connectionAttempts = 0;
        this.maxConnectionAttempts = 3;
        this.eventListenersSetup = false;
        this.initializationTimeout = null;
        
        // Prevent multiple initializations
        if (window.web3ManagerInstance) {
            return window.web3ManagerInstance;
        }
        window.web3ManagerInstance = this;
        
        this.init();
    }

    async init() {
        if (this.isInitialized) {
            console.log('⚠️ Web3Manager already initialized, skipping...');
            return;
        }
        
        console.log('🔗 Initializing Stable Web3 Manager...');
        console.log('💰 Reward pool address:', this.rewardPoolAddress);
        
        // Clear any existing timeout
        if (this.initializationTimeout) {
            clearTimeout(this.initializationTimeout);
        }
        
        // Set initialization timeout to prevent hanging
        this.initializationTimeout = setTimeout(() => {
            if (!this.isInitialized) {
                console.log('⏰ Initialization timeout, falling back to demo mode');
                this.enableDemoMode();
            }
        }, 5000);
        
        try {
            // Wait a moment for page to settle
            await new Promise(resolve => setTimeout(resolve, 500));
            
            // Check for MetaMask with stability checks
            if (this.isMetaMaskAvailable()) {
                console.log('✅ MetaMask detected - initializing connection');
                this.demoMode = false;
                await this.initializeMetaMask();
            } else {
                console.log('🌐 MetaMask not available - using demo mode');
                this.enableDemoMode();
            }
            
            // Mark as initialized
            this.isInitialized = true;
            clearTimeout(this.initializationTimeout);
            
            // Update UI
            this.updateUI();
            
            // Load transaction history
            this.loadTransactionHistory();
            
            console.log('✅ Web3Manager initialized successfully');
            
        } catch (error) {
            console.error('❌ Web3 initialization error:', error);
            this.enableDemoMode();
        }
    }

    isMetaMaskAvailable() {
        return typeof window.ethereum !== 'undefined' && 
               window.ethereum.isMetaMask && 
               !window.ethereum.isConnecting;
    }

    async initializeMetaMask() {
        try {
            this.web3 = new Web3(window.ethereum);
            
            // Setup event listeners only once
            if (!this.eventListenersSetup) {
                this.setupEventListeners();
                this.eventListenersSetup = true;
            }
            
            // Check existing connection without triggering events
            await this.checkExistingConnection();
            
        } catch (error) {
            console.error('❌ MetaMask initialization error:', error);
            this.enableDemoMode();
        }
    }

    setupEventListeners() {
        if (!window.ethereum || this.eventListenersSetup) return;

        console.log('🔌 Setting up MetaMask event listeners...');

        try {
            // Debounced event handlers to prevent loops
            const debouncedAccountsChanged = this.debounce((accounts) => {
                if (!this.isConnecting) {
                    console.log('🔄 Accounts changed:', accounts.length);
                    this.handleAccountsChanged(accounts);
                }
            }, 500);

            const debouncedChainChanged = this.debounce((chainId) => {
                console.log('⛓️ Chain changed to:', chainId);
                this.handleChainChanged(chainId);
            }, 1000);

            const debouncedDisconnect = this.debounce(() => {
                if (!this.isConnecting) {
                    console.log('🔌 MetaMask disconnected');
                    this.handleDisconnect();
                }
            }, 500);

            // Remove existing listeners first
            if (window.ethereum.removeAllListeners) {
                window.ethereum.removeAllListeners('accountsChanged');
                window.ethereum.removeAllListeners('chainChanged');
                window.ethereum.removeAllListeners('disconnect');
            }

            // Add new listeners
            window.ethereum.on('accountsChanged', debouncedAccountsChanged);
            window.ethereum.on('chainChanged', debouncedChainChanged);
            window.ethereum.on('disconnect', debouncedDisconnect);

            console.log('✅ Event listeners setup complete');
            
        } catch (error) {
            console.warn('⚠️ Error setting up event listeners:', error);
        }
    }

    async checkExistingConnection() {
        if (!this.web3 || this.isConnecting) return;

        try {
            console.log('🔍 Checking existing wallet connection...');
            
            const accounts = await this.web3.eth.getAccounts();
            
            if (accounts && accounts.length > 0) {
                const newAccount = accounts[0];
                
                // Only update if account actually changed
                if (this.account !== newAccount) {
                    this.account = newAccount;
                    this.isConnected = true;
                    console.log('👤 Found existing connection:', this.formatAddress(this.account));
                    this.updateUI();
                    await this.loadBalance();
                } else {
                    console.log('✅ Connection status confirmed');
                }
            } else {
                if (this.isConnected) {
                    console.log('❌ No accounts found, disconnecting');
                    this.account = null;
                    this.isConnected = false;
                    this.updateUI();
                }
            }
        } catch (error) {
            console.warn('⚠️ Connection check failed:', error);
        }
    }

    enableDemoMode() {
        this.demoMode = true;
        this.isInitialized = true;
        this.isConnecting = false;
        
        if (this.initializationTimeout) {
            clearTimeout(this.initializationTimeout);
        }
        
        console.log('🎭 Demo mode enabled');
        this.createDemoInterface();
        this.updateUI();
        
        setTimeout(() => {
            if (typeof showNotification === 'function') {
                showNotification('🎭 Demo Mode: Full blockchain simulation active!', 'info', 5000);
            }
        }, 2000);
    }

    async connectWallet() {
        // Prevent multiple simultaneous connection attempts
        if (this.isConnecting) {
            console.log('⚠️ Connection already in progress...');
            return false;
        }

        if (this.demoMode) {
            return await this.connectDemoWallet();
        }

        if (this.connectionAttempts >= this.maxConnectionAttempts) {
            console.log('⚠️ Maximum connection attempts reached, using demo mode');
            this.enableDemoMode();
            return false;
        }

        this.isConnecting = true;
        this.connectionAttempts++;

        try {
            console.log(`🔌 Connecting to MetaMask (attempt ${this.connectionAttempts}/${this.maxConnectionAttempts})...`);

            if (!this.isMetaMaskAvailable()) {
                throw new Error('MetaMask not available');
            }

            // Show connecting state
            this.updateConnectingUI();

            const accounts = await window.ethereum.request({
                method: 'eth_requestAccounts'
            });

            if (accounts && accounts.length > 0) {
                this.account = accounts[0];
                this.isConnected = true;
                this.connectionAttempts = 0; // Reset on success
                
                console.log('✅ Wallet connected:', this.formatAddress(this.account));
                
                // Ensure correct network
                await this.ensureCorrectNetwork();
                
                // Update UI
                this.updateUI();
                
                // Load balance
                await this.loadBalance();
                
                if (typeof showNotification === 'function') {
                    showNotification('✅ Wallet connected successfully!', 'success', 4000);
                }
                
                return true;
            } else {
                throw new Error('No accounts returned');
            }
            
        } catch (error) {
            console.error('❌ Wallet connection error:', error);
            
            if (error.code === 4001) {
                if (typeof showNotification === 'function') {
                    showNotification('❌ Connection rejected by user', 'warning');
                }
            } else if (this.connectionAttempts >= this.maxConnectionAttempts) {
                if (typeof showNotification === 'function') {
                    showNotification('❌ Connection failed, switching to demo mode', 'error');
                }
                this.enableDemoMode();
            } else {
                if (typeof showNotification === 'function') {
                    showNotification('❌ Connection failed, please try again', 'error');
                }
            }
            
            return false;
            
        } finally {
            this.isConnecting = false;
            if (!this.demoMode) {
                this.updateUI();
            }
        }
    }

    async connectDemoWallet() {
        if (this.isConnecting) return false;
        
        this.isConnecting = true;
        
        try {
            console.log('🎭 Connecting demo wallet...');
            
            this.updateConnectingUI();

            if (typeof showNotification === 'function') {
                showNotification('🔄 Connecting demo wallet...', 'info', 2000);
            }
            
            // Simulate connection delay
            await new Promise(resolve => setTimeout(resolve, 1500));
            
            this.account = '0x742d35Cc6634C0532925a3b8D98d27f65d3c3eA6';
            this.isConnected = true;
            
            this.updateUI();
            this.loadDemoBalance();
            
            if (typeof showNotification === 'function') {
                showNotification('🎭 Demo wallet connected! Submit content to earn rewards!', 'success', 5000);
            }
            
            return true;
            
        } finally {
            this.isConnecting = false;
        }
    }

    updateConnectingUI() {
        const connectButton = document.getElementById('connectWallet');
        if (connectButton) {
            connectButton.disabled = true;
            connectButton.innerHTML = `
                <i class="fas fa-spinner fa-spin"></i>
                Connecting...
            `;
        }
    }

    async ensureCorrectNetwork() {
        if (this.demoMode || !window.ethereum) return;

        try {
            const chainId = await window.ethereum.request({ method: 'eth_chainId' });
            
            if (chainId !== CONFIG.BLOCKCHAIN.NETWORK.chainId) {
                console.log('🔄 Switching to correct network...');
                await this.switchNetwork();
            }
        } catch (error) {
            console.warn('⚠️ Network check error:', error);
        }
    }

    async switchNetwork() {
        try {
            await window.ethereum.request({
                method: 'wallet_switchEthereumChain',
                params: [{ chainId: CONFIG.BLOCKCHAIN.NETWORK.chainId }]
            });
            console.log('✅ Network switched successfully');
        } catch (switchError) {
            if (switchError.code === 4902) {
                try {
                    await window.ethereum.request({
                        method: 'wallet_addEthereumChain',
                        params: [CONFIG.BLOCKCHAIN.NETWORK]
                    });
                    console.log('✅ Network added successfully');
                } catch (addError) {
                    console.error('❌ Error adding network:', addError);
                }
            }
        }
    }

    async loadBalance() {
        if (this.demoMode) {
            return this.loadDemoBalance();
        }

        if (!this.account || !this.web3) return;

        try {
            const userContributions = this.getUserContributionCount();
            const shmBalance = (userContributions * 0.01).toFixed(3);
            
            this.updateBalanceUI('0.000', shmBalance);
            
        } catch (error) {
            console.warn('⚠️ Balance loading error:', error);
        }
    }

    loadDemoBalance() {
        const userContributions = this.getUserContributionCount();
        const shmBalance = (0.123 + userContributions * 0.01).toFixed(3);
        
        this.updateBalanceUI('2.456', shmBalance);
    }

    getUserContributionCount() {
        try {
            if (typeof UTILS !== 'undefined' && UTILS.storage) {
                const feedbacks = UTILS.storage.getFeedbacks() || [];
                const reports = UTILS.storage.getReports() || [];
                return feedbacks.length + reports.length;
            }
        } catch (error) {
            console.warn('Error getting contribution count:', error);
        }
        return 0;
    }

    updateUI() {
        const connectButton = document.getElementById('connectWallet');
        if (!connectButton) return;

        // Reset disabled state
        connectButton.disabled = false;

        if (this.isConnected && this.account) {
            const walletType = this.demoMode ? ' (Demo)' : '';
            
            connectButton.innerHTML = `
                <i class="fas fa-wallet"></i>
                ${this.formatAddress(this.account)}${walletType}
            `;
            connectButton.classList.add('connected');
            
            // Remove old click handler and add new one
            connectButton.onclick = null;
            connectButton.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.showWalletMenu();
            }, { once: true });

        } else {
            const buttonText = this.demoMode ? 'Connect Demo Wallet' : 'Connect Wallet';
            
            connectButton.innerHTML = `
                <i class="fas fa-wallet"></i>
                ${buttonText}
            `;
            connectButton.classList.remove('connected');
            
            // Remove old click handler and add new one
            connectButton.onclick = null;
            connectButton.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.connectWallet();
            }, { once: true });
        }
    }

    updateBalanceUI(nativeBalance, shmBalance) {
        const userPoints = document.getElementById('userPoints');
        const userPointsProfile = document.getElementById('userPointsProfile');
        
        const formattedBalance = `${parseFloat(shmBalance).toFixed(3)} SHM`;
        
        if (userPoints) {
            userPoints.textContent = formattedBalance;
        }
        
        if (userPointsProfile) {
            userPointsProfile.textContent = formattedBalance;
        }
    }

    async disconnectWallet() {
        if (this.isConnecting) {
            console.log('⚠️ Cannot disconnect while connecting');
            return;
        }

        console.log('👋 Disconnecting wallet...');
        
        this.account = null;
        this.isConnected = false;
        this.connectionAttempts = 0;
        
        this.updateUI();
        
        const walletType = this.demoMode ? 'Demo wallet' : 'Wallet';
        if (typeof showNotification === 'function') {
            showNotification(`👋 ${walletType} disconnected`, 'info');
        }
    }

    // Event Handlers with loop prevention
    handleAccountsChanged(accounts) {
        if (this.isConnecting) {
            console.log('⚠️ Ignoring account change during connection');
            return;
        }

        console.log('🔄 Handling account change...');
        
        if (!accounts || accounts.length === 0) {
            if (this.isConnected) {
                console.log('❌ No accounts, disconnecting');
                this.disconnectWallet();
            }
        } else {
            const newAccount = accounts[0];
            if (this.account !== newAccount) {
                console.log('🔄 Account switched to:', this.formatAddress(newAccount));
                this.account = newAccount;
                this.isConnected = true;
                this.updateUI();
                this.loadBalance();
            }
        }
    }

    handleChainChanged(chainId) {
        console.log('⛓️ Chain changed to:', chainId);
        // Reload page to reset connection state
        setTimeout(() => {
            window.location.reload();
        }, 1000);
    }

    handleDisconnect() {
        if (!this.isConnecting) {
            console.log('🔌 Handling disconnect...');
            this.disconnectWallet();
        }
    }

    // Utility functions
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    formatAddress(address) {
        if (!address) return '';
        return `${address.substr(0, 6)}...${address.substr(-4)}`;
    }

    // Reward system methods (simplified to prevent errors)
    async sendReward(recipientAddress, amount = 0.01) {
        if (!this.isConnected) {
            return this.simulateReward(amount);
        }

        if (this.demoMode) {
            return await this.sendDemoReward(recipientAddress, amount);
        }

        return await this.trackReward(recipientAddress, amount);
    }

    simulateReward(amount) {
        const rewardTx = {
            hash: `0xsim${Date.now()}${Math.random().toString(36).substr(2, 6)}`,
            from: this.rewardPoolAddress,
            to: 'Pending Connection',
            amount: amount,
            timestamp: Date.now(),
            status: 'simulated',
            type: 'reward'
        };
        
        this.recordTransaction(rewardTx);
        
        if (typeof showNotification === 'function') {
            showNotification(`🪙 You earned ${amount} SHM! Connect wallet to track rewards.`, 'success', 5000);
        }
        
        return rewardTx.hash;
    }

    async sendDemoReward(recipientAddress, amount) {
        const demoTx = {
            hash: `0xdemo${Date.now()}${Math.random().toString(36).substr(2, 6)}`,
            from: this.rewardPoolAddress,
            to: recipientAddress,
            amount: amount,
            timestamp: Date.now(),
            status: 'confirmed',
            type: 'reward',
            demo: true
        };
        
        this.recordTransaction(demoTx);
        
        if (typeof showNotification === 'function') {
            showNotification(`🎉 Demo reward earned! +${amount} SHM tokens!`, 'success', 6000);
        }
        
        setTimeout(() => this.loadDemoBalance(), 1000);
        return demoTx.hash;
    }

    async trackReward(recipientAddress, amount) {
        const trackTx = {
            hash: `0xtrack${Date.now()}${Math.random().toString(36).substr(2, 6)}`,
            from: this.rewardPoolAddress,
            to: recipientAddress,
            amount: amount,
            timestamp: Date.now(),
            status: 'tracked',
            type: 'reward'
        };
        
        this.recordTransaction(trackTx);
        
        if (typeof showNotification === 'function') {
            showNotification(`🎉 Reward earned! +${amount} SHM added to your balance!`, 'success', 6000);
        }
        
        setTimeout(() => this.loadBalance(), 1000);
        return trackTx.hash;
    }

    recordTransaction(transaction) {
        this.transactionHistory.unshift(transaction);
        
        // Keep only last 50 transactions
        if (this.transactionHistory.length > 50) {
            this.transactionHistory = this.transactionHistory.slice(0, 50);
        }
        
        // Save to storage
        if (typeof UTILS !== 'undefined' && UTILS.storage) {
            UTILS.storage.set('transaction_history', this.transactionHistory);
        }
    }

    loadTransactionHistory() {
        try {
            if (typeof UTILS !== 'undefined' && UTILS.storage) {
                this.transactionHistory = UTILS.storage.get('transaction_history') || [];
            }
            console.log('📜 Loaded', this.transactionHistory.length, 'reward transactions');
        } catch (error) {
            console.warn('Error loading transaction history:', error);
            this.transactionHistory = [];
        }
    }

    // Demo interface methods
    createDemoInterface() {
        // Simplified demo interface to prevent complexity
        console.log('🎭 Demo interface ready');
    }

    showWalletMenu() {
        // Remove any existing menus first
        document.querySelectorAll('.dropdown-menu').forEach(menu => menu.remove());
        
        const menu = document.createElement('div');
        menu.className = 'dropdown-menu active';
        menu.style.cssText = `
            position: absolute;
            top: 100%;
            right: 0;
            background: white;
            border: 1px solid #e5e7eb;
            border-radius: 12px;
            box-shadow: 0 8px 25px rgba(0,0,0,0.15);
            min-width: 200px;
            z-index: 1500;
            padding: 8px 0;
        `;
        
        const refreshText = this.demoMode ? 'Refresh Demo' : 'Refresh Balance';
        
        menu.innerHTML = `
            <button class="dropdown-item" onclick="web3Manager.copyAddress(); this.parentElement.remove();">
                <i class="fas fa-copy"></i>
                Copy Address
            </button>
            <button class="dropdown-item" onclick="web3Manager.loadBalance(); this.parentElement.remove();">
                <i class="fas fa-sync-alt"></i>
                ${refreshText}
            </button>
            <div style="height: 1px; background: #e5e7eb; margin: 8px 0;"></div>
            <button class="dropdown-item" onclick="web3Manager.disconnectWallet(); this.parentElement.remove();" style="color: #ef4444;">
                <i class="fas fa-sign-out-alt"></i>
                Disconnect
            </button>
        `;

        document.getElementById('walletStatus').appendChild(menu);
        
        // Auto-remove menu when clicking outside
        setTimeout(() => {
            document.addEventListener('click', function removeMenu(e) {
                if (!menu.contains(e.target) && !e.target.closest('#walletStatus')) {
                    menu.remove();
                    document.removeEventListener('click', removeMenu);
                }
            }, { once: true });
        }, 100);
    }

    copyAddress() {
        if (this.account && navigator.clipboard) {
            navigator.clipboard.writeText(this.account).then(() => {
                if (typeof showNotification === 'function') {
                    showNotification('📋 Address copied!', 'success');
                }
            }).catch(() => {
                console.log('Fallback: Address is', this.account);
            });
        }
    }

    getStats() {
        return {
            initialized: this.isInitialized,
            connected: this.isConnected,
            connecting: this.isConnecting,
            account: this.account,
            demoMode: this.demoMode,
            rewardCount: this.transactionHistory.length
        };
    }
}

// Initialize with connection loop prevention
let web3Manager;

function initializeWeb3Manager() {
    if (web3Manager && web3Manager.isInitialized) {
        console.log('✅ Web3Manager already initialized');
        return web3Manager;
    }
    
    console.log('🚀 Creating new Web3Manager instance...');
    web3Manager = new Web3ManagerStable();
    return web3Manager;
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeWeb3Manager);
} else {
    // DOM is already ready
    setTimeout(initializeWeb3Manager, 100);
}

// Export for global use
window.web3Manager = web3Manager;
window.initializeWeb3Manager = initializeWeb3Manager;