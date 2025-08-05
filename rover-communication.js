/**
 * ROVER COMMUNICATION SYSTEM
 * Sistema de comunicação WebSocket e controle de comandos do rover
 */

// ===========================================
// CONFIGURAÇÃO DE COMUNICAÇÃO
// ===========================================
const SERVER_URL = 'ws://192.168.4.1:8765';
let websocket = null;
let isConnected = false;
let connectionTimeout = null;

// Sistema de comandos
let lastCommand = null;
let commandInterval = null;
let lastSentCommand = null;
let debounceTimeout = null;
let headLampState = false;
let stopModeActive = false;
let avoidObjectState = false;
let followObjectState = false;
let lastSpeedMultiplier = null;

// Configurações de tempo
const COMMAND_INTERVAL_MS = 1500;
const DEBOUNCE_MS = 60;
const COMMAND_CHANGE_THRESHOLD = 25;

// Controle de reconexão
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 10;
let reconnectTimeout = null;
let isReconnecting = false;

// Monitoramento de performance
let commandsSent = 0;
let commandsSkipped = 0;
let performanceInterval = null;

// ===========================================
// SISTEMA WEBSOCKET
// ===========================================
function connectToServer() {
    if (isReconnecting) {
        console.log('[WebSocket] Tentativa de conexão já em andamento');
        return;
    }
    
    if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
        console.error('[WebSocket] Número máximo de tentativas de reconexão atingido');
        return;
    }
    
    console.log(`[WebSocket] Conectando ao servidor: ${SERVER_URL} (Tentativa ${reconnectAttempts + 1}/${MAX_RECONNECT_ATTEMPTS})`);
    
    // Cleanup de conexão anterior
    if (websocket) {
        websocket.onopen = null;
        websocket.onmessage = null;
        websocket.onclose = null;
        websocket.onerror = null;
        if (websocket.readyState === WebSocket.OPEN || websocket.readyState === WebSocket.CONNECTING) {
            websocket.close();
        }
        websocket = null;
    }
    
    isReconnecting = true;
    
    try {
        websocket = new WebSocket(SERVER_URL);
        
        connectionTimeout = setTimeout(() => {
            if (websocket && websocket.readyState === WebSocket.CONNECTING) {
                console.error('[WebSocket] Timeout - Servidor não respondeu');
                websocket.close();
                handleConnectionFailure();
            }
        }, 5000);
        
        websocket.onopen = function(event) {
            console.log('[WebSocket] Conectado com sucesso');
            clearTimeout(connectionTimeout);
            connectionTimeout = null;
            
            isConnected = true;
            isReconnecting = false;
            reconnectAttempts = 0;
            
            updateConnectionStatus(true);
        };
        
        websocket.onmessage = function(event) {
            try {
                const data = JSON.parse(event.data);
                handleServerResponse(data);
            } catch (error) {
                console.warn('[WebSocket] Erro ao analisar mensagem:', event.data, error);
            }
        };
        
        websocket.onclose = function(event) {
            console.log(`[WebSocket] Conexão fechada - Código: ${event.code}, Razão: ${event.reason}`);
            cleanup();
            
            if (!isReconnecting && reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
                scheduleReconnect();
            }
        };
        
        websocket.onerror = function(error) {
            console.error('[WebSocket] Erro de conexão - Verifique se o servidor está ativo');
            cleanup();
            handleConnectionFailure();
        };
        
    } catch (error) {
        console.error('[WebSocket] Falha ao criar conexão WebSocket:', error);
        cleanup();
        handleConnectionFailure();
    }
}

function cleanup() {
    if (connectionTimeout) {
        clearTimeout(connectionTimeout);
        connectionTimeout = null;
    }
    
    isConnected = false;
    isReconnecting = false;
    updateConnectionStatus(false);
}

function handleConnectionFailure() {
    cleanup();
    
    if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
        scheduleReconnect();
    } else {
        console.error('[WebSocket] Falha permanente de conexão - Parando tentativas de reconexão');
    }
}

function scheduleReconnect() {
    if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
    }
    
    reconnectAttempts++;
    const delay = Math.min(3000 * reconnectAttempts, 30000); // Backoff exponencial limitado a 30s
    
    console.log(`[WebSocket] Reagendando reconexão em ${delay}ms (Tentativa ${reconnectAttempts})`);
    
    reconnectTimeout = setTimeout(() => {
        reconnectTimeout = null;
        connectToServer();
    }, delay);
}

