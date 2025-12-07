// 🕑 GLOBAL CLOCK LOGIC (Must be outside the IIFE for setTimeout)
// =======================================================

function checkTime(i) {
    if (i < 10) {i = "0" + i};
    return i;
}

function startTime() {
    const today = new Date();
    let h = today.getHours();
    let m = today.getMinutes();
    let s = today.getSeconds();
    m = checkTime(m);
    s = checkTime(s);
    document.getElementById('real-time-clock').innerHTML = h + ":" + m + ":" + s;
    setTimeout(startTime, 1000); 
}

// -------------------------------------------------------
// 📦 DYNAMIC CONTENT LOADING FROM JSON
// -------------------------------------------------------

async function loadServices() {
    try {
        // Try different possible paths
        let response;
        const possiblePaths = [
            'assets/data/services.json',      // ← Updated path
            './assets/data/services.json',
            '/assets/data/services.json'
        ];
        
        let lastError;
        for (const path of possiblePaths) {
            try {
                response = await fetch(path);
                if (response.ok) {
                    break;
                }
            } catch (err) {
                lastError = err;
                continue;
            }
        }
        
        if (!response || !response.ok) {
            throw new Error(`Failed to load assets/data/services.json. Make sure you're running a local web server. Status: ${response?.status || 'Network Error'}`);
        }
        
        const data = await response.json();
        
        // Validate JSON structure
        if (!data.sections || !Array.isArray(data.sections)) {
            throw new Error('Invalid JSON structure: "sections" array not found');
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
    
    const errorHTML = `
        <div style="color: var(--muted); padding: 40px; text-align: center; max-width: 800px; margin: 0 auto;">
            <h3 style="color: var(--accent); margin-bottom: 20px;">⚠️ Failed to load services</h3>
            <p style="margin-bottom: 15px;"><strong>Error:</strong> ${error.message}</p>
            <div style="background: var(--card-dark); padding: 20px; border-radius: 8px; margin-top: 20px; text-align: left; font-size: 0.9rem;">
                <p style="margin-bottom: 10px;"><strong>📋 To fix this issue:</strong></p>
                <ol style="margin-left: 20px; line-height: 1.8;">
                    <li>Make sure <code>assets/data/services.json</code> exists in your web directory</li>
                    <li>Ensure Apache/Nginx has read permissions for the file</li>
                    <li>Check browser console (F12) for more details</li>
                    <li>Verify the file path matches: <code>assets/data/services.json</code></li>
                </ol>
                <div style="margin-top: 20px; padding-top: 15px; border-top: 1px solid var(--glass);">
                    <p style="margin-bottom: 10px;"><strong>🔧 Apache/Nginx Setup:</strong></p>
                    <p style="margin-bottom: 10px; font-size: 0.9rem;">Make sure your files are in the web server directory:</p>
                    <ul style="margin-left: 20px; line-height: 1.8; font-size: 0.9rem;">
                        <li><strong>Apache:</strong> Usually <code>/var/www/html/</code> or your virtual host directory</li>
                        <li><strong>Nginx:</strong> Usually <code>/var/www/html/</code> or <code>/usr/share/nginx/html/</code></li>
                    </ul>
                    <p style="margin-top: 15px; font-size: 0.85rem; color: var(--accent);">
                        💡 Access via: <code>http://apps.homelab1367.local</code>
                    </p>
                </div>
            </div>
        </div>
    `;
    
    container.innerHTML = errorHTML;
}

// --- Helper Functions for News ---

// 1. Calculate "2h ago", "5m ago"
function getTimeAgo(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now - date) / 1000);
    
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

// 2. Extract Source from Google News Title (e.g., "Headline - CNN" -> returns "CNN")
function extractSource(title) {
    const separator = " - ";
    if (title.includes(separator)) {
        const parts = title.split(separator);
        return parts[parts.length - 1]; // Return the last part
    }
    return "News";
}

// 3. Clean Headline (Remove the source from the title)
function cleanTitle(title) {
    const separator = " - ";
    if (title.includes(separator)) {
        const parts = title.split(separator);
        parts.pop(); // Remove the source
        return parts.join(separator);
    }
    return title;
}

// --- Modified Render Function ---

function renderSections(sections) {
    const container = document.getElementById('sections-container');
    if (!container) return;
    container.innerHTML = '';

    sections.forEach(section => {
        const sectionDiv = document.createElement('section');
        sectionDiv.className = 'tv-row';

        sectionDiv.setAttribute('data-section-type', section.type);
        
        // Title
        const title = document.createElement('h3');
        title.className = 'row-title';
        title.innerHTML = `<i class="bi ${section.icon}"></i>${section.title}`;
        
        // Container
        const contentContainer = document.createElement('div');

        // CHECK: Is this the News section?
        if (section.type === 'news' && section.rssUrl) {
            
            // Use the NEW Grid Layout for news
            contentContainer.className = 'news-grid'; 
            
            // Render Loading State
            contentContainer.innerHTML = `
                <div class="news-card" style="background: #222; display: flex; align-items: center; justify-content: center; color: #666;">
                    Loading News...
                </div>`;

            // Fetch Data
            fetch(`https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(section.rssUrl)}`)
                .then(res => res.json())
                .then(data => {
                    contentContainer.innerHTML = ''; // Clear loading
                    
                    // Display up to 8 news items
                    data.items.slice(0, 8).forEach(item => {
                        const sourceName = extractSource(item.title);
                        const cleanHeadline = cleanTitle(item.title);
                        const timeAgo = getTimeAgo(item.pubDate);
                        
                        // Try to find an image (enclosure or thumbnail)
                        // Note: Free RSS feeds often lack good images, we use a fallback if missing
                        let imageUrl = item.thumbnail || item.enclosure?.link;
                        
                        // Fallback logic for Google News specifically (which often hides images)
                        if (!imageUrl || imageUrl.length < 10) {
                            // Use a random abstract image for variety if no real image found
                             imageUrl = `https://picsum.photos/seed/${cleanHeadline.length}/400/300`;
                        }

                        // Try to fetch favicon (Icon of the news source)
                        const sourceDomain = new URL(item.link).hostname;
                        const faviconUrl = `https://www.google.com/s2/favicons?domain=${sourceDomain}&sz=32`;

                        // Create the BING-STYLE Card
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
                            </div>
                        `;
                        contentContainer.appendChild(card);
                    });
                })
                .catch(err => {
                    console.error(err);
                    contentContainer.innerHTML = `<div style="color:var(--muted); padding:20px;">Unable to load news feed.</div>`;
                });

        } else {
            // Standard Horizontal Layout for Apps
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

        sectionDiv.appendChild(title);
        sectionDiv.appendChild(contentContainer);
        container.appendChild(sectionDiv);
    });
}

function createSectionElement(section) {
    const sectionDiv = document.createElement('section');
    sectionDiv.className = 'tv-row';
    sectionDiv.setAttribute('data-section-id', section.id);

    // Create section title
    const title = document.createElement('h3');
    title.className = 'row-title';
    title.innerHTML = `<i class="bi ${section.icon}"></i>${section.title}`;

    // Create content container
    const contentContainer = document.createElement('div');
    contentContainer.className = section.type === 'favorite' ? 'tv-row-content' : 'tv-fluid-content';
    contentContainer.id = `${section.id}-container`;

    // Render items
    if (section.items && Array.isArray(section.items)) {
        section.items.forEach(item => {
            const card = section.type === 'favorite' 
                ? createFavoriteCard(item) 
                : createContentCard(item);
            contentContainer.appendChild(card);
        });
    }

    sectionDiv.appendChild(title);
    sectionDiv.appendChild(contentContainer);

    return sectionDiv;
}

function createFavoriteCard(item) {
    const card = document.createElement('a');
    card.className = 'app-card favorite-app-card';
    card.href = item.url;
    card.target = '_blank';
    card.setAttribute('aria-label', item.title);

    const icon = document.createElement('i');
    icon.className = `bi ${item.icon} app-icon`;
    icon.style.cssText = `color: ${item.color || 'var(--accent)'}; font-size: 3rem;`;
    icon.setAttribute('aria-hidden', 'true');

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

    // --- START OF CHANGES ---
    const overlay = document.createElement('div');
    overlay.className = 'card-content-overlay';
    
    // We create a container for the text to handle the new lines neatly
    let overlayContent = `<div class="overlay-title">${item.title}</div>`;
    
    if (item.course || item.author) {
        overlayContent += `<div class="overlay-meta">`;
        if (item.course) overlayContent += `<span class="meta-course"><i class="bi bi-journal-bookmark-fill"></i> ${item.course}</span><br>`;
        if (item.author) overlayContent += `<span class="meta-author"><i class="bi bi-person-fill"></i> ${item.author}</span>`;
        overlayContent += `</div>`;
    }
    
    overlay.innerHTML = overlayContent;
    // --- END OF CHANGES ---

    const subtitle = document.createElement('div');
    subtitle.className = 'app-sub';
    subtitle.textContent = item.subtitle || '';

    card.appendChild(image);
    card.appendChild(overlay);
    
    if (item.subtitle) {
        card.appendChild(subtitle);
    }

    return card;
}

function updateSearchFunctionality() {
    // Re-attach search functionality to newly rendered cards
    const searchInput = document.getElementById('global-search-input');
    if (!searchInput) return;
    
    // Remove all existing listeners by cloning the input
    const newSearchInput = searchInput.cloneNode(true);
    searchInput.parentNode.replaceChild(newSearchInput, searchInput);
    
    newSearchInput.addEventListener('keyup', function() {
        const searchTerm = this.value.toLowerCase().trim();
        const allCards = document.querySelectorAll('.app-card');
        
        allCards.forEach(card => {
            const titleElement = card.querySelector('.app-title');
            const subElement = card.querySelector('.app-sub');
            
            const titleText = titleElement ? titleElement.textContent.toLowerCase() : '';
            const subText = subElement ? subElement.textContent.toLowerCase() : '';

            const isMatch = (
                searchTerm.length === 0 ||
                titleText.includes(searchTerm) ||
                subText.includes(searchTerm)
            );

            card.classList.toggle('hidden', !isMatch);
        });
    });
}

// -------------------------------------------------------

(function(){
    const storageKey = 'homelab-theme-v2';
    const body = document.body;
    const themeBtn = document.getElementById('theme-toggle-btn');
    const themeIcon = document.getElementById('theme-toggle-icon');
    const githubIcon = document.getElementById('github-icon');

    // --- Theme and Particle Logic (Existing) ---
    function initParticles(color){
        const root = document.getElementById('particles-js');
        const old = root.querySelector('canvas'); 
        if(old) old.remove();

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

    function setTheme(t){
        const isLight = t === 'light';
        if(isLight){ 
            body.classList.add('light-theme'); 
            themeIcon.className = 'bi bi-sun-fill'; 
            themeIcon.style.color = '#ffb020'; 
            githubIcon.style.color = '#111111';
            initParticles('#111111'); 
        }
        else { 
            body.classList.remove('light-theme'); 
            themeIcon.className = 'bi bi-moon-fill'; 
            themeIcon.style.color = 'var(--text)'; 
            githubIcon.style.color = 'var(--text)';
            initParticles('#ffffff'); 
        }
        localStorage.setItem(storageKey, t);
    }

    const saved = localStorage.getItem(storageKey) || 'dark';
    setTheme(saved);

    themeBtn.addEventListener('click', function(e){ 
        e.preventDefault(); 
        setTheme(body.classList.contains('light-theme') ? 'dark' : 'light'); 
    });

    // Load services when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', loadServices);
    } else {
        loadServices();
    }
})();

startTime();