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
        document.getElementById('admin-banner')?.remove();
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
        document.getElementById('admin-export-btn')?.addEventListener('click',       () => this._exportJson());
        document.getElementById('admin-exit-btn')?.addEventListener('click',         () => this.exitAdminMode());
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
                <button class="admin-section-btn" data-action="edit-section" data-sid="${sid}" title="Edit Section">
                  <i class="bi bi-pencil-fill"></i>
                </button>
                <button class="admin-section-btn danger" data-action="delete-section" data-sid="${sid}" title="Delete Section">
                  <i class="bi bi-trash3-fill"></i>
                </button>`;
            titleEl.appendChild(ctrls);
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

                const isDisabled = card.classList.contains('card-disabled');
                const overlay = document.createElement('div');
                overlay.className = 'admin-card-overlay';
                overlay.innerHTML = `
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
            });
        });

        // Event delegation — bind once on the container
        const container = document.getElementById('sections-container');
        if (container && !container._adminBound) {
            container._adminBound = true;
            container.addEventListener('click', (e) => {
                if (!this.isAdminMode) return;

                // Section buttons (edit-section / delete-section)
                const secBtn = e.target.closest('.admin-section-btn');
                if (secBtn) {
                    e.preventDefault(); e.stopPropagation();
                    const { action, sid } = secBtn.dataset;
                    if (action === 'edit-section')   this.openDrawer('edit-section', sid, null);
                    if (action === 'delete-section') this._deleteSection(sid);
                    return;
                }

                // Card control buttons (edit / toggle / delete)
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
            const p = document.getElementById('admin-icon-preview');
            if (p) p.className = `bi ${e.target.value.trim() || 'bi-app'}`;
        });

        // Icon preview (section icon)
        document.getElementById('admin-section-icon')?.addEventListener('input', (e) => {
            const p = document.getElementById('admin-section-icon-preview');
            if (p) p.className = `bi ${e.target.value.trim() || 'bi-grid'}`;
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
        const icon   = document.getElementById('admin-icon-preview');
        if (swatch) swatch.style.background = hex;
        if (icon)   icon.style.color = hex;
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
            document.getElementById('admin-field-icon').value        = item.icon        || '';
            document.getElementById('admin-field-description').value = item.description || '';
            const color = item.color || '#8a39ff';
            this._syncColor(color);
            const p = document.getElementById('admin-icon-preview');
            if (p) { p.className = `bi ${item.icon || 'bi-app'}`; p.style.color = color; }
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
        const p = document.getElementById('admin-icon-preview');
        if (p) { p.className = 'bi bi-app'; p.style.color = '#8a39ff'; }
    }

    // ── Drawer populate (sections) ─────────────────────────────
    _prefillSectionDrawer(sectionId) {
        const data    = this._getData();
        const section = data.sections.find(s => s.id === sectionId);
        if (!section) return;

        document.getElementById('admin-section-title').value  = section.title  || '';
        document.getElementById('admin-section-icon').value   = section.icon   || '';
        document.getElementById('admin-section-rssurl').value = section.rssUrl || '';

        const p = document.getElementById('admin-section-icon-preview');
        if (p) p.className = `bi ${section.icon || 'bi-grid'}`;

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
        const p = document.getElementById('admin-section-icon-preview');
        if (p) p.className = 'bi bi-grid';

        const radio = document.querySelector('input[name="admin-section-type"][value="favorite"]');
        if (radio) radio.checked = true;

        const newsField = document.querySelector('.admin-news-url-field');
        if (newsField) newsField.style.display = 'none';
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