function resetConnection() {
    console.log('[WebSocket] Resetando conexão...');
    
    // Cleanup completo
    if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
        reconnectTimeout = null;
    }
    
    if (connectionTimeout) {
        clearTimeout(connectionTimeout);
        connectionTimeout = null;
    }
    
    if (websocket) {
        websocket.onopen = null;
        websocket.onmessage = null;
        websocket.onclose = null;
        websocket.onerror = null;
        
        if (websocket.readyState === WebSocket.OPEN || websocket.readyState === WebSocket.CONNECTING) {
            websocket.close();
        }
        websocket = null;
    }
    
    // Reset de estados
    isConnected = false;
    isReconnecting = false;
    reconnectAttempts = 0;
    
    // Reiniciar conexão
    connectToServer();
}

function handleServerResponse(data) {
    // Sensores ultrassônicos
    if (data.hasOwnProperty('O')) {
        const ultrasonicElement = document.getElementById('ultrasonic-value');
        if (ultrasonicElement) {
            ultrasonicElement.textContent = data.O.toFixed(1) + ' cm';
        }
    }
    
    // Sensor IR esquerdo
    if (data.hasOwnProperty('N')) {
        const leftIRElement = document.getElementById('left-ir-value');
        if (leftIRElement) {
            leftIRElement.textContent = data.N;
        }
    }
    
    // Sensor IR direito
    if (data.hasOwnProperty('P')) {
        const rightIRElement = document.getElementById('right-ir-value');
        if (rightIRElement) {
            rightIRElement.textContent = data.P;
        }
    }
    
    console.log('[WebSocket] Dados recebidos:', data);
}

