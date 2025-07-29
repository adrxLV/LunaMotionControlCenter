document.addEventListener('DOMContentLoaded', function() {
  
  const PROXIMITY_THRESHOLD = 5;
  
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
      alert('Update functionality - Coming Soon');
    });
  }
  
  if (placesBtn) {
    placesBtn.addEventListener('click', function() {
      alert('Places functionality - Coming Soon');
    });
  }
  
  if (satellitesBtn) {
    satellitesBtn.addEventListener('click', function() {
      alert('Satellites functionality - Coming Soon');
    });
  }
  
  if (configsBtn) {
    configsBtn.addEventListener('click', function() {
      alert('Configs functionality - Coming Soon');
    });
  }

  function updateDateTime() {
    const now = new Date();
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

  function updateStatusValues() {
    const statusValues = document.querySelectorAll('.status-value');
    
    const signalElement = statusValues[1];
    if (signalElement) {
      const signalOptions = ['None', 'Weak', 'Medium', 'Strong'];
      const randomSignal = signalOptions[Math.floor(Math.random() * signalOptions.length)];
      signalElement.textContent = randomSignal;
    }
    
    const strengthElement = statusValues[2];
    if (strengthElement) {
      const strength = Math.floor(Math.random() * 101); 
      strengthElement.textContent = `${strength}%`;
    }
    
    const speedElement = statusValues[3];
    if (speedElement) {
      const speed = (Math.random() * 3 + 3).toFixed(1);
      speedElement.textContent = speed;
    }
    
    const modeElement = statusValues[5];
    if (modeElement) {
      modeElement.textContent = 'Auto';
    }
  }

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
    const proximityThreshold = PROXIMITY_THRESHOLD;
    
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

  updateDateTime();
  setInterval(updateDateTime, 1000);
  setInterval(updateStatusValues, 3000);
  setInterval(animateRoverMarker, 5000);

  // Add click effects to navigation buttons
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
});
