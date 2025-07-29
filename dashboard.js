// Efeito magnético no centro dos sliders verticais
function addMagneticSnap(sliderId, snapValue = 50, snapRange = 5) {
  const slider = document.getElementById(sliderId);
  if (!slider) return;
  slider.addEventListener('change', function() {
    const value = parseInt(slider.value, 10);
    if (Math.abs(value - snapValue) <= snapRange) {
      slider.value = snapValue;
      slider.classList.add('snap-effect');
      setTimeout(() => slider.classList.remove('snap-effect'), 150);
    }
  });
}

window.addEventListener('DOMContentLoaded', function() {
  addMagneticSnap('left-range-slider');
  addMagneticSnap('right-range-slider');
});
// dashboard.js
// JavaScript para controlar switches e sliders na dashboard

document.addEventListener('DOMContentLoaded', function () {

    // Switches: garantir visual de switch moderno
    document.querySelectorAll('.switch').forEach(function (sw) {
        // Adiciona o knob se não existir
        if (!sw.querySelector('.switch-knob')) {
            const knob = document.createElement('div');
            knob.className = 'switch-knob';
            sw.appendChild(knob);
        }
        sw.addEventListener('click', function () {
            sw.classList.toggle('active');
        });
    });

    // Slide Lock: sincronizar sliders esquerdo e direito
    const slideLockSwitch = document.getElementById('slide-lock-switch');
    const leftSlider = document.getElementById('left-range-slider');
    const rightSlider = document.getElementById('right-range-slider');
    // Ativo por defeito se o switch já tem a classe 'active' (HTML)
    let slideLockActive = slideLockSwitch && slideLockSwitch.classList.contains('active');

    if (slideLockSwitch && leftSlider && rightSlider) {
        slideLockSwitch.addEventListener('click', function () {
            slideLockActive = !slideLockActive;
            if (slideLockActive) {
                // Sincroniza imediatamente
                rightSlider.value = leftSlider.value;
                // Dispara evento para atualizar UI
                rightSlider.dispatchEvent(new Event('input'));
            }
        });

        // Quando um slider muda, se slide lock estiver ativo, sincroniza o outro
        leftSlider.addEventListener('input', function () {
            if (slideLockActive) {
                rightSlider.value = leftSlider.value;
                rightSlider.dispatchEvent(new Event('input'));
            }
        });
        rightSlider.addEventListener('input', function () {
            if (slideLockActive) {
                leftSlider.value = rightSlider.value;
                leftSlider.dispatchEvent(new Event('input'));
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