function updateConnectionStatus(connected) {
    const status = connected ? 'CONECTADO' : 'DESCONECTADO';
    console.log(`[WebSocket] Status: ${status}`);
    
    // Atualizar elementos da UI se existirem
    const statusElements = document.querySelectorAll('.connection-status');
    statusElements.forEach(element => {
        element.textContent = status;
        element.className = `connection-status ${connected ? 'connected' : 'disconnected'}`;
    });
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

// ===========================================
// SISTEMA DE COMANDOS
// ===========================================
function sendSpeedCommandDebounced(leftValue, rightValue) {
    if (debounceTimeout) {
        clearTimeout(debounceTimeout);
    }
    
    debounceTimeout = setTimeout(() => {
        const leftVal = parseInt(leftValue);
        const rightVal = parseInt(rightValue);
        
        sendSpeedCommand(leftVal, rightVal, false);
    }, DEBOUNCE_MS);
}

function sendSpeedCommand(leftValue, rightValue, forceImmediate = false) {
    if (!websocket || websocket.readyState !== WebSocket.OPEN || !isConnected) {
        console.warn('[Comando] WebSocket não está pronto - Comando ignorado');
        return false;
    }
    
    if (stopModeActive) {
        leftValue = 0;
        rightValue = 0;
    }
    
    const command = {
        "K": parseInt(leftValue),
        "Q": parseInt(rightValue),
        "D": window.cameraAngle || 90,
        "M": stopModeActive ? false : headLampState,
        "E": avoidObjectState,
        "F": followObjectState
    };
    
    lastCommand = command;
    
    const shouldSendImmediate = forceImmediate || 
                              hasSignificantChange(command.K, command.Q) || 
                              hasStateChange(command);
    
    if (!shouldSendImmediate) {
        commandsSkipped++;
        console.log(`[Comando] Mudança insignificante - K: ${command.K}, Q: ${command.Q}`);
        return false;
    }
    
    try {
        const message = JSON.stringify(command);
        websocket.send(message);
        lastSentCommand = { ...command };
        commandsSent++;
        console.log('[Comando] Enviado:', message);
        return true;
    } catch (error) {
        console.error('[Comando] Falha ao enviar comando:', error);
        // Se falhar ao enviar, pode ser que a conexão esteja instável
        if (websocket.readyState !== WebSocket.OPEN) {
            isConnected = false;
            updateConnectionStatus(false);
        }
        return false;
    }
}

function sendSpeedCommandWithSpeed(leftValue, rightValue, speedMultiplier, forceImmediate = false) {
    const speedChanged = hasSpeedChange(speedMultiplier);
    return sendSpeedCommand(leftValue, rightValue, forceImmediate || speedChanged);
}

function hasSignificantChange(newLeftValue, newRightValue) {
    if (!lastSentCommand) return true;
    
    const leftDiff = Math.abs(newLeftValue - lastSentCommand.K);
    const rightDiff = Math.abs(newRightValue - lastSentCommand.Q);
    
    return leftDiff >= COMMAND_CHANGE_THRESHOLD || rightDiff >= COMMAND_CHANGE_THRESHOLD;
}

function hasStateChange(newCommand) {
    if (!lastSentCommand) return true;
    return lastSentCommand.M !== newCommand.M || 
           lastSentCommand.E !== newCommand.E || 
           lastSentCommand.F !== newCommand.F;
}

function hasSpeedChange(currentSpeedMultiplier) {
    if (lastSpeedMultiplier === null) {
        lastSpeedMultiplier = currentSpeedMultiplier;
        return false;
    }
    
    const speedChanged = Math.abs(currentSpeedMultiplier - lastSpeedMultiplier) > 0.01;
    if (speedChanged) {
        lastSpeedMultiplier = currentSpeedMultiplier;
        return true;
    }
    return false;
}

// ===========================================
// SISTEMA DE COMANDOS CONTÍNUOS
// ===========================================
function startCommandInterval() {
    if (commandInterval) {
        clearInterval(commandInterval);
        commandInterval = null;
    }
    
    commandInterval = setInterval(() => {
        if (lastCommand && isConnected && websocket && websocket.readyState === WebSocket.OPEN) {
            sendSpeedCommand(lastCommand.K, lastCommand.Q, true);
        } else if (!isConnected) {
            console.warn('[CommandInterval] Não conectado - comando ignorado');
        }
    }, COMMAND_INTERVAL_MS);
    
    console.log('[CommandInterval] Iniciado');
}

function stopCommandInterval() {
    if (commandInterval) {
        clearInterval(commandInterval);
        commandInterval = null;
        console.log('[CommandInterval] Parado');
    }
    
    // Enviar comando de parada final
    if (isConnected && websocket && websocket.readyState === WebSocket.OPEN) {
        sendSpeedCommand(0, 0, true);
    }
    
    lastCommand = { K: 0, Q: 0, D: 90, M: stopModeActive ? false : headLampState, E: avoidObjectState, F: followObjectState };
}

// ===========================================
// MONITORAMENTO DE PERFORMANCE
// ===========================================
function getCommandStats() {
    const total = commandsSent + commandsSkipped;
    const efficiency = total > 0 ? ((commandsSkipped / total) * 100).toFixed(1) : 0;
    return {
        sent: commandsSent,
        skipped: commandsSkipped,
        total: total,
        efficiency: `${efficiency}% optimizado`,
        reconnectAttempts: reconnectAttempts,
        connectionStatus: isConnected ? 'Conectado' : 'Desconectado'
    };
}

function startPerformanceMonitoring() {
    if (performanceInterval) {
        clearInterval(performanceInterval);
    }
    
    performanceInterval = setInterval(() => {
        if (commandsSent > 0 || commandsSkipped > 0) {
            const stats = getCommandStats();
            console.log(`[Performance] Comandos - Enviados: ${stats.sent}, Ignorados: ${stats.skipped}, Eficiência: ${stats.efficiency}`);
            commandsSent = 0;
            commandsSkipped = 0;
        }
    }, 10000);
}

function stopPerformanceMonitoring() {
    if (performanceInterval) {
        clearInterval(performanceInterval);
        performanceInterval = null;
    }
}

// ===========================================
// CONTROLE DE ESTADOS DO ROVER
// ===========================================
function setHeadlampState(state) {
    headLampState = state;
    console.log('[HeadLamp] Estado alterado para:', headLampState);
    
    if (lastCommand && isConnected) {
        sendSpeedCommand(lastCommand.K, lastCommand.Q, true);
    }
}

function setStopModeState(state) {
    stopModeActive = state;
    console.log('[Stop Mode] Estado alterado para:', stopModeActive);
    
    if (lastCommand && isConnected) {
        sendSpeedCommand(lastCommand.K, lastCommand.Q, true);
    }
}

function getHeadlampState() {
    return headLampState;
}

function getStopModeState() {
    return stopModeActive;
}

function setAvoidObjectState(state) {
    avoidObjectState = state;
    console.log('[Avoid Object] Estado alterado para:', avoidObjectState);
    
    if (lastCommand && isConnected) {
        sendSpeedCommand(lastCommand.K, lastCommand.Q, true);
    }
}

function setFollowObjectState(state) {
    followObjectState = state;
    console.log('[Follow Object] Estado alterado para:', followObjectState);
    
    if (lastCommand && isConnected) {
        sendSpeedCommand(lastCommand.K, lastCommand.Q, true);
    }
}

function getAvoidObjectState() {
    return avoidObjectState;
}

function getFollowObjectState() {
    return followObjectState;
}

// ===========================================
// INICIALIZAÇÃO E EXPORTAÇÃO
// ===========================================
function initializeCommunicationSystem() {
    console.log('[Communication] Iniciando sistema de comunicação...');
    
    // Limpar estados anteriores
    if (commandInterval) {
        clearInterval(commandInterval);
        commandInterval = null;
    }
    
    if (performanceInterval) {
        clearInterval(performanceInterval);
        performanceInterval = null;
    }
    
    // Inicializar comando base
    lastCommand = { K: 0, Q: 0, D: 90, M: stopModeActive ? false : headLampState, E: avoidObjectState, F: followObjectState };
    
    // Conectar ao servidor
    connectToServer();
    
    // Iniciar sistemas
    startCommandInterval();
    startPerformanceMonitoring();
    
    console.log('[Communication] Sistema de comunicação inicializado');
}

function shutdownCommunicationSystem() {
    console.log('[Communication] Parando sistema de comunicação...');
    
    // Parar intervals
    stopCommandInterval();
    stopPerformanceMonitoring();
    
    // Limpar timeouts
    if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
        reconnectTimeout = null;
    }
    
    if (connectionTimeout) {
        clearTimeout(connectionTimeout);
        connectionTimeout = null;
    }
    
    if (debounceTimeout) {
        clearTimeout(debounceTimeout);
        debounceTimeout = null;
    }
    
    // Fechar websocket
    if (websocket) {
        websocket.onopen = null;
        websocket.onmessage = null;
        websocket.onclose = null;
        websocket.onerror = null;
        
        if (websocket.readyState === WebSocket.OPEN) {
            // Enviar comando de parada final antes de fechar
            try {
                websocket.send(JSON.stringify({ K: 0, Q: 0, D: 90, M: false, E: false, F: false }));
            } catch (error) {
                console.warn('[Communication] Erro ao enviar comando final:', error);
            }
        }
        
        websocket.close();
        websocket = null;
    }
    
    // Reset estados
    isConnected = false;
    isReconnecting = false;
    reconnectAttempts = 0;
    
    console.log('[Communication] Sistema de comunicação parado');
}

