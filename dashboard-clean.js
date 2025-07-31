let isSyncing = false;
let slideLockActive = false;

// WebSocket configuration
const SERVER_URL = 'ws://192.168.4.1:8765';
let websocket = null;
let isConnected = false;
let connectionTimeout = null;

// Command sending configuration
let lastCommand = null;
let commandInterval = null;
let lastSentCommand = null; // Track last sent command to avoid duplicates
let debounceTimeout = null; // For debouncing slider input
let headLampState = false; // Track headlamp state
const COMMAND_INTERVAL_MS = 1500; // Send command every 1.5 seconds
const DEBOUNCE_MS = 50; // Debounce slider input

// WebSocket functions
function connectToServer() {
  console.log('[WebSocket] Conectando ao servidor:', SERVER_URL);
  
  try {
    websocket = new WebSocket(SERVER_URL);
    
    // Set connection timeout
    connectionTimeout = setTimeout(() => {
      if (websocket.readyState === WebSocket.CONNECTING) {
        console.error('[WebSocket] Timeout - Servidor nao respondeu');
        websocket.close();
      }
    }, 5000);
    
    websocket.onopen = function(event) {
      console.log('[WebSocket] Conectado com sucesso');
      clearTimeout(connectionTimeout);
      isConnected = true;
      updateConnectionStatus(true);
    };
    
    websocket.onmessage = function(event) {
      try {
        const data = JSON.parse(event.data);
        handleServerResponse(data);
      } catch (error) {
        console.warn('[WebSocket] Erro ao analisar mensagem:', event.data);
      }
    };
    
    websocket.onclose = function(event) {
      console.log('[WebSocket] Conexao fechada - Codigo:', event.code);
      clearTimeout(connectionTimeout);
      isConnected = false;
      updateConnectionStatus(false);
      
      // Auto-reconnect after 3 seconds
      setTimeout(connectToServer, 3000);
    };
    
    websocket.onerror = function(error) {
      console.error('[WebSocket] Erro - Verifique se o servidor esta ativo');
      clearTimeout(connectionTimeout);
      isConnected = false;
      updateConnectionStatus(false);
    };
    
  } catch (error) {
    console.error('[WebSocket] Falha ao criar conexao WebSocket');
    isConnected = false;
    updateConnectionStatus(false);
  }
}

function sendSpeedCommandDebounced(leftValue, rightValue) {
  // Clear any existing debounce timeout
  if (debounceTimeout) {
    clearTimeout(debounceTimeout);
  }
  
  // Set new debounce timeout
  debounceTimeout = setTimeout(() => {
    const leftVal = parseInt(leftValue);
    const rightVal = parseInt(rightValue);
    
    // Send command immediately when slider changes
    sendSpeedCommand(leftVal, rightVal);
  }, DEBOUNCE_MS);
}

function sendSpeedCommand(leftValue, rightValue) {
  const command = {
    "K": parseInt(leftValue),
    "Q": parseInt(rightValue),
    "D": 90,
    "M": headLampState
  };
  
  // Always store the command for continuous sending
  lastCommand = command;
  
  if (websocket && websocket.readyState === WebSocket.OPEN) {
    try {
      const message = JSON.stringify(command);
      websocket.send(message);
      lastSentCommand = { ...command }; // Track what was actually sent
      console.log('[Comando] Enviado:', message);
    } catch (error) {
      console.error('[Comando] Falha ao enviar comando:', error);
    }
  } else {
    console.warn('[Comando] WebSocket nao esta pronto - Comando ignorado');
  }
}

function startCommandInterval() {
  // Clear any existing interval
  if (commandInterval) {
    clearInterval(commandInterval);
  }
  
  // Start sending commands every 1.5 seconds regardless of values
  commandInterval = setInterval(() => {
    if (lastCommand) {
      // Always send the last command to maintain connection
      sendSpeedCommand(lastCommand.K, lastCommand.Q);
    }
  }, COMMAND_INTERVAL_MS);
}

function stopCommandInterval() {
  if (commandInterval) {
    clearInterval(commandInterval);
    commandInterval = null;
  }
  // Send final stop command
  sendSpeedCommand(0, 0);
  lastCommand = { K: 0, Q: 0, D: 90, M: headLampState };
}

function getWebSocketStatusText() {
  if (!websocket) return 'NULL';
  
  switch(websocket.readyState) {
    case WebSocket.CONNECTING:
      return '0 (CONNECTING - A conectar)';
    case WebSocket.OPEN:
      return '1 (OPEN - Conectado)';
    case WebSocket.CLOSING:
      return '2 (CLOSING - A fechar)';
    case WebSocket.CLOSED:
      return '3 (CLOSED - Fechado)';
    default:
      return 'DESCONHECIDO';
  }
}

