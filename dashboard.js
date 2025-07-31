
let isSyncing = false;
let slideLockActive = false;

// WebSocket configuration
const SERVER_URL = 'ws://192.168.4.1:8765';
let websocket = null;
let isConnected = false;
let connectionTimeout = null;

// WebSocket functions
function connectToServer() {
  console.log('[WebSocket] A tentar conectar a:', SERVER_URL);
  
  try {
    websocket = new WebSocket(SERVER_URL);
    console.log('[WebSocket] WebSocket criado, estado inicial:', getWebSocketStatusText());
    
    // Set connection timeout
    connectionTimeout = setTimeout(() => {
      if (websocket.readyState === WebSocket.CONNECTING) {
        console.error('[WebSocket] Timeout de conexao - Servidor nao respondeu em 5 segundos');
        console.error('[WebSocket] Verifique se o servidor esta ativo em', SERVER_URL);
        websocket.close();
      }
    }, 5000);
    
    websocket.onopen = function(event) {
      console.log('[WebSocket] Conectado com sucesso a:', SERVER_URL);
      console.log('[WebSocket] Estado da conexao:', getWebSocketStatusText());
      clearTimeout(connectionTimeout);
      isConnected = true;
      updateConnectionStatus(true);
    };
    
    websocket.onmessage = function(event) {
      console.log('[WebSocket] Mensagem recebida:', event.data);
      try {
        const data = JSON.parse(event.data);
        console.log('[WebSocket] Dados analisados:', data);
        handleServerResponse(data);
      } catch (error) {
        console.warn('[WebSocket] Falha ao analisar mensagem como JSON:', event.data);
      }
    };
    
    websocket.onclose = function(event) {
      console.log('[WebSocket] Conexao fechada. Codigo:', event.code, 'Razao:', event.reason);
      console.log('[WebSocket] Estado da conexao:', getWebSocketStatusText());
      clearTimeout(connectionTimeout);
      isConnected = false;
      updateConnectionStatus(false);
      
      // Auto-reconnect after 3 seconds
      console.log('[WebSocket] A tentar reconectar em 3 segundos...');
      setTimeout(connectToServer, 3000);
    };
    
    websocket.onerror = function(error) {
      console.error('[WebSocket] Erro ocorrido:', error);
      console.log('[WebSocket] Estado da conexao:', getWebSocketStatusText());
      console.error('[WebSocket] Detalhes do erro - Verifique se o servidor esta ativo em', SERVER_URL);
      clearTimeout(connectionTimeout);
      isConnected = false;
      updateConnectionStatus(false);
    };
    
  } catch (error) {
    console.error('[WebSocket] Falha ao criar conexao WebSocket:', error);
    isConnected = false;
    updateConnectionStatus(false);
  }
}

function sendSpeedCommand(leftValue, rightValue) {
  const command = {
    "K": parseInt(leftValue),
    "Q": parseInt(rightValue)
  };
  
  console.log('[Comando] A preparar envio de comando de velocidade:', command);
  
  if (websocket && websocket.readyState === WebSocket.OPEN) {
    try {
      const message = JSON.stringify(command);
      websocket.send(message);
      console.log('[Comando] Comando de velocidade enviado com sucesso:', message);
    } catch (error) {
      console.error('[Comando] Falha ao enviar comando:', error);
    }
  } else {
    const statusText = getWebSocketStatusText();
    console.warn('[Comando] Nao e possivel enviar comando - WebSocket nao esta pronto. Estado:', statusText);
    console.log('[Comando] Comando em fila:', command);
  }
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
  console.log('[Resposta] A processar resposta do servidor:', data);
  // Add response handling logic here if needed
}

function updateConnectionStatus(connected) {
  const status = connected ? 'CONECTADO' : 'DESCONECTADO';
  console.log('[Estado] Estado da conexao:', status);
  
  // You can add visual indicators here later
  // For now, just console logging
}

// Função para  snap magnético
function applyMagneticSnap(slider, snapValue = 50, snapRange = 5) {
  const value = parseInt(slider.value, 10);
  if (Math.abs(value - snapValue) <= snapRange && value !== snapValue) {
    slider.value = snapValue;
    slider.classList.add('snap-effect');
    setTimeout(() => slider.classList.remove('snap-effect'), 150);
    return true; 
  }
  return false;
}
function syncSliders(sourceSlider, targetSlider, snapValue = 50, snapRange = 10) {
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
      setTimeout(() => targetSlider.classList.remove('snap-effect'), 150);
    }
  }
  
  // Send speed command in real-time
  const leftSlider = document.getElementById('left-range-slider');
  const rightSlider = document.getElementById('right-range-slider');
  if (leftSlider && rightSlider) {
    console.log('[Sliders] Esquerda:', leftSlider.value, '| Direita:', rightSlider.value);
    sendSpeedCommand(leftSlider.value, rightSlider.value);
    
    if (slideLockActive && leftSlider.value !== rightSlider.value) {
      console.warn('[Sliders] Slide Lock esta ativo, mas os valores nao estao iguais!');
    }
  }
  
  setTimeout(() => {
    isSyncing = false;
  }, 50);
}

window.addEventListener('DOMContentLoaded', function() {
  console.log('[Inicializacao] A inicializar dashboard...');
  
  // Initialize WebSocket connection
  console.log('[Inicializacao] A iniciar conexao WebSocket...');
  connectToServer();
  
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
                }, 50);
            }
        });

        leftSlider.addEventListener('input', function () {
            console.log('[Slider] Slider esquerdo alterado para:', leftSlider.value);
            if (isSyncing) return;
            if (slideLockActive) {
                isSyncing = true;
                rightSlider.value = leftSlider.value;
                const event = new Event('input', { bubbles: true });
                rightSlider.dispatchEvent(event);
                setTimeout(() => {
                    isSyncing = false;
                }, 10);
            }
            // Send real-time command
            const rightValue = document.getElementById('right-range-slider').value;
            sendSpeedCommand(leftSlider.value, rightValue);
        });
        
        rightSlider.addEventListener('input', function () {
            console.log('[Slider] Slider direito alterado para:', rightSlider.value);
            if (isSyncing) return;
            if (slideLockActive) {
                isSyncing = true;
                leftSlider.value = rightSlider.value;
                const event = new Event('input', { bubbles: true });
                leftSlider.dispatchEvent(event);
                setTimeout(() => {
                    isSyncing = false;
                }, 10);
            }
            // Send real-time command
            const leftValue = document.getElementById('left-range-slider').value;
            sendSpeedCommand(leftValue, rightSlider.value);
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
            // Send real-time command when any slider changes
            const leftSlider = document.getElementById('left-range-slider');
            const rightSlider = document.getElementById('right-range-slider');
            if (leftSlider && rightSlider) {
                console.log('[Slider] Slider vertical alterado, a enviar comando...');
                sendSpeedCommand(leftSlider.value, rightSlider.value);
            }
        });
        slider.addEventListener('input', updateThumb);
        window.addEventListener('resize', updateThumb);
        updateThumb();
    });
    
    console.log('[Inicializacao] Inicializacao do dashboard completa!');
    console.log('[Inicializacao] URL WebSocket:', SERVER_URL);
    console.log('[Inicializacao] Sliders configurados para controlo em tempo real');
});
