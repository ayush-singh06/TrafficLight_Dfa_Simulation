// --- Constants (from your C code) ---
const DEFAULT_D_NS_GREEN = 5; // seconds
const DEFAULT_D_NS_YELLOW = 2;
const DEFAULT_D_EW_GREEN = 5;
const DEFAULT_D_EW_YELLOW = 2;
const DEFAULT_D_PEDESTRIAN = 3;
const DEFAULT_MAX_CYCLES = 5;

// FSM states (using an object as an Enum)
const States = {
    NS_GREEN_EW_RED: 0,
    NS_YELLOW_EW_RED: 1,
    NS_RED_EW_GREEN: 2,
    NS_RED_EW_YELLOW: 3,
    PEDESTRIAN_WALK: 4 // A new state to simplify pedestrian logic
};

// Emergency states
const EmergencyStates = {
    STANDBY: 0,
    ACTIVATED: 1,
    CLEARING: 2
};

// State names for display
const StateNames = {
    0: "NS_GREEN_EW_RED",
    1: "NS_YELLOW_EW_RED",
    2: "NS_RED_EW_GREEN",
    3: "NS_RED_EW_YELLOW",
    4: "PEDESTRIAN_WALK"
};

// State labels for DFA diagram
const StateLabels = {
    0: "NS Green\nEW Red",
    1: "NS Yellow\nEW Red",
    2: "NS Red\nEW Green",
    3: "NS Red\nEW Yellow",
    4: "Pedestrian\nWalk"
};

// Traffic density levels
const TrafficDensity = {
    LOW: 1,
    MEDIUM: 2,
    HIGH: 3
};

// --- Global Variables ---
let D_NS_GREEN = DEFAULT_D_NS_GREEN;
let D_NS_YELLOW = DEFAULT_D_NS_YELLOW;
let D_EW_GREEN = DEFAULT_D_EW_GREEN;
let D_EW_YELLOW = DEFAULT_D_EW_YELLOW;
let D_PEDESTRIAN = DEFAULT_D_PEDESTRIAN;
let MAX_CYCLES = DEFAULT_MAX_CYCLES;

let currentState = States.NS_GREEN_EW_RED;
let currentCycle = 1;
let stateTimer = null; // To hold the setInterval for the countdown
let transitionTimeout = null; // To hold the setTimeout for state transitions
let isPaused = false;
let speedFactor = 1;
let pedestrianRequested = false;
let pedestrianCountdown = 0;
let pedestrianCountdownInterval = null;
let emergencyState = EmergencyStates.STANDBY;
let emergencyClearingTimeout = null;
let pedestrianRequests = 0;
let stateHistory = [];
let trafficDensity = TrafficDensity.MEDIUM;
let carsPassed = 0;
let throughput = 0;

// --- Get references to all our HTML elements ---
const lights = {
    nsRed: document.getElementById('ns-red'),
    nsYellow: document.getElementById('ns-yellow'),
    nsGreen: document.getElementById('ns-green'),
    ewRed: document.getElementById('ew-red'),
    ewYellow: document.getElementById('ew-yellow'),
    ewGreen: document.getElementById('ew-green')
};
const displays = {
    nsStatus: document.getElementById('ns-status'),
    ewStatus: document.getElementById('ew-status'),
    cycleCount: document.getElementById('cycle-count'),
    timer: document.getElementById('timer'),
    pedBox: document.getElementById('ped-box')
};

// --- Statistics Elements ---
const totalCyclesDisplay = document.getElementById('total-cycles');
const currentStateDisplay = document.getElementById('current-state');
const stateDurationDisplay = document.getElementById('state-duration');
const pedRequestsDisplay = document.getElementById('ped-requests');
const carsPassedDisplay = document.getElementById('cars-passed');
const throughputDisplay = document.getElementById('throughput');
const stateHistoryList = document.getElementById('state-history-list');