function handleServerResponse(data) {
  // Process server response silently
}

function updateConnectionStatus(connected) {
  const status = connected ? 'CONECTADO' : 'DESCONECTADO';
  // Visual indicators can be added here later
}

// Função para snap magnético
function applyMagneticSnap(slider, snapValue = 0, snapRange = 8) {
  const value = parseInt(slider.value, 10);
  if (Math.abs(value - snapValue) <= snapRange && value !== snapValue) {
    slider.value = snapValue;
    slider.classList.add('snap-effect');
    setTimeout(() => slider.classList.remove('snap-effect'), 100);
    return true; 
  }
  return false;
}

function syncSliders(sourceSlider, targetSlider, snapValue = 0, snapRange = 8) {
  if (isSyncing) return;
  
  isSyncing = true;
  
  const snapApplied = applyMagneticSnap(sourceSlider, snapValue, snapRange);
  
  if (slideLockActive && targetSlider) {
    targetSlider.value = sourceSlider.value;
    // Atualiza a UI 
    const event = new Event('input', { bubbles: true });
    targetSlider.dispatchEvent(event);
    
    if (snapApplied) {
      targetSlider.classList.add('snap-effect');
      setTimeout(() => targetSlider.classList.remove('snap-effect'), 100);
    }
  }
  
  // Send speed command in real-time
  const leftSlider = document.getElementById('left-range-slider');
  const rightSlider = document.getElementById('right-range-slider');
  if (leftSlider && rightSlider) {
    const leftVal = parseInt(leftSlider.value);
    const rightVal = parseInt(rightSlider.value);
    
    sendSpeedCommandDebounced(leftVal, rightVal);
  }
  
  setTimeout(() => {
    isSyncing = false;
  }, 20);
}

window.addEventListener('DOMContentLoaded', function() {
  // Initialize WebSocket connection
  connectToServer();
  
  // Start continuous command sending immediately
  lastCommand = { K: 0, Q: 0, D: 90, M: headLampState };
  startCommandInterval();
  
  const leftSlider = document.getElementById('left-range-slider');

  // Navigation functionality for main dashboard
  const overrideBtn = document.getElementById('override-btn');
  
  if (overrideBtn) {
    overrideBtn.addEventListener('click', function() {
      window.location.href = 'override.html';
    });
  }

  // Update current date and time
  function updateDateTime() {
    const now = new Date();
    const options = {
      day: '2-digit',
      month: '2-digit', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'GMT'
    };
    
    const dateTimeElements = document.querySelectorAll('.datetime-text');
    const formattedDateTime = `DATE: ${now.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })} | ${now.toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'GMT'
    })} GMT+0`;
    
    dateTimeElements.forEach(element => {
      element.textContent = formattedDateTime;
    });
  }

  // Update status values (simulated real-time data)
  function updateStatusValues() {
    const ultrasonicValue = document.getElementById('ultrasonic-value');
    const leftIrValue = document.getElementById('left-ir-value');
    const rightIrValue = document.getElementById('right-ir-value');
    
    if (ultrasonicValue) {
      // Simulate ultrasonic readings
      const distance = Math.floor(Math.random() * 50) + 10;
      ultrasonicValue.textContent = `${distance} cm`;
    }
    
    if (leftIrValue) {
      // Simulate IR sensor readings
      const leftIr = Math.floor(Math.random() * 100);
      leftIrValue.textContent = leftIr;
    }
    
    if (rightIrValue) {
      // Simulate IR sensor readings  
      const rightIr = Math.floor(Math.random() * 100);
      rightIrValue.textContent = rightIr;
    }
  }

  // Initialize datetime update
  updateDateTime();
  setInterval(updateDateTime, 1000);
  
  // Initialize status updates (if on override page)
  if (document.getElementById('ultrasonic-value')) {
    setInterval(updateStatusValues, 2000);
  }
  const rightSlider = document.getElementById('right-range-slider');
  
  if (leftSlider && rightSlider) {
    leftSlider.addEventListener('change', function() {
      syncSliders(leftSlider, rightSlider);
    });
    
    rightSlider.addEventListener('change', function() {
      syncSliders(rightSlider, leftSlider);
    });
  }
  
  // Add event listeners to stop rover when page is closed or unloaded
  window.addEventListener('beforeunload', function() {
    stopCommandInterval();
  });
  
  window.addEventListener('unload', function() {
    stopCommandInterval();
  });
  
  // Stop rover if user navigates away
  window.addEventListener('pagehide', function() {
    stopCommandInterval();
  });
});

