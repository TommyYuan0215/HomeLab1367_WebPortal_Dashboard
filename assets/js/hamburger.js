// =======================================================
// 🍔 MOBILE HAMBURGER MENU
// =======================================================

(function() {
    'use strict';

    // Elements
    const hamburgerBtn = document.getElementById('hamburger-btn');
    const mobileMenu = document.getElementById('mobile-menu');
    const mobileMenuOverlay = document.getElementById('mobile-menu-overlay');
    const mobileMenuClose = document.getElementById('mobile-menu-close');
    
    // Search elements
    const desktopSearchInput = document.getElementById('global-search-input');
    const mobileSearchInput = document.getElementById('mobile-search-input');
    const mobilePopupSearchInput = document.getElementById('mobile-popup-search-input');
    
    // Mobile search popup elements
    const mobileSearchPopup = document.getElementById('mobile-search-popup');
    const mobileSearchPopupOverlay = document.getElementById('mobile-search-popup-overlay');
    const mobileSearchPopupClose = document.getElementById('mobile-search-popup-close');

    // Open mobile menu
    function openMobileMenu() {
        if (!mobileMenu) return;
        mobileMenu.classList.add('active');
        mobileMenu.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';
        
        // Sync search value from desktop to mobile
        if (desktopSearchInput && mobileSearchInput) {
            mobileSearchInput.value = desktopSearchInput.value;
        }
    }

    // Close mobile menu
    function closeMobileMenu() {
        if (!mobileMenu) return;
        mobileMenu.classList.remove('active');
        mobileMenu.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
        
        // Sync search value from mobile to desktop
        if (desktopSearchInput && mobileSearchInput) {
            desktopSearchInput.value = mobileSearchInput.value;
        }
    }

    // Open mobile search popup
    function openSearchPopup() {
        if (!mobileSearchPopup) return;
        mobileSearchPopup.classList.add('active');
        mobileSearchPopup.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';
        
        // Sync search value from desktop
        if (desktopSearchInput && mobilePopupSearchInput) {
            mobilePopupSearchInput.value = desktopSearchInput.value;
        }
        
        // Focus on search input
        setTimeout(() => {
            mobilePopupSearchInput?.focus();
        }, 300);
    }

    // Close mobile search popup
    function closeSearchPopup() {
        if (!mobileSearchPopup) return;
        mobileSearchPopup.classList.remove('active');
        mobileSearchPopup.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
        
        // Sync search value to desktop
        if (desktopSearchInput && mobilePopupSearchInput) {
            desktopSearchInput.value = mobilePopupSearchInput.value;
        }
    }

    // Event Listeners
    hamburgerBtn?.addEventListener('click', () => openMobileMenu());
    mobileMenuClose?.addEventListener('click', () => closeMobileMenu());
    mobileMenuOverlay?.addEventListener('click', () => closeMobileMenu());

    // Mobile Search Button - opens search popup
    const mobileSearchToggle = document.getElementById('mobile-search-toggle');
    mobileSearchToggle?.addEventListener('click', () => openSearchPopup());
    
    // Search popup close
    mobileSearchPopupClose?.addEventListener('click', () => closeSearchPopup());
    mobileSearchPopupOverlay?.addEventListener('click', () => closeSearchPopup());

    // Mobile Settings Button - opens settings modal and closes hamburger menu
    const mobileSettingsBtn = document.getElementById('mobile-settings-btn');
    mobileSettingsBtn?.addEventListener('click', (e) => {
        e.preventDefault();
        closeMobileMenu();
        // Trigger the desktop settings button
        const desktopSettingsBtn = document.getElementById('settings-btn');
        desktopSettingsBtn?.click();
    });

    // Close on Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            if (mobileSearchPopup?.classList.contains('active')) {
                closeSearchPopup();
            } else if (mobileMenu?.classList.contains('active')) {
                closeMobileMenu();
            }
        }
    });

    // Sync search inputs in real-time
    desktopSearchInput?.addEventListener('input', (e) => {
        if (mobileSearchInput) {
            mobileSearchInput.value = e.target.value;
        }
        if (mobilePopupSearchInput) {
            mobilePopupSearchInput.value = e.target.value;
        }
    });

    mobileSearchInput?.addEventListener('input', (e) => {
        if (desktopSearchInput) {
            desktopSearchInput.value = e.target.value;
        }
        if (mobilePopupSearchInput) {
            mobilePopupSearchInput.value = e.target.value;
        }
    });

    mobilePopupSearchInput?.addEventListener('input', (e) => {
        if (desktopSearchInput) {
            desktopSearchInput.value = e.target.value;
        }
        if (mobileSearchInput) {
            mobileSearchInput.value = e.target.value;
        }
    });

})();