// --- Configuration Elements ---
const nsGreenTimeInput = document.getElementById('ns-green-time');
const nsYellowTimeInput = document.getElementById('ns-yellow-time');
const ewGreenTimeInput = document.getElementById('ew-green-time');
const ewYellowTimeInput = document.getElementById('ew-yellow-time');
const pedestrianTimeInput = document.getElementById('pedestrian-time');
const maxCyclesInput = document.getElementById('max-cycles');
const applyConfigBtn = document.getElementById('apply-config');

// --- DFA Visualization Elements ---
const dfaCanvas = document.getElementById('dfa-canvas');
const tupleDisplay = document.getElementById('tuple-display');

// --- Traffic Density Elements ---
const trafficDensitySlider = document.getElementById('traffic-density');
const densityValueDisplay = document.getElementById('density-value');

// --- Control Elements ---
const playBtn = document.getElementById('play-btn');
const pauseBtn = document.getElementById('pause-btn');
const resetBtn = document.getElementById('reset-btn');
const speedSlider = document.getElementById('speed-slider');
const speedValue = document.getElementById('speed-value');
const pedestrianBtn = document.getElementById('pedestrian-btn');
const pedestrianCountdownDisplay = document.getElementById('pedestrian-countdown');
const emergencyBtn = document.getElementById('emergency-btn');
const emergencyStatusDisplay = document.getElementById('emergency-status');

/**
 * Main function to update the visual display based on the current state.
 * This is the equivalent of your C 'displayLights' function.
 */
function updateDisplay(state) {
    // 1. Turn all lights "off" by removing the .on class
    Object.values(lights).forEach(light => light.classList.remove('on'));
    
    // 2. Turn "on" the correct lights and set status text
    switch (state) {
        case States.NS_GREEN_EW_RED:
            lights.nsGreen.classList.add('on');
            lights.ewRed.classList.add('on');
            displays.nsStatus.textContent = "GO";
            displays.ewStatus.textContent = "STOP";
            break;
        case States.NS_YELLOW_EW_RED:
            lights.nsYellow.classList.add('on');
            lights.ewRed.classList.add('on');
            displays.nsStatus.textContent = "CAUTION";
            displays.ewStatus.textContent = "STOP";
            break;
        case States.NS_RED_EW_GREEN:
            lights.nsRed.classList.add('on');
            lights.ewGreen.classList.add('on');
            displays.nsStatus.textContent = "STOP";
            displays.ewStatus.textContent = "GO";
            break;
        case States.NS_RED_EW_YELLOW:
            lights.nsRed.classList.add('on');
            lights.ewYellow.classList.add('on');
            displays.nsStatus.textContent = "STOP";
            displays.ewStatus.textContent = "CAUTION";
            break;
        case States.PEDESTRIAN_WALK:
            lights.nsRed.classList.add('on');
            lights.ewRed.classList.add('on');
            displays.nsStatus.textContent = "STOP (PED)";
            displays.ewStatus.textContent = "STOP (PED)";
            displays.pedBox.classList.add('active');
            break;
        default:
            console.error("Unknown state:", state);
    }

    // Update cycle counter display
    displays.cycleCount.textContent = currentCycle;
    
    // Update statistics
    updateStatistics();
    
    // Update DFA visualization
    drawDFA();
    
    // Update tuple display
    updateTupleDisplay(state);
}

/**
 * Updates the statistics panel with current information
 */
function updateStatistics() {
    if (totalCyclesDisplay) totalCyclesDisplay.textContent = currentCycle;
    if (currentStateDisplay) currentStateDisplay.textContent = StateNames[currentState];
    if (stateDurationDisplay) stateDurationDisplay.textContent = displays.timer.textContent + "s";
    if (pedRequestsDisplay) pedRequestsDisplay.textContent = pedestrianRequests;
    if (carsPassedDisplay) carsPassedDisplay.textContent = carsPassed;
    if (throughputDisplay) throughputDisplay.textContent = throughput;
}

