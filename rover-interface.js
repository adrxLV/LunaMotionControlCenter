/**
 * ROVER INTERFACE SYSTEM
 * Sistema de interface incluindo sliders, switches, navegação e dashboard
 */

// ===========================================
// CONFIGURAÇÃO DE INTERFACE
// ===========================================
let isSyncing = false;
let slideLockActive = false;

// ===========================================
// SISTEMA DE SLIDERS
// ===========================================
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
        const event = new Event('input', { bubbles: true });
        targetSlider.dispatchEvent(event);
        
        if (snapApplied) {
            targetSlider.classList.add('snap-effect');
            setTimeout(() => targetSlider.classList.remove('snap-effect'), 100);
        }
    }
    
    const leftSlider = document.getElementById('left-range-slider');
    const rightSlider = document.getElementById('right-range-slider');
    if (leftSlider && rightSlider) {
        const leftVal = parseInt(leftSlider.value);
        const rightVal = parseInt(rightSlider.value);
        
        if (typeof sendSpeedCommandDebounced === 'function') {
            sendSpeedCommandDebounced(leftVal, rightVal);
        }
    }
    
    setTimeout(() => {
        isSyncing = false;
    }, 20);
}

function initializeSliders() {
    const leftSlider = document.getElementById('left-range-slider');
    const rightSlider = document.getElementById('right-range-slider');
    
    if (leftSlider && rightSlider) {
        leftSlider.addEventListener('change', function() {
            syncSliders(leftSlider, rightSlider);
        });
        
        rightSlider.addEventListener('change', function() {
            syncSliders(rightSlider, leftSlider);
        });
        
        leftSlider.addEventListener('input', function() {
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
            const rightValue = parseInt(rightSlider.value);
            const leftValue = parseInt(leftSlider.value);
            
            if (typeof sendSpeedCommandDebounced === 'function') {
                sendSpeedCommandDebounced(leftValue, rightValue);
            }
        });
        
        rightSlider.addEventListener('input', function() {
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
            const leftValue = parseInt(leftSlider.value);
            const rightValue = parseInt(rightSlider.value);
            
            if (typeof sendSpeedCommandDebounced === 'function') {
                sendSpeedCommandDebounced(leftValue, rightValue);
            }
        });
    }
    
    // Sliders verticais
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
            const leftSlider = document.getElementById('left-range-slider');
            const rightSlider = document.getElementById('right-range-slider');
            if (leftSlider && rightSlider) {
                const leftValue = parseInt(leftSlider.value);
                const rightValue = parseInt(rightSlider.value);
                
                if (typeof sendSpeedCommandDebounced === 'function') {
                    sendSpeedCommandDebounced(leftValue, rightValue);
                }
            }
        });
        
        slider.addEventListener('input', updateThumb);
        window.addEventListener('resize', updateThumb);
        updateThumb();
    });
}

// ===========================================
// SISTEMA DE SWITCHES
// ===========================================
function initializeSwitches() {
    document.querySelectorAll('.switch').forEach(function (sw) {
        if (!sw.querySelector('.switch-knob')) {
            const knob = document.createElement('div');
            knob.className = 'switch-knob';
            sw.appendChild(knob);
        }
        
        sw.addEventListener('click', function () {
            sw.classList.toggle('active');
            
            // Switch do headlamp
            if (sw.id === 'headlamp-switch') {
                const state = sw.classList.contains('active');
                if (typeof roverCommunication !== 'undefined') {
                    roverCommunication.setHeadlampState(state);
                }
            }
            
            // Switch do stop mode
            if (sw.id === 'stop-mode-switch') {
                const state = sw.classList.contains('active');
                if (typeof roverCommunication !== 'undefined') {
                    roverCommunication.setStopModeState(state);
                }
            }
            
            // Switch do avoid object
            if (sw.id === 'avoid-switch') {
                const state = sw.classList.contains('active');
                if (typeof roverCommunication !== 'undefined') {
                    roverCommunication.setAvoidObjectState(state);
                }
            }
            
            // Switch do follow object
            if (sw.id === 'follow-switch') {
                const state = sw.classList.contains('active');
                if (typeof roverCommunication !== 'undefined') {
                    roverCommunication.setFollowObjectState(state);
                }
            }
            
            // Switch do slide lock
            if (sw.id === 'slide-lock-switch') {
                slideLockActive = sw.classList.contains('active');
                const leftSlider = document.getElementById('left-range-slider');
                const rightSlider = document.getElementById('right-range-slider');
                
                if (slideLockActive && leftSlider && rightSlider) {
                    isSyncing = true;
                    rightSlider.value = leftSlider.value;
                    const updateEvent = new Event('input');
                    rightSlider.dispatchEvent(updateEvent);
                    setTimeout(() => {
                        isSyncing = false;
                    }, 20);
                }
            }
            
            // Switch do joystick mode
            if (sw.id === 'joystick-mode-switch') {
                if (sw.classList.contains('active')) {
                    window.location.href = 'override-joystick.html';
                }
            }
        });
    });
}

