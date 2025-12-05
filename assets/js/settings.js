// =======================================================
// 🎨 ACCESSIBILITY & VISUALIZATION SETTINGS (CLEANED)
// =======================================================

(function() {
    'use strict';

    // --- DOM Elements ---
    const settingsBtn = document.getElementById('settings-btn');
    const settingsModal = document.getElementById('settings-modal');
    const settingsOverlay = document.getElementById('settings-overlay');
    const settingsClose = document.getElementById('settings-close');
    
    // Font Size Elements
    const fontSizeRange = document.getElementById('font-size-range');
    const fontSizeValue = document.getElementById('font-size-value');
    const fontIncrease = document.getElementById('font-increase');
    const fontDecrease = document.getElementById('font-decrease');
    const fontReset = document.getElementById('font-reset');
    
    // Animation Speed Elements
    const animationSpeedRange = document.getElementById('animation-speed-range');
    const animationSpeedValue = document.getElementById('animation-speed-value');
    const speedSlow = document.getElementById('speed-slow');
    const speedReset = document.getElementById('speed-reset');
    const speedFast = document.getElementById('speed-fast');
    
    // Toggles
    const highContrastToggle = document.getElementById('high-contrast-toggle');
    const reducedMotionToggle = document.getElementById('reduced-motion-toggle');
    const showNewsToggle = document.getElementById('show-news-toggle'); // New
    const resetAllBtn = document.getElementById('reset-all-settings');
    
    // Storage keys
    const STORAGE_KEYS = {
        fontSize: 'homelab-font-size',
        animationSpeed: 'homelab-animation-speed',
        highContrast: 'homelab-high-contrast',
        reducedMotion: 'homelab-reduced-motion',
        showNews: 'homelab-show-news'
    };
    
    // --- Modal Functions ---
    function openSettings() {
        settingsModal?.classList.add('active');
        settingsModal?.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';
    }
    
    function closeSettings() {
        settingsModal?.classList.remove('active');
        settingsModal?.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
    }
    
    // Event Listeners for Modal
    settingsBtn?.addEventListener('click', function(e) {
        e.preventDefault();
        openSettings();
    });
    
    settingsClose?.addEventListener('click', closeSettings);
    settingsOverlay?.addEventListener('click', closeSettings);
    
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && settingsModal?.classList.contains('active')) {
            closeSettings();
        }
    });
    
    // --- Font Size Functions ---
    function updateFontSize(value) {
        const percentage = value + '%';
        if (fontSizeValue) fontSizeValue.textContent = percentage;
        
        document.body.className = document.body.className.replace(/font-size-\d+/g, '');
        document.body.classList.add(`font-size-${value}`);
        
        localStorage.setItem(STORAGE_KEYS.fontSize, value);
    }
    
    fontSizeRange?.addEventListener('input', function(e) {
        updateFontSize(parseInt(e.target.value));
    });
    
    fontIncrease?.addEventListener('click', function() {
        const current = parseInt(fontSizeRange.value);
        if (current < 150) {
            fontSizeRange.value = current + 5;
            updateFontSize(current + 5);
        }
    });
    
    fontDecrease?.addEventListener('click', function() {
        const current = parseInt(fontSizeRange.value);
        if (current > 75) {
            fontSizeRange.value = current - 5;
            updateFontSize(current - 5);
        }
    });
    
    fontReset?.addEventListener('click', function() {
        if (fontSizeRange) fontSizeRange.value = 100;
        updateFontSize(100);
    });
    
    // --- Animation Speed Functions ---
    const speedLabels = { 1: 'Slow', 2: 'Normal', 3: 'Fast' };
    
    function updateAnimationSpeed(value) {
        const label = speedLabels[value];
        if (animationSpeedValue) animationSpeedValue.textContent = label;
        
        document.body.className = document.body.className.replace(/animation-speed-\d+/g, '');
        document.body.classList.add(`animation-speed-${value}`);
        
        localStorage.setItem(STORAGE_KEYS.animationSpeed, value);
    }
    
    animationSpeedRange?.addEventListener('input', function(e) {
        updateAnimationSpeed(parseInt(e.target.value));
    });
    
    speedSlow?.addEventListener('click', function() {
        if (animationSpeedRange) animationSpeedRange.value = 1;
        updateAnimationSpeed(1);
    });
    
    speedReset?.addEventListener('click', function() {
        if (animationSpeedRange) animationSpeedRange.value = 2;
        updateAnimationSpeed(2);
    });
    
    speedFast?.addEventListener('click', function() {
        if (animationSpeedRange) animationSpeedRange.value = 3;
        updateAnimationSpeed(3);
    });
    
    // --- Toggles ---
    highContrastToggle?.addEventListener('change', function(e) {
        if (e.target.checked) {
            document.body.classList.add('high-contrast');
            localStorage.setItem(STORAGE_KEYS.highContrast, 'true');
        } else {
            document.body.classList.remove('high-contrast');
            localStorage.setItem(STORAGE_KEYS.highContrast, 'false');
        }
    });
    
    reducedMotionToggle?.addEventListener('change', function(e) {
        if (e.target.checked) {
            document.body.classList.add('reduced-motion');
            localStorage.setItem(STORAGE_KEYS.reducedMotion, 'true');
        } else {
            document.body.classList.remove('reduced-motion');
            localStorage.setItem(STORAGE_KEYS.reducedMotion, 'false');
        }
    });

    showNewsToggle?.addEventListener('change', function(e) {
        const isVisible = e.target.checked;
        localStorage.setItem(STORAGE_KEYS.showNews, isVisible);
        document.body.classList.toggle('hide-news', !isVisible);
    });
    
    // --- Reset All Settings ---
    resetAllBtn?.addEventListener('click', function() {
        if (confirm('Reset all settings to default?')) {
            // Reset font size
            if (fontSizeRange) fontSizeRange.value = 100;
            updateFontSize(100);
            
            // Reset animation speed
            if (animationSpeedRange) animationSpeedRange.value = 2;
            updateAnimationSpeed(2);
            
            // Reset toggles
            if (highContrastToggle) {
                highContrastToggle.checked = false;
                document.body.classList.remove('high-contrast');
            }
            if (reducedMotionToggle) {
                reducedMotionToggle.checked = false;
                document.body.classList.remove('reduced-motion');
            }
            if (showNewsToggle) {
                showNewsToggle.checked = true;
                document.body.classList.remove('hide-news');
            }
            
            // Clear localStorage
            Object.values(STORAGE_KEYS).forEach(key => {
                localStorage.removeItem(key);
            });
        }
    });
    
    // --- Load Saved Settings ---
    function loadSavedSettings() {
        // Load font size
        const savedFontSize = localStorage.getItem(STORAGE_KEYS.fontSize);
        if (savedFontSize && fontSizeRange) {
            fontSizeRange.value = savedFontSize;
            updateFontSize(parseInt(savedFontSize));
        }
        
        // Load animation speed
        const savedSpeed = localStorage.getItem(STORAGE_KEYS.animationSpeed);
        if (savedSpeed && animationSpeedRange) {
            animationSpeedRange.value = savedSpeed;
            updateAnimationSpeed(parseInt(savedSpeed));
        }
        
        // Load high contrast
        const savedContrast = localStorage.getItem(STORAGE_KEYS.highContrast);
        if (savedContrast === 'true' && highContrastToggle) {
            highContrastToggle.checked = true;
            document.body.classList.add('high-contrast');
        }
        
        // Load reduced motion
        const savedMotion = localStorage.getItem(STORAGE_KEYS.reducedMotion);
        if (savedMotion === 'true' && reducedMotionToggle) {
            reducedMotionToggle.checked = true;
            document.body.classList.add('reduced-motion');
        }

        // Load News Toggle
        const savedNews = localStorage.getItem(STORAGE_KEYS.showNews);
        // Default is TRUE (show news), so we only hide if specifically set to 'false'
        const showNews = savedNews === null ? true : (savedNews === 'true');
        
        if (showNewsToggle) {
            showNewsToggle.checked = showNews;
        }
        document.body.classList.toggle('hide-news', !showNews);
    }
    
    // Initialize
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', loadSavedSettings);
    } else {
        loadSavedSettings();
    }
})();