/**
 * Updates the current state tuple display
 */
function updateTupleDisplay(state) {
    if (tupleDisplay) {
        let nextState = getNextState(state);
        let input = "Timer_Expired";
        
        // Special cases for inputs
        if (pedestrianRequested && state !== States.PEDESTRIAN_WALK) {
            input = "Pedestrian_Request";
        } else if (emergencyState === EmergencyStates.ACTIVATED) {
            input = "Emergency_Signal";
        }
        
        tupleDisplay.textContent = `Current State: q${state} (${StateNames[state]}) | Input: ${input} | Next State: q${nextState} (${StateNames[nextState]})`;
    }
}

/**
 * Gets the next state based on current state
 */
function getNextState(state) {
    switch (state) {
        case States.NS_GREEN_EW_RED:
            return States.NS_YELLOW_EW_RED;
        case States.NS_YELLOW_EW_RED:
            return States.NS_RED_EW_GREEN;
        case States.NS_RED_EW_GREEN:
            return States.NS_RED_EW_YELLOW;
        case States.NS_RED_EW_YELLOW:
            return States.PEDESTRIAN_WALK;
        case States.PEDESTRIAN_WALK:
            return States.NS_GREEN_EW_RED;
        default:
            return States.NS_GREEN_EW_RED;
    }
}

/**
 * Draws the DFA state diagram on the canvas
 */
