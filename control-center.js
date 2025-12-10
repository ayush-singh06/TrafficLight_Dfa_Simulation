// TrafficDFA Class - Implements the Deterministic Finite Automaton for traffic control
class TrafficDFA {
    /**
     * Constructor initializes the DFA with default parameters
     * Q: States (NS_GREEN_EW_RED, NS_YELLOW_EW_RED, NS_RED_EW_GREEN, NS_RED_EW_YELLOW, PEDESTRIAN_WALK)
     * Σ: Input alphabet (TIMER_EXPIRED, EMERGENCY_OVERRIDE, PEDESTRIAN_REQUEST)
     * δ: Transition function (defined in transitionFunction)
     * q0: Initial state (NS_GREEN_EW_RED)
     * F: Accept states (all states are accept states in this implementation)
     */
    constructor() {
        // DFA States
        this.States = {
            NS_GREEN_EW_RED: 0,
            NS_YELLOW_EW_RED: 1,
            NS_RED_EW_GREEN: 2,
            NS_RED_EW_YELLOW: 3,
            PEDESTRIAN_WALK: 4
        };

        // Input alphabet
        this.Inputs = {
            TIMER_EXPIRED: 'TIMER_EXPIRED',
            EMERGENCY_OVERRIDE: 'EMERGENCY_OVERRIDE',
            PEDESTRIAN_REQUEST: 'PEDESTRIAN_REQUEST',
            FORCE_RED: 'FORCE_RED',
            FORCE_GREEN: 'FORCE_GREEN'
        };

        // Emergency states
        this.EmergencyStates = {
            STANDBY: 0,
            ACTIVATED: 1,
            CLEARING: 2
        };

        // Initialize state variables
        this.currentState = this.States.NS_GREEN_EW_RED;
        this.previousState = null;
        this.emergencyState = this.EmergencyStates.STANDBY;
        this.pedestrianRequested = false;
        this.isPaused = false;
        this.speedFactor = 1;
        
        // Timing configuration (can be modified)
        this.config = {
            NS_GREEN_DURATION: 15, // seconds
            NS_YELLOW_DURATION: 3,
            EW_GREEN_DURATION: 15,
            EW_YELLOW_DURATION: 3,
            PEDESTRIAN_DURATION: 10
        };
        
        // Statistics tracking
        this.stats = {
            stateTimes: {
                [this.States.NS_GREEN_EW_RED]: 0,
                [this.States.NS_YELLOW_EW_RED]: 0,
                [this.States.NS_RED_EW_GREEN]: 0,
                [this.States.NS_RED_EW_YELLOW]: 0,
                [this.States.PEDESTRIAN_WALK]: 0
            },
            totalTransitions: 0,
            startTime: Date.now()
        };
        
        // Event logging
        this.eventLog = [];
        this.maxLogEntries = 50;
        
        // DOM elements cache
        this.elements = {};
        
        // Timers
        this.stateTimer = null;
        this.transitionTimeout = null;
        this.emergencyTimeout = null;
        
        // Load saved configuration from localStorage
        this.loadConfiguration();
        
        // Initialize the simulation
        this.initializeElements();
        this.updateDisplay();
        this.drawDFA();
    }
    
    /**
     * Initializes DOM element references for better performance
     */
    initializeElements() {
        this.elements = {
            // Traffic lights
            nsRed: document.getElementById('ns-red'),
            nsYellow: document.getElementById('ns-yellow'),
            nsGreen: document.getElementById('ns-green'),
            ewRed: document.getElementById('ew-red'),
            ewYellow: document.getElementById('ew-yellow'),
            ewGreen: document.getElementById('ew-green'),
            nsStatus: document.getElementById('ns-status'),
            ewStatus: document.getElementById('ew-status'),
            
            // DFA visualization
            dfaCanvas: document.getElementById('dfa-canvas'),
            tupleDisplay: document.getElementById('tuple-display'),
            
            // Controls
            playBtn: document.getElementById('play-btn'),
            pauseBtn: document.getElementById('pause-btn'),
            resetBtn: document.getElementById('reset-btn'),
            speedSlider: document.getElementById('speed-slider'),
            speedValue: document.getElementById('speed-value'),
            forceRedBtn: document.getElementById('force-red-btn'),
            forceGreenBtn: document.getElementById('force-green-btn'),
            emergencyBtn: document.getElementById('emergency-btn'),
            pedestrianBtn: document.getElementById('pedestrian-btn'),
            
            // Configuration form
            configForm: document.getElementById('config-form'),
            nsGreenTime: document.getElementById('ns-green-time'),
            nsYellowTime: document.getElementById('ns-yellow-time'),
            ewGreenTime: document.getElementById('ew-green-time'),
            ewYellowTime: document.getElementById('ew-yellow-time'),
            pedestrianTime: document.getElementById('pedestrian-time'),
            
            // Analytics
            redProgress: document.getElementById('red-progress'),
            greenProgress: document.getElementById('green-progress'),
            yellowProgress: document.getElementById('yellow-progress'),
            logOutput: document.getElementById('log-output')
        };
    }
    
