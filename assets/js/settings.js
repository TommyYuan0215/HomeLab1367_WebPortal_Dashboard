// =======================================================
// 🎨 ACCESSIBILITY & SETTINGS MANAGER — Extended Edition
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
            // ── NEW: Card Density ──
            'card-density': {
                type: 'range',
                elementId: 'card-density-range',
                displayId: 'card-density-desc',
                storageKey: 'homelab-card-density',
                defaultValue: 1,
                onChange: (value) => this.updateCardDensity(value),
                onLoad: (value) => this.updateCardDensity(value)
            },
            // ── NEW: Screen Zoom ──
            'zoom-level': {
                type: 'range',
                elementId: 'zoom-level-range',
                displayId: 'zoom-level-value',
                storageKey: 'homelab-zoom-level',
                defaultValue: 100,
                onChange: (value) => this.updateZoomLevel(value),
                onLoad: (value) => this.updateZoomLevel(value)
            },
            // ── NEW: Color Filter ──
            'color-filter': {
                type: 'range',
                elementId: 'color-filter-range',
                displayId: 'color-filter-desc',
                storageKey: 'homelab-color-filter',
                defaultValue: 0,
                onChange: (value) => this.updateColorFilter(value),
                onLoad: (value) => this.updateColorFilter(value)
            },
            // ── NEW: Text Shadow ──
            'text-shadow': {
                type: 'toggle',
                elementId: 'text-shadow-toggle',
                storageKey: 'homelab-text-shadow',
                defaultValue: false,
                cssClass: 'text-shadow-on'
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
            // ── NEW: Focus Highlight ──
            'focus-highlight': {
                type: 'toggle',
                elementId: 'focus-highlight-toggle',
                storageKey: 'homelab-focus-highlight',
                defaultValue: false,
                cssClass: 'focus-highlight'
            },
            // ── NEW: Sticky Hover ──
            'sticky-hover': {
                type: 'toggle',
                elementId: 'sticky-hover-toggle',
                storageKey: 'homelab-sticky-hover',
                defaultValue: false,
                cssClass: 'sticky-hover',
                onChange: (value) => this.updateStickyHover(value)
            },
            // ── NEW: Navigation Sound ──
            'nav-sound': {
                type: 'toggle',
                elementId: 'nav-sound-toggle',
                storageKey: 'homelab-nav-sound',
                defaultValue: false,
                onChange: (value) => this.updateNavSound(value)
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
            },
            // ── NEW: Splash Screen Mode ──
            'splash-mode': {
                type: 'toggle',
                elementId: 'splash-mode-toggle',
                displayId: 'splash-mode-desc',
                storageKey: 'homelab-splash-mode',
                defaultValue: true, // true = always, false = never
                onChange: (value) => this.updateSplashMode(value),
                onLoad: (value) => this.updateSplashMode(value)
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

        // Mobile settings button
        this.mobileSettingsBtn = document.getElementById('mobile-settings-btn');

        // Audio context for nav sound (lazily created)
        this._audioCtx = null;

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

        this.mobileSettingsBtn?.addEventListener('click', (e) => {
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
            if (setting.type === 'toggle') {
                const element = document.getElementById(setting.elementId);
                if (!element) return;
                element.addEventListener('change', (e) => {
                    const value = e.target.checked;
                    this.saveSetting(key, value);
                    this.applySetting(key, value);
                    this.showToast(key, value);
                });
            } else if (setting.type === 'range') {
                const element = document.getElementById(setting.elementId);
                if (!element) return;
                element.addEventListener('input', (e) => {
                    const value = e.target.value;
                    this.saveSetting(key, value);
                    this.applySetting(key, value);
                });
            } else if (setting.type === 'option') {
                const group = document.getElementById(setting.groupId);
                if (!group) return;
                group.querySelectorAll('.opt-btn').forEach(btn => {
                    btn.addEventListener('click', () => {
                        const value = btn.getAttribute('data-value');
                        // Update active state in group
                        group.querySelectorAll('.opt-btn').forEach(b => b.classList.remove('active'));
                        btn.classList.add('active');
                        this.saveSetting(key, value);
                        this.applySetting(key, value);
                        this.showToast(key, value);
                    });
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
            const themeToggle = document.getElementById(this.config['theme'].elementId);
            if (themeToggle) themeToggle.checked = newTheme;
        });

        // Reset All
        this.resetAllBtn?.addEventListener('click', () => {
            if (confirm('Reset all accessibility settings to default?')) {
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

        // Custom onChange handler takes priority
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

            if (setting.type === 'toggle') {
                const element = document.getElementById(setting.elementId);
                if (element) element.checked = value;
            } else if (setting.type === 'range') {
                const element = document.getElementById(setting.elementId);
                if (element) element.value = value;
            } else if (setting.type === 'option') {
                const group = document.getElementById(setting.groupId);
                if (group) {
                    group.querySelectorAll('.opt-btn').forEach(b => {
                        b.classList.toggle('active', b.getAttribute('data-value') === value);
                    });
                }
            }

            // Apply using onLoad or applySetting
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

        if (setting.type === 'toggle') {
            const element = document.getElementById(setting.elementId);
            if (element) element.checked = defaultValue;
        } else if (setting.type === 'range') {
            const element = document.getElementById(setting.elementId);
            if (element) element.value = defaultValue;
        } else if (setting.type === 'option') {
            const group = document.getElementById(setting.groupId);
            if (group) {
                group.querySelectorAll('.opt-btn').forEach(b => {
                    b.classList.toggle('active', b.getAttribute('data-value') === defaultValue);
                });
            }
        }

        this.saveSetting(key, defaultValue);
        this.applySetting(key, defaultValue);
    }

    resetAll() {
        localStorage.clear();
        location.reload();
    }

    // === Toast notification ===
    showToast(key, value) {
        let existing = document.getElementById('settings-toast');
        if (existing) existing.remove();

        const label = this._getSettingLabel(key, value);
        if (!label) return;

        const toast = document.createElement('div');
        toast.id = 'settings-toast';
        toast.className = 'settings-toast';
        toast.innerHTML = `<i class="bi bi-check-circle-fill"></i> ${label}`;
        document.body.appendChild(toast);

        requestAnimationFrame(() => toast.classList.add('show'));
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 400);
        }, 2200);
    }

    _getSettingLabel(key, value) {
        const densityLabels = ['Compact', 'Comfortable', 'Cozy'];
        const filterLabels = ['Off', 'Deuteranopia', 'Protanopia', 'Tritanopia', 'Greyscale'];
        const labels = {
            'theme': value ? 'Light Mode' : 'Dark Mode',
            'high-contrast': value ? 'High Contrast On' : 'High Contrast Off',
            'dyslexic-font': value ? 'Dyslexia Font On' : 'Dyslexia Font Off',
            'highlight-links': value ? 'Link Highlights On' : 'Link Highlights Off',
            'big-cursor': value ? 'Large Cursor On' : 'Large Cursor Off',
            'focus-highlight': value ? 'Focus Highlight On' : 'Focus Highlight Off',
            'sticky-hover': value ? 'Sticky Hover On' : 'Sticky Hover Off',
            'nav-sound': value ? 'Navigation Sound On' : 'Navigation Sound Off',
            'reduced-motion': value ? 'Animations Disabled' : 'Animations Enabled',
            'show-news': value ? 'News Feed Shown' : 'News Feed Hidden',
            'text-shadow': value ? 'Text Shadow On' : 'Text Shadow Off',
            'splash-mode': value ? 'Splash: Always' : 'Splash: Never',
            'card-density': `Density: ${densityLabels[value] || 'Comfortable'}`,
            'color-filter': `Filter: ${filterLabels[value] || 'Off'}`,
            'zoom-level': `Zoom: ${value}%`
        };
        return labels[key] || null;
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
        document.documentElement.style.fontSize = val + '%';
        document.body.className = document.body.className.replace(/\bfont-size-\d+\b/g, '').replace(/\s+/g, ' ').trim();
        document.body.classList.add(`font-size-${val}`);
    }

    updateAnimSpeed(val) {
        const speedLabels = { 1: 'Slow', 2: 'Normal', 3: 'Fast' };
        const displayEl = document.getElementById('animation-speed-value');
        if (displayEl) displayEl.textContent = speedLabels[val] || 'Normal';
        document.body.className = document.body.className.replace(/animation-speed-\d+/g, '');
        document.body.classList.add(`animation-speed-${val}`);
    }

    updateCardDensity(val) {
        // val is 0, 1, or 2 (from range slider)
        const steps = ['compact', 'comfortable', 'cozy'];
        const labels = ['Compact', 'Comfortable', 'Cozy'];
        const name = steps[val] || 'comfortable';
        const desc = document.getElementById('card-density-desc');
        if (desc) desc.textContent = labels[val] || 'Comfortable';
        document.body.classList.remove('density-comfortable', 'density-compact', 'density-cozy');
        document.body.classList.add(`density-${name}`);
    }

    updateZoomLevel(val) {
        const displayEl = document.getElementById('zoom-level-value');
        if (displayEl) displayEl.textContent = val + '%';
        // Apply zoom via CSS zoom property on the root container
        const main = document.querySelector('.main-container-tv');
        if (main) main.style.zoom = (val / 100);
        // Also scale the navbar slightly for visual consistency
        const nav = document.querySelector('.navbar-tv');
        if (nav) nav.style.zoom = (val / 100);
    }

    updateColorFilter(val) {
        // val is 0–4 (from range slider)
        const filters = ['none', 'deuteranopia', 'protanopia', 'tritanopia', 'greyscale'];
        const descs = ['Off', 'Deuteranopia (red-green)', 'Protanopia (red)', 'Tritanopia (blue-yellow)', 'Greyscale'];
        const name = filters[val] || 'none';
        const desc = document.getElementById('color-filter-desc');
        if (desc) desc.textContent = descs[val] || 'Off';
        document.body.classList.remove(
            'color-filter-deuteranopia',
            'color-filter-protanopia',
            'color-filter-tritanopia',
            'color-filter-greyscale'
        );
        if (name !== 'none') {
            document.body.classList.add(`color-filter-${name}`);
        }
    }

    updateStickyHover(val) {
        if (val) {
            document.body.classList.add('sticky-hover');
            // Add click-to-sticky listeners on all app cards
            document.querySelectorAll('.app-card').forEach(card => {
                card.addEventListener('click', this._stickyClickHandler, true);
            });
        } else {
            document.body.classList.remove('sticky-hover');
            document.querySelectorAll('.app-card.sticky-active').forEach(c => c.classList.remove('sticky-active'));
            document.querySelectorAll('.app-card').forEach(card => {
                card.removeEventListener('click', this._stickyClickHandler, true);
            });
        }
    }

    _stickyClickHandler(e) {
        const card = e.currentTarget;
        const isAlreadyActive = card.classList.contains('sticky-active');
        document.querySelectorAll('.app-card.sticky-active').forEach(c => c.classList.remove('sticky-active'));
        if (!isAlreadyActive) card.classList.add('sticky-active');
        // Don't prevent default — still follow the link
    }

    updateNavSound(val) {
        if (val) {
            document.querySelectorAll('.app-card').forEach(card => {
                card.addEventListener('mouseenter', this._playNavSound.bind(this));
            });
        } else {
            document.querySelectorAll('.app-card').forEach(card => {
                card.removeEventListener('mouseenter', this._playNavSound.bind(this));
            });
        }
    }

    _playNavSound() {
        try {
            if (!this._audioCtx) {
                this._audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            }
            const ctx = this._audioCtx;
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.type = 'sine';
            osc.frequency.setValueAtTime(880, ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(660, ctx.currentTime + 0.06);
            gain.gain.setValueAtTime(0.08, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.12);
            osc.start(ctx.currentTime);
            osc.stop(ctx.currentTime + 0.12);
        } catch (err) {
            // AudioContext unavailable — silently skip
        }
    }

    updateSplashMode(val) {
        // val is boolean: true = always show, false = never show
        const desc = document.getElementById('splash-mode-desc');
        if (desc) desc.textContent = val ? 'Always show on startup' : 'Never show';
    }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => new SettingsManager());
} else {
    new SettingsManager();
}