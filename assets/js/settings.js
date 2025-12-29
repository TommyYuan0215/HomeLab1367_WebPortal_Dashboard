// =======================================================
// 🎨 ACCESSIBILITY & SETTINGS MANAGER (REFACTORED)
// =======================================================

class SettingsManager {
    constructor() {
        // Configuration for all settings
        this.config = {
            'theme': {
                type: 'toggle',
                elementId: 'theme-toggle-setting',
                storageKey: 'homelab-theme',
                defaultValue: false, // false = dark, true = light
                cssClass: 'light-theme',
                onChange: (value) => this.updateTheme(value),
                onLoad: (value) => this.updateTheme(value, true)
            },
            'font-size': {
                type: 'range',
                elementId: 'font-size-range',
                displayId: 'font-size-value',
                storageKey: 'homelab-font-size',
                defaultValue: 100,
                onChange: (value) => this.updateFontSize(value),
                onLoad: (value) => this.updateFontSize(value)
            },
            'animation-speed': {
                type: 'range',
                elementId: 'animation-speed-range',
                displayId: 'animation-speed-value',
                storageKey: 'homelab-animation-speed',
                defaultValue: 2,
                onChange: (value) => this.updateAnimSpeed(value),
                onLoad: (value) => this.updateAnimSpeed(value)
            },
            'high-contrast': {
                type: 'toggle',
                elementId: 'high-contrast-toggle',
                storageKey: 'homelab-high-contrast',
                defaultValue: false,
                cssClass: 'high-contrast'
            },
            'dyslexic-font': {
                type: 'toggle',
                elementId: 'dyslexic-font-toggle',
                storageKey: 'homelab-dyslexic-font',
                defaultValue: false,
                cssClass: 'dyslexic-font'
            },
            'highlight-links': {
                type: 'toggle',
                elementId: 'highlight-links-toggle',
                storageKey: 'homelab-highlight-links',
                defaultValue: false,
                cssClass: 'highlight-links'
            },
            'big-cursor': {
                type: 'toggle',
                elementId: 'big-cursor-toggle',
                storageKey: 'homelab-big-cursor',
                defaultValue: false,
                cssClass: 'cursor-big'
            },
            'reduced-motion': {
                type: 'toggle',
                elementId: 'reduced-motion-toggle',
                storageKey: 'homelab-reduced-motion',
                defaultValue: false,
                cssClass: 'reduced-motion'
            },
            'show-news': {
                type: 'toggle',
                elementId: 'show-news-toggle',
                storageKey: 'homelab-show-news',
                defaultValue: true,
                cssClass: 'hide-news',
                inverted: true // true means we add class when OFF
            }
        };

        // Modal elements
        this.settingsModal = document.getElementById('settings-modal');
        this.settingsBtn = document.getElementById('settings-btn');
        this.settingsOverlay = document.getElementById('settings-overlay');
        this.settingsClose = document.getElementById('settings-close');
        this.resetAllBtn = document.getElementById('reset-all-settings');
        
        // Navbar theme toggle (sync with settings panel)
        this.navbarThemeBtn = document.getElementById('theme-toggle-btn');
        this.navbarThemeIcon = document.getElementById('theme-toggle-icon');
        
        this.init();
    }

    init() {
        this.setupModalControls();
        this.setupSettings();
        this.setupResetButtons();
        this.loadAllSettings();
    }