    /**
     * Loads configuration from localStorage if available
     */
    loadConfiguration() {
        try {
            const savedConfig = localStorage.getItem('trafficDFAConfig');
            if (savedConfig) {
                this.config = JSON.parse(savedConfig);
                this.logEvent('Configuration loaded from localStorage');
            }
        } catch (e) {
            console.warn('Failed to load configuration from localStorage:', e);
        }
    }
    
    /**
     * Saves current configuration to localStorage
     */
    saveConfiguration() {
        try {
            localStorage.setItem('trafficDFAConfig', JSON.stringify(this.config));
            this.logEvent('Configuration saved to localStorage');
        } catch (e) {
            console.warn('Failed to save configuration to localStorage:', e);
        }
    }
    
    /**
     * Updates the visual display based on the current state
     */
    updateDisplay() {
        // Turn off all lights
        Object.values(this.elements).forEach(el => {
            if (el && el.classList && el.classList.contains('light')) {
                el.classList.remove('on');
            }
        });
        
        // Turn on appropriate lights based on state
        switch (this.currentState) {
            case this.States.NS_GREEN_EW_RED:
                this.elements.nsGreen?.classList.add('on');
                this.elements.ewRed?.classList.add('on');
                this.elements.nsStatus.textContent = 'GO';
                this.elements.ewStatus.textContent = 'STOP';
                break;
                
            case this.States.NS_YELLOW_EW_RED:
                this.elements.nsYellow?.classList.add('on');
                this.elements.ewRed?.classList.add('on');
                this.elements.nsStatus.textContent = 'CAUTION';
                this.elements.ewStatus.textContent = 'STOP';
                break;
                
            case this.States.NS_RED_EW_GREEN:
                this.elements.nsRed?.classList.add('on');
                this.elements.ewGreen?.classList.add('on');
                this.elements.nsStatus.textContent = 'STOP';
                this.elements.ewStatus.textContent = 'GO';
                break;
                
            case this.States.NS_RED_EW_YELLOW:
                this.elements.nsRed?.classList.add('on');
                this.elements.ewYellow?.classList.add('on');
                this.elements.nsStatus.textContent = 'STOP';
                this.elements.ewStatus.textContent = 'CAUTION';
                break;
                
            case this.States.PEDESTRIAN_WALK:
                this.elements.nsRed?.classList.add('on');
                this.elements.ewRed?.classList.add('on');
                this.elements.nsStatus.textContent = 'STOP (PED)';
                this.elements.ewStatus.textContent = 'STOP (PED)';
                break;
        }
        
        // Update tuple display
        this.updateTupleDisplay();
        
        // Update DFA visualization
        this.drawDFA();
        
        // Update analytics
        this.updateAnalytics();
    }
    
    /**
     * Updates the current state tuple display
     */
    updateTupleDisplay() {
        if (!this.elements.tupleDisplay) return;
        
        let input = this.Inputs.TIMER_EXPIRED;
        if (this.emergencyState === this.EmergencyStates.ACTIVATED) {
            input = this.Inputs.EMERGENCY_OVERRIDE;
        } else if (this.pedestrianRequested) {
            input = this.Inputs.PEDESTRIAN_REQUEST;
        }
        
        const nextState = this.getNextState(this.currentState, input);
        this.elements.tupleDisplay.textContent = 
            `Current State: q${this.currentState} | Input: ${input} | Next State: q${nextState}`;
    }
    
