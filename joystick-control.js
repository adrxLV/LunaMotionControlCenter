// Joystick Control System
let joystickActive = false;
let joystickPosition = { x: 0, y: 0 };
let speedMultiplier = 0.5; // 50% initial speed
let isDragging = false;

// Joystick configuration
const JOYSTICK_RADIUS = 70; // Maximum distance from center
const DEAD_ZONE = 10; // Dead zone radius in pixels

// Initialize joystick control
function initializeJoystick() {
    const joystickKnob = document.getElementById('joystick-knob');
    const joystickBase = document.querySelector('.joystick-base');
    const speedSlider = document.getElementById('speed-slider');
    
    if (!joystickKnob || !joystickBase || !speedSlider) return;
    
    // Speed slider event
    speedSlider.addEventListener('input', function() {
        speedMultiplier = parseInt(this.value) / 100;
        updateSpeedDisplay();
        updateMotorValues();
    });
    
    // Mouse events for joystick
    joystickKnob.addEventListener('mousedown', startDrag);
    document.addEventListener('mousemove', handleDrag);
    document.addEventListener('mouseup', stopDrag);
    
    // Touch events for mobile
    joystickKnob.addEventListener('touchstart', startDragTouch, { passive: false });
    document.addEventListener('touchmove', handleDragTouch, { passive: false });
    document.addEventListener('touchend', stopDrag);
    
    // Initialize displays
    updateSpeedDisplay();
    updateMotorValues();
    updateDirectionDisplay();
}

function startDrag(e) {
    e.preventDefault();
    isDragging = true;
    joystickActive = true;
    document.getElementById('joystick-knob').classList.add('active');
}

function startDragTouch(e) {
    e.preventDefault();
    isDragging = true;
    joystickActive = true;
    document.getElementById('joystick-knob').classList.add('active');
}

function handleDrag(e) {
    if (!isDragging) return;
    
    const joystickBase = document.querySelector('.joystick-base');
    const rect = joystickBase.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    updateJoystickPosition(e.clientX - centerX, e.clientY - centerY);
}

function handleDragTouch(e) {
    if (!isDragging) return;
    
    e.preventDefault();
    const touch = e.touches[0];
    const joystickBase = document.querySelector('.joystick-base');
    const rect = joystickBase.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    updateJoystickPosition(touch.clientX - centerX, touch.clientY - centerY);
}

function stopDrag() {
    if (!isDragging) return;
    
    isDragging = false;
    joystickActive = false;
    document.getElementById('joystick-knob').classList.remove('active');
    
    // Return to center with animation
    joystickPosition = { x: 0, y: 0 };
    updateJoystickVisual();
    updateMotorValues();
    updateDirectionDisplay();
}

function updateJoystickPosition(deltaX, deltaY) {
    // Calculate distance from center
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    
    // Limit to joystick radius
    if (distance > JOYSTICK_RADIUS) {
        const angle = Math.atan2(deltaY, deltaX);
        deltaX = Math.cos(angle) * JOYSTICK_RADIUS;
        deltaY = Math.sin(angle) * JOYSTICK_RADIUS;
    }
    
    // Apply dead zone
    if (distance < DEAD_ZONE) {
        deltaX = 0;
        deltaY = 0;
    }
    
    joystickPosition.x = deltaX;
    joystickPosition.y = deltaY;
    
    updateJoystickVisual();
    updateMotorValues();
    updateDirectionDisplay();
}

function updateJoystickVisual() {
    const joystickKnob = document.getElementById('joystick-knob');
    const translateX = joystickPosition.x;
    const translateY = joystickPosition.y;
    
    joystickKnob.style.transform = `translate(calc(-50% + ${translateX}px), calc(-50% + ${translateY}px))`;
}

function calculateMotorValues() {
    // Normalize joystick position (-1 to 1)
    const normalizedX = joystickPosition.x / JOYSTICK_RADIUS;
    const normalizedY = -joystickPosition.y / JOYSTICK_RADIUS; // Invert Y for forward/backward
    
    // Calculate forward/backward and left/right components
    const forward = normalizedY;
    const turn = normalizedX;
    
    // Calculate differential drive values
    let leftMotor = forward + turn;
    let rightMotor = forward - turn;
    
    // Normalize to prevent values > 1
    const maxVal = Math.max(Math.abs(leftMotor), Math.abs(rightMotor));
    if (maxVal > 1) {
        leftMotor /= maxVal;
        rightMotor /= maxVal;
    }
    
    // Apply speed multiplier and convert to -100 to 100 range
    leftMotor = Math.round(leftMotor * speedMultiplier * 100);
    rightMotor = Math.round(rightMotor * speedMultiplier * 100);
    
    return { left: leftMotor, right: rightMotor };
}