window.addEventListener('DOMContentLoaded', function() {
    initializeCommunicationSystem();
    
    window.addEventListener('beforeunload', function() {
        shutdownCommunicationSystem();
    });
    
    window.addEventListener('unload', function() {
        shutdownCommunicationSystem();
    });
    
    window.addEventListener('pagehide', function() {
        shutdownCommunicationSystem();
    });
});

// Exportação para uso externo
window.roverCommunication = {
    sendSpeedCommand,
    sendSpeedCommandDebounced,
    sendSpeedCommandWithSpeed,
    connectToServer,
    resetConnection,
    getWebSocketStatusText,
    getCommandStats,
    setHeadlampState,
    setStopModeState,
    getHeadlampState,
    getStopModeState,
    setAvoidObjectState,
    setFollowObjectState,
    getAvoidObjectState,
    getFollowObjectState,
    isConnected: () => isConnected,
    getReconnectAttempts: () => reconnectAttempts,
    initialize: initializeCommunicationSystem,
    shutdown: shutdownCommunicationSystem
};

// Funções globais para compatibilidade
window.sendSpeedCommandDebounced = sendSpeedCommandDebounced;
window.sendSpeedCommandWithSpeed = sendSpeedCommandWithSpeed;
window.getCommandStats = getCommandStats;