    /**
     * Draws the DFA state diagram on the canvas
     */
    drawDFA() {
        if (!this.elements.dfaCanvas) return;
        
        const canvas = this.elements.dfaCanvas;
        const ctx = canvas.getContext('2d');
        const width = canvas.width;
        const height = canvas.height;
        
        // Clear canvas
        ctx.clearRect(0, 0, width, height);
        
        // Set background
        ctx.fillStyle = '#0a0a0f';
        ctx.fillRect(0, 0, width, height);
        
        // Define node positions (pentagon arrangement)
        const centerX = width / 2;
        const centerY = height / 2;
        const radius = Math.min(width, height) * 0.35;
        
        const nodes = [
            { 
                x: centerX + radius * Math.cos(0), 
                y: centerY + radius * Math.sin(0),
                label: 'NS Green\nEW Red',
                state: this.States.NS_GREEN_EW_RED
            },
            { 
                x: centerX + radius * Math.cos(Math.PI * 0.4), 
                y: centerY + radius * Math.sin(Math.PI * 0.4),
                label: 'NS Yellow\nEW Red',
                state: this.States.NS_YELLOW_EW_RED
            },
            { 
                x: centerX + radius * Math.cos(Math.PI * 0.8), 
                y: centerY + radius * Math.sin(Math.PI * 0.8),
                label: 'NS Red\nEW Green',
                state: this.States.NS_RED_EW_GREEN
            },
            { 
                x: centerX + radius * Math.cos(Math.PI * 1.2), 
                y: centerY + radius * Math.sin(Math.PI * 1.2),
                label: 'NS Red\nEW Yellow',
                state: this.States.NS_RED_EW_YELLOW
            },
            { 
                x: centerX + radius * Math.cos(Math.PI * 1.6), 
                y: centerY + radius * Math.sin(Math.PI * 1.6),
                label: 'Pedestrian\nWalk',
                state: this.States.PEDESTRIAN_WALK
            }
        ];
        
        // Draw connections (arrows between states)
        ctx.strokeStyle = '#00f7ff';
        ctx.lineWidth = 2;
        ctx.fillStyle = '#00f7ff';
        
        for (let i = 0; i < nodes.length; i++) {
            const fromNode = nodes[i];
            const toNode = nodes[(i + 1) % nodes.length];
            this.drawArrow(ctx, fromNode.x, fromNode.y, toNode.x, toNode.y);
        }
        
        // Draw nodes
        nodes.forEach(node => {
            // Highlight current state
            if (node.state === this.currentState) {
                // Outer glow for current state
                ctx.fillStyle = 'rgba(255, 0, 128, 0.3)';
                ctx.beginPath();
                ctx.arc(node.x, node.y, 35, 0, Math.PI * 2);
                ctx.fill();
                
                // Pulsing effect
                const pulseSize = 30 + 5 * Math.sin(Date.now() / 200);
                ctx.strokeStyle = 'rgba(255, 0, 128, 0.7)';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.arc(node.x, node.y, pulseSize, 0, Math.PI * 2);
                ctx.stroke();
            }
            
            // Node circle
            ctx.fillStyle = node.state === this.currentState ? '#ff00c8' : '#444';
            ctx.beginPath();
            ctx.arc(node.x, node.y, 30, 0, Math.PI * 2);
            ctx.fill();
            
            // Node border
            ctx.strokeStyle = '#00f7ff';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(node.x, node.y, 30, 0, Math.PI * 2);
            ctx.stroke();
            
            // Node label
            ctx.fillStyle = '#ffffff';
            ctx.font = '12px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            
            const lines = node.label.split('\n');
            lines.forEach((line, i) => {
                ctx.fillText(line, node.x, node.y + (i - (lines.length - 1) / 2) * 15);
            });
        });
    }
    
    /**
     * Draws an arrow from (fromX, fromY) to (toX, toY)
     */
    drawArrow(ctx, fromX, fromY, toX, toY) {
        const headLength = 15;
        const dx = toX - fromX;
        const dy = toY - fromY;
        const angle = Math.atan2(dy, dx);
        
        ctx.beginPath();
        ctx.moveTo(fromX, fromY);
        ctx.lineTo(toX, toY);
        ctx.stroke();
        
        // Draw arrowhead
        ctx.beginPath();
        ctx.moveTo(toX, toY);
        ctx.lineTo(toX - headLength * Math.cos(angle - Math.PI / 6), toY - headLength * Math.sin(angle - Math.PI / 6));
        ctx.lineTo(toX - headLength * Math.cos(angle + Math.PI / 6), toY - headLength * Math.sin(angle + Math.PI / 6));
        ctx.closePath();
        ctx.fill();
    }
    