function updateMotorValues() {
    const motorValues = calculateMotorValues();
    
    // Check if stop mode is active (get from dashboard.js)
    const stopModeSwitch = document.getElementById('stop-mode-switch');
    const isStopModeActive = stopModeSwitch && stopModeSwitch.classList.contains('active');
    
    // Override motor values if stop mode is active
    const leftMotor = isStopModeActive ? 0 : motorValues.left;
    const rightMotor = isStopModeActive ? 0 : motorValues.right;
    
    // Update display
    document.getElementById('left-motor-value').textContent = leftMotor;
    document.getElementById('right-motor-value').textContent = rightMotor;
    
    // Send command to rover
    if (typeof sendSpeedCommandDebounced === 'function') {
        sendSpeedCommandDebounced(leftMotor, rightMotor);
    }
}

function updateSpeedDisplay() {
    const speedPercentage = Math.round(speedMultiplier * 100);
    document.getElementById('speed-value').textContent = speedPercentage + '%';
}

function updateDirectionDisplay() {
    // Check if stop mode is active
    const stopModeSwitch = document.getElementById('stop-mode-switch');
    const isStopModeActive = stopModeSwitch && stopModeSwitch.classList.contains('active');
    
    if (isStopModeActive) {
        document.getElementById('direction-value').textContent = 'STOP';
        return;
    }
    
    const normalizedX = joystickPosition.x / JOYSTICK_RADIUS;
    const normalizedY = -joystickPosition.y / JOYSTICK_RADIUS;
    
    let direction = 'Center';
    
    if (Math.abs(normalizedX) < 0.1 && Math.abs(normalizedY) < 0.1) {
        direction = 'Center';
    } else if (normalizedY > 0.5) {
        direction = normalizedX > 0.3 ? 'Forward Right' : 
                   normalizedX < -0.3 ? 'Forward Left' : 'Forward';
    } else if (normalizedY < -0.5) {
        direction = normalizedX > 0.3 ? 'Backward Right' : 
                   normalizedX < -0.3 ? 'Backward Left' : 'Backward';
    } else if (normalizedX > 0.5) {
        direction = 'Turn Right';
    } else if (normalizedX < -0.5) {
        direction = 'Turn Left';
    }
    
    document.getElementById('direction-value').textContent = direction;
}

// Keyboard support
function initializeKeyboardControl() {
    const keyState = {};
    const KEYBOARD_SPEED = 0.7; // 70% of max radius
    
    document.addEventListener('keydown', function(e) {
        keyState[e.code] = true;
        handleKeyboardInput();
        e.preventDefault();
    });
    
    document.addEventListener('keyup', function(e) {
        keyState[e.code] = false;
        handleKeyboardInput();
        e.preventDefault();
    });
    
    function handleKeyboardInput() {
        if (!joystickActive) { // Only if not using mouse/touch
            let x = 0, y = 0;
            
            if (keyState['KeyW'] || keyState['ArrowUp']) y = -KEYBOARD_SPEED * JOYSTICK_RADIUS;
            if (keyState['KeyS'] || keyState['ArrowDown']) y = KEYBOARD_SPEED * JOYSTICK_RADIUS;
            if (keyState['KeyA'] || keyState['ArrowLeft']) x = -KEYBOARD_SPEED * JOYSTICK_RADIUS;
            if (keyState['KeyD'] || keyState['ArrowRight']) x = KEYBOARD_SPEED * JOYSTICK_RADIUS;
            
            // Handle space bar for stop
            if (keyState['Space']) {
                x = 0;
                y = 0;
            }
            
            joystickPosition.x = x;
            joystickPosition.y = y;
            
            updateJoystickVisual();
            updateMotorValues();
            updateDirectionDisplay();
        }
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Wait a bit to ensure other scripts are loaded
    setTimeout(() => {
        initializeJoystick();
        initializeKeyboardControl();
        
        // Add navigation back to override
        const backSwitch = document.getElementById('back-override-switch');
        if (backSwitch) {
            backSwitch.addEventListener('click', function() {
                window.location.href = 'override.html';
            });
        }
        
        // Add stop mode switch listener
        const stopModeSwitch = document.getElementById('stop-mode-switch');
        if (stopModeSwitch) {
            stopModeSwitch.addEventListener('click', function() {
                // Force update motor values when stop mode changes
                setTimeout(() => {
                    updateMotorValues();
                    updateDirectionDisplay();
                }, 10);
            });
        }
        
        console.log('[Joystick] Sistema de controle inicializado');
        console.log('[Joystick] Controlos: Mouse/Touch no joystick, WASD ou setas, Espaço para parar');
    }, 100);
});

// Export functions for external use
window.joystickControl = {
    getMotorValues: calculateMotorValues,
    getSpeedMultiplier: () => speedMultiplier,
    setSpeedMultiplier: (value) => {
        speedMultiplier = Math.max(0, Math.min(1, value));
        document.getElementById('speed-slider').value = speedMultiplier * 100;
        updateSpeedDisplay();
        updateMotorValues();
    },
    reset: () => {
        joystickPosition = { x: 0, y: 0 };
        updateJoystickVisual();
        updateMotorValues();
        updateDirectionDisplay();
    }
};