function drawDFA() {
    if (!dfaCanvas) return;
    
    const ctx = dfaCanvas.getContext('2d');
    const width = dfaCanvas.width;
    const height = dfaCanvas.height;
    
    // Clear canvas
    ctx.clearRect(0, 0, width, height);
    
    // Define node positions
    const nodes = [
        { x: width * 0.2, y: height * 0.3, label: StateLabels[0], state: States.NS_GREEN_EW_RED },
        { x: width * 0.5, y: height * 0.2, label: StateLabels[1], state: States.NS_YELLOW_EW_RED },
        { x: width * 0.8, y: height * 0.3, label: StateLabels[2], state: States.NS_RED_EW_GREEN },
        { x: width * 0.8, y: height * 0.7, label: StateLabels[3], state: States.NS_RED_EW_YELLOW },
        { x: width * 0.5, y: height * 0.8, label: StateLabels[4], state: States.PEDESTRIAN_WALK },
        { x: width * 0.2, y: height * 0.7, label: StateLabels[0], state: States.NS_GREEN_EW_RED } // Closing node
    ];
    
    // Draw connections (arrows)
    ctx.strokeStyle = '#666';
    ctx.lineWidth = 2;
    ctx.fillStyle = '#666';
    
    for (let i = 0; i < nodes.length - 1; i++) {
        drawArrow(ctx, nodes[i].x, nodes[i].y, nodes[i + 1].x, nodes[i + 1].y);
    }
    
    // Draw closing arrow from last node to first
    drawArrow(ctx, nodes[5].x, nodes[5].y, nodes[0].x, nodes[0].y);
    
    // Draw nodes
    nodes.forEach((node, index) => {
        // Highlight current state node
        if (node.state === currentState) {
            ctx.fillStyle = '#ff6b6b';
            ctx.beginPath();
            ctx.arc(node.x, node.y, 35, 0, Math.PI * 2);
            ctx.fill();
            
            // Pulsing effect for current state
            const pulseRadius = 35 + 5 * Math.sin(Date.now() / 200);
            ctx.strokeStyle = 'rgba(255, 107, 107, 0.5)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(node.x, node.y, pulseRadius, 0, Math.PI * 2);
            ctx.stroke();
        } else {
            ctx.fillStyle = '#444';
            ctx.beginPath();
            ctx.arc(node.x, node.y, 30, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Draw node border
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(node.x, node.y, 30, 0, Math.PI * 2);
        ctx.stroke();
        
        // Draw node label
        ctx.fillStyle = '#fff';
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
function drawArrow(ctx, fromX, fromY, toX, toY) {
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
 * Adds a state transition to the history
 */
function addToStateHistory(state, timestamp) {
    if (stateHistoryList) {
        const entry = document.createElement('div');
        entry.className = 'history-entry';
        entry.textContent = `[${timestamp}] ${StateNames[state]}`;
        stateHistoryList.prepend(entry);
        
        // Keep only the last 10 entries
        if (stateHistoryList.children.length > 10) {
            stateHistoryList.removeChild(stateHistoryList.lastChild);
        }
    }
}

/**
 * Applies configuration settings from the UI
 */
function applyConfiguration() {
    D_NS_GREEN = parseInt(nsGreenTimeInput.value) || DEFAULT_D_NS_GREEN;
    D_NS_YELLOW = parseInt(nsYellowTimeInput.value) || DEFAULT_D_NS_YELLOW;
    D_EW_GREEN = parseInt(ewGreenTimeInput.value) || DEFAULT_D_EW_GREEN;
    D_EW_YELLOW = parseInt(ewYellowTimeInput.value) || DEFAULT_D_EW_YELLOW;
    D_PEDESTRIAN = parseInt(pedestrianTimeInput.value) || DEFAULT_D_PEDESTRIAN;
    MAX_CYCLES = parseInt(maxCyclesInput.value) || DEFAULT_MAX_CYCLES;
    
    // Update info panel with new max cycles
    if (displays.cycleCount) {
        const parts = displays.cycleCount.textContent.split('/');
        if (parts.length === 2) {
            displays.cycleCount.textContent = parts[0] + '/' + MAX_CYCLES;
        }
    }
    
    alert('Configuration applied successfully!');
}

/**
 * Updates traffic density based on slider value
 */
function updateTrafficDensity() {
    const value = parseInt(trafficDensitySlider.value);
    
    switch (value) {
        case 1:
            trafficDensity = TrafficDensity.LOW;
            densityValueDisplay.textContent = "Low";
            // Adjust green light durations
            D_NS_GREEN = DEFAULT_D_NS_GREEN * 0.5; // Shorter for low traffic
            D_EW_GREEN = DEFAULT_D_EW_GREEN * 0.5;
            break;
        case 2:
            trafficDensity = TrafficDensity.MEDIUM;
            densityValueDisplay.textContent = "Medium";
            // Reset to default values
            D_NS_GREEN = DEFAULT_D_NS_GREEN;
            D_EW_GREEN = DEFAULT_D_EW_GREEN;
            break;
        case 3:
            trafficDensity = TrafficDensity.HIGH;
            densityValueDisplay.textContent = "High";
            // Longer green light for high traffic
            D_NS_GREEN = DEFAULT_D_NS_GREEN * 2;
            D_EW_GREEN = DEFAULT_D_EW_GREEN * 2;
            break;
    }
    
    // If simulation is running, restart with new timing
    if (!isPaused) {
        runState(currentState);
    }
}

/**
 * Simulates cars passing through during green light
 */
function simulateCarPassing() {
    if (currentState === States.NS_GREEN_EW_RED || currentState === States.NS_RED_EW_GREEN) {
        // Random number of cars passing based on traffic density
        let cars;
        switch (trafficDensity) {
            case TrafficDensity.LOW:
                cars = Math.floor(Math.random() * 3); // 0-2 cars
                break;
            case TrafficDensity.MEDIUM:
                cars = Math.floor(Math.random() * 5); // 0-4 cars
                break;
            case TrafficDensity.HIGH:
                cars = Math.floor(Math.random() * 8); // 0-7 cars
                break;
            default:
                cars = Math.floor(Math.random() * 3);
        }
        
        carsPassed += cars;
        throughput = Math.round((carsPassed / currentCycle) * 10) / 10; // Cars per cycle
        updateStatistics();
    }
}

/**
 * Advances the state machine to the next state.
 * This is the equivalent of your C 'advanceState' function.
 */
function advanceState() {
    // Handle emergency state first
    if (emergencyState === EmergencyStates.ACTIVATED) {
        // Emergency is active, keep all lights red
        return;
    }
    
    // Add current state to history
    addToStateHistory(currentState, new Date().toLocaleTimeString());
    
    // Simulate car passing
    simulateCarPassing();
    
    // Handle pedestrian request if pending
    if (pedestrianRequested && currentState !== States.PEDESTRIAN_WALK) {
        // If pedestrian is requested and we're not already in pedestrian state,
        // go directly to pedestrian state
        currentState = States.PEDESTRIAN_WALK;
        pedestrianRequested = false;
        pedestrianRequests++;
        updatePedestrianCountdown(0);
    } else {
        // Normal state advancement
        // Increment cycle counter if we're looping back to the start
        if (currentState === States.PEDESTRIAN_WALK) {
            currentCycle++;
        }

        // Move to the next state
        switch (currentState) {
            case States.NS_GREEN_EW_RED:
                currentState = States.NS_YELLOW_EW_RED;
                break;
            case States.NS_YELLOW_EW_RED:
                currentState = States.NS_RED_EW_GREEN;
                break;
            case States.NS_RED_EW_GREEN:
                currentState = States.NS_RED_EW_YELLOW;
                break;
            case States.NS_RED_EW_YELLOW:
                currentState = States.PEDESTRIAN_WALK;
                break;
            case States.PEDESTRIAN_WALK:
                // Check if we've completed all cycles
                if (currentCycle > MAX_CYCLES) {
                    endSimulation();
                    return;
                }
                currentState = States.NS_GREEN_EW_RED;
                displays.pedBox.classList.remove('active'); // Turn off ped signal
                break;
            default:
                console.error("Invalid state:", currentState);
                return;
        }
    }

    // Update the display for the new state
    updateDisplay(currentState);

    // Schedule the next state transition
    runState(currentState);
}

/**
 * Runs a state for its designated duration.
 * This is the equivalent of your C 'runState' function.
 */
function runState(state) {
    // Handle emergency state
    if (emergencyState === EmergencyStates.ACTIVATED) {
        // Emergency is active, keep all lights red and don't advance
        Object.values(lights).forEach(light => light.classList.remove('on'));
        lights.nsRed.classList.add('on');
        lights.ewRed.classList.add('on');
        displays.nsStatus.textContent = "EMERGENCY";
        displays.ewStatus.textContent = "EMERGENCY";
        updateDisplay(state); // Update DFA visualization
        return;
    }
    
    // Clear any existing timers
    clearTimeout(transitionTimeout);
    clearInterval(stateTimer);

    // Reset the timer display
    let timeInState = 0;
    displays.timer.textContent = timeInState;
    if (stateDurationDisplay) stateDurationDisplay.textContent = "0s";

    // Determine how long this state should last
    let duration;
    switch (state) {
        case States.NS_GREEN_EW_RED:
            duration = D_NS_GREEN;
            break;
        case States.NS_YELLOW_EW_RED:
            duration = D_NS_YELLOW;
            break;
        case States.NS_RED_EW_GREEN:
            duration = D_EW_GREEN;
            break;
        case States.NS_RED_EW_YELLOW:
            duration = D_EW_YELLOW;
            break;
        case States.PEDESTRIAN_WALK:
            duration = D_PEDESTRIAN;
            break;
        default:
            console.error("Unknown state duration for:", state);
            duration = 1; // fallback
    }

    // Adjust duration based on speed factor
    duration = duration / speedFactor;

    // Update the timer display every second
    stateTimer = setInterval(() => {
        if (!isPaused) {
            timeInState++;
            displays.timer.textContent = timeInState;
            if (stateDurationDisplay) stateDurationDisplay.textContent = timeInState + "s";
            
            // Redraw DFA periodically to maintain pulsing effect
            drawDFA();
        }
    }, 1000);

    // Schedule the next state transition
    transitionTimeout = setTimeout(() => {
        if (!isPaused) {
            clearInterval(stateTimer);
            advanceState();
        }
    }, duration * 1000);
}

/**
 * Ends the simulation after MAX_CYCLES cycles.
 */
function endSimulation() {
    clearInterval(stateTimer);
    clearTimeout(transitionTimeout);
    clearInterval(pedestrianCountdownInterval);
    clearTimeout(emergencyClearingTimeout);
    document.body.innerHTML = `<h1>Simulation Complete</h1>
        <p>Finished ${MAX_CYCLES} cycles.</p>
        <p>Total Pedestrian Requests: ${pedestrianRequests}</p>
        <p>Total Cars Passed: ${carsPassed}</p>
        <p>Average Throughput: ${throughput} cars/cycle</p>`;
}

// --- Control Functions ---

function playSimulation() {
    if (isPaused) {
        isPaused = false;
        runState(currentState);
    }
}

function pauseSimulation() {
    isPaused = true;
    clearTimeout(transitionTimeout);
    clearInterval(stateTimer);
}

function resetSimulation() {
    // Clear timers
    clearTimeout(transitionTimeout);
    clearInterval(stateTimer);
    clearInterval(pedestrianCountdownInterval);
    clearTimeout(emergencyClearingTimeout);
    
    // Reset state variables
    currentState = States.NS_GREEN_EW_RED;
    currentCycle = 1;
    isPaused = false;
    speedFactor = 1;
    speedSlider.value = 1;
    speedValue.textContent = "1x";
    pedestrianRequested = false;
    pedestrianCountdown = 0;
    pedestrianRequests = 0;
    stateHistory = [];
    carsPassed = 0;
    throughput = 0;
    updatePedestrianCountdown("--");
    emergencyState = EmergencyStates.STANDBY;
    updateEmergencyStatus("Standby");
    emergencyBtn.disabled = false;
    emergencyBtn.textContent = "Activate Emergency Mode";
    if (pedestrianBtn) {
        pedestrianBtn.disabled = false;
        pedestrianBtn.textContent = "Request Crossing";
    }
    
    // Clear state history
    if (stateHistoryList) {
        stateHistoryList.innerHTML = "";
    }
    
    // Reset UI
    displays.pedBox.classList.remove('active');
    
    // Update display
    updateDisplay(currentState);
    displays.timer.textContent = "0";
    displays.cycleCount.textContent = "1";
    
    // Update statistics
    updateStatistics();
    
    // Restart simulation
    runState(currentState);
}

function updateSpeed() {
    speedFactor = parseFloat(speedSlider.value);
    speedValue.textContent = speedFactor + "x";
    
    // If simulation is running, restart with new speed
    if (!isPaused) {
        runState(currentState);
    }
}

// --- Pedestrian Functions ---

function requestPedestrianCrossing() {
    if (currentState === States.PEDESTRIAN_WALK) {
        // Already in pedestrian state
        return;
    }
    
    pedestrianRequested = true;
    pedestrianRequests++;
    pedestrianBtn.disabled = true;
    pedestrianBtn.textContent = "Crossing Requested";
    
    // Calculate time until pedestrian crossing
    calculatePedestrianCountdown();
    
    // Start countdown timer
    pedestrianCountdownInterval = setInterval(() => {
        if (pedestrianCountdown > 0) {
            pedestrianCountdown--;
            updatePedestrianCountdown(pedestrianCountdown);
        } else {
            clearInterval(pedestrianCountdownInterval);
        }
    }, 1000);
    
    // Update statistics
    updateStatistics();
    
    // Update tuple display
    updateTupleDisplay(currentState);
}

function calculatePedestrianCountdown() {
    // Calculate time until next pedestrian phase
    let timeUntilPedestrian = 0;
    
    switch (currentState) {
        case States.NS_GREEN_EW_RED:
            timeUntilPedestrian = D_NS_GREEN - parseInt(displays.timer.textContent) + D_NS_YELLOW;
            break;
        case States.NS_YELLOW_EW_RED:
            timeUntilPedestrian = D_NS_YELLOW - parseInt(displays.timer.textContent);
            break;
        case States.NS_RED_EW_GREEN:
            timeUntilPedestrian = D_EW_GREEN - parseInt(displays.timer.textContent) + D_EW_YELLOW;
            break;
        case States.NS_RED_EW_YELLOW:
            timeUntilPedestrian = D_EW_YELLOW - parseInt(displays.timer.textContent);
            break;
    }
    
    // Adjust for speed factor
    timeUntilPedestrian = Math.ceil(timeUntilPedestrian / speedFactor);
    pedestrianCountdown = timeUntilPedestrian;
    updatePedestrianCountdown(pedestrianCountdown);
}

function updatePedestrianCountdown(value) {
    if (pedestrianCountdownDisplay) {
        pedestrianCountdownDisplay.textContent = value;
    }
}

// --- Emergency Vehicle Functions ---

function activateEmergencyMode() {
    if (emergencyState !== EmergencyStates.STANDBY) {
        return;
    }
    
    emergencyState = EmergencyStates.ACTIVATED;
    emergencyBtn.disabled = true;
    emergencyBtn.textContent = "Emergency Active";
    updateEmergencyStatus("Active - All lights RED");
    
    // Disable pedestrian button during emergency
    if (pedestrianBtn) {
        pedestrianBtn.disabled = true;
    }
    
    // Immediately set all lights to red
    runState(currentState);
    
    // Schedule emergency clearing after 5 seconds
    emergencyClearingTimeout = setTimeout(() => {
        emergencyState = EmergencyStates.CLEARING;
        updateEmergencyStatus("Clearing - Resuming normal operation");
        
        // Re-enable buttons
        emergencyBtn.disabled = false;
        emergencyBtn.textContent = "Activate Emergency Mode";
        if (pedestrianBtn) {
            pedestrianBtn.disabled = false;
            pedestrianBtn.textContent = "Request Crossing";
        }
        
        // Reset emergency state after 2 seconds
        setTimeout(() => {
            emergencyState = EmergencyStates.STANDBY;
            updateEmergencyStatus("Standby");
            runState(currentState);
        }, 2000);
    }, 5000 / speedFactor);
}

function updateEmergencyStatus(status) {
    if (emergencyStatusDisplay) {
        emergencyStatusDisplay.textContent = status;
    }
}

// --- Event Listeners for Controls ---
if (playBtn && pauseBtn && resetBtn && speedSlider) {
    playBtn.addEventListener('click', playSimulation);
    pauseBtn.addEventListener('click', pauseSimulation);
    resetBtn.addEventListener('click', resetSimulation);
    speedSlider.addEventListener('input', updateSpeed);
}

// --- Event Listener for Configuration ---
if (applyConfigBtn) {
    applyConfigBtn.addEventListener('click', applyConfiguration);
}

// --- Event Listener for Traffic Density ---
if (trafficDensitySlider) {
    trafficDensitySlider.addEventListener('input', updateTrafficDensity);
}

// --- Event Listener for Pedestrian Button ---
if (pedestrianBtn) {
    pedestrianBtn.addEventListener('click', requestPedestrianCrossing);
}

// --- Event Listener for Emergency Button ---
if (emergencyBtn) {
    emergencyBtn.addEventListener('click', activateEmergencyMode);
}

// --- Start the simulation ---
window.onload = () => {
    updateDisplay(currentState);
    runState(currentState);
    
    // Start periodic DFA redraw for animation effects
    setInterval(drawDFA, 100);
};