    // === Modal Controls ===
    setupModalControls() {
        this.settingsBtn?.addEventListener('click', (e) => {
            e.preventDefault();
            this.openModal();
        });
        
        this.settingsClose?.addEventListener('click', () => this.closeModal());
        this.settingsOverlay?.addEventListener('click', () => this.closeModal());
        
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.settingsModal?.classList.contains('active')) {
                this.closeModal();
            }
        });
    }

    openModal() {
        if (!this.settingsModal) return;
        this.settingsModal.classList.add('active');
        this.settingsModal.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';
    }

    closeModal() {
        if (!this.settingsModal) return;
        this.settingsModal.classList.remove('active');
        this.settingsModal.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
    }

    // === Settings Setup ===
    setupSettings() {
        Object.entries(this.config).forEach(([key, setting]) => {
            const element = document.getElementById(setting.elementId);
            if (!element) return;

            if (setting.type === 'toggle') {
                element.addEventListener('change', (e) => {
                    const value = e.target.checked;
                    this.saveSetting(key, value);
                    this.applySetting(key, value);
                });
            } else if (setting.type === 'range') {
                element.addEventListener('input', (e) => {
                    const value = e.target.value;
                    this.saveSetting(key, value);
                    this.applySetting(key, value);
                });
            }
        });

        // Navbar theme toggle sync
        this.navbarThemeBtn?.addEventListener('click', (e) => {
            e.preventDefault();
            const currentTheme = this.getSetting('theme');
            const newTheme = !currentTheme;
            this.saveSetting('theme', newTheme);
            this.applySetting('theme', newTheme);
            // Sync the settings panel toggle
            const themeToggle = document.getElementById(this.config['theme'].elementId);
            if (themeToggle) themeToggle.checked = newTheme;
        });

        // Reset All
        this.resetAllBtn?.addEventListener('click', () => {
            if (confirm('Reset all settings to default?')) {
                this.resetAll();
            }
        });
    }

    // === Individual Reset Buttons ===
    setupResetButtons() {
        document.querySelectorAll('.btn-reset-individual').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const settingKey = btn.getAttribute('data-reset');
                if (settingKey && this.config[settingKey]) {
                    this.resetSetting(settingKey);
                }
            });
        });
    }

    // === Storage & Application ===
    saveSetting(key, value) {
        const setting = this.config[key];
        if (!setting) return;
        localStorage.setItem(setting.storageKey, value);
    }

    getSetting(key) {
        const setting = this.config[key];
        if (!setting) return null;
        
        const saved = localStorage.getItem(setting.storageKey);
        if (saved === null) return setting.defaultValue;
        
        return setting.type === 'toggle' ? saved === 'true' : saved;
    }

    applySetting(key, value) {
        const setting = this.config[key];
        if (!setting) return;

        // Custom onChange handler
        if (setting.onChange) {
            setting.onChange(value);
        } 
        // Default CSS class toggle behavior
        else if (setting.cssClass) {
            const shouldAdd = setting.inverted ? !value : value;
            if (shouldAdd) {
                document.body.classList.add(setting.cssClass);
            } else {
                document.body.classList.remove(setting.cssClass);
            }
        }
    }

    loadAllSettings() {
        Object.entries(this.config).forEach(([key, setting]) => {
            const value = this.getSetting(key);
            const element = document.getElementById(setting.elementId);
            
            if (!element) return;

            // Set element value
            if (setting.type === 'toggle') {
                element.checked = value;
            } else if (setting.type === 'range') {
                element.value = value;
            }

            // Apply setting using onLoad or onChange
            if (setting.onLoad) {
                setting.onLoad(value);
            } else {
                this.applySetting(key, value);
            }
        });
    }

    resetSetting(key) {
        const setting = this.config[key];
        if (!setting) return;

        const defaultValue = setting.defaultValue;
        const element = document.getElementById(setting.elementId);
        
        // Update UI
        if (element) {
            if (setting.type === 'toggle') {
                element.checked = defaultValue;
            } else if (setting.type === 'range') {
                element.value = defaultValue;
            }
        }

        // Save and apply
        this.saveSetting(key, defaultValue);
        this.applySetting(key, defaultValue);
    }

    resetAll() {
        localStorage.clear();
        location.reload();
    }

    // === Custom Handlers ===
    updateTheme(isLight, skipNavbarUpdate = false) {
        const themeDesc = document.getElementById('theme-desc');
        
        if (isLight) {
            document.body.classList.add('light-theme');
            if (themeDesc) themeDesc.textContent = 'Light Mode';
            if (!skipNavbarUpdate && this.navbarThemeIcon) {
                this.navbarThemeIcon.className = 'bi bi-sun-fill';
            }
        } else {
            document.body.classList.remove('light-theme');
            if (themeDesc) themeDesc.textContent = 'Dark Mode';
            if (!skipNavbarUpdate && this.navbarThemeIcon) {
                this.navbarThemeIcon.className = 'bi bi-moon-fill';
            }
        }
    }

    updateFontSize(val) {
        const displayEl = document.getElementById('font-size-value');
        if (displayEl) displayEl.textContent = val + '%';
        
        // Remove old font-size classes
        document.body.className = document.body.className.replace(/font-size-\d+/g, '');
        document.body.classList.add(`font-size-${val}`);
    }

    updateAnimSpeed(val) {
        const speedLabels = { 1: 'Slow', 2: 'Normal', 3: 'Fast' };
        const displayEl = document.getElementById('animation-speed-value');
        if (displayEl) displayEl.textContent = speedLabels[val] || 'Normal';
        
        // Remove old animation-speed classes
        document.body.className = document.body.className.replace(/animation-speed-\d+/g, '');
        document.body.classList.add(`animation-speed-${val}`);
    }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => new SettingsManager());
} else {
    new SettingsManager();
}