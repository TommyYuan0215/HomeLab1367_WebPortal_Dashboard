// =======================================================
// 🛡️  ADMIN MANAGER — HomeLab1367 Dashboard
// Features: login, add/edit/delete/disable services,
//           add/edit/delete sections, JSON export,
//           localStorage persistence.
// =======================================================

class AdminManager {
    constructor() {
        this.isAdminMode   = false;
        this.STORAGE_KEY   = 'homelab-admin-services';
        this.drawerMode    = null;      // 'add'|'edit'|'add-section'|'edit-section'
        this.drawerSection = null;      // section id string
        this.drawerIndex   = null;      // item index or null
        this.currentType   = 'favorite';
        this.canSaveToServer = false;   // true when api/save-services.php is reachable
        this.serverType    = null;      // 'apache' | 'nginx' | null
        this._dragEl       = null;      // currently dragged card element
        this._dragSectionEl = null;     // currently dragged section element
        this._preDragData  = null;      // deep copy of data taken at dragstart

        this._waitForData();
    }

    _waitForData() {
        if (window._servicesConfig !== undefined) {
            this._init();
        } else {
            const t = setInterval(() => {
                if (window._servicesConfig !== undefined) {
                    clearInterval(t);
                    this._init();
                }
            }, 80);
        }
    }

    _init() {
        this.adminPassword = (window._servicesConfig?.adminPassword) || 'admin1367';
        this._injectAdminIcon();
        this._setupLoginModal();
        this._setupDrawer();
        this._detectSaveCapability(); // async, sets this.canSaveToServer before admin mode opens
    }

