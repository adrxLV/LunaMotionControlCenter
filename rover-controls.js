/**
 * ROVER CONTROL SYSTEM
 * Sistema de controle do rover incluindo joystick, gamepad e teclado
 */

// ===========================================
// CONFIGURAÇÃO DE VARIÁVEIS DO ROVER
// ===========================================
let joystickActive = false;
let joystickPosition = { x: 0, y: 0 };
let speedMultiplier = 0.5;
let isDragging = false;

// Gamepad
let gamepadActive = false;
let gamepadIndex = -1;
let lastButtonStates = {
    buttonA: false,
    buttonB: false
};

// Configurações do joystick
const JOYSTICK_RADIUS = 70;
const DEAD_ZONE = 10;
const GAMEPAD_DEAD_ZONE = 0.15;

// Zonas direcionais
const DIRECTION_ZONES = {
    STOP: 'stop',
    FORWARD: 'forward',
    BACKWARD: 'backward',
    FORWARD_LEFT: 'forward_left',
    FORWARD_RIGHT: 'forward_right',
    BACKWARD_LEFT: 'backward_left',
    BACKWARD_RIGHT: 'backward_right',
    TURN_LEFT: 'turn_left',
    TURN_RIGHT: 'turn_right'
};

let lastDirectionZone = null;
let lastZoneCommand = null;

// ===========================================
// SISTEMA DE JOYSTICK
// ===========================================
function initializeJoystick() {
    const joystickKnob = document.getElementById('joystick-knob');
    const joystickBase = document.querySelector('.joystick-base');
    const speedSlider = document.getElementById('speed-slider');
    
    if (!joystickKnob || !joystickBase || !speedSlider) return;
    
    // Slider de velocidade
    speedSlider.addEventListener('input', function() {
        speedMultiplier = parseInt(this.value) / 100;
        updateSpeedDisplay();
        updateMotorValues();
    });
    
    // Eventos do mouse
    joystickKnob.addEventListener('mousedown', startDrag);
    document.addEventListener('mousemove', handleDrag);
    document.addEventListener('mouseup', stopDrag);
    
    // Eventos touch para dispositivos móveis
    joystickKnob.addEventListener('touchstart', startDragTouch, { passive: false });
    document.addEventListener('touchmove', handleDragTouch, { passive: false });
    document.addEventListener('touchend', stopDrag);
    
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
    
    joystickPosition = { x: 0, y: 0 };
    lastDirectionZone = null;
    lastZoneCommand = null;
    
    updateJoystickVisual();
    updateMotorValues();
    updateDirectionDisplay();
}