// JavaScript para controlar switches e sliders na dashboard
document.addEventListener('DOMContentLoaded', function () {

    document.querySelectorAll('.switch').forEach(function (sw) {
        if (!sw.querySelector('.switch-knob')) {
            const knob = document.createElement('div');
            knob.className = 'switch-knob';
            sw.appendChild(knob);
        }
        sw.addEventListener('click', function () {
            sw.classList.toggle('active');
            
            // Handle HeadLamp switch specifically
            if (sw.id === 'headlamp-switch') {
                headLampState = sw.classList.contains('active');
                console.log('[HeadLamp] Estado alterado para:', headLampState);
                
                // Send command immediately when headlamp changes
                if (lastCommand) {
                    sendSpeedCommand(lastCommand.K, lastCommand.Q);
                }
            }
            
            // Handle Joystick Mode switch
            if (sw.id === 'joystick-mode-switch') {
                if (sw.classList.contains('active')) {
                    console.log('[UI] Mudando para modo Joystick');
                    window.location.href = 'override-joystick.html';
                }
            }
        });
    });

    const slideLockSwitch = document.getElementById('slide-lock-switch');
    const leftSlider = document.getElementById('left-range-slider');
    const rightSlider = document.getElementById('right-range-slider');
    
    if (slideLockSwitch) {
        slideLockActive = slideLockSwitch.classList.contains('active');
    }

    if (slideLockSwitch && leftSlider && rightSlider) {
        slideLockSwitch.addEventListener('click', function () {
            slideLockActive = !slideLockActive;
            if (slideLockActive) {
                isSyncing = true;
                rightSlider.value = leftSlider.value;
                const updateEvent = new Event('input');
                rightSlider.dispatchEvent(updateEvent);
                setTimeout(() => {
                    isSyncing = false;
                }, 20);
            }
        });

        leftSlider.addEventListener('input', function () {
            if (isSyncing) return;
            if (slideLockActive) {
                isSyncing = true;
                rightSlider.value = leftSlider.value;
                const event = new Event('input', { bubbles: true });
                rightSlider.dispatchEvent(event);
                setTimeout(() => {
                    isSyncing = false;
                }, 5);
            }
            // Use debounced command sending
            const rightValue = parseInt(document.getElementById('right-range-slider').value);
            const leftValue = parseInt(leftSlider.value);
            
            sendSpeedCommandDebounced(leftValue, rightValue);
        });
        
        rightSlider.addEventListener('input', function () {
            if (isSyncing) return;
            if (slideLockActive) {
                isSyncing = true;
                leftSlider.value = rightSlider.value;
                const event = new Event('input', { bubbles: true });
                leftSlider.dispatchEvent(event);
                setTimeout(() => {
                    isSyncing = false;
                }, 5);
            }
            // Use debounced command sending
            const leftValue = parseInt(document.getElementById('left-range-slider').value);
            const rightValue = parseInt(rightSlider.value);
            
            sendSpeedCommandDebounced(leftValue, rightValue);
        });
    }

    // Sliders (vertical)
    document.querySelectorAll('.slider-input').forEach(function (slider) {
        const track = slider.closest('.slider-track');
        const thumb = track.querySelector('.slider-thumb');
        function updateThumb() {
            const min = parseFloat(slider.min) || 0;
            const max = parseFloat(slider.max) || 100;
            const val = parseFloat(slider.value);
            const percent = (val - min) / (max - min);
            const trackHeight = track.offsetHeight - thumb.offsetHeight;
            thumb.style.position = 'absolute';
            thumb.style.left = '0';
            thumb.style.width = '90px';
            thumb.style.height = '39px';
            thumb.style.top = (trackHeight * (1 - percent)) + 'px';
        }
        slider.addEventListener('input', function() {
            updateThumb();
            // Use debounced command sending for slider changes
            const leftSlider = document.getElementById('left-range-slider');
            const rightSlider = document.getElementById('right-range-slider');
            if (leftSlider && rightSlider) {
                const leftValue = parseInt(leftSlider.value);
                const rightValue = parseInt(rightSlider.value);
                
                sendSpeedCommandDebounced(leftValue, rightValue);
            }
        });
        slider.addEventListener('input', updateThumb);
        window.addEventListener('resize', updateThumb);
        updateThumb();
    });
    
    // Initialization complete
});