    // ── Navbar admin icon ──────────────────────────────────────
    _injectAdminIcon() {
        const authorLink = document.querySelector('.nav-profile .nav-author-link');
        if (!authorLink) return;

        const btn = document.createElement('a');
        btn.href = '#';
        btn.id = 'admin-mode-btn';
        btn.setAttribute('aria-label', 'Toggle Admin Mode');
        btn.innerHTML = '<i id="admin-icon" class="bi bi-shield-lock-fill"></i>';
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            this.isAdminMode ? this.exitAdminMode() : this._openLogin();
        });
        authorLink.parentNode.insertBefore(btn, authorLink);
    }

    // ── Login modal ────────────────────────────────────────────
    _openLogin() {
        const modal = document.getElementById('admin-login-modal');
        if (!modal) return;
        modal.classList.add('active');
        modal.setAttribute('aria-hidden', 'false');
        document.getElementById('admin-login-error').classList.remove('visible');
        document.getElementById('admin-password-input').value = '';
        setTimeout(() => document.getElementById('admin-password-input').focus(), 80);
    }

    _closeLogin() {
        const modal = document.getElementById('admin-login-modal');
        if (!modal) return;
        modal.classList.remove('active', 'shake');
        modal.setAttribute('aria-hidden', 'true');
    }

    _setupLoginModal() {
        document.getElementById('admin-login-overlay')?.addEventListener('click', () => this._closeLogin());
        document.getElementById('admin-login-close')?.addEventListener('click',   () => this._closeLogin());
        document.getElementById('admin-login-submit')?.addEventListener('click',  () => this._attemptLogin());
        document.getElementById('admin-password-input')?.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') this._attemptLogin();
        });
    }

    _attemptLogin() {
        const input = document.getElementById('admin-password-input');
        const err   = document.getElementById('admin-login-error');
        const modal = document.getElementById('admin-login-modal');
        if (input.value === this.adminPassword) {
            this._closeLogin();
            this.enterAdminMode();
        } else {
            err.classList.add('visible');
            modal.classList.remove('shake');
            void modal.offsetWidth; // reflow to replay animation
            modal.classList.add('shake');
        }
    }

    // ── Admin mode activation ──────────────────────────────────
    enterAdminMode() {
        this.isAdminMode = true;
        document.body.classList.add('admin-mode');
        document.getElementById('admin-icon').className = 'bi bi-shield-fill-check';

        // Update mobile admin button appearance
        const mobileAdminBtn = document.getElementById('mobile-admin-btn');
        if (mobileAdminBtn) {
            mobileAdminBtn.querySelector('i').className = 'bi bi-shield-fill-check';
            mobileAdminBtn.querySelector('span').textContent = 'Exit Admin Mode';
            mobileAdminBtn.classList.add('mobile-admin-active');
        }

        this._injectBanner();
        this._injectSectionControls();
        this._injectOverlays();
        this._injectAddCards();
        this._injectAddSectionRow();
        this._showToast('Admin Mode Activated', 'success');
    }

    exitAdminMode() {
        this.isAdminMode = false;
        document.body.classList.remove('admin-mode');
        document.getElementById('admin-icon').className = 'bi bi-shield-lock-fill';

        // Reset mobile admin button appearance
        const mobileAdminBtn = document.getElementById('mobile-admin-btn');
        if (mobileAdminBtn) {
            mobileAdminBtn.querySelector('i').className = 'bi bi-gear-fill';
            mobileAdminBtn.querySelector('span').textContent = 'Admin Panel';
            mobileAdminBtn.classList.remove('mobile-admin-active');
        }

        document.getElementById('admin-banner')?.remove();
        document.getElementById('admin-wallpaper-modal')?.remove();
        document.getElementById('admin-add-section-row')?.remove();
        this.closeDrawer();
        this._refreshDashboard();
        this._showToast('Admin Mode Exited', 'info');
    }

    // ── Admin banner ───────────────────────────────────────────
    _injectBanner() {
        if (document.getElementById('admin-banner')) return;
        const banner = document.createElement('div');
        banner.id = 'admin-banner';

        // Save-to-server button — shown only when PHP endpoint is reachable
        const saveBtn = this.canSaveToServer
            ? `<button id="admin-save-server-btn" class="admin-banner-btn save-server">
                 <i class="bi bi-floppy-fill"></i> Save to Server
                 <span class="admin-server-badge">${this.serverType}</span>
               </button>`
            : `<button class="admin-banner-btn save-server offline" disabled
                 title="Deploy api/save-services.php on your server to enable direct saves">
                 <i class="bi bi-floppy"></i> Save to Server
                 <span class="admin-server-badge offline">Offline</span>
               </button>`;

        banner.innerHTML = `
            <div class="admin-banner-content">
              <span class="admin-banner-label">
                <i class="bi bi-shield-fill-check"></i> ADMIN MODE ACTIVE
              </span>
              <div class="admin-banner-actions">
                ${saveBtn}
                <button id="admin-wallpaper-btn" class="admin-banner-btn export" style="background: rgba(168,85,247,0.15); color: #c084fc; border-color: rgba(168,85,247,0.28);">
                  <i class="bi bi-image"></i> Customize Banner
                </button>
                <button id="admin-export-btn" class="admin-banner-btn export">
                  <i class="bi bi-download"></i> Export JSON
                </button>
                <button id="admin-exit-btn" class="admin-banner-btn exit">
                  <i class="bi bi-box-arrow-right"></i> Exit Admin
                </button>
              </div>
            </div>`;

        const main     = document.querySelector('.main-container-tv');
        const sections = document.getElementById('sections-container');
        if (sections && main) main.insertBefore(banner, sections);

        document.getElementById('admin-save-server-btn')?.addEventListener('click', () => this._saveToServer());
        document.getElementById('admin-wallpaper-btn')?.addEventListener('click',    () => this._openWallpaperModal());
        document.getElementById('admin-export-btn')?.addEventListener('click',       () => this._exportJson());
        document.getElementById('admin-exit-btn')?.addEventListener('click',         () => this.exitAdminMode());
    }

    _openWallpaperModal() {
        this._injectWallpaperModal();
        const data = this._getData();
        const type = data.wallpaperType || 'auto';
        const url = data.customWallpaper || '';

        const radio = document.querySelector(`input[name="admin-wallpaper-mode"][value="${type}"]`);
        if (radio) {
            radio.checked = true;
            const event = new Event('change');
            radio.dispatchEvent(event);
        }

        const urlInput = document.getElementById('admin-field-wallpaper-url');
        if (urlInput) urlInput.value = url;

        const modal = document.getElementById('admin-wallpaper-modal');
        if (modal) modal.style.display = 'flex';
    }

    _closeWallpaperModal() {
        const modal = document.getElementById('admin-wallpaper-modal');
        if (modal) modal.style.display = 'none';
    }

    _injectWallpaperModal() {
        if (document.getElementById('admin-wallpaper-modal')) return;

        const modal = document.createElement('div');
        modal.id = 'admin-wallpaper-modal';
        modal.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
            z-index: 2000; display: none; align-items: center; justify-content: center;
        `;
        modal.innerHTML = `
            <div id="admin-wallpaper-overlay" style="position: absolute; width: 100%; height: 100%; background: rgba(0,0,0,0.6); backdrop-filter: blur(4px);"></div>
            <div class="admin-login-content" style="position: relative; z-index: 2; width: 400px; max-width: 90vw; background: #1a1a24; border: 1px solid rgba(255,255,255,0.08); border-radius: 12px; padding: 1.5rem; box-shadow: 0 10px 30px rgba(0,0,0,0.5);">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.2rem;">
                    <h3 style="margin: 0; font-size: 1.1rem; color: var(--admin-purple-lt); display: flex; align-items: center; gap: 0.5rem;"><i class="bi bi-image"></i> Header Wallpaper</h3>
                    <button id="admin-wallpaper-close" style="background: none; border: none; color: #9aa0a6; cursor: pointer; font-size: 1.2rem;"><i class="bi bi-x-lg"></i></button>
                </div>

                <div class="admin-field-group" style="margin-bottom: 1rem;">
                    <label class="admin-field-label" style="display: block; margin-bottom: 0.5rem; color: #fff; font-size: 0.85rem;">Wallpaper Mode</label>
                    <div style="display: flex; gap: 1rem;">
                        <label style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer; color: #e9eef8; font-size: 0.85rem;">
                            <input type="radio" name="admin-wallpaper-mode" value="auto" checked /> Auto Wallpaper
                        </label>
                        <label style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer; color: #e9eef8; font-size: 0.85rem;">
                            <input type="radio" name="admin-wallpaper-mode" value="custom" /> Custom Image
                        </label>
                    </div>
                </div>

                <div id="admin-custom-wallpaper-fields" style="display: none; margin-bottom: 1.2rem;">
                    <div class="admin-field-group" style="margin-bottom: 0.8rem;">
                        <label class="admin-field-label" style="display: block; margin-bottom: 0.4rem; color: #fff; font-size: 0.85rem;">Custom Image URL / Path</label>
                        <input type="text" id="admin-field-wallpaper-url" class="admin-input-full" placeholder="e.g. assets/data/custom-icons/my-bg.jpg" />
                    </div>
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <label class="admin-drawer-btn" style="flex: none; padding: 4px 8px; font-size: 0.75rem; margin: 0; background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.12); cursor: pointer;" for="admin-field-wallpaper-upload">
                            <i class="bi bi-upload"></i> Upload Custom Wallpaper
                        </label>
                        <input type="file" id="admin-field-wallpaper-upload" accept="image/*" style="display: none;" />
                    </div>
                </div>

                <div style="display: flex; gap: 0.7rem; margin-top: 1.5rem;">
                    <button class="admin-drawer-btn cancel" id="admin-wallpaper-cancel" style="flex: 1; padding: 0.6rem;">Cancel</button>
                    <button class="admin-drawer-btn save" id="admin-wallpaper-save" style="flex: 1; padding: 0.6rem;">Save</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);

        // Wire up events
        document.getElementById('admin-wallpaper-close').addEventListener('click', () => this._closeWallpaperModal());
        document.getElementById('admin-wallpaper-cancel').addEventListener('click', () => this._closeWallpaperModal());
        document.getElementById('admin-wallpaper-overlay').addEventListener('click', () => this._closeWallpaperModal());

        document.querySelectorAll('input[name="admin-wallpaper-mode"]').forEach(radio => {
            radio.addEventListener('change', (e) => {
                document.getElementById('admin-custom-wallpaper-fields').style.display =
                    (e.target.value === 'custom') ? 'block' : 'none';
            });
        });

        document.getElementById('admin-field-wallpaper-upload').addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) this._uploadIcon(file, 'admin-field-wallpaper-url');
        });

        document.getElementById('admin-wallpaper-save').addEventListener('click', () => {
            const mode = document.querySelector('input[name="admin-wallpaper-mode"]:checked').value;
            const url = document.getElementById('admin-field-wallpaper-url').value.trim();

            const data = this._getData();
            data.wallpaperType = mode;
            if (mode === 'custom') {
                data.customWallpaper = url;
            }

            // Save to localStorage (admin override)
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));

            // Apply wallpaper immediately
            if (window.applyHeaderWallpaper) window.applyHeaderWallpaper();

            this._closeWallpaperModal();
            this._showToast('Wallpaper configuration updated!', 'success');
        });
    }

    // ── Section header controls (edit / delete section) ────────
    _injectSectionControls() {
        document.querySelectorAll('.tv-row').forEach(row => {
            const sid = row.dataset.sectionId;
            if (!sid) return;
            if (row.querySelector('.admin-section-controls')) return;

            const titleEl = row.querySelector('.row-title');
            if (!titleEl) return;

            const ctrls = document.createElement('span');
            ctrls.className = 'admin-section-controls';
            ctrls.innerHTML = `
                <div class="admin-section-drag-handle" title="Drag to reorder section">
                  <i class="bi bi-grip-vertical"></i>
                </div>
                <button class="admin-section-btn" data-action="edit-section" data-sid="${sid}" title="Edit Section">
                  <i class="bi bi-pencil-fill"></i>
                </button>
                <button class="admin-section-btn danger" data-action="delete-section" data-sid="${sid}" title="Delete Section">
                  <i class="bi bi-trash3-fill"></i>
                </button>`;
            titleEl.appendChild(ctrls);

            const handle = ctrls.querySelector('.admin-section-drag-handle');
            handle.addEventListener('mousedown', () => {
                row.setAttribute('draggable', 'true');
            });
            handle.addEventListener('mouseup', () => {
                row.setAttribute('draggable', 'false');
            });

            // dragstart
            row.addEventListener('dragstart', (e) => {
                if (e.target !== row) {
                    return;
                }
                this._dragSectionEl = row;
                this._preDragData = JSON.parse(JSON.stringify(this._getData()));
                e.dataTransfer.effectAllowed = 'move';
                e.dataTransfer.setData('text/plain', 'drag-section');
                requestAnimationFrame(() => row.classList.add('dragging-section'));
            });

            // dragover: vertical reordering
            row.addEventListener('dragover', (e) => {
                if (!this._dragSectionEl || this._dragSectionEl === row) return;
                e.preventDefault();
                e.stopPropagation();

                const rect = row.getBoundingClientRect();
                const container = row.parentElement;

                if (e.clientY < rect.top + rect.height / 2) {
                    if (row.previousElementSibling !== this._dragSectionEl) {
                        container.insertBefore(this._dragSectionEl, row);
                    }
                } else {
                    const after = row.nextElementSibling;
                    if (after && after.id === 'admin-add-section-row') {
                        container.insertBefore(this._dragSectionEl, after);
                    } else if (after !== this._dragSectionEl) {
                        container.insertBefore(this._dragSectionEl, after);
                    }
                }
            });

            // dragend
            row.addEventListener('dragend', () => {
                row.setAttribute('draggable', 'false');
                row.classList.remove('dragging-section');
                if (this._dragSectionEl) {
                    this._saveSectionDomOrder();
                    this._dragSectionEl = null;
                    this._preDragData = null;
                }
            });
        });
    }

    // ── "Add New Section" row at bottom ────────────────────────
    _injectAddSectionRow() {
        if (document.getElementById('admin-add-section-row')) return;
        const container = document.getElementById('sections-container');
        if (!container) return;

        const row = document.createElement('div');
        row.id = 'admin-add-section-row';
        row.className = 'admin-add-section-row';
        row.innerHTML = `<i class="bi bi-plus-circle-fill"></i> <span>Add New Section</span>`;
        row.addEventListener('click', () => this.openDrawer('add-section', null, null));
        container.appendChild(row);
    }

    // ── Card overlays (edit / disable / delete per card) ───────
    _injectOverlays() {
        document.querySelectorAll('.tv-row').forEach(row => {
            const sid  = row.dataset.sectionId;
            const type = row.dataset.sectionType;
            if (type === 'news') return;

            row.querySelectorAll('.app-card:not(.admin-add-card)').forEach((card, idx) => {
                if (card.querySelector('.admin-card-overlay')) return;

                // Tag each card with its original section+index so we can
                // reconstruct data order from the DOM after live reordering
                card.dataset.itemSid = sid;
                card.dataset.itemIdx = idx;

                const isDisabled = card.classList.contains('card-disabled');
                const overlay = document.createElement('div');
                overlay.className = 'admin-card-overlay';
                overlay.innerHTML = `
                    <div class="admin-card-drag-handle" title="Drag to reorder">
                      <i class="bi bi-grip-vertical"></i>
                    </div>
                    <button class="admin-ctrl-btn edit"
                        data-action="edit" data-sid="${sid}" data-idx="${idx}">
                      <i class="bi bi-pencil-fill"></i> Edit
                    </button>
                    <button class="admin-ctrl-btn toggle-active${isDisabled ? ' is-disabled' : ''}"
                        data-action="toggle" data-sid="${sid}" data-idx="${idx}">
                      <i class="bi bi-${isDisabled ? 'check-circle-fill' : 'slash-circle-fill'}"></i>
                      ${isDisabled ? 'Enable' : 'Disable'}
                    </button>
                    <button class="admin-ctrl-btn delete"
                        data-action="delete" data-sid="${sid}" data-idx="${idx}">
                      <i class="bi bi-trash3-fill"></i> Delete
                    </button>`;

                card.style.position = 'relative';
                card.appendChild(overlay);
                card.setAttribute('draggable', 'true');

                // ── dragstart: snapshot data + mark the dragged element ──
                card.addEventListener('dragstart', (e) => {
                    this._dragEl = card;
                    this._preDragData = JSON.parse(JSON.stringify(this._getData()));
                    e.dataTransfer.effectAllowed = 'move';
                    e.dataTransfer.setData('text/plain', 'drag'); // required for Firefox
                    // Delay so ghost image is captured before we apply the dim
                    requestAnimationFrame(() => card.classList.add('dragging'));
                });

                // ── dragover: LIVE reorder — immediately move card in DOM ──
                card.addEventListener('dragover', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const dragging = this._dragEl;
                    if (!dragging || dragging === card) return;

                    const rect = card.getBoundingClientRect();
                    const content = card.parentElement;

                    if (e.clientX < rect.left + rect.width / 2) {
                        // Cursor is on the left half → place dragged card before target
                        if (card.previousElementSibling !== dragging) {
                            content.insertBefore(dragging, card);
                        }
                    } else {
                        // Cursor is on the right half → place dragged card after target
                        const after = card.nextElementSibling;
                        if (after !== dragging) {
                            content.insertBefore(dragging, after); // null = append
                        }
                    }
                });

                // ── dragend: save the new DOM order to the data model ──
                card.addEventListener('dragend', () => {
                    card.classList.remove('dragging');
                    document.querySelectorAll('.tv-row-content, .tv-fluid-content')
                        .forEach(c => c.classList.remove('drag-over'));
                    if (this._dragEl) {
                        this._saveDomOrder();
                        this._dragEl = null;
                        this._preDragData = null;
                    }
                });
            });
        });

        // ── Container drop zones (drag into an empty/different section) ──
        document.querySelectorAll('.tv-row').forEach(row => {
            const type = row.dataset.sectionType;
            if (type === 'news') return;

            const content = row.querySelector('.tv-row-content, .tv-fluid-content');
            if (!content || content._dragBound) return;
            content._dragBound = true;

            content.addEventListener('dragover', (e) => {
                e.preventDefault();
                if (!this._dragEl) return;
                content.classList.add('drag-over');
                // Move dragged card to end of this container (before add-card)
                const addCard = content.querySelector('.admin-add-card');
                const target = addCard || null;
                if (this._dragEl.parentElement !== content ||
                    content.lastElementChild !== this._dragEl &&
                    content.lastElementChild !== addCard) {
                    content.insertBefore(this._dragEl, target);
                }
            });

            content.addEventListener('dragleave', (e) => {
                if (!content.contains(e.relatedTarget)) {
                    content.classList.remove('drag-over');
                }
            });

            // drop is handled by dragend — just clean up visual
            content.addEventListener('drop', (e) => {
                e.preventDefault();
                content.classList.remove('drag-over');
            });
        });

        // ── Event delegation — click handlers for edit/toggle/delete ──
        const container = document.getElementById('sections-container');
        if (container && !container._adminBound) {
            container._adminBound = true;
            container.addEventListener('click', (e) => {
                if (!this.isAdminMode) return;

                const secBtn = e.target.closest('.admin-section-btn');
                if (secBtn) {
                    e.preventDefault(); e.stopPropagation();
                    const { action, sid } = secBtn.dataset;
                    if (action === 'edit-section')   this.openDrawer('edit-section', sid, null);
                    if (action === 'delete-section') this._deleteSection(sid);
                    return;
                }

                const cardBtn = e.target.closest('.admin-ctrl-btn');
                if (cardBtn) {
                    e.preventDefault(); e.stopPropagation();
                    const { action, sid, idx } = cardBtn.dataset;
                    const index = parseInt(idx, 10);
                    if (action === 'edit')   this.openDrawer('edit', sid, index);
                    if (action === 'toggle') this._toggleDisable(sid, index);
                    if (action === 'delete') this._deleteItem(sid, index);
                }
            }, true);
        }
    }

    // ── Add-service cards at end of each section ───────────────
    _injectAddCards() {
        document.querySelectorAll('.tv-row').forEach(row => {
            if (row.dataset.sectionType === 'news') return;
            if (row.querySelector('.admin-add-card')) return;

            const content = row.querySelector('.tv-row-content, .tv-fluid-content');
            if (!content) return;

            const sid     = row.dataset.sectionId;
            const type    = row.dataset.sectionType;
            const addCard = document.createElement('div');
            if (type === 'content') {
                addCard.className = 'app-card content-card admin-add-card';
            } else {
                addCard.className = 'app-card favorite-app-card admin-add-card';
            }
            addCard.setAttribute('role', 'button');
            addCard.setAttribute('tabindex', '0');
            addCard.setAttribute('aria-label', 'Add new service');
            addCard.innerHTML = `
                <i class="bi bi-plus-circle-fill admin-add-icon"></i>
                <div class="app-title">Add Service</div>`;

            addCard.addEventListener('click',   ()  => this.openDrawer('add', sid, null));
            addCard.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') this.openDrawer('add', sid, null);
            });
            content.appendChild(addCard);
        });
    }

    // ── Drawer setup ───────────────────────────────────────────
    _setupDrawer() {
        document.getElementById('admin-drawer-overlay')?.addEventListener('click', () => this.closeDrawer());
        document.getElementById('admin-drawer-close')?.addEventListener('click',   () => this.closeDrawer());
        document.getElementById('admin-drawer-save')?.addEventListener('click',    () => this._saveFromDrawer());
        document.getElementById('admin-drawer-cancel')?.addEventListener('click',  () => this.closeDrawer());

        // Icon preview (item icon)
        document.getElementById('admin-field-icon')?.addEventListener('input', (e) => {
            const color = document.getElementById('admin-field-color')?.value || '#8a39ff';
            this._updateIconPreview(e.target.value, 'admin-icon-preview', 'bi-app', color);
        });

        // Icon preview (section icon)
        document.getElementById('admin-section-icon')?.addEventListener('input', (e) => {
            this._updateIconPreview(e.target.value, 'admin-section-icon-preview', 'bi-grid');
        });

        // Handle custom icon file upload (item icon)
        document.getElementById('admin-field-icon-upload')?.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;
            this._uploadIcon(file, 'admin-field-icon');
        });

        // Handle custom icon file upload (section icon)
        document.getElementById('admin-section-icon-upload')?.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;
            this._uploadIcon(file, 'admin-section-icon');
        });

        // Color picker → text + swatch
        document.getElementById('admin-field-color')?.addEventListener('input', (e) => {
            this._syncColor(e.target.value);
        });
        document.getElementById('admin-field-color-text')?.addEventListener('input', (e) => {
            const v = e.target.value.trim();
            if (/^#[0-9A-Fa-f]{6}$/.test(v)) this._syncColor(v);
        });

        // Section type radio → show/hide RSS URL field
        document.querySelectorAll('input[name="admin-section-type"]').forEach(radio => {
            radio.addEventListener('change', (e) => {
                const newsField = document.querySelector('.admin-news-url-field');
                if (newsField) newsField.style.display = (e.target.value === 'news') ? '' : 'none';
            });
        });

        // Escape closes drawer
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && document.getElementById('admin-drawer')?.classList.contains('active')) {
                this.closeDrawer();
            }
        });
    }

    _syncColor(hex) {
        ['admin-field-color', 'admin-field-color-text'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.value = hex;
        });
        const swatch = document.getElementById('admin-color-swatch');
        if (swatch) swatch.style.background = hex;
        
        const iconInput = document.getElementById('admin-field-icon');
        if (iconInput) {
            this._updateIconPreview(iconInput.value, 'admin-icon-preview', 'bi-app', hex);
        }
    }

    _updateIconPreview(inputVal, previewWrapId, defaultClass, color = '') {
        const previewEl = document.getElementById(previewWrapId);
        if (!previewEl) return;
        const wrap = previewEl.parentElement;
        if (!wrap) return;

        const trimmed = inputVal.trim();
        if (trimmed.includes('/') || trimmed.includes('.')) {
            // Render image
            wrap.innerHTML = `<img id="${previewWrapId}" src="${trimmed}" style="max-width: 100%; max-height: 100%; object-fit: contain; border-radius: 4px;" onerror="this.src='data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2224%22 height=%2224%22 viewBox=%220 0 24 24%22 fill=%22none%22 stroke=%22%238a39ff%22 stroke-width=%222%22><rect x=%223%22 y=%223%22 width=%2218%22 height=%2218%22 rx=%222%22/></svg>'">`;
        } else {
            // Render bootstrap icon
            const colorStyle = color ? `style="color:${color}"` : '';
            wrap.innerHTML = `<i id="${previewWrapId}" class="bi ${trimmed || defaultClass}" ${colorStyle}></i>`;
        }
    }

    async _uploadIcon(file, inputId) {
        const formData = new FormData();
        formData.append('icon', file);

        try {
            const input = document.getElementById(inputId);
            const originalVal = input ? input.value : '';
            if (input) {
                input.value = 'Uploading...';
                input.disabled = true;
            }

            const response = await fetch('api/upload-icon.php', {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.error || 'Upload failed');
            }

            const data = await response.json();
            if (data.status === 'uploaded' && data.path) {
                if (input) {
                    input.value = data.path;
                    input.disabled = false;
                    // Trigger input event to update preview
                    const event = new Event('input', { bubbles: true });
                    input.dispatchEvent(event);
                }
            } else {
                throw new Error('Invalid server response');
            }
        } catch (err) {
            alert('Icon upload failed: ' + err.message);
            const input = document.getElementById(inputId);
            if (input) {
                input.value = '';
                input.disabled = false;
            }
        }
    }

    // ── Open drawer ────────────────────────────────────────────
    openDrawer(mode, sectionId, itemIndex) {
        this.drawerMode    = mode;
        this.drawerSection = sectionId;
        this.drawerIndex   = itemIndex;

        const isSectionMode = (mode === 'add-section' || mode === 'edit-section');

        // Hide all optional field groups first
        document.querySelectorAll('.admin-field-favorite').forEach(f => f.style.display = 'none');
        document.querySelectorAll('.admin-field-content').forEach(f  => f.style.display = 'none');
        document.querySelectorAll('.admin-field-section').forEach(f  => f.style.display = 'none');

        // Common item fields (title / url / alturl groups) and active toggle
        const commonIds = ['admin-field-title', 'admin-field-url', 'admin-field-alturl'];
        commonIds.forEach(id => {
            const grp = document.getElementById(id)?.closest('.admin-field-group');
            if (grp) grp.style.display = isSectionMode ? 'none' : '';
        });
        const toggleRow = document.querySelector('.admin-toggle-row');
        if (toggleRow) toggleRow.style.display = isSectionMode ? 'none' : '';

        // Hide "Basic Info" header in section mode
        const itemOnlyHeader = document.querySelector('.admin-field-item-only');
        if (itemOnlyHeader) itemOnlyHeader.style.display = isSectionMode ? 'none' : '';

        // First divider between common/appearance sections
        const dividers = document.querySelectorAll('.admin-drawer-divider');
        if (dividers[0]) dividers[0].style.display = isSectionMode ? 'none' : '';

        if (isSectionMode) {
            document.querySelectorAll('.admin-field-section').forEach(f => f.style.display = '');
        } else {
            const row = document.querySelector(`.tv-row[data-section-id="${sectionId}"]`);
            this.currentType = row?.dataset.sectionType || 'favorite';
            const isFav = (this.currentType === 'favorite');
            document.querySelectorAll('.admin-field-favorite').forEach(f => f.style.display = isFav ? '' : 'none');
            document.querySelectorAll('.admin-field-content').forEach(f  => f.style.display = isFav ? 'none' : '');
        }

        // Populate / clear
        if (mode === 'edit') {
            this._prefillDrawer(sectionId, itemIndex);
        } else if (mode === 'edit-section') {
            this._prefillSectionDrawer(sectionId);
        } else if (mode === 'add-section') {
            this._clearSectionDrawer();
        } else {
            this._clearDrawer();
        }

        const titles = {
            'edit': 'Edit Service',
            'add':  'Add New Service',
            'edit-section': 'Edit Section',
            'add-section':  'Add New Section'
        };
        document.getElementById('admin-drawer-title').textContent = titles[mode] || 'Edit';

        document.getElementById('admin-drawer').classList.add('active');
        document.getElementById('admin-drawer-overlay').classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    closeDrawer() {
        document.getElementById('admin-drawer')?.classList.remove('active');
        document.getElementById('admin-drawer-overlay')?.classList.remove('active');
        document.body.style.overflow = '';
        this.drawerMode = this.drawerSection = this.drawerIndex = null;
    }

    // ── Drawer populate (items) ────────────────────────────────
    _prefillDrawer(sectionId, itemIndex) {
        const data    = this._getData();
        const section = data.sections.find(s => s.id === sectionId);
        const item    = section?.items?.[itemIndex];
        if (!item) return;

        document.getElementById('admin-field-title').value  = item.title    || '';
        document.getElementById('admin-field-url').value    = item.url      || '';
        document.getElementById('admin-field-alturl').value = item.altUrl   || '';
        document.getElementById('admin-field-active').checked = (item.active !== false);

        if (this.currentType === 'favorite') {
            const iconVal = item.icon || '';
            document.getElementById('admin-field-icon').value        = iconVal;
            document.getElementById('admin-field-description').value = item.description || '';
            const color = item.color || '#8a39ff';
            this._syncColor(color);
            this._updateIconPreview(iconVal, 'admin-icon-preview', 'bi-app', color);
        } else {
            document.getElementById('admin-field-image').value     = item.image     || '';
            document.getElementById('admin-field-subtitle').value  = item.subtitle  || '';
            document.getElementById('admin-field-course').value    = item.course    || '';
            document.getElementById('admin-field-author').value    = item.author    || '';
            document.getElementById('admin-field-authorurl').value = item.authorUrl || '';
        }
    }

    _clearDrawer() {
        ['admin-field-title','admin-field-url','admin-field-alturl',
         'admin-field-icon','admin-field-description',
         'admin-field-image','admin-field-subtitle','admin-field-course',
         'admin-field-author','admin-field-authorurl'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.value = '';
        });
        const activeEl = document.getElementById('admin-field-active');
        if (activeEl) activeEl.checked = true;
        this._syncColor('#8a39ff');
        this._updateIconPreview('', 'admin-icon-preview', 'bi-app', '#8a39ff');
        
        // Reset file inputs
        const fileInput = document.getElementById('admin-field-icon-upload');
        if (fileInput) fileInput.value = '';
    }

    // ── Drawer populate (sections) ─────────────────────────────
    _prefillSectionDrawer(sectionId) {
        const data    = this._getData();
        const section = data.sections.find(s => s.id === sectionId);
        if (!section) return;

        document.getElementById('admin-section-title').value  = section.title  || '';
        const iconVal = section.icon || '';
        document.getElementById('admin-section-icon').value   = iconVal;
        document.getElementById('admin-section-rssurl').value = section.rssUrl || '';

        this._updateIconPreview(iconVal, 'admin-section-icon-preview', 'bi-grid');

        const type  = section.type || 'favorite';
        const radio = document.querySelector(`input[name="admin-section-type"][value="${type}"]`);
        if (radio) radio.checked = true;

        const newsField = document.querySelector('.admin-news-url-field');
        if (newsField) newsField.style.display = (type === 'news') ? '' : 'none';
    }

    _clearSectionDrawer() {
        ['admin-section-title','admin-section-icon','admin-section-rssurl'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.value = '';
        });
        this._updateIconPreview('', 'admin-section-icon-preview', 'bi-grid');

        const radio = document.querySelector('input[name="admin-section-type"][value="favorite"]');
        if (radio) radio.checked = true;

        const newsField = document.querySelector('.admin-news-url-field');
        if (newsField) newsField.style.display = 'none';

        // Reset file inputs
        const fileInput = document.getElementById('admin-section-icon-upload');
        if (fileInput) fileInput.value = '';
    }

    // ── Save dispatcher ────────────────────────────────────────
    _saveFromDrawer() {
        const isSectionMode = (this.drawerMode === 'add-section' || this.drawerMode === 'edit-section');
        if (isSectionMode) {
            this._saveSectionFromDrawer();
        } else {
            this._saveItemFromDrawer();
        }
    }

    // ── Save: item ─────────────────────────────────────────────
    _saveItemFromDrawer() {
        const titleEl = document.getElementById('admin-field-title');
        const title   = titleEl.value.trim();
        if (!title) { titleEl.classList.add('error'); titleEl.focus(); return; }
        titleEl.classList.remove('error');

        const item = {
            title,
            url:    document.getElementById('admin-field-url').value.trim(),
            active: document.getElementById('admin-field-active').checked
        };
        const altUrl = document.getElementById('admin-field-alturl').value.trim();
        if (altUrl) item.altUrl = altUrl;

        if (this.currentType === 'favorite') {
            item.icon        = document.getElementById('admin-field-icon').value.trim()  || 'bi-app';
            item.color       = document.getElementById('admin-field-color-text').value.trim() || '#8a39ff';
            item.description = document.getElementById('admin-field-description').value.trim();
        } else {
            const image     = document.getElementById('admin-field-image').value.trim();
            const subtitle  = document.getElementById('admin-field-subtitle').value.trim();
            const course    = document.getElementById('admin-field-course').value.trim();
            const author    = document.getElementById('admin-field-author').value.trim();
            const authorUrl = document.getElementById('admin-field-authorurl').value.trim();
            if (image)     item.image     = image;
            if (subtitle)  item.subtitle  = subtitle;
            if (course)    item.course    = course;
            if (author)    item.author    = author;
            if (authorUrl) item.authorUrl = authorUrl;
        }

        this._saveItem(this.drawerSection, item, this.drawerIndex);
        this.closeDrawer();
    }

    // ── Save: section ──────────────────────────────────────────
    _saveSectionFromDrawer() {
        const titleEl = document.getElementById('admin-section-title');
        const title   = titleEl.value.trim();
        if (!title) { titleEl.classList.add('error'); titleEl.focus(); return; }
        titleEl.classList.remove('error');

        const icon   = document.getElementById('admin-section-icon').value.trim() || 'bi-grid';
        const type   = document.querySelector('input[name="admin-section-type"]:checked')?.value || 'favorite';
        const rssUrl = document.getElementById('admin-section-rssurl').value.trim();

        const data = this._getData();

        if (this.drawerMode === 'edit-section') {
            const sec = data.sections.find(s => s.id === this.drawerSection);
            if (sec) {
                sec.title = title;
                sec.icon  = icon;
                const prevType = sec.type;
                sec.type  = type;
                // If switching to news, clear items; if switching away, add empty items
                if (type === 'news') {
                    sec.rssUrl = rssUrl || sec.rssUrl;
                    delete sec.items;
                } else {
                    if (!sec.items || prevType === 'news') sec.items = [];
                    delete sec.rssUrl;
                }
            }
        } else {
            // Add new section
            let id = this._slugify(title) || 'section-' + Date.now().toString(36);
            // Ensure unique ID
            if (data.sections.find(s => s.id === id)) id += '-' + Date.now().toString(36).slice(-4);

            const newSection = { id, title, icon, type, active: true };
            if (type === 'news') {
                if (rssUrl) newSection.rssUrl = rssUrl;
            } else {
                newSection.items = [];
            }
            data.sections.push(newSection);
        }

        this._persistData(data);
        this.closeDrawer();
        this._refreshDashboard();
        this._showToast(this.drawerMode === 'edit-section' ? 'Section updated!' : 'Section added!', 'success');
    }

    // ── Data operations ────────────────────────────────────────
    _getData() {
        const stored = localStorage.getItem(this.STORAGE_KEY);
        if (stored) { try { return JSON.parse(stored); } catch (e) { /* corrupt */ } }
        return window._servicesData
            ? JSON.parse(JSON.stringify(window._servicesData))
            : { sections: [] };
    }

    _persistData(data) {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
        window._servicesData = data;
    }

    _saveItem(sectionId, item, itemIndex) {
        const data    = this._getData();
        const section = data.sections.find(s => s.id === sectionId);
        if (!section) return;
        if (!section.items) section.items = [];

        if (itemIndex !== null && itemIndex >= 0) {
            section.items[itemIndex] = item;
        } else {
            section.items.push(item);
        }

        this._persistData(data);
        this._refreshDashboard();
        this._showToast('Service saved!', 'success');
    }

    _moveCard(sourceSectionId, sourceIdx, targetSectionId, targetIdx, dropOnLeft) {
        const data = this._getData();
        const sourceSection = data.sections.find(s => s.id === sourceSectionId);
        const targetSection = data.sections.find(s => s.id === targetSectionId);

        if (!sourceSection || !targetSection) return;
        if (!sourceSection.items || !sourceSection.items[sourceIdx]) return;

        const itemToMove = sourceSection.items[sourceIdx];
        const targetItem = targetIdx !== null && targetIdx !== undefined ? targetSection.items[targetIdx] : null;

        // 1. Remove from source section
        sourceSection.items.splice(sourceIdx, 1);

        // 2. Insert into target section
        if (targetItem) {
            let newTargetIdx = targetSection.items.indexOf(targetItem);
            if (newTargetIdx === -1) {
                newTargetIdx = targetIdx;
            }
            if (dropOnLeft) {
                targetSection.items.splice(newTargetIdx, 0, itemToMove);
            } else {
                targetSection.items.splice(newTargetIdx + 1, 0, itemToMove);
            }
        } else {
            // Drop on container -> append to end
            if (!targetSection.items) targetSection.items = [];
            targetSection.items.push(itemToMove);
        }

        // 3. Persist and refresh
        this._persistData(data);
        this._refreshDashboard();
        this._showToast('Card position updated!', 'success');
    }

    // ── Read DOM order → rebuild & persist data after live drag ──
    _saveDomOrder() {
        const snapshot = this._preDragData;
        if (!snapshot) return;

        // Deep-copy snapshot so we can safely mutate section.items
        const data = JSON.parse(JSON.stringify(snapshot));

        // Clear items for every non-news section that exists in the DOM
        const touched = new Set();
        document.querySelectorAll('.tv-row').forEach(row => {
            const sid  = row.dataset.sectionId;
            const type = row.dataset.sectionType;
            if (type === 'news' || !sid) return;
            const sec = data.sections.find(s => s.id === sid);
            if (sec && !touched.has(sid)) {
                touched.add(sid);
                sec.items = [];
            }
        });

        // Walk every content container in DOM order and push items in their
        // new visual order using the original sid+idx tags to look them up
        document.querySelectorAll('.tv-row').forEach(row => {
            const sid  = row.dataset.sectionId;
            const type = row.dataset.sectionType;
            if (type === 'news' || !sid) return;

            const content = row.querySelector('.tv-row-content, .tv-fluid-content');
            if (!content) return;

            const targetSec = data.sections.find(s => s.id === sid);
            if (!targetSec) return;

            content.querySelectorAll('.app-card:not(.admin-add-card)').forEach(card => {
                const origSid = card.dataset.itemSid;
                const origIdx = parseInt(card.dataset.itemIdx, 10);
                const origSec = snapshot.sections.find(s => s.id === origSid);
                const item    = origSec?.items?.[origIdx];
                if (item) targetSec.items.push(JSON.parse(JSON.stringify(item)));
            });
        });

        this._persistData(data);
        this._refreshDashboard();
        this._showToast('Order saved!', 'success');
    }

    _saveSectionDomOrder() {
        const snapshot = this._preDragData;
        if (!snapshot) return;

        const data = JSON.parse(JSON.stringify(snapshot));
        const newSections = [];

        document.querySelectorAll('#sections-container .tv-row').forEach(row => {
            const sid = row.dataset.sectionId;
            if (!sid) return;
            const sec = data.sections.find(s => s.id === sid);
            if (sec) {
                newSections.push(sec);
            }
        });

        // Keep any sections that might not be rendered in the DOM currently
        data.sections.forEach(sec => {
            if (!newSections.some(s => s.id === sec.id)) {
                newSections.push(sec);
            }
        });

        data.sections = newSections;
        this._persistData(data);
        this._refreshDashboard();
        this._showToast('Section order saved!', 'success');
    }

    _deleteItem(sectionId, itemIndex) {
        if (!confirm('Delete this service? This cannot be undone.')) return;
        const data    = this._getData();
        const section = data.sections.find(s => s.id === sectionId);
        if (!section?.items) return;
        section.items.splice(itemIndex, 1);
        this._persistData(data);
        this._refreshDashboard();
        this._showToast('Service deleted', 'info');
    }

    _toggleDisable(sectionId, itemIndex) {
        const data    = this._getData();
        const section = data.sections.find(s => s.id === sectionId);
        if (!section?.items) return;
        const item = section.items[itemIndex];
        if (!item) return;
        item.active = (item.active === false);
        this._persistData(data);
        this._refreshDashboard();
        this._showToast(item.active ? 'Service enabled' : 'Service disabled', item.active ? 'success' : 'warning');
    }

    _deleteSection(sectionId) {
        if (!confirm('Delete this entire section and all its services? This cannot be undone.')) return;
        const data = this._getData();
        data.sections = data.sections.filter(s => s.id !== sectionId);
        this._persistData(data);
        this._refreshDashboard();
        this._showToast('Section deleted', 'info');
    }

    _slugify(text) {
        return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    }

    // ── Refresh dashboard ──────────────────────────────────────
    _refreshDashboard() {
        const data = this._getData();
        window._servicesData = data;

        const authorUrl = data.config?.authorUrl || null;
        if (authorUrl) {
            document.querySelectorAll('a.nav-author-link').forEach(el => {
                el.href = window.resolveServiceUrl ? window.resolveServiceUrl(authorUrl) : authorUrl;
            });
        }

        if (window.renderSections)           window.renderSections(data.sections, authorUrl);
        if (window.updateSearchFunctionality) window.updateSearchFunctionality();

        if (this.isAdminMode) {
            setTimeout(() => {
                this._injectSectionControls();
                this._injectOverlays();
                this._injectAddCards();
                this._injectAddSectionRow();
            }, 60);
        }
    }

    // ── Detect save capability (probe api/save-services.php) ──
    async _detectSaveCapability() {
        try {
            const resp = await fetch('api/save-services.php', {
                method: 'GET',
                cache:  'no-store'
            });
            if (!resp.ok) return;
            const info = await resp.json();
            if (info.status === 'ok') {
                this.canSaveToServer = true;
                this.serverType      = info.server || 'php';
                // If already in admin mode when detection completes, refresh banner
                if (this.isAdminMode) {
                    document.getElementById('admin-banner')?.remove();
                    this._injectBanner();
                }
            }
        } catch (_) {
            // endpoint not available — stay in export-only mode
        }
    }

    // ── Save directly to server via PHP endpoint ───────────────
    async _saveToServer() {
        const data = this._getData();
        const cleanData = Object.assign({}, data);
        delete cleanData.config;
        const btn  = document.getElementById('admin-save-server-btn');

        if (btn) { btn.disabled = true; btn.innerHTML = '<i class="bi bi-hourglass-split"></i> Saving…'; }

        try {
            const resp = await fetch('api/save-services.php', {
                method:  'POST',
                headers: { 'Content-Type': 'application/json' },
                body:    JSON.stringify(cleanData)
            });

            const result = await resp.json();

            if (!resp.ok) {
                // Show detailed error (includes chmod fix if permissions issue)
                const msg = result.fix
                    ? `${result.error}\n\nFix: ${result.fix.command}`
                    : result.error || `HTTP ${resp.status}`;
                alert('⚠ Save failed\n\n' + msg);
                this._showToast('Save failed — check console', 'error');
                console.error('[Admin] Save failed:', result);
            } else {
                this._showToast(`✓ Saved to server (${result.bytes} bytes) — backup: ${result.backup}`, 'success');
                // Sync window._servicesData so subsequent actions work from saved state
                window._servicesData = data;
            }
        } catch (err) {
            alert('⚠ Could not reach api/save-services.php\n\n' + err.message);
            this._showToast('Network error — could not save', 'error');
            console.error('[Admin] Save error:', err);
        } finally {
            if (btn) {
                btn.disabled = false;
                btn.innerHTML = `<i class="bi bi-floppy-fill"></i> Save to Server <span class="admin-server-badge">${this.serverType}</span>`;
            }
        }
    }

    // ── Export JSON ────────────────────────────────────────────
    _exportJson() {
        const data = this._getData();
        const cleanData = Object.assign({}, data);
        delete cleanData.config;
        const json = JSON.stringify(cleanData, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url  = URL.createObjectURL(blob);
        const a    = Object.assign(document.createElement('a'), { href: url, download: 'services.json' });
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        this._showToast('services.json downloaded!', 'success');
    }

    // ── Reset to original ──────────────────────────────────────
    _resetToOriginal() {
        if (!confirm('Reset all admin changes? The page will reload with the original services.json.')) return;
        localStorage.removeItem(this.STORAGE_KEY);
        location.reload();
    }

    // ── Toast ──────────────────────────────────────────────────
    _showToast(message, type = 'info') {
        document.getElementById('admin-toast-el')?.remove();
        const icons = { success: 'bi-check-circle-fill', info: 'bi-info-circle-fill', warning: 'bi-exclamation-triangle-fill', error: 'bi-x-circle-fill' };
        const toast = document.createElement('div');
        toast.id = 'admin-toast-el';
        toast.className = `admin-toast admin-toast-${type}`;
        toast.innerHTML = `<i class="bi ${icons[type] || icons.info}"></i> ${message}`;
        document.body.appendChild(toast);
        requestAnimationFrame(() => toast.classList.add('show'));
        setTimeout(() => { toast.classList.remove('show'); setTimeout(() => toast.remove(), 400); }, 2600);
    }
}

// Initialise
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => new AdminManager());
} else {
    new AdminManager();
}
