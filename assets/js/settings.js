// =======================================================
// 🎨 ACCESSIBILITY & VISUALIZATION SETTINGS
// =======================================================

(function() {
    'use strict';

    // --- DOM Elements ---
    const settingsBtn = document.getElementById('settings-btn');
    const settingsModal = document.getElementById('settings-modal');
    const settingsOverlay = document.getElementById('settings-overlay');
    const settingsClose = document.getElementById('settings-close');
    
    const fontSizeRange = document.getElementById('font-size-range');
    const fontSizeValue = document.getElementById('font-size-value');
    const fontIncrease = document.getElementById('font-increase');
    const fontDecrease = document.getElementById('font-decrease');
    const fontReset = document.getElementById('font-reset');
    
    const cardSpacingRange = document.getElementById('card-spacing-range');
    const cardSpacingValue = document.getElementById('card-spacing-value');
    const spacingCompact = document.getElementById('spacing-compact');
    const spacingReset = document.getElementById('spacing-reset');
    const spacingSpacious = document.getElementById('spacing-spacious');
    
    const borderRadiusRange = document.getElementById('border-radius-range');
    const borderRadiusValue = document.getElementById('border-radius-value');
    const radiusSharp = document.getElementById('radius-sharp');
    const radiusReset = document.getElementById('radius-reset');
    const radiusRounded = document.getElementById('radius-rounded');
    
    const animationSpeedRange = document.getElementById('animation-speed-range');
    const animationSpeedValue = document.getElementById('animation-speed-value');
    const speedSlow = document.getElementById('speed-slow');
    const speedReset = document.getElementById('speed-reset');
    const speedFast = document.getElementById('speed-fast');
    
    const cardSizeRange = document.getElementById('card-size-range');
    const cardSizeValue = document.getElementById('card-size-value');
    const sizeSmall = document.getElementById('size-small');
    const sizeReset = document.getElementById('size-reset');
    const sizeLarge = document.getElementById('size-large');
    
    const highContrastToggle = document.getElementById('high-contrast-toggle');
    const reducedMotionToggle = document.getElementById('reduced-motion-toggle');
    const resetAllBtn = document.getElementById('reset-all-settings');
    
    // Storage keys
    const STORAGE_KEYS = {
        fontSize: 'homelab-font-size',
        cardSpacing: 'homelab-card-spacing',
        borderRadius: 'homelab-border-radius',
        animationSpeed: 'homelab-animation-speed',
        cardSize: 'homelab-card-size',
        highContrast: 'homelab-high-contrast',
        reducedMotion: 'homelab-reduced-motion'
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
    
    // Close on Escape key
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
    
    // --- Card Spacing Functions ---
    const spacingLabels = { 1: 'Compact', 2: 'Comfortable', 3: 'Spacious' };
    
    function updateCardSpacing(value) {
        const label = spacingLabels[value];
        if (cardSpacingValue) cardSpacingValue.textContent = label;
        
        document.body.className = document.body.className.replace(/card-spacing-\d+/g, '');
        document.body.classList.add(`card-spacing-${value}`);
        
        localStorage.setItem(STORAGE_KEYS.cardSpacing, value);
    }
    
    cardSpacingRange?.addEventListener('input', function(e) {
        updateCardSpacing(parseInt(e.target.value));
    });
    
    spacingCompact?.addEventListener('click', function() {
        if (cardSpacingRange) cardSpacingRange.value = 1;
        updateCardSpacing(1);
    });
    
    spacingReset?.addEventListener('click', function() {
        if (cardSpacingRange) cardSpacingRange.value = 2;
        updateCardSpacing(2);
    });
    
    spacingSpacious?.addEventListener('click', function() {
        if (cardSpacingRange) cardSpacingRange.value = 3;
        updateCardSpacing(3);
    });
    
    // --- Border Radius Functions ---
    const radiusLabels = { 1: 'Sharp', 2: 'Rounded', 3: 'Very Rounded' };
    
    function updateBorderRadius(value) {
        const label = radiusLabels[value];
        if (borderRadiusValue) borderRadiusValue.textContent = label;
        
        document.body.className = document.body.className.replace(/border-radius-\d+/g, '');
        document.body.classList.add(`border-radius-${value}`);
        
        localStorage.setItem(STORAGE_KEYS.borderRadius, value);
    }
    
    borderRadiusRange?.addEventListener('input', function(e) {
        updateBorderRadius(parseInt(e.target.value));
    });
    
    radiusSharp?.addEventListener('click', function() {
        if (borderRadiusRange) borderRadiusRange.value = 1;
        updateBorderRadius(1);
    });
    
    radiusReset?.addEventListener('click', function() {
        if (borderRadiusRange) borderRadiusRange.value = 2;
        updateBorderRadius(2);
    });
    
    radiusRounded?.addEventListener('click', function() {
        if (borderRadiusRange) borderRadiusRange.value = 3;
        updateBorderRadius(3);
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
    
    // --- Card Size Functions ---
    const sizeLabels = { 1: 'Small', 2: 'Default', 3: 'Large' };
    
    function updateCardSize(value) {
        const label = sizeLabels[value];
        if (cardSizeValue) cardSizeValue.textContent = label;
        
        document.body.className = document.body.className.replace(/card-size-\d+/g, '');
        document.body.classList.add(`card-size-${value}`);
        
        localStorage.setItem(STORAGE_KEYS.cardSize, value);
    }
    
    cardSizeRange?.addEventListener('input', function(e) {
        updateCardSize(parseInt(e.target.value));
    });
    
    sizeSmall?.addEventListener('click', function() {
        if (cardSizeRange) cardSizeRange.value = 1;
        updateCardSize(1);
    });
    
    sizeReset?.addEventListener('click', function() {
        if (cardSizeRange) cardSizeRange.value = 2;
        updateCardSize(2);
    });
    
    sizeLarge?.addEventListener('click', function() {
        if (cardSizeRange) cardSizeRange.value = 3;
        updateCardSize(3);
    });
    
    // --- High Contrast Toggle ---
    highContrastToggle?.addEventListener('change', function(e) {
        if (e.target.checked) {
            document.body.classList.add('high-contrast');
            localStorage.setItem(STORAGE_KEYS.highContrast, 'true');
        } else {
            document.body.classList.remove('high-contrast');
            localStorage.setItem(STORAGE_KEYS.highContrast, 'false');
        }
    });
    
    // --- Reduced Motion Toggle ---
    reducedMotionToggle?.addEventListener('change', function(e) {
        if (e.target.checked) {
            document.body.classList.add('reduced-motion');
            localStorage.setItem(STORAGE_KEYS.reducedMotion, 'true');
        } else {
            document.body.classList.remove('reduced-motion');
            localStorage.setItem(STORAGE_KEYS.reducedMotion, 'false');
        }
    });
    
    // --- Reset All Settings ---
    resetAllBtn?.addEventListener('click', function() {
        if (confirm('Reset all accessibility settings to default?')) {
            // Reset font size
            if (fontSizeRange) fontSizeRange.value = 100;
            updateFontSize(100);
            
            // Reset card spacing
            if (cardSpacingRange) cardSpacingRange.value = 2;
            updateCardSpacing(2);
            
            // Reset border radius
            if (borderRadiusRange) borderRadiusRange.value = 2;
            updateBorderRadius(2);
            
            // Reset animation speed
            if (animationSpeedRange) animationSpeedRange.value = 2;
            updateAnimationSpeed(2);
            
            // Reset card size
            if (cardSizeRange) cardSizeRange.value = 2;
            updateCardSize(2);
            
            // Reset toggles
            if (highContrastToggle) {
                highContrastToggle.checked = false;
                document.body.classList.remove('high-contrast');
            }
            if (reducedMotionToggle) {
                reducedMotionToggle.checked = false;
                document.body.classList.remove('reduced-motion');
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
        
        // Load card spacing
        const savedSpacing = localStorage.getItem(STORAGE_KEYS.cardSpacing);
        if (savedSpacing && cardSpacingRange) {
            cardSpacingRange.value = savedSpacing;
            updateCardSpacing(parseInt(savedSpacing));
        }
        
        // Load border radius
        const savedRadius = localStorage.getItem(STORAGE_KEYS.borderRadius);
        if (savedRadius && borderRadiusRange) {
            borderRadiusRange.value = savedRadius;
            updateBorderRadius(parseInt(savedRadius));
        }
        
        // Load animation speed
        const savedSpeed = localStorage.getItem(STORAGE_KEYS.animationSpeed);
        if (savedSpeed && animationSpeedRange) {
            animationSpeedRange.value = savedSpeed;
            updateAnimationSpeed(parseInt(savedSpeed));
        }
        
        // Load card size
        const savedSize = localStorage.getItem(STORAGE_KEYS.cardSize);
        if (savedSize && cardSizeRange) {
            cardSizeRange.value = savedSize;
            updateCardSize(parseInt(savedSize));
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
    }
    
    // --- Initialize Settings ---
    function initSettings() {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', loadSavedSettings);
        } else {
            loadSavedSettings();
        }
    }
    
    // Initialize when script loads
    initSettings();
})();
