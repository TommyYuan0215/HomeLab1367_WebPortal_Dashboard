/**
 * =======================================================
 * 1. CORE UTILITIES & CLOCK
 * =======================================================
 */

// Format numbers (e.g., 9 -> 09)
function checkTime(i) {
    return i < 10 ? "0" + i : i;
}

// Start the real-time clock
function startTime() {
    const today = new Date();
    let h = today.getHours();
    let m = today.getMinutes();
    let s = today.getSeconds();
    
    m = checkTime(m);
    s = checkTime(s);
    
    const clock = document.getElementById('real-time-clock');
    if (clock) {
        clock.innerHTML = h + ":" + m + ":" + s;
    }
    setTimeout(startTime, 1000); 
}

// Update the "Good Morning/Evening" text
function updateGreeting() {
    const hour = new Date().getHours();
    const greetingElement = document.getElementById('greeting-text');
    let greeting = 'Welcome';

    if (hour >= 5 && hour < 12) greeting = 'Good Morning';
    else if (hour >= 12 && hour < 18) greeting = 'Good Afternoon';
    else greeting = 'Good Evening';

    if (greetingElement) {
        greetingElement.textContent = greeting;
    }
}


/**
 * =======================================================
 * 2. DATA FETCHING (Service Links)
 * =======================================================
 */

async function loadServices() {
    try {
        const possiblePaths = [
            'assets/data/services.json',
            './assets/data/services.json',
            '/assets/data/services.json'
        ];
        
        let response;
        for (const path of possiblePaths) {
            try {
                response = await fetch(path);
                if (response.ok) break;
            } catch (err) { continue; }
        }
        
        if (!response || !response.ok) {
            throw new Error(`Failed to load services.json. Status: ${response?.status || 'Network Error'}`);
        }
        
        const data = await response.json();
        
        if (!data.sections || !Array.isArray(data.sections)) {
            throw new Error('Invalid JSON: "sections" array missing');
        }
        
        renderSections(data.sections);
    } catch (error) {
        console.error('Error loading services:', error);
        showErrorMessage(error);
    }
}

function showErrorMessage(error) {
    const container = document.getElementById('sections-container');
    if (!container) return;
    
    container.innerHTML = `
        <div style="color: var(--muted); padding: 40px; text-align: center;">
            <h3 style="color: var(--accent);">⚠️ Failed to load services</h3>
            <p>${error.message}</p>
            <p style="font-size: 0.9rem; margin-top: 10px;">Check console (F12) for details.</p>
        </div>
    `;
}


/**
 * =======================================================
 * 3. SERVER STATS (Netdata Top Bar) - NEW SECTION
 * =======================================================
 */

const NETDATA_HOST = 'http://apps.homelab1367.local:19999';