// ===========================================
// SISTEMA DE NAVEGAÇÃO
// ===========================================
function initializeNavigation() {
    const overrideBtn = document.getElementById('override-btn');
    const updateBtn = document.getElementById('update-btn');
    const placesBtn = document.getElementById('places-btn');
    const satellitesBtn = document.getElementById('satellites-btn');
    const configsBtn = document.getElementById('configs-btn');
    
    if (overrideBtn) {
        overrideBtn.addEventListener('click', function() {
            window.location.href = 'override.html';
        });
    }
    
    if (updateBtn) {
        updateBtn.addEventListener('click', function() {
            alert('Update functionality - Em breve');
        });
    }
    
    if (placesBtn) {
        placesBtn.addEventListener('click', function() {
            alert('Places functionality - Em breve');
        });
    }
    
    if (satellitesBtn) {
        satellitesBtn.addEventListener('click', function() {
            showSatellitePopup();
        });
    }
    
    if (configsBtn) {
        configsBtn.addEventListener('click', function() {
            alert('Configs functionality - Em breve');
        });
    }
    
    // Efeitos hover para botões de navegação
    const navButtons = document.querySelectorAll('.nav-button');
    navButtons.forEach(button => {
        button.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-2px)';
            this.style.boxShadow = '0 4px 12px rgba(255, 206, 52, 0.3)';
        });
        
        button.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0)';
            this.style.boxShadow = 'none';
        });
        
        button.addEventListener('mousedown', function() {
            this.style.transform = 'translateY(1px)';
        });
        
        button.addEventListener('mouseup', function() {
            this.style.transform = 'translateY(-2px)';
        });
    });
}

// ===========================================
// SISTEMA DE POPUP SATÉLITE
// ===========================================
function showSatellitePopup() {
    const popup = document.getElementById('satellite-popup');
    const overlay = createOverlay();
    
    document.body.appendChild(overlay);
    
    setTimeout(() => {
        popup.classList.add('show');
        overlay.classList.add('show');
    }, 10);
    
    const closeBtn = document.getElementById('satellite-popup-close');
    closeBtn.addEventListener('click', closeSatellitePopup);
    
    overlay.addEventListener('click', closeSatellitePopup);
}

function closeSatellitePopup() {
    const popup = document.getElementById('satellite-popup');
    const overlay = document.querySelector('.popup-overlay');
    
    popup.classList.remove('show');
    overlay.classList.remove('show');
    
    setTimeout(() => {
        if (overlay && overlay.parentNode) {
            overlay.parentNode.removeChild(overlay);
        }
    }, 400);
}

function createOverlay() {
    const overlay = document.createElement('div');
    overlay.className = 'popup-overlay';
    return overlay;
}

// ===========================================
// SISTEMA DE DATA/HORA
// ===========================================
function updateDateTime() {
    const now = new Date();
    const dateTimeElements = document.querySelectorAll('.datetime-text');
    
    const timezoneOffset = now.getTimezoneOffset();
    const offsetHours = Math.abs(Math.floor(timezoneOffset / 60));
    const offsetMinutes = Math.abs(timezoneOffset % 60);
    const offsetSign = timezoneOffset <= 0 ? '+' : '-';
    const timezoneString = `GMT${offsetSign}${offsetHours.toString().padStart(2, '0')}${offsetMinutes > 0 ? ':' + offsetMinutes.toString().padStart(2, '0') : ''}`;
    
    const formattedDateTime = `DATE: ${now.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    })} | ${now.toLocaleTimeString('en-GB', {
        hour: '2-digit',
        minute: '2-digit'
    })} ${timezoneString}`;
    
    dateTimeElements.forEach(element => {
        element.textContent = formattedDateTime;
    });
}