    /**
     * Updates analytics displays
     */
    updateAnalytics() {
        // Update progress bars
        const totalTime = Object.values(this.stats.stateTimes).reduce((sum, time) => sum + time, 0);
        if (totalTime > 0) {
            const redPercent = Math.round((this.stats.stateTimes[this.States.NS_GREEN_EW_RED] / totalTime) * 100);
            const greenPercent = Math.round(((this.stats.stateTimes[this.States.NS_RED_EW_GREEN] + 
                                            this.stats.stateTimes[this.States.NS_RED_EW_YELLOW]) / totalTime) * 100);
            const yellowPercent = Math.round((this.stats.stateTimes[this.States.NS_YELLOW_EW_RED] / totalTime) * 100);
            
            if (this.elements.redProgress) this.elements.redProgress.style.width = `${redPercent}%`;
            if (this.elements.greenProgress) this.elements.greenProgress.style.width = `${greenPercent}%`;
            if (this.elements.yellowProgress) this.elements.yellowProgress.style.width = `${yellowPercent}%`;
        }
        
        // Update log display
        this.updateLogDisplay();
    }
    
    /**
     * Updates the log display with recent events
     */
    updateLogDisplay() {
        if (!this.elements.logOutput) return;
        
        this.elements.logOutput.innerHTML = '';
        this.eventLog.slice().reverse().forEach(entry => {
            const logEntry = document.createElement('div');
            logEntry.className = 'log-entry';
            logEntry.textContent = entry;
            this.elements.logOutput.appendChild(logEntry);
        });
        
        // Scroll to bottom
        this.elements.logOutput.scrollTop = this.elements.logOutput.scrollHeight;
    }
    
    /**
     * Logs an event with timestamp
     */
    logEvent(message) {
        const timestamp = new Date().toISOString().slice(11, 19); // HH:MM:SS format
        const logEntry = `[${timestamp}] ${message}`;
        
        // Add to log array
        this.eventLog.unshift(logEntry);
        
        // Keep only the last N entries
        if (this.eventLog.length > this.maxLogEntries) {
            this.eventLog = this.eventLog.slice(0, this.maxLogEntries);
        }
        
        // Save to localStorage
        try {
            localStorage.setItem('trafficDFAEventLog', JSON.stringify(this.eventLog));
        } catch (e) {
            console.warn('Failed to save event log to localStorage:', e);
        }
        
        // Update display
        this.updateLogDisplay();
    }
    
    /**
     * Gets the next state based on current state and input
     */
    getNextState(currentState, input) {
        // Handle emergency override
        if (input === this.Inputs.EMERGENCY_OVERRIDE) {
            return currentState; // Stay in current state but all lights go red
        }
        
        // Handle force commands
        if (input === this.Inputs.FORCE_RED) {
            return this.States.NS_GREEN_EW_RED; // Will be overridden by emergency logic
        }
        
        if (input === this.Inputs.FORCE_GREEN) {
            return this.States.NS_RED_EW_GREEN; // Will be overridden by emergency logic
        }
        
        // Handle pedestrian request
        if (input === this.Inputs.PEDESTRIAN_REQUEST && currentState !== this.States.PEDESTRIAN_WALK) {
            return this.States.PEDESTRIAN_WALK;
        }
        
        // Normal state transitions
        switch (currentState) {
            case this.States.NS_GREEN_EW_RED:
                return this.States.NS_YELLOW_EW_RED;
            case this.States.NS_YELLOW_EW_RED:
                return this.States.NS_RED_EW_GREEN;
            case this.States.NS_RED_EW_GREEN:
                return this.States.NS_RED_EW_YELLOW;
            case this.States.NS_RED_EW_YELLOW:
                return this.States.PEDESTRIAN_WALK;
            case this.States.PEDESTRIAN_WALK:
                return this.States.NS_GREEN_EW_RED;
            default:
                return this.States.NS_GREEN_EW_RED; // Default fallback
        }
    }
    