async function updateServerStats() {
    const container = document.getElementById('server-stats-container');
    if (!container) return; // Stop if the navbar widget isn't in HTML yet

    try {
        // --- 1. CPU Usage ---
        // Chart: system.cpu (Percentage)
        const cpuRes = await fetch(`${NETDATA_HOST}/api/v1/data?chart=system.cpu&points=1&after=-1&group=average`);
        const cpuData = await cpuRes.json();
        const cpuVal = Math.round(cpuData.data[0]); 
        updateStatUI('cpu', cpuVal, '%');

        // --- 2. RAM Usage ---
        // Chart: system.ram (MB) -> [Free, Used, Cached, Buffers] (Indices vary, so we sum)
        const ramRes = await fetch(`${NETDATA_HOST}/api/v1/data?chart=system.ram&points=1&after=-1`);
        const ramData = await ramRes.json();
        const ramValues = ramData.data; // Array of values like [500, 2000, 100, 50]
        
        // Calculate Total & Used
        // Netdata usually sends 'used' as the second or third value, but 'total' is sum of all.
        // We assume the dimension names in `ramData.labels` tell us which is which.
        // Simplified Logic: Sum all positive numbers = Total. Find 'used' dimension index.
        const totalMem = ramValues.reduce((a, b) => a + (typeof b === 'number' ? b : 0), 0);
        
        // Find index of 'used' in labels (case-insensitive)
        const usedIndex = ramData.labels.findIndex(l => l.toLowerCase() === 'used');
        const usedMem = (usedIndex > -1) ? ramValues[usedIndex] : ramValues[1]; // Fallback to index 1

        const ramPercent = Math.round((usedMem / totalMem) * 100);
        updateStatUI('ram', ramPercent, '%');

        // --- 3. Disk Usage ---
        // Chart: disk.space (GB/MB) -> usually [avail, used, reserved]
        const diskRes = await fetch(`${NETDATA_HOST}/api/v1/data?chart=disk.space&points=1&after=-1`);
        const diskData = await diskRes.json();
        const diskValues = diskData.data;

        // Calculate Total & Used
        const totalDisk = diskValues.reduce((a, b) => a + (typeof b === 'number' ? b : 0), 0);
        const diskUsedIndex = diskData.labels.findIndex(l => l.toLowerCase() === 'used');
        const usedDiskVal = (diskUsedIndex > -1) ? diskValues[diskUsedIndex] : diskValues[1];

        const diskPercent = Math.round((usedDiskVal / totalDisk) * 100);
        const diskUsedGB = Math.round(Math.abs(usedDiskVal)); // Convert negative if needed (Netdata quirk)
        
        // Update Bar with %, but Text with GB
        updateStatUI('disk', diskPercent, 'GB', diskUsedGB);

    } catch (err) {
        // Silent fail (console log only) to avoid UI clutter
        console.warn('Netdata fetch error:', err);
    }
}

// Helper to update the DOM elements
function updateStatUI(id, percentage, unit, textOverride = null) {
    const bar = document.getElementById(`bar-${id}`);
    const text = document.getElementById(`val-${id}`);
    
    if (bar && text) {
        // Clamp percentage 0-100
        const safePercent = Math.min(Math.max(percentage, 0), 100);
        
        bar.style.width = `${safePercent}%`;
        text.innerText = textOverride !== null ? `${textOverride}${unit}` : `${percentage}${unit}`;
        
        // Dynamic Colors
        bar.className = 'stat-bar'; // Reset classes
        if (percentage > 90) bar.classList.add('danger');
        else if (percentage > 70) bar.classList.add('warning');
    }
}


/**
 * =======================================================
 * 4. HELPER FUNCTIONS (News & Formatting)
 * =======================================================
 */

function getTimeAgo(dateString) {
    const seconds = Math.floor((new Date() - new Date(dateString)) / 1000);
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + "y";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + "mo";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + "d";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + "h";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + "m";
    return "Just now";
}

function extractSource(title) {
    return title.includes(" - ") ? title.split(" - ").pop() : "News";
}

function cleanTitle(title) {
    if (title.includes(" - ")) {
        const parts = title.split(" - ");
        parts.pop();
        return parts.join(" - ");
    }
    return title;
}


/**
 * =======================================================
 * 5. RENDERING LOGIC (The Core)
 * =======================================================
 */

function renderSections(sections) {
    const container = document.getElementById('sections-container');
    if (!container) return;
    container.innerHTML = '';

    sections.forEach(section => {
        const sectionDiv = document.createElement('section');
        sectionDiv.className = 'tv-row';
        sectionDiv.setAttribute('data-section-type', section.type);
        
        // 1. Render Title
        const title = document.createElement('h3');
        title.className = 'row-title';
        title.innerHTML = `<i class="bi ${section.icon}"></i>${section.title}`;
        sectionDiv.appendChild(title);
        
        // 2. Create Content Container
        const contentContainer = document.createElement('div');
        
        // --- TYPE: MONITOR (Netdata Main Widget) ---
        // (Optional: Keep this if you still want the big gauges in the body)
        if (section.type === 'monitor') {
            contentContainer.className = 'monitor-grid'; 
            renderMonitorSection(section, contentContainer);
        } 
        // --- TYPE: NEWS (RSS) ---
        else if (section.type === 'news' && section.rssUrl) {
            contentContainer.className = 'news-grid';
            renderNewsSection(section, contentContainer);
        } 
        // --- TYPE: APPS (Favorite/Content) ---
        else {
            contentContainer.className = section.type === 'favorite' ? 'tv-row-content' : 'tv-fluid-content';
            if (section.items) {
                section.items.forEach(item => {
                    const card = section.type === 'favorite' 
                        ? createFavoriteCard(item) 
                        : createContentCard(item);
                    contentContainer.appendChild(card);
                });
            }
        }

        sectionDiv.appendChild(contentContainer);
        container.appendChild(sectionDiv);
    });
}

