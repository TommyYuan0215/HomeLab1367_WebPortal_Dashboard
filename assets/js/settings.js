// =======================================================
// 🎨 ACCESSIBILITY SETTINGS (UPDATED)
// =======================================================

(function() {
    'use strict';

    // --- Elements ---
    const settingsBtn = document.getElementById('settings-btn');
    const settingsModal = document.getElementById('settings-modal');
    const settingsOverlay = document.getElementById('settings-overlay');
    const settingsClose = document.getElementById('settings-close');
    const resetAllBtn = document.getElementById('reset-all-settings');
    
    // Sliders
    const fontSizeRange = document.getElementById('font-size-range');
    const fontSizeValue = document.getElementById('font-size-value');
    const animRange = document.getElementById('animation-speed-range');
    const animValue = document.getElementById('animation-speed-value');

    // Toggles Configuration
    // maps ID -> { cssClass, storageKey }
    const togglesConfig = [
        { 
            id: 'high-contrast-toggle', 
            cssClass: 'high-contrast', 
            storageKey: 'homelab-high-contrast' 
        },
        { 
            id: 'dyslexic-font-toggle', 
            cssClass: 'dyslexic-font', 
            storageKey: 'homelab-dyslexic-font' 
        },
        { 
            id: 'highlight-links-toggle', 
            cssClass: 'highlight-links', 
            storageKey: 'homelab-highlight-links' 
        },
        { 
            id: 'big-cursor-toggle', 
            cssClass: 'cursor-big', 
            storageKey: 'homelab-big-cursor' 
        },
        { 
            id: 'reduced-motion-toggle', 
            cssClass: 'reduced-motion', 
            storageKey: 'homelab-reduced-motion' 
        }
    ];

    const showNewsToggle = document.getElementById('show-news-toggle');

    // --- Modal Logic ---
    function openSettings() {
        if(!settingsModal) return;
        settingsModal.classList.add('active');
        settingsModal.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';
    }
    
    function closeSettings() {
        if(!settingsModal) return;
        settingsModal.classList.remove('active');
        settingsModal.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
    }
    
    settingsBtn?.addEventListener('click', (e) => { e.preventDefault(); openSettings(); });
    settingsClose?.addEventListener('click', closeSettings);
    settingsOverlay?.addEventListener('click', closeSettings);
    
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && settingsModal?.classList.contains('active')) closeSettings();
    });

    // --- Settings Logic ---

    // 1. Font Size
    function updateFontSize(val) {
        if(fontSizeValue) fontSizeValue.textContent = val + '%';
        document.body.className = document.body.className.replace(/font-size-\d+/g, '');
        document.body.classList.add(`font-size-${val}`);
        localStorage.setItem('homelab-font-size', val);
    }
    fontSizeRange?.addEventListener('input', (e) => updateFontSize(e.target.value));

    // 2. Animation Speed
    const speedLabels = { 1: 'Slow', 2: 'Normal', 3: 'Fast' };
    function updateAnimSpeed(val) {
        if(animValue) animValue.textContent = speedLabels[val] || 'Normal';
        document.body.className = document.body.className.replace(/animation-speed-\d+/g, '');
        document.body.classList.add(`animation-speed-${val}`);
        localStorage.setItem('homelab-animation-speed', val);
    }
    animRange?.addEventListener('input', (e) => updateAnimSpeed(e.target.value));

    // 3. Generic Toggles
    togglesConfig.forEach(conf => {
        const el = document.getElementById(conf.id);
        if(!el) return;

        el.addEventListener('change', (e) => {
            const isChecked = e.target.checked;
            if (isChecked) {
                document.body.classList.add(conf.cssClass);
                localStorage.setItem(conf.storageKey, 'true');
            } else {
                document.body.classList.remove(conf.cssClass);
                localStorage.setItem(conf.storageKey, 'false');
            }
        });
    });

    // 4. News Toggle (Special case as it hides an element)
    showNewsToggle?.addEventListener('change', (e) => {
        const isVisible = e.target.checked;
        document.body.classList.toggle('hide-news', !isVisible);
        localStorage.setItem('homelab-show-news', isVisible);
    });

    // --- Load Saved ---
    function loadSaved() {
        // Font
        const savedFont = localStorage.getItem('homelab-font-size') || 100;
        if(fontSizeRange) fontSizeRange.value = savedFont;
        updateFontSize(savedFont);

        // Anim
        const savedAnim = localStorage.getItem('homelab-animation-speed') || 2;
        if(animRange) animRange.value = savedAnim;
        updateAnimSpeed(savedAnim);

        // Toggles
        togglesConfig.forEach(conf => {
            const el = document.getElementById(conf.id);
            const saved = localStorage.getItem(conf.storageKey) === 'true';
            if(el) el.checked = saved;
            if(saved) document.body.classList.add(conf.cssClass);
        });

        // News
        const savedNews = localStorage.getItem('homelab-show-news');
        const showNews = savedNews === null ? true : (savedNews === 'true');
        if(showNewsToggle) showNewsToggle.checked = showNews;
        document.body.classList.toggle('hide-news', !showNews);
    }

    // --- Reset ---
    resetAllBtn?.addEventListener('click', () => {
        if(confirm('Reset all settings to default?')) {
            localStorage.clear();
            location.reload();
        }
    });

    // Init
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', loadSaved);
    } else {
        loadSaved();
    }
})();