    /**
     * Advances the DFA to the next state
     */
    tick() {
        if (this.isPaused) return;
        
        // Record time spent in current state
        this.stats.stateTimes[this.currentState] += 1;
        
        // Handle emergency state
        if (this.emergencyState === this.EmergencyStates.ACTIVATED) {
            // Stay in emergency mode until cleared
            this.updateDisplay();
            return;
        }
        
        // Determine next state based on inputs
        let input = this.Inputs.TIMER_EXPIRED;
        if (this.pedestrianRequested) {
            input = this.Inputs.PEDESTRIAN_REQUEST;
        }
        
        const nextState = this.getNextState(this.currentState, input);
        
        // Log state transition
        this.logEvent(`State changed from q${this.currentState} to q${nextState}`);
        this.stats.totalTransitions++;
        
        // Update state
        this.previousState = this.currentState;
        this.currentState = nextState;
        
        // Handle pedestrian request fulfillment
        if (input === this.Inputs.PEDESTRIAN_REQUEST) {
            this.pedestrianRequested = false;
            if (this.elements.pedestrianBtn) {
                this.elements.pedestrianBtn.disabled = false;
                this.elements.pedestrianBtn.innerHTML = '<i class="fas fa-walking"></i> Pedestrian Request';
            }
        }
        
        // Update display
        this.updateDisplay();
        
        // Schedule next tick
        this.scheduleNextTick();
    }
    
    /**
     * Schedules the next tick based on current state duration
     */
    scheduleNextTick() {
        // Clear existing timeout
        if (this.transitionTimeout) {
            clearTimeout(this.transitionTimeout);
        }
        
        // Don't schedule if paused
        if (this.isPaused) return;
        
        // Determine duration based on current state
        let duration;
        switch (this.currentState) {
            case this.States.NS_GREEN_EW_RED:
                duration = this.config.NS_GREEN_DURATION;
                break;
            case this.States.NS_YELLOW_EW_RED:
                duration = this.config.NS_YELLOW_DURATION;
                break;
            case this.States.NS_RED_EW_GREEN:
                duration = this.config.EW_GREEN_DURATION;
                break;
            case this.States.NS_RED_EW_YELLOW:
                duration = this.config.EW_YELLOW_DURATION;
                break;
            case this.States.PEDESTRIAN_WALK:
                duration = this.config.PEDESTRIAN_DURATION;
                break;
            default:
                duration = 5; // Default fallback
        }
        
        // Adjust for speed factor
        duration = duration / this.speedFactor;
        
        // Schedule next tick
        this.transitionTimeout = setTimeout(() => {
            this.tick();
        }, duration * 1000);
    }
    
    /**
     * Starts the simulation
     */
    play() {
        if (!this.isPaused) return;
        
        this.isPaused = false;
        this.logEvent('Simulation resumed');
        this.scheduleNextTick();
        
        if (this.elements.playBtn) {
            this.elements.playBtn.innerHTML = '<i class="fas fa-pause"></i> Pause';
            this.elements.playBtn.onclick = () => this.pause();
        }
    }
    
    /**
     * Pauses the simulation
     */
    pause() {
        this.isPaused = true;
        if (this.transitionTimeout) {
            clearTimeout(this.transitionTimeout);
        }
        this.logEvent('Simulation paused');
        
        if (this.elements.playBtn) {
            this.elements.playBtn.innerHTML = '<i class="fas fa-play"></i> Play';
            this.elements.playBtn.onclick = () => this.play();
        }
    }
    
    /**
     * Resets the simulation to initial state
     */
    reset() {
        // Clear timeouts
        if (this.transitionTimeout) clearTimeout(this.transitionTimeout);
        if (this.emergencyTimeout) clearTimeout(this.emergencyTimeout);
        
        // Reset state
        this.currentState = this.States.NS_GREEN_EW_RED;
        this.previousState = null;
        this.emergencyState = this.EmergencyStates.STANDBY;
        this.pedestrianRequested = false;
        this.isPaused = false;
        this.speedFactor = 1;
        
        // Reset stats
        this.stats = {
            stateTimes: {
                [this.States.NS_GREEN_EW_RED]: 0,
                [this.States.NS_YELLOW_EW_RED]: 0,
                [this.States.NS_RED_EW_GREEN]: 0,
                [this.States.NS_RED_EW_YELLOW]: 0,
                [this.States.PEDESTRIAN_WALK]: 0
            },
            totalTransitions: 0,
            startTime: Date.now()
        };
        
        // Update UI
        if (this.elements.speedSlider) this.elements.speedSlider.value = 1;
        if (this.elements.speedValue) this.elements.speedValue.textContent = '1x';
        
        this.logEvent('Simulation reset');
        this.updateDisplay();
    }
    