/**
 * Renders the Netdata Server Health Section (Big Body Widget)
 */
function renderMonitorSection(section, container) {
    if (!document.getElementById('netdata-script')) {
        const script = document.createElement('script');
        script.id = 'netdata-script';
        script.src = `${section.host}/dashboard.js`; 
        script.async = true;
        document.head.appendChild(script);
    }
    // (Existing gauge HTML code...)
    container.innerHTML = `<div class="monitor-wrapper" style="padding: 20px; color: var(--muted);">Netdata Dashboard Loaded</div>`;
}

/**
 * Renders the News Section via RSS2JSON
 */
function renderNewsSection(section, container) {
    container.innerHTML = `<div class="news-card" style="background: #222; display: flex; align-items: center; justify-content: center; color: #666;">Loading News...</div>`;

    fetch(`https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(section.rssUrl)}`)
        .then(res => res.json())
        .then(data => {
            container.innerHTML = '';
            data.items.slice(0, 8).forEach(item => {
                const sourceName = extractSource(item.title);
                const cleanHeadline = cleanTitle(item.title);
                const timeAgo = getTimeAgo(item.pubDate);
                let imageUrl = item.thumbnail || item.enclosure?.link;
                if (!imageUrl || imageUrl.length < 10) imageUrl = `https://picsum.photos/seed/${cleanHeadline.length}/400/300`;
                
                const sourceDomain = new URL(item.link).hostname;
                const faviconUrl = `https://www.google.com/s2/favicons?domain=${sourceDomain}&sz=32`;

                const card = document.createElement('a');
                card.className = 'news-card';
                card.href = item.link;
                card.target = '_blank';
                card.innerHTML = `
                    <img src="${imageUrl}" class="news-bg-image" loading="lazy" alt="News Image">
                    <div class="news-overlay">
                        <div class="news-meta">
                            <img src="${faviconUrl}" class="news-source-icon" onerror="this.style.display='none'">
                            <span>${sourceName}</span>
                            <span>• ${timeAgo}</span>
                        </div>
                        <h4 class="news-title">${cleanHeadline}</h4>
                    </div>`;
                container.appendChild(card);
            });
        })
        .catch(err => {
            console.error(err);
            container.innerHTML = `<div style="color:var(--muted); padding:20px;">Unable to load news feed.</div>`;
        });
}


/**
 * =======================================================
 * 6. CARD CREATION FACTORIES
 * =======================================================
 */

function createFavoriteCard(item) {
    const card = document.createElement('a');
    card.className = 'app-card favorite-app-card';
    card.href = item.url;
    card.target = '_blank';
    card.setAttribute('aria-label', item.title);

    const icon = document.createElement('i');
    icon.className = `bi ${item.icon} app-icon`;
    icon.style.cssText = `color: ${item.color || 'var(--accent)'}; font-size: 3rem;`;

    const title = document.createElement('div');
    title.className = 'app-title';
    title.textContent = item.title;

    card.appendChild(icon);
    card.appendChild(title);
    return card;
}

function createContentCard(item) {
    const card = document.createElement('a');
    card.className = 'app-card content-card';
    card.href = item.url;
    card.target = '_blank';
    card.setAttribute('aria-label', item.title);

    const image = document.createElement('img');
    image.src = item.image;
    image.alt = item.title;
    image.className = 'card-image';
    image.onerror = function() {
        this.src = 'https://via.placeholder.com/320x180?text=' + encodeURIComponent(item.title);
    };

    const overlay = document.createElement('div');
    overlay.className = 'card-content-overlay';
    
    let overlayContent = `<div class="overlay-title">${item.title}</div>`;
    if (item.course || item.author) {
        overlayContent += `<div class="overlay-meta">`;
        if (item.course) overlayContent += `<span class="meta-course"><i class="bi bi-journal-bookmark-fill"></i> ${item.course}</span><br>`;
        if (item.author) overlayContent += `<span class="meta-author"><i class="bi bi-person-fill"></i> ${item.author}</span>`;
        overlayContent += `</div>`;
    }
    overlay.innerHTML = overlayContent;
    card.appendChild(image);
    card.appendChild(overlay);

    if (item.subtitle) {
        const subtitle = document.createElement('div');
        subtitle.className = 'app-sub';
        subtitle.textContent = item.subtitle;
        card.appendChild(subtitle);
    }
    return card;
}


