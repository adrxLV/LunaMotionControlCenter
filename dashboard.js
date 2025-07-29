
let isSyncing = false;
let slideLockActive = false;

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
  
  const leftSlider = document.getElementById('left-range-slider');
  const rightSlider = document.getElementById('right-range-slider');
  if (leftSlider && rightSlider) {
    console.log(`Left: ${leftSlider.value} | Right: ${rightSlider.value}`);
    if (slideLockActive && leftSlider.value !== rightSlider.value) {
      console.warn('Slide Lock está ativo, mas os valores não estão iguais!');
    }
  }
  
  setTimeout(() => {
    isSyncing = false;
  }, 50);
}

window.addEventListener('DOMContentLoaded', function() {
  const leftSlider = document.getElementById('left-range-slider');
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
                }, 10);
            }
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
        slider.addEventListener('input', updateThumb);
        window.addEventListener('resize', updateThumb);
        updateThumb();
    });
});