function updateJoystickPosition(deltaX, deltaY) {
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    
    if (distance > JOYSTICK_RADIUS) {
        const angle = Math.atan2(deltaY, deltaX);
        deltaX = Math.cos(angle) * JOYSTICK_RADIUS;
        deltaY = Math.sin(angle) * JOYSTICK_RADIUS;
    }
    
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

// ===========================================
// CÁLCULOS DO MOTOR
// ===========================================
function calculateMotorValues() {
    const normalizedX = joystickPosition.x / JOYSTICK_RADIUS;
    const normalizedY = -joystickPosition.y / JOYSTICK_RADIUS;
    
    const forward = normalizedY;
    const turn = normalizedX;
    
    let leftMotor = forward + turn;
    let rightMotor = forward - turn;
    
    const maxVal = Math.max(Math.abs(leftMotor), Math.abs(rightMotor));
    if (maxVal > 1) {
        leftMotor /= maxVal;
        rightMotor /= maxVal;
    }
    
    leftMotor = Math.round(leftMotor * speedMultiplier * 100);
    rightMotor = Math.round(rightMotor * speedMultiplier * 100);
    
    return { left: leftMotor, right: rightMotor };
}

function getCurrentDirectionZone() {
    const normalizedX = joystickPosition.x / JOYSTICK_RADIUS;
    const normalizedY = -joystickPosition.y / JOYSTICK_RADIUS;
    
    const FORWARD_THRESHOLD = 0.3;
    const TURN_THRESHOLD = 0.4;
    
    if (Math.abs(normalizedX) < 0.15 && Math.abs(normalizedY) < 0.15) {
        return DIRECTION_ZONES.STOP;
    }
    
    if (Math.abs(normalizedY) > FORWARD_THRESHOLD) {
        if (normalizedY > 0) {
            if (normalizedX > 0.25) return DIRECTION_ZONES.FORWARD_RIGHT;
            if (normalizedX < -0.25) return DIRECTION_ZONES.FORWARD_LEFT;
            return DIRECTION_ZONES.FORWARD;
        } else {
            if (normalizedX > 0.25) return DIRECTION_ZONES.BACKWARD_RIGHT;
            if (normalizedX < -0.25) return DIRECTION_ZONES.BACKWARD_LEFT;
            return DIRECTION_ZONES.BACKWARD;
        }
    }
    
    if (Math.abs(normalizedX) > TURN_THRESHOLD) {
        return normalizedX > 0 ? DIRECTION_ZONES.TURN_RIGHT : DIRECTION_ZONES.TURN_LEFT;
    }
    
    return DIRECTION_ZONES.STOP;
}

function shouldSendCommandForZone() {
    const currentZone = getCurrentDirectionZone();
    const motorValues = calculateMotorValues();
    
    if (currentZone !== lastDirectionZone) {
        lastDirectionZone = currentZone;
        lastZoneCommand = {
            zone: currentZone,
            left: motorValues.left,
            right: motorValues.right,
            timestamp: Date.now()
        };
        return true;
    }
    
    if (lastZoneCommand) {
        const leftDiff = Math.abs(motorValues.left - lastZoneCommand.left);
        const rightDiff = Math.abs(motorValues.right - lastZoneCommand.right);
        
        if (leftDiff >= 15 || rightDiff >= 15) {
            lastZoneCommand = {
                zone: currentZone,
                left: motorValues.left,
                right: motorValues.right,
                timestamp: Date.now()
            };
            return true;
        }
    }
    
    return false;
}

function updateMotorValues() {
    const motorValues = calculateMotorValues();
    
    const stopModeSwitch = document.getElementById('stop-mode-switch');
    const isStopModeActive = stopModeSwitch && stopModeSwitch.classList.contains('active');
    
    const leftMotor = isStopModeActive ? 0 : motorValues.left;
    const rightMotor = isStopModeActive ? 0 : motorValues.right;
    
    const leftMotorElement = document.getElementById('left-motor-value');
    const rightMotorElement = document.getElementById('right-motor-value');
    
    if (leftMotorElement) leftMotorElement.textContent = leftMotor;
    if (rightMotorElement) rightMotorElement.textContent = rightMotor;
    
    if (shouldSendCommandForZone() || isStopModeActive !== (lastZoneCommand && lastZoneCommand.zone === DIRECTION_ZONES.STOP)) {
        console.log(`[Joystick] Zone: ${getCurrentDirectionZone()}, Motors: L=${leftMotor}, R=${rightMotor}`);
        if (typeof sendSpeedCommandWithSpeed === 'function') {
            sendSpeedCommandWithSpeed(leftMotor, rightMotor, speedMultiplier, false);
        } else if (typeof sendSpeedCommandDebounced === 'function') {
            sendSpeedCommandDebounced(leftMotor, rightMotor);
        }
    }
}

function updateSpeedDisplay() {
    const speedPercentage = Math.round(speedMultiplier * 100);
    const speedElement = document.getElementById('speed-value');
    if (speedElement) speedElement.textContent = speedPercentage + '%';
}

function updateDirectionDisplay() {
    const stopModeSwitch = document.getElementById('stop-mode-switch');
    const isStopModeActive = stopModeSwitch && stopModeSwitch.classList.contains('active');
    
    if (isStopModeActive) {
        document.getElementById('direction-value').textContent = 'STOP';
        return;
    }
    
    const currentZone = getCurrentDirectionZone();
    
    let displayText = 'Center';
    switch (currentZone) {
        case DIRECTION_ZONES.FORWARD:
            displayText = 'Forward';
            break;
        case DIRECTION_ZONES.BACKWARD:
            displayText = 'Backward';
            break;
        case DIRECTION_ZONES.FORWARD_LEFT:
            displayText = 'Forward Left';
            break;
        case DIRECTION_ZONES.FORWARD_RIGHT:
            displayText = 'Forward Right';
            break;
        case DIRECTION_ZONES.BACKWARD_LEFT:
            displayText = 'Backward Left';
            break;
        case DIRECTION_ZONES.BACKWARD_RIGHT:
            displayText = 'Backward Right';
            break;
        case DIRECTION_ZONES.TURN_LEFT:
            displayText = 'Turn Left';
            break;
        case DIRECTION_ZONES.TURN_RIGHT:
            displayText = 'Turn Right';
            break;
    }
    
    const directionElement = document.getElementById('direction-value');
    if (directionElement) directionElement.textContent = displayText;
}

// ===========================================
// SISTEMA DE TECLADO
// ===========================================
function initializeKeyboardControl() {
    const keyState = {};
    const KEYBOARD_SPEED = 0.7;
    
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
        if (!joystickActive) {
            let x = 0, y = 0;
            
            if (keyState['KeyW'] || keyState['ArrowUp']) y = -KEYBOARD_SPEED * JOYSTICK_RADIUS;
            if (keyState['KeyS'] || keyState['ArrowDown']) y = KEYBOARD_SPEED * JOYSTICK_RADIUS;
            if (keyState['KeyA'] || keyState['ArrowLeft']) x = -KEYBOARD_SPEED * JOYSTICK_RADIUS;
            if (keyState['KeyD'] || keyState['ArrowRight']) x = KEYBOARD_SPEED * JOYSTICK_RADIUS;
            
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

// ===========================================
// SISTEMA DE GAMEPAD
// ===========================================
function initializeGamepadControl() {
    if (!navigator.getGamepads) {
        console.warn('[Gamepad] API não suportada neste navegador');
        return;
    }
    
    window.addEventListener('gamepadconnected', function(e) {
        console.log(`[Gamepad] Conectado: ${e.gamepad.id}`);
        gamepadIndex = e.gamepad.index;
        startGamepadLoop();
    });
    
    window.addEventListener('gamepaddisconnected', function(e) {
        console.log(`[Gamepad] Desconectado: ${e.gamepad.id}`);
        if (e.gamepad.index === gamepadIndex) {
            gamepadIndex = -1;
            gamepadActive = false;
        }
    });
    
    const gamepads = navigator.getGamepads();
    for (let i = 0; i < gamepads.length; i++) {
        if (gamepads[i]) {
            console.log(`[Gamepad] Detectado: ${gamepads[i].id}`);
            gamepadIndex = i;
            startGamepadLoop();
            break;
        }
    }
}

function handleGamepadButtons(gamepad) {
    if (!gamepad || !gamepad.buttons) return;
    
    const buttonAPressed = gamepad.buttons[0] && gamepad.buttons[0].pressed;
    if (buttonAPressed && !lastButtonStates.buttonA) {
        toggleHeadlamp();
    }
    lastButtonStates.buttonA = buttonAPressed;
    
    const buttonBPressed = gamepad.buttons[1] && gamepad.buttons[1].pressed;
    if (buttonBPressed && !lastButtonStates.buttonB) {
        toggleStopMode();
    }
    lastButtonStates.buttonB = buttonBPressed;
}

function toggleHeadlamp() {
    const headlampSwitch = document.getElementById('headlamp-switch');
    if (headlampSwitch) {
        headlampSwitch.click();
        console.log('[Gamepad] Headlamp toggled');
    }
}

function toggleStopMode() {
    const stopModeSwitch = document.getElementById('stop-mode-switch');
    if (stopModeSwitch) {
        stopModeSwitch.click();
        console.log('[Gamepad] Stop mode toggled');
    }
}

function startGamepadLoop() {
    if (gamepadIndex === -1) return;
    
    let lastUpdate = 0;
    const UPDATE_INTERVAL = 100;
    
    function gamepadLoop(timestamp) {
        const gamepad = navigator.getGamepads()[gamepadIndex];
        if (!gamepad) {
            gamepadIndex = -1;
            return;
        }
        
        if (timestamp - lastUpdate < UPDATE_INTERVAL) {
            requestAnimationFrame(gamepadLoop);
            return;
        }
        lastUpdate = timestamp;
        
        const leftStickX = gamepad.axes[0];
        const leftStickY = gamepad.axes[1];
        
        let leftTrigger = 0;
        let rightTrigger = 0;
        
        if (gamepad.axes.length > 6) leftTrigger = Math.max(0, gamepad.axes[6]);
        if (gamepad.axes.length > 7) rightTrigger = Math.max(0, gamepad.axes[7]);
        
        if (leftTrigger === 0 && gamepad.buttons[6]) leftTrigger = gamepad.buttons[6].value;
        if (rightTrigger === 0 && gamepad.buttons[7]) rightTrigger = gamepad.buttons[7].value;
        
        let processedLeftX = Math.abs(leftStickX) > GAMEPAD_DEAD_ZONE ? leftStickX : 0;
        let processedLeftY = Math.abs(leftStickY) > GAMEPAD_DEAD_ZONE ? leftStickY : 0;
        
        const TRIGGER_DEAD_ZONE = 0.05;
        let processedLeftTrigger = leftTrigger > TRIGGER_DEAD_ZONE ? leftTrigger : 0;
        let processedRightTrigger = rightTrigger > TRIGGER_DEAD_ZONE ? rightTrigger : 0;
        
        handleGamepadButtons(gamepad);
        
        const gamepadInUse = Math.abs(processedLeftX) > 0 || Math.abs(processedLeftY) > 0 || 
                            processedLeftTrigger > 0 || processedRightTrigger > 0;
        
        if (gamepadInUse) {
            if (processedLeftTrigger > 0 || processedRightTrigger > 0) {
                const speedChange = (processedRightTrigger - processedLeftTrigger) * 0.02;
                const newSpeed = Math.max(0, Math.min(1, speedMultiplier + speedChange));
                
                if (Math.abs(newSpeed - speedMultiplier) > 0.01) {
                    speedMultiplier = newSpeed;
                    const speedSlider = document.getElementById('speed-slider');
                    if (speedSlider) speedSlider.value = speedMultiplier * 100;
                    updateSpeedDisplay();
                }
            }
            
            joystickPosition.x = processedLeftX * JOYSTICK_RADIUS;
            joystickPosition.y = processedLeftY * JOYSTICK_RADIUS;
            gamepadActive = true;
            
            updateJoystickVisual();
            updateMotorValues();
            updateDirectionDisplay();
        } else if (gamepadActive) {
            joystickPosition = { x: 0, y: 0 };
            gamepadActive = false;
            updateJoystickVisual();
            updateMotorValues();
            updateDirectionDisplay();
        }
        
        requestAnimationFrame(gamepadLoop);
    }
    
    requestAnimationFrame(gamepadLoop);
}

// ===========================================
// INICIALIZAÇÃO E EXPORTAÇÃO
// ===========================================
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(() => {
        initializeJoystick();
        initializeKeyboardControl();
        initializeGamepadControl();
        
        if (typeof sendSpeedCommandDebounced === 'function') {
            console.log('[Controls] Sistema de comandos disponível');
        } else {
            console.warn('[Controls] Sistema de comandos não encontrado');
        }
        
        const backSwitch = document.getElementById('back-override-switch');
        if (backSwitch) {
            backSwitch.addEventListener('click', function() {
                window.location.href = 'override.html';
            });
        }
        
        const stopModeSwitch = document.getElementById('stop-mode-switch');
        if (stopModeSwitch) {
            stopModeSwitch.addEventListener('click', function() {
                setTimeout(() => {
                    updateMotorValues();
                    updateDirectionDisplay();
                }, 10);
            });
        }
        
        console.log('[Controls] Sistema inicializado');
        console.log('[Controls] Mouse/Touch, WASD/Setas, Espaço=Stop');
        console.log('[Gamepad] Stick=Direção, Triggers=Velocidade, A=Headlamp, B=Stop');
    }, 100);
});

// Exportação para uso externo
window.joystickControl = {
    getMotorValues: calculateMotorValues,
    getSpeedMultiplier: () => speedMultiplier,
    setSpeedMultiplier: (value) => {
        const newSpeedMultiplier = Math.max(0, Math.min(1, value));
        const speedChanged = Math.abs(newSpeedMultiplier - speedMultiplier) > 0.01;
        
        speedMultiplier = newSpeedMultiplier;
        const speedSlider = document.getElementById('speed-slider');
        if (speedSlider) speedSlider.value = speedMultiplier * 100;
        updateSpeedDisplay();
        
        if (speedChanged) {
            console.log(`[Controls] Velocidade alterada para ${Math.round(speedMultiplier * 100)}%`);
            if (typeof sendSpeedCommandWithSpeed === 'function') {
                const motorValues = calculateMotorValues();
                const stopModeSwitch = document.getElementById('stop-mode-switch');
                const isStopModeActive = stopModeSwitch && stopModeSwitch.classList.contains('active');
                const leftMotor = isStopModeActive ? 0 : motorValues.left;
                const rightMotor = isStopModeActive ? 0 : motorValues.right;
                sendSpeedCommandWithSpeed(leftMotor, rightMotor, speedMultiplier, true);
            } else {
                updateMotorValues();
            }
        } else {
            updateMotorValues();
        }
    },
    reset: () => {
        joystickPosition = { x: 0, y: 0 };
        gamepadActive = false;
        lastDirectionZone = null;
        lastZoneCommand = null;
        
        updateJoystickVisual();
        updateMotorValues();
        updateDirectionDisplay();
    },
    isGamepadConnected: () => gamepadIndex !== -1,
    getGamepadStatus: () => ({
        connected: gamepadIndex !== -1,
        active: gamepadActive,
        index: gamepadIndex
    }),
    getCurrentZone: () => getCurrentDirectionZone(),
    getLastZoneCommand: () => lastZoneCommand,
    forceZoneReset: () => {
        lastDirectionZone = null;
        lastZoneCommand = null;
        console.log('[Controls] Reset de zona forçado');
    },
    testGamepad: () => {
        if (gamepadIndex === -1) {
            console.log('[Gamepad Test] Nenhum gamepad conectado');
            return;
        }
        const gamepad = navigator.getGamepads()[gamepadIndex];
        if (!gamepad) {
            console.log('[Gamepad Test] Gamepad não encontrado');
            return;
        }
        console.log(`[Gamepad Test] ID: ${gamepad.id}`);
        console.log(`[Gamepad Test] Axes: [${gamepad.axes.map(a => a.toFixed(2)).join(', ')}]`);
        console.log(`[Gamepad Test] Buttons: [${gamepad.buttons.map(b => b.pressed ? '1' : '0').join(', ')}]`);
        updateMotorValues();
    }
};