    /**
     * Forces all lights to red (emergency override)
     */
    emergencyOverride() {
        if (this.emergencyState !== this.EmergencyStates.STANDBY) return;
        
        this.emergencyState = this.EmergencyStates.ACTIVATED;
        this.logEvent('Emergency override activated');
        
        // Turn all lights red
        Object.values(this.elements).forEach(el => {
            if (el && el.classList && el.classList.contains('light')) {
                el.classList.remove('on');
            }
        });
        
        this.elements.nsRed?.classList.add('on');
        this.elements.ewRed?.classList.add('on');
        this.elements.nsStatus.textContent = 'EMERGENCY';
        this.elements.ewStatus.textContent = 'EMERGENCY';
        
        // Update buttons
        if (this.elements.emergencyBtn) {
            this.elements.emergencyBtn.innerHTML = '<i class="fas fa-times-circle"></i> Cancel Emergency';
            this.elements.emergencyBtn.onclick = () => this.cancelEmergency();
        }
        
        // Clear any scheduled transitions
        if (this.transitionTimeout) {
            clearTimeout(this.transitionTimeout);
        }
        
        // Schedule automatic clearing after 10 seconds
        this.emergencyTimeout = setTimeout(() => {
            this.cancelEmergency();
        }, 10000 / this.speedFactor);
    }
    
    /**
     * Cancels emergency override
     */
    cancelEmergency() {
        if (this.emergencyState !== this.EmergencyStates.ACTIVATED) return;
        
        this.emergencyState = this.EmergencyStates.STANDBY;
        this.logEvent('Emergency override cancelled');
        
        // Restore normal operation
        this.updateDisplay();
        
        // Update buttons
        if (this.elements.emergencyBtn) {
            this.elements.emergencyBtn.innerHTML = '<i class="fas fa-ambulance"></i> Emergency Mode';
            this.elements.emergencyBtn.onclick = () => this.emergencyOverride();
        }
        
        // Resume normal scheduling
        this.scheduleNextTick();
    }
    
    /**
     * Forces lights to red state
     */
    forceRed() {
        this.logEvent('Force red command issued');
        this.emergencyOverride();
    }
    
    /**
     * Requests pedestrian crossing
     */
    requestPedestrian() {
        if (this.currentState === this.States.PEDESTRIAN_WALK) {
            this.logEvent('Pedestrian request ignored - already in pedestrian phase');
            return;
        }
        
        this.pedestrianRequested = true;
        this.logEvent('Pedestrian crossing requested');
        
        if (this.elements.pedestrianBtn) {
            this.elements.pedestrianBtn.disabled = true;
            this.elements.pedestrianBtn.innerHTML = '<i class="fas fa-hourglass-half"></i> Request Pending';
        }
    }
    
    /**
     * Updates speed factor
     */
    updateSpeed(factor) {
        this.speedFactor = factor;
        this.logEvent(`Simulation speed changed to ${factor}x`);
        
        // Reschedule next tick with new speed
        this.scheduleNextTick();
    }
    
    /**
     * Updates configuration
     */
    updateConfiguration(newConfig) {
        this.config = { ...this.config, ...newConfig };
        this.saveConfiguration();
        this.logEvent('Configuration updated');
        
        // Reschedule next tick with new timing
        this.scheduleNextTick();
    }
}