// ===========================================
// SISTEMA DE STATUS DO DASHBOARD
// ===========================================
function updateStatusValues() {
    const statusValues = document.querySelectorAll('.status-value');
    
    // Signal strength
    const signalElement = statusValues[1];
    if (signalElement) {
        const signalOptions = ['None', 'Weak', 'Medium', 'Strong'];
        const randomSignal = signalOptions[Math.floor(Math.random() * signalOptions.length)];
        signalElement.textContent = randomSignal;
    }
    
    // Battery/Strength
    const strengthElement = statusValues[2];
    if (strengthElement) {
        const strength = Math.floor(Math.random() * 101);
        strengthElement.textContent = `${strength}%`;
    }
    
    // Speed
    const speedElement = statusValues[3];
    if (speedElement) {
        const speed = (Math.random() * 3 + 3).toFixed(1);
        speedElement.textContent = speed;
    }
    
    // Mode
    const modeElement = statusValues[5];
    if (modeElement) {
        modeElement.textContent = 'Auto';
    }
    
}

// ===========================================
// SISTEMA DE MARCADORES DO ROVER
// ===========================================
function animateRoverMarker() {
    const roverMarker = document.querySelector('.rover-marker');
    if (roverMarker) {
        const baseLeft = 40;
        const baseTop = 45;
        const offsetX = (Math.random() - 0.5) * 6;
        const offsetY = (Math.random() - 0.5) * 6;
        
        const newLeft = baseLeft + offsetX;
        const newTop = baseTop + offsetY;
        
        roverMarker.style.left = `${newLeft}%`;
        roverMarker.style.top = `${newTop}%`;
        
        checkRoverProximity(newLeft, newTop);
    }
}

function checkRoverProximity(roverLeft, roverTop) {
    const roverMarker = document.querySelector('.rover-marker');
    const markers = [
        { element: document.querySelector('.marker-1'), left: 50, top: 35 },
        { element: document.querySelector('.marker-2'), left: 43, top: 42 }
    ];
    
    let isNearMarker = false;
    const proximityThreshold = 5;
    
    markers.forEach(marker => {
        if (marker.element) {
            const distance = Math.sqrt(
                Math.pow(roverLeft - marker.left, 2) + 
                Math.pow(roverTop - marker.top, 2)
            );
            
            if (distance <= proximityThreshold) {
                isNearMarker = true;
            }
        }
    });
    
    if (isNearMarker) {
        roverMarker.classList.add('near-marker');
    } else {
        roverMarker.classList.remove('near-marker');
    }
}

// ===========================================
// INICIALIZAÇÃO GERAL
// ===========================================
function initializeInterface() {
    // Sistemas base
    initializeSwitches();
    initializeSliders();
    initializeNavigation();
    
    // Atualizações periódicas
    updateDateTime();
    setInterval(updateDateTime, 1000);
    
    // Status values (apenas para dashboard principal)
    if (document.querySelector('.status-value')) {
        setInterval(updateStatusValues, 3000);
        setInterval(animateRoverMarker, 5000);
    }
    
    // Configuração inicial do slide lock
    const slideLockSwitch = document.getElementById('slide-lock-switch');
    if (slideLockSwitch) {
        slideLockActive = slideLockSwitch.classList.contains('active');
    }
    
    console.log('[Interface] Sistema de interface inicializado');
}

// ===========================================
// INICIALIZAÇÃO E EXPORTAÇÃO
// ===========================================
document.addEventListener('DOMContentLoaded', function() {
    // Aguardar outros scripts carregarem
    setTimeout(() => {
        initializeInterface();
    }, 50);
});

// Exportação para uso externo
window.roverInterface = {
    updateDateTime,
    updateStatusValues,
    animateRoverMarker,
    showSatellitePopup,
    closeSatellitePopup,
    applyMagneticSnap,
    syncSliders,
    getSlideLockState: () => slideLockActive,
    setSlideLockState: (state) => {
        slideLockActive = state;
        const slideLockSwitch = document.getElementById('slide-lock-switch');
        if (slideLockSwitch) {
            if (state) {
                slideLockSwitch.classList.add('active');
            } else {
                slideLockSwitch.classList.remove('active');
            }
        }
    }
};