/**
 * =======================================================
 * 7. UI INTERACTIONS (Search, etc.)
 * =======================================================
 */

function updateSearchFunctionality() {
    const searchInput = document.getElementById('global-search-input');
    if (!searchInput) return;
    
    const newSearchInput = searchInput.cloneNode(true);
    searchInput.parentNode.replaceChild(newSearchInput, searchInput);
    
    newSearchInput.addEventListener('keyup', function() {
        const searchTerm = this.value.toLowerCase().trim();
        const allCards = document.querySelectorAll('.app-card');
        
        allCards.forEach(card => {
            const titleElement = card.querySelector('.app-title') || card.querySelector('.overlay-title');
            const subElement = card.querySelector('.app-sub');
            
            const titleText = titleElement ? titleElement.textContent.toLowerCase() : '';
            const subText = subElement ? subElement.textContent.toLowerCase() : '';

            const isMatch = (searchTerm.length === 0 || titleText.includes(searchTerm) || subText.includes(searchTerm));
            card.classList.toggle('hidden', !isMatch);
        });
    });
}


/**
 * =======================================================
 * 8. INITIALIZATION (Theme, Particles, Boot)
 * =======================================================
 */

(function(){
    const storageKey = 'homelab-theme-v2';
    const body = document.body;
    const themeBtn = document.getElementById('theme-toggle-btn');
    const themeIcon = document.getElementById('theme-toggle-icon');
    const githubIcon = document.getElementById('github-icon');

    // --- Particle Logic ---
    function initParticles(color){
        const root = document.getElementById('particles-js');
        if(!root) return;
        const old = root.querySelector('canvas'); 
        if(old) old.remove();

        if (typeof particlesJS !== 'undefined') {
            particlesJS('particles-js', {
                particles: {
                    number: { value: 55, density: { enable: true, value_area: 800 } },
                    color: { value: color },
                    opacity: { value: 0.08 },
                    size: { value: 3 },
                    move: { speed: 0.9 }
                },
                interactivity: { detect_on: 'canvas', events: { onhover: { enable: false } } }
            });
        }
    }

    // --- Theme Logic ---
    function setTheme(t){
        const isLight = t === 'light';
        if(isLight){ 
            body.classList.add('light-theme'); 
            if(themeIcon) { themeIcon.className = 'bi bi-sun-fill'; themeIcon.style.color = '#ffb020'; }
            if(githubIcon) githubIcon.style.color = '#111111';
            initParticles('#111111'); 
        }
        else { 
            body.classList.remove('light-theme'); 
            if(themeIcon) { themeIcon.className = 'bi bi-moon-fill'; themeIcon.style.color = 'var(--text)'; }
            if(githubIcon) githubIcon.style.color = 'var(--text)';
            initParticles('#ffffff'); 
        }
        localStorage.setItem(storageKey, t);
    }

    const saved = localStorage.getItem(storageKey) || 'dark';
    setTheme(saved);

    if (themeBtn) {
        themeBtn.addEventListener('click', function(e){ 
            e.preventDefault(); 
            setTheme(body.classList.contains('light-theme') ? 'dark' : 'light'); 
        });
    }

    // --- Boot Sequence ---
    function init() {
        loadServices();
        updateGreeting();
        updateSearchFunctionality();
        // ** START SERVER STATS POLLING **
        setInterval(updateServerStats, 2000); // Check every 2 seconds
        updateServerStats(); // Run once immediately
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();

// Start Global Clock
startTime();