// Initialize the application when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Initialize the TrafficDFA
    const trafficDFA = new TrafficDFA();
    
    // Set up event listeners for controls
    if (trafficDFA.elements.playBtn) {
        trafficDFA.elements.playBtn.onclick = () => trafficDFA.play();
    }
    
    if (trafficDFA.elements.pauseBtn) {
        trafficDFA.elements.pauseBtn.onclick = () => trafficDFA.pause();
    }
    
    if (trafficDFA.elements.resetBtn) {
        trafficDFA.elements.resetBtn.onclick = () => trafficDFA.reset();
    }
    
    if (trafficDFA.elements.speedSlider) {
        trafficDFA.elements.speedSlider.oninput = (e) => {
            const factor = parseFloat(e.target.value);
            if (trafficDFA.elements.speedValue) {
                trafficDFA.elements.speedValue.textContent = factor + 'x';
            }
            trafficDFA.updateSpeed(factor);
        };
    }
    
    if (trafficDFA.elements.forceRedBtn) {
        trafficDFA.elements.forceRedBtn.onclick = () => trafficDFA.forceRed();
    }
    
    if (trafficDFA.elements.forceGreenBtn) {
        trafficDFA.elements.forceGreenBtn.onclick = () => {
            trafficDFA.logEvent('Force green command issued (not implemented in this version)');
            alert('Force green feature would override to green state in a full implementation');
        };
    }
    
    if (trafficDFA.elements.emergencyBtn) {
        trafficDFA.elements.emergencyBtn.onclick = () => trafficDFA.emergencyOverride();
    }
    
    if (trafficDFA.elements.pedestrianBtn) {
        trafficDFA.elements.pedestrianBtn.onclick = () => trafficDFA.requestPedestrian();
    }
    
    // Set up configuration form
    if (trafficDFA.elements.configForm) {
        trafficDFA.elements.configForm.onsubmit = (e) => {
            e.preventDefault();
            
            const newConfig = {
                NS_GREEN_DURATION: parseInt(trafficDFA.elements.nsGreenTime.value) || 15,
                NS_YELLOW_DURATION: parseInt(trafficDFA.elements.nsYellowTime.value) || 3,
                EW_GREEN_DURATION: parseInt(trafficDFA.elements.ewGreenTime.value) || 15,
                EW_YELLOW_DURATION: parseInt(trafficDFA.elements.ewYellowTime.value) || 3,
                PEDESTRIAN_DURATION: parseInt(trafficDFA.elements.pedestrianTime.value) || 10
            };
            
            trafficDFA.updateConfiguration(newConfig);
            alert('Configuration saved successfully!');
        };
    }
    
    // Load saved event log from localStorage
    try {
        const savedLog = localStorage.getItem('trafficDFAEventLog');
        if (savedLog) {
            trafficDFA.eventLog = JSON.parse(savedLog);
            trafficDFA.updateLogDisplay();
        }
    } catch (e) {
        console.warn('Failed to load event log from localStorage:', e);
    }
    
    // Set up login/logout functionality
    const loginModal = document.getElementById('login-modal');
    const dashboard = document.getElementById('dashboard');
    const pinInput = document.getElementById('pin-input');
    const loginBtn = document.getElementById('login-btn');
    const loginError = document.getElementById('login-error');
    const logoutBtn = document.getElementById('logout-btn');
    
    // Check if already logged in
    if (localStorage.getItem('trafficDFALoggedIn') === 'true') {
        loginModal.classList.add('hidden');
        dashboard.classList.remove('hidden');
    }
    
    // Login functionality
    if (loginBtn) {
        loginBtn.onclick = () => {
            const pin = pinInput.value;
            if (pin === '1234') {
                loginModal.classList.add('hidden');
                dashboard.classList.remove('hidden');
                localStorage.setItem('trafficDFALoggedIn', 'true');
                loginError.textContent = '';
                pinInput.value = '';
            } else {
                loginError.textContent = 'Incorrect PIN. Please try again.';
            }
        };
    }
    
    // Logout functionality
    if (logoutBtn) {
        logoutBtn.onclick = () => {
            dashboard.classList.add('hidden');
            loginModal.classList.remove('hidden');
            localStorage.removeItem('trafficDFALoggedIn');
        };
    }
    
    // Allow Enter key to submit PIN
    if (pinInput) {
        pinInput.onkeypress = (e) => {
            if (e.key === 'Enter') {
                loginBtn.click();
            }
        };
    }
    
    // Start the simulation
    trafficDFA.scheduleNextTick();
    
    // Periodically redraw DFA for animation effects
    setInterval(() => {
        trafficDFA.drawDFA();
    }, 100);
});