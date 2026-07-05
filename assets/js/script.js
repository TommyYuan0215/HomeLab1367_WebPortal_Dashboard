const APP_VERSION = '2.3.13';

// 🕑 GLOBAL CLOCK LOGIC (Must be outside the IIFE for setTimeout)
// =======================================================

function checkTime(i) {
    if (i < 10) {i = "0" + i};
    return i;
}

function startTime() {
    const today = new Date();
    const clock = document.getElementById('real-time-clock');

    // Respect show-clock setting
    const showClock = localStorage.getItem('homelab-show-clock');
    if (showClock === 'false') {
        if (clock) clock.style.display = 'none';
        setTimeout(startTime, 1000);
        return;
    }
    if (clock) clock.style.display = '';

    // Read format preference: boolean toggle (true = 12hr, false/null = 24hr)
    const fmt12 = localStorage.getItem('homelab-clock-format') === 'true';
    const hideSeconds = localStorage.getItem('homelab-hide-seconds') === 'true';

    let h = today.getHours();
    let m = today.getMinutes();
    let s = today.getSeconds();
    m = checkTime(m);
    s = checkTime(s);

    let timeStr;
    if (fmt12) {
        const period = h >= 12 ? 'PM' : 'AM';
        let h12 = h % 12;
        if (h12 === 0) h12 = 12;
        timeStr = hideSeconds
            ? h12 + ':' + m + ' ' + period
            : h12 + ':' + m + ':' + s + ' ' + period;
    } else {
        h = checkTime(h);
        timeStr = hideSeconds
            ? h + ':' + m
            : h + ':' + m + ':' + s;
    }

    // Toggle compact class so min-width adjusts (no layout shift)
    if (clock) {
        clock.innerHTML = timeStr;
        clock.classList.toggle('clock-no-seconds', hideSeconds);
    }
    setTimeout(startTime, 1000);
}

// ⛅ WEATHER LOGIC — Open-Meteo (no API key)
// =======================================================

const WMO_ICONS = {
    0:  'bi-sun-fill',
    1:  'bi-sun-fill',
    2:  'bi-cloud-sun-fill',
    3:  'bi-clouds-fill',
    45: 'bi-cloud-haze2-fill',
    48: 'bi-cloud-haze2-fill',
    51: 'bi-cloud-drizzle-fill',
    53: 'bi-cloud-drizzle-fill',
    55: 'bi-cloud-drizzle-fill',
    61: 'bi-cloud-rain-fill',
    63: 'bi-cloud-rain-fill',
    65: 'bi-cloud-rain-heavy-fill',
    71: 'bi-cloud-snow-fill',
    73: 'bi-cloud-snow-fill',
    75: 'bi-cloud-snow-fill',
    80: 'bi-cloud-rain-fill',
    81: 'bi-cloud-rain-fill',
    82: 'bi-cloud-rain-heavy-fill',
    95: 'bi-cloud-lightning-rain-fill',
    96: 'bi-cloud-lightning-rain-fill',
    99: 'bi-cloud-lightning-rain-fill',
};

const WMO_DESC = {
    0: 'Clear Sky', 1: 'Mainly Clear', 2: 'Partly Cloudy', 3: 'Overcast',
    45: 'Foggy', 48: 'Icy Fog',
    51: 'Light Drizzle', 53: 'Moderate Drizzle', 55: 'Dense Drizzle',
    61: 'Slight Rain', 63: 'Moderate Rain', 65: 'Heavy Rain',
    71: 'Slight Snow', 73: 'Moderate Snow', 75: 'Heavy Snow',
    80: 'Slight Showers', 81: 'Moderate Showers', 82: 'Violent Showers',
    95: 'Thunderstorm', 96: 'Thunderstorm w/ Hail', 99: 'Heavy Thunderstorm',
};

// Cached weather data for the popup
let _weatherCache = null;

function getWeatherIcon(code) {
    if (WMO_ICONS[code]) return WMO_ICONS[code];
    if (code >= 51 && code <= 57) return 'bi-cloud-drizzle-fill';
    if (code >= 61 && code <= 67) return 'bi-cloud-rain-fill';
    if (code >= 71 && code <= 77) return 'bi-cloud-snow-fill';
    if (code >= 80 && code <= 82) return 'bi-cloud-rain-fill';
    if (code >= 85 && code <= 86) return 'bi-cloud-snow-fill';
    if (code >= 95) return 'bi-cloud-lightning-rain-fill';
    return 'bi-cloud-sun-fill';
}

function getWeatherDesc(code) {
    return WMO_DESC[code] || 'Unknown';
}

function getWindDir(deg) {
    const dirs = ['N','NE','E','SE','S','SW','W','NW'];
    return dirs[Math.round(deg / 45) % 8];
}

async function reverseGeocode(lat, lon) {
    try {
        const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&zoom=10`;
        const res = await fetch(url, { headers: { 'Accept-Language': 'en' } });
        if (!res.ok) return null;
        const data = await res.json();
        const addr = data.address || {};
        // Return city/town/village/county — first available
        return addr.city || addr.town || addr.village || addr.county || addr.state || null;
    } catch (e) {
        return null;
    }
}

function updateWeatherPopup() {
    const popup = document.getElementById('weather-popup');
    if (!popup || !_weatherCache) return;
    const d = _weatherCache;

    popup.innerHTML = `
        <div class="wp-header">
            <div class="wp-location">
                <i class="bi bi-geo-alt-fill"></i>
                <span>${d.location || 'Current Location'}</span>
            </div>
            <div class="wp-updated">Updated ${d.updatedAt}</div>
        </div>
        <div class="wp-main">
            <i class="bi ${d.icon} wp-big-icon"></i>
            <div class="wp-temp-block">
                <span class="wp-temp">${d.temp}°C</span>
                <span class="wp-desc">${d.desc}</span>
            </div>
        </div>
        <div class="wp-grid">
            <div class="wp-stat">
                <i class="bi bi-thermometer-half"></i>
                <span class="wp-stat-label">Feels Like</span>
                <span class="wp-stat-val">${d.feelsLike}°C</span>
            </div>
            <div class="wp-stat">
                <i class="bi bi-droplet-fill"></i>
                <span class="wp-stat-label">Humidity</span>
                <span class="wp-stat-val">${d.humidity}%</span>
            </div>
            <div class="wp-stat">
                <i class="bi bi-wind"></i>
                <span class="wp-stat-label">Wind</span>
                <span class="wp-stat-val">${d.windSpeed} km/h ${d.windDir}</span>
            </div>
            <div class="wp-stat">
                <i class="bi bi-cloud-rain"></i>
                <span class="wp-stat-label">Precip.</span>
                <span class="wp-stat-val">${d.precip} mm</span>
            </div>
            <div class="wp-stat">
                <i class="bi bi-eye-fill"></i>
                <span class="wp-stat-label">UV Index</span>
                <span class="wp-stat-val">${d.uv}</span>
            </div>
            <div class="wp-stat">
                <i class="bi bi-compass"></i>
                <span class="wp-stat-label">Coords</span>
                <span class="wp-stat-val">${d.lat.toFixed(2)}, ${d.lon.toFixed(2)}</span>
            </div>
        </div>
    `;
}

async function fetchWeather(lat, lon) {
    try {
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
            `&current=temperature_2m,apparent_temperature,weather_code,relative_humidity_2m,` +
            `wind_speed_10m,wind_direction_10m,precipitation,uv_index` +
            `&temperature_unit=celsius&wind_speed_unit=kmh&timezone=auto`;
        const res = await fetch(url);
        if (!res.ok) return;
        const data = await res.json();
        const c = data.current;
        const code = c.weather_code;
        const now = new Date();
        const updatedAt = now.getHours().toString().padStart(2,'0') + ':' + now.getMinutes().toString().padStart(2,'0');

        // Update navbar widget
        const iconEl = document.getElementById('weather-icon');
        const tempEl = document.getElementById('weather-temp');
        if (iconEl) iconEl.className = 'bi ' + getWeatherIcon(code);
        if (tempEl) tempEl.textContent = Math.round(c.temperature_2m) + '°C';

        // Update mobile hamburger menu weather elements if they exist
        const mIconEl = document.getElementById('m-weather-icon');
        const mTempEl = document.querySelector('#mobile-menu-status-panel #m-weather-temp');
        if (mIconEl) mIconEl.className = 'bi ' + getWeatherIcon(code);
        if (mTempEl) mTempEl.textContent = Math.round(c.temperature_2m) + '°C';

        // Fetch location name if not yet cached
        let location = _weatherCache?.location || null;
        if (!location) {
            location = await reverseGeocode(lat, lon);
        }

        // Store in cache
        _weatherCache = {
            temp:      Math.round(c.temperature_2m),
            feelsLike: Math.round(c.apparent_temperature),
            humidity:  Math.round(c.relative_humidity_2m),
            windSpeed: Math.round(c.wind_speed_10m),
            windDir:   getWindDir(c.wind_direction_10m),
            precip:    (c.precipitation ?? 0).toFixed(1),
            uv:        (c.uv_index ?? '--'),
            code,
            icon:      getWeatherIcon(code),
            desc:      getWeatherDesc(code),
            location,
            lat,
            lon,
            updatedAt,
        };

        updateWeatherPopup();
    } catch (e) {
        console.warn('Weather fetch failed:', e);
    }
}

function createWeatherPopup() {
    let popup = document.getElementById('weather-popup');
    if (popup) return popup;
    popup = document.createElement('div');
    popup.id = 'weather-popup';
    popup.className = 'weather-popup';
    popup.innerHTML = `<div class="wp-loading"><i class="bi bi-arrow-repeat wp-spin"></i> Fetching weather…</div>`;
    document.body.appendChild(popup);
    return popup;
}

function positionWeatherPopup() {
    const trigger = document.getElementById('nav-weather');
    const popup   = document.getElementById('weather-popup');
    if (!trigger || !popup) return;
    const rect = trigger.getBoundingClientRect();
    // Position below the weather widget, right-aligned
    popup.style.top  = (rect.bottom + 10) + 'px';
    popup.style.right = (window.innerWidth - rect.right) + 'px';
    popup.style.left  = 'auto';
}

function initWeather() {
    const weatherEl = document.getElementById('nav-weather');
    const showWeather = localStorage.getItem('homelab-show-weather');

    if (showWeather === 'false') {
        if (weatherEl) weatherEl.style.display = 'none';
        return;
    }
    if (weatherEl) weatherEl.style.display = '';

    if (!navigator.geolocation) {
        if (weatherEl) weatherEl.style.display = 'none';
        return;
    }

    // Create popup once
    const popup = createWeatherPopup();

    // Hover show/hide
    if (weatherEl && !weatherEl._weatherHoverBound) {
        weatherEl._weatherHoverBound = true;

        weatherEl.addEventListener('mouseenter', () => {
            if (_weatherCache) updateWeatherPopup();
            positionWeatherPopup();
            popup.classList.add('visible');
        });

        weatherEl.addEventListener('mouseleave', (e) => {
            // Keep open if moving into popup
            if (popup.contains(e.relatedTarget)) return;
            popup.classList.remove('visible');
        });

        popup.addEventListener('mouseleave', (e) => {
            if (weatherEl.contains(e.relatedTarget)) return;
            popup.classList.remove('visible');
        });
    }

    navigator.geolocation.getCurrentPosition(
        (pos) => {
            fetchWeather(pos.coords.latitude, pos.coords.longitude);
            setInterval(() => fetchWeather(pos.coords.latitude, pos.coords.longitude), 600000);
        },
        () => {
            if (weatherEl) weatherEl.style.display = 'none';
        },
        { timeout: 8000 }
    );
}


// 🖥️ SERVER STATUS LOGIC — CPU, RAM, Network & Services
// =======================================================

let _statusCache = null;

// In-memory registry for service reachability status
let _serviceStatusMap = {};

async function checkServiceStatus(url, title) {
    // Resolve URL through smart resolver to handle local/public domains
    const targetUrl = window.resolveServiceUrl ? window.resolveServiceUrl(url) : url;
    
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3500); // 3.5 seconds timeout

        // We use fetch with 'no-cors' mode. Even if CORS blocks reading the response body,
        // a successful TCP connection/HTTP response will resolve, whereas offline services
        // will throw a network/TypeError/Abort error.
        const response = await fetch(targetUrl, {
            method: 'GET',
            mode: 'no-cors',
            cache: 'no-cache',
            signal: controller.signal
        });
        clearTimeout(timeoutId);
        
        // In no-cors mode, type is "opaque" and status is 0. If we got here without throwing,
        // it means the host answered. It is Online.
        _serviceStatusMap[title] = 'Online';
    } catch (e) {
        _serviceStatusMap[title] = 'Offline';
    }
}

async function checkAllServicesStatus() {
    if (!window._servicesData || !window._servicesData.sections) return;
    
    const promises = [];
    window._servicesData.sections.forEach(sec => {
        if (sec.items && Array.isArray(sec.items)) {
            sec.items.forEach(item => {
                // Initialize in map as 'Checking' if not present
                if (!_serviceStatusMap[item.title]) {
                    _serviceStatusMap[item.title] = 'Checking';
                }
                promises.push(checkServiceStatus(item.url, item.title));
            });
        }
    });

    await Promise.all(promises);
    // Re-generate status stats and update widget/popup
    generateSimulatedStatus();
    updateStatusWidget();
}

function generateSimulatedStatus() {
    const cpu = Math.floor(15 + Math.random() * 45); // 15% - 60%
    const ram = Math.floor(40 + Math.random() * 25); // 40% - 65%
    const temp = Math.floor(42 + Math.random() * 12); // 42°C - 54°C
    const networkRx = (Math.random() * 12).toFixed(1); // MB/s
    const networkTx = (Math.random() * 4).toFixed(1); // MB/s
    
    // Extract actual services injected in window._servicesData
    let services = [];
    if (window._servicesData && window._servicesData.sections) {
        window._servicesData.sections.forEach(sec => {
            if (sec.items && Array.isArray(sec.items)) {
                sec.items.forEach(item => {
                    // Extract domain/host from URL
                    let domain = 'localhost';
                    try {
                        const parsedUrl = new URL(item.url);
                        domain = parsedUrl.hostname;
                        // Clean subdomains for local homelab domains if preferred
                        // e.g. web.homelab1367.internal -> homelab1367.internal
                        if (domain.endsWith('.homelab1367.internal')) {
                            domain = 'homelab1367.internal';
                        } else if (domain.endsWith('.homelab1367.local')) {
                            domain = 'homelab1367.local';
                        }
                    } catch (e) {}

                    // Get reachability status from async checker (default to Checking/Online)
                    const status = _serviceStatusMap[item.title] || 'Checking';

                    services.push({
                        name: item.title,
                        domain: domain,
                        status: status
                    });
                });
            }
        });
    }

    // Fallback if no services are loaded yet
    if (services.length === 0) {
        services = [
            { name: 'IdealHub Dashboard', domain: 'homelab1367.internal', status: 'Online' }
        ];
    }

    const activeServices = services.filter(s => s.status === 'Online').length;

    _statusCache = {
        cpu,
        ram,
        temp,
        netRx: networkRx,
        netTx: networkTx,
        services,
        activeServices,
        totalServices: services.length,
        uptime: '12 days, 4 hours'
    };
}

function updateStatusWidget() {
    const statusText = document.getElementById('status-text');
    const statusIcon = document.getElementById('status-icon');
    if (!_statusCache) return;

    if (statusText) statusText.textContent = _statusCache.cpu + '%';
    
    if (statusIcon) {
        if (_statusCache.cpu > 75) {
            statusIcon.className = 'bi bi-cpu-fill text-danger';
        } else if (_statusCache.cpu > 50) {
            statusIcon.className = 'bi bi-cpu-fill text-warning';
        } else {
            statusIcon.className = 'bi bi-cpu-fill';
        }
    }

    // Sync to mobile status panel if active
    const mCpu = document.getElementById('m-status-cpu');
    const mRam = document.getElementById('m-status-ram');
    const mTemp = document.getElementById('m-status-temp');
    if (mCpu) mCpu.textContent = _statusCache.cpu + '%';
    if (mRam) mRam.textContent = _statusCache.ram + '%';
    if (mTemp) mTemp.textContent = _statusCache.temp + '°C';

    updateStatusPopup();
}

function updateStatusPopup() {
    const popup = document.getElementById('status-popup');
    if (!popup || !_statusCache) return;
    const d = _statusCache;

    let servicesHtml = '';
    d.services.forEach(s => {
        let dotClass = 'text-danger';
        if (s.status === 'Online') {
            dotClass = 'text-success';
        } else if (s.status === 'Checking') {
            dotClass = 'text-muted opacity-50';
        }

        const isChecking = s.status === 'Checking' ? ' <small class="text-muted">(checking…)</small>' : '';

        servicesHtml += `
            <div class="sp-service-row">
                <span class="sp-service-name">
                    <i class="bi bi-circle-fill ${dotClass}" style="font-size: 0.55rem; margin-right: 6px;"></i>
                    ${s.name}${isChecking}
                </span>
                <span class="sp-service-port">${s.domain}</span>
            </div>
        `;
    });

    popup.innerHTML = `
        <div class="sp-header">
            <div class="sp-title">
                <i class="bi bi-hdd-network-fill"></i>
                <span>${window.location.hostname === 'localhost' ? 'homelab1367.internal' : window.location.hostname}</span>
            </div>
            <div class="sp-uptime">Uptime: ${d.uptime}</div>
        </div>
        <div class="sp-grid">
            <div class="sp-stat">
                <i class="bi bi-cpu-fill"></i>
                <span class="sp-stat-label">CPU Load</span>
                <span class="sp-stat-val">${d.cpu}%</span>
            </div>
            <div class="sp-stat">
                <i class="bi bi-memory"></i>
                <span class="sp-stat-label">RAM Usage</span>
                <span class="sp-stat-val">${d.ram}%</span>
            </div>
            <div class="sp-stat">
                <i class="bi bi-thermometer-high"></i>
                <span class="sp-stat-label">CPU Temp</span>
                <span class="sp-stat-val">${d.temp}°C</span>
            </div>
        </div>
        <div class="sp-net-speed">
            <div class="sp-net-item">
                <i class="bi bi-arrow-down-short text-success"></i> Download: <span>${d.netRx} MB/s</span>
            </div>
            <div class="sp-net-item">
                <i class="bi bi-arrow-up-short text-primary"></i> Upload: <span>${d.netTx} MB/s</span>
            </div>
        </div>
        <div class="sp-services-header">
            <i class="bi bi-grid-fill"></i>
            <span>Services (${d.activeServices}/${d.totalServices} Up)</span>
        </div>
        <div class="sp-services-list">
            ${servicesHtml}
        </div>
    `;
}

function createStatusPopup() {
    let popup = document.getElementById('status-popup');
    if (popup) return popup;
    popup = document.createElement('div');
    popup.id = 'status-popup';
    popup.className = 'status-popup';
    popup.innerHTML = `<div class="wp-loading"><i class="bi bi-arrow-repeat wp-spin"></i> Loading system status…</div>`;
    document.body.appendChild(popup);
    return popup;
}

function positionStatusPopup() {
    const trigger = document.getElementById('nav-status');
    const popup   = document.getElementById('status-popup');
    if (!trigger || !popup) return;
    const rect = trigger.getBoundingClientRect();
    popup.style.top  = (rect.bottom + 10) + 'px';
    popup.style.right = (window.innerWidth - rect.right) + 'px';
    popup.style.left  = 'auto';
}

function initServerStatus() {
    const statusEl = document.getElementById('nav-status');
    const showStatus = localStorage.getItem('homelab-show-status');

    if (showStatus === 'false') {
        if (statusEl) statusEl.style.display = 'none';
        return;
    }
    if (statusEl) statusEl.style.display = '';

    const popup = createStatusPopup();

    if (statusEl && !statusEl._statusHoverBound) {
        statusEl._statusHoverBound = true;

        statusEl.addEventListener('mouseenter', () => {
            if (_statusCache) updateStatusPopup();
            positionStatusPopup();
            popup.classList.add('visible');
        });

        statusEl.addEventListener('mouseleave', (e) => {
            if (popup.contains(e.relatedTarget)) return;
            popup.classList.remove('visible');
        });

    popup.addEventListener('mouseleave', (e) => {
            if (statusEl.contains(e.relatedTarget)) return;
            popup.classList.remove('visible');
        });
    }

    // Refresh simulation details and run reachability checks
    generateSimulatedStatus();
    updateStatusWidget();
    checkAllServicesStatus();
    
    if (!window._statusIntervalId) {
        window._statusIntervalId = setInterval(() => {
            generateSimulatedStatus();
            updateStatusWidget();
        }, 4000);
    }

    // Run active reachability checks every 15 seconds
    if (!window._pingIntervalId) {
        window._pingIntervalId = setInterval(() => {
            checkAllServicesStatus();
        }, 15000);
    }
}



// ☀️ GREETING LOGIC
// =======================================================

function updateGreeting() {
    const hour = new Date().getHours();
    const greetingElement = document.getElementById('greeting-text'); // Ensure your HTML <h1> has this ID
    let greeting = 'Welcome';

    if (hour >= 5 && hour < 12) {
        greeting = 'Good Morning';
    } else if (hour >= 12 && hour < 18) {
        greeting = 'Good Afternoon';
    } else {
        greeting = 'Good Evening';
    }

    if (greetingElement) {
        greetingElement.textContent = greeting;
    }
}

// -------------------------------------------------------
// 🔗 SMART URL RESOLVER
// Handles three access modes automatically:
//   1. LAN IP       (e.g. 192.168.0.227)
//   2. Internal DNS (e.g. web.homelab1367.internal)
//   3. Public host  (e.g. ideahub.eu1.netbird.services)
// -------------------------------------------------------

(function () {
    /**
     * Returns true if `host` looks like an IPv4 or IPv6 address
     * (rather than a hostname like apps.homelab1367.internal).
     */
    function isIPAddress(host) {
        // IPv4: four groups of digits separated by dots
        if (/^\d{1,3}(\.\d{1,3}){3}$/.test(host)) return true;
        // IPv6: contains colons (simplified check)
        if (host.startsWith('[') || host.includes(':')) return true;
        // localhost
        if (host === 'localhost') return true;
        return false;
    }

    /**
     * Rewrites a URL from services.json so it works correctly across
     * all three access modes: LAN IP, internal hostname, public hostname.
     *
     * @param {string} rawUrl      - The URL from services.json
     * @param {string} [proxyPath] - Optional subpath (e.g. "/photo") for port-based
     *                               services when accessed from an external public host.
     *                               Configured per-item in services.json as "proxyPath".
     *
     * Rewrite rules:
     *
     *  [LAN IP - e.g. 192.168.0.227 or localhost]
     *    web.homelab1367.internal/path  → 192.168.0.227/path
     *    web.homelab1367.internal:PORT  → 192.168.0.227:PORT  (port accessible on LAN)
     *
     *  [Internal DNS - e.g. web.homelab1367.internal]
     *    All URLs → unchanged (local DNS resolves everything)
     *
     *  [External/public host - e.g. ideahub.eu1.netbird.services]
     *    web.homelab1367.internal/path  → publichost/path       (Nginx reverse-proxies)
     *    web.homelab1367.internal:PORT  → publichost/proxyPath  (Nginx subpath proxy)
     *    Other hosts (adguard, router…) → unchanged
     */
    window.resolveServiceUrl = function (rawUrl, proxyPath, altUrl) {
        const currentHost = window.location.hostname;

        // ── FAST PATH: IP access + altUrl provided ───────────────────────
        // If the dashboard is open via a raw IP address and the service has
        // an explicit IP-based alternative URL, use it directly — no rewrite needed.
        if (isIPAddress(currentHost) && altUrl) {
            return altUrl;
        }

        let parsed;
        try {
            parsed = new URL(rawUrl);
        } catch (e) {
            return rawUrl;
        }

        // Only rewrite URLs pointing at known internal LAMP/homelab hostnames
        const INTERNAL_HOSTS = ['web.homelab1367.internal', 'apps.homelab1367.internal'];
        if (!INTERNAL_HOSTS.includes(parsed.hostname)) return rawUrl;

        // ── CASE 1: LAN IP access (e.g. 192.168.0.221) ─────────────────
        if (isIPAddress(currentHost)) {
            const scheme = parsed.protocol;
            if (parsed.port) {
                // Port-based service: swap host to IP, keep the port (LAN can reach it)
                return `${scheme}//${currentHost}:${parsed.port}${parsed.pathname}${parsed.search}${parsed.hash}`;
            } else {
                // Path-based service: swap host to IP
                const currentPort = window.location.port ? `:${window.location.port}` : '';
                return `${scheme}//${currentHost}${currentPort}${parsed.pathname}${parsed.search}${parsed.hash}`;
            }
        }

        // ── CASE 2: Internal hostname (*.homelab1367.*) ─────────────────
        const isInternalHost = currentHost.endsWith('.homelab1367.internal') ||
                               currentHost.endsWith('.homelab1367.local')    ||
                               currentHost === 'web.homelab1367.internal'    ||
                               currentHost === 'apps.homelab1367.internal';
        if (isInternalHost) {
            return rawUrl; // Local DNS resolves everything — use as-is
        }

        // ── CASE 3: External / public hostname (Netbird, Cloudflare…) ───
        if (parsed.port) {
            // Port-based service — the port is NOT directly exposed through the public proxy.
            // If a proxyPath is defined, route via Nginx subpath location block.
            // Otherwise, fall back to the public base URL so the link stays on the
            // current host instead of leaking an unreachable internal address.
            if (proxyPath) {
                return `${window.location.origin}${proxyPath}`;
            }
            return window.location.origin; // No proxyPath — follow the public base URL
        } else {
            // Path-based service — rewrite to current public host + same path
            return `${window.location.origin}${parsed.pathname}${parsed.search}${parsed.hash}`;
        }
    };
}());

// -------------------------------------------------------
// 📦 DYNAMIC CONTENT LOADING FROM JSON
// -------------------------------------------------------

async function loadServices() {
    try {
        // Try different possible paths
        let response;
        const possiblePaths = [
            'assets/data/services.json',
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
            // Check if setup is needed
            try {
                const setupCheck = await fetch('api/setup.php');
                if (setupCheck.ok) {
                    const setupStatus = await setupCheck.json();
                    if (setupStatus.initialized === false) {
                        showSetupWizard(setupStatus);
                        return;
                    }
                }
            } catch (e) {
                console.log('Setup API not available:', e);
            }

            throw new Error(`Failed to load assets/data/services.json. Make sure you're running a local web server. Status: ${response?.status || 'Network Error'}`);
        }
        
        let data = await response.json();
        
        // Validate JSON structure
        if (!data.sections || !Array.isArray(data.sections)) {
            throw new Error('Invalid JSON structure: "sections" array not found');
        }

        // Load config.json using the same base path
        let configData = {};
        try {
            const configPath = response.url.replace('services.json', 'config.json');
            const configResponse = await fetch(configPath);
            if (configResponse.ok) {
                const configJson = await configResponse.json();
                configData = configJson.config || configJson;
            }
        } catch (err) {
            console.warn('Failed to load config.json:', err);
        }

        data.config = configData;

        // Store raw config for admin access
        window._servicesConfig = data.config || {};

        // Check localStorage for admin overrides and merge
        const adminOverride = localStorage.getItem('homelab-admin-services');
        if (adminOverride) {
            try {
                const overrideData = JSON.parse(adminOverride);
                if (overrideData.sections && Array.isArray(overrideData.sections)) {
                    data.sections = overrideData.sections;
                }
                if (overrideData.config) {
                    data.config = Object.assign({}, data.config, overrideData.config);
                }
            } catch (e) {
                console.warn('Admin override data is corrupt, using original services.json');
            }
        }

        // Expose current data globally for admin.js
        window._servicesData = data;

        // Apply author URL to navbar and mobile menu links (resolved dynamically if LAN/remote rules apply)
        const authorUrl = 'http://web.homelab1367.internal/author';
        document.querySelectorAll('a.nav-author-link').forEach(el => {
            el.href = window.resolveServiceUrl ? window.resolveServiceUrl(authorUrl) : authorUrl;
        });

        // Apply version to footer
        const versionEl = document.querySelector('.footer-version small');
        if (versionEl) {
            versionEl.textContent = `Version ${APP_VERSION}`;
        }
        
        renderSections(data.sections, authorUrl);
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

function showSetupWizard(setupStatus) {
    const container = document.getElementById('sections-container');
    if (!container) return;

    let formOrWarningHTML = '';
    
    if (setupStatus.writable === false) {
        const webUser = setupStatus.server === 'nginx' ? 'nginx' : 'www-data';
        formOrWarningHTML = `
            <div style="color: #ef4444; background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.2); padding: 20px; border-radius: 8px; font-size: 0.95rem; line-height: 1.6; text-align: left;">
                <h4 style="margin-bottom: 12px; display: flex; align-items: center; gap: 8px; color: #ef4444;"><i class="bi bi-exclamation-octagon-fill"></i> Directory Permissions Error</h4>
                <p>The web server does not have permission to write to the <code>assets/data/</code> directory. Please run the following command on your server to allow configuration setup:</p>
                <code style="display: block; background: rgba(0, 0, 0, 0.3); padding: 12px; border-radius: 6px; margin: 15px 0; border: 1px solid var(--glass); color: var(--accent); font-family: monospace; word-break: break-all;">sudo chown -R ${webUser}:${webUser} assets/data</code>
                <p style="font-size: 0.85rem; color: var(--muted); margin-bottom: 0;">Once permissions are fixed, reload this page to complete the setup.</p>
            </div>
        `;
    } else {
        formOrWarningHTML = `
            <div id="setup-error-msg" style="color: #ef4444; background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.2); padding: 12px; border-radius: 8px; margin-bottom: 20px; display: none; font-size: 0.9rem;"></div>
            <form id="setup-wizard-form">
                <div style="margin-bottom: 20px;">
                    <label for="setup-password" style="display: block; color: var(--muted); margin-bottom: 8px; font-size: 0.85rem; text-transform: uppercase; letter-spacing: 1px;">Admin Password</label>
                    <input type="password" id="setup-password" required minlength="4" style="width: 100%; padding: 12px; background: rgba(255,255,255,0.05); border: 1px solid var(--glass); border-radius: 8px; color: #fff; font-size: 1rem; outline: none; transition: border-color 0.2s;" />
                </div>
                <div style="margin-bottom: 25px;">
                    <label for="setup-confirm" style="display: block; color: var(--muted); margin-bottom: 8px; font-size: 0.85rem; text-transform: uppercase; letter-spacing: 1px;">Confirm Password</label>
                    <input type="password" id="setup-confirm" required minlength="4" style="width: 100%; padding: 12px; background: rgba(255,255,255,0.05); border: 1px solid var(--glass); border-radius: 8px; color: #fff; font-size: 1rem; outline: none; transition: border-color 0.2s;" />
                </div>
                
                <button type="submit" id="setup-submit-btn" style="width: 100%; padding: 14px; background: var(--accent); border: none; border-radius: 8px; color: #000; font-weight: 600; font-size: 1rem; cursor: pointer; transition: opacity 0.2s, transform 0.1s;">
                    <i class="bi bi-rocket-takeoff-fill"></i> Complete Setup & Initialize
                </button>
            </form>
        `;
    }

    const wizardHTML = `
        <div class="setup-container" style="max-width: 500px; margin: 40px auto; padding: 30px; background: var(--card-dark); border: 1px solid var(--glass); border-radius: 12px; box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.37); backdrop-filter: blur(4px);">
            <h3 style="color: var(--accent); margin-bottom: 20px; font-weight: 500; display: flex; align-items: center; gap: 10px;">
                <i class="bi bi-shield-lock-fill"></i> Initialize IdealHub Dashboard
            </h3>
            <p style="color: var(--muted); font-size: 0.95rem; margin-bottom: 25px; line-height: 1.6;">
                Welcome to your new dashboard! To secure the administration panel, please configure your administrator password below.
            </p>
            ${formOrWarningHTML}
        </div>
    `;

    container.innerHTML = wizardHTML;

    // Attach form handler
    const form = document.getElementById('setup-wizard-form');
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const password = document.getElementById('setup-password').value;
            const confirm = document.getElementById('setup-confirm').value;
            const errorMsg = document.getElementById('setup-error-msg');
            const submitBtn = document.getElementById('setup-submit-btn');

            if (password !== confirm) {
                errorMsg.textContent = 'Passwords do not match.';
                errorMsg.style.display = 'block';
                return;
            }

            errorMsg.style.display = 'none';
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="bi bi-hourglass-split"></i> Initializing...';

            try {
                const resp = await fetch('api/setup.php', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ password })
                });

                const result = await resp.json();

                if (!resp.ok) {
                    errorMsg.textContent = result.error || 'Setup failed.';
                    errorMsg.style.display = 'block';
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = '<i class="bi bi-rocket-takeoff-fill"></i> Complete Setup & Initialize';
                } else {
                    container.innerHTML = `
                        <div class="setup-container" style="max-width: 500px; margin: 40px auto; padding: 40px 30px; background: var(--card-dark); border: 1px solid var(--glass); border-radius: 12px; text-align: center;">
                            <h3 style="color: #10b981; margin-bottom: 20px;"><i class="bi bi-check-circle-fill" style="font-size: 2.5rem; display: block; margin-bottom: 15px;"></i> Setup Complete!</h3>
                            <p style="color: var(--muted); font-size: 0.95rem; line-height: 1.6; margin-bottom: 25px;">
                                Your configuration files have been successfully created and populated. The dashboard is ready to use.
                            </p>
                            <p style="color: var(--accent); font-weight: 500;">Reloading the page in 3 seconds...</p>
                        </div>
                    `;
                    setTimeout(() => {
                        window.location.reload();
                    }, 3000);
                }
            } catch (err) {
                errorMsg.textContent = 'Network error: ' + err.message;
                errorMsg.style.display = 'block';
                submitBtn.disabled = false;
                submitBtn.innerHTML = '<i class="bi bi-rocket-takeoff-fill"></i> Complete Setup & Initialize';
            }
        });
    }
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

// --- Render Functions with active status---

function renderSections(sections, authorUrl) {
    const container = document.getElementById('sections-container');
    if (!container) return;
    container.innerHTML = '';

    sections.forEach(section => {
        // SKIP: If the entire section is marked as inactive
        if (section.active === false) return;

        // Ensure section has an ID for admin targeting
        if (!section.id) section.id = 'section-' + Math.random().toString(36).substr(2, 6);

        const sectionDiv = document.createElement('section');
        sectionDiv.className = 'tv-row';
        sectionDiv.setAttribute('data-section-type', section.type);
        sectionDiv.setAttribute('data-section-id', section.id);
        
        // Title
        const title = document.createElement('h3');
        title.className = 'row-title';
        title.innerHTML = `<i class="bi ${section.icon}"></i>${section.title}`;
        
        // Container
        const contentContainer = document.createElement('div');

        // CASE 1: News Section
        if (section.type === 'news' && section.rssUrl) {
            contentContainer.className = 'news-grid'; 
            contentContainer.innerHTML = `
                <div class="news-card" style="background: #222; display: flex; align-items: center; justify-content: center; color: #666;">
                    Loading News...
                </div>`;

            fetch(`https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(section.rssUrl)}`)
                .then(res => res.json())
                .then(data => {
                    contentContainer.innerHTML = ''; 
                    data.items.slice(0, 8).forEach(item => {
                        const sourceName = extractSource(item.title);
                        const cleanHeadline = cleanTitle(item.title);
                        const timeAgo = getTimeAgo(item.pubDate);
                        
                        let imageUrl = item.thumbnail || item.enclosure?.link;
                        if (!imageUrl || imageUrl.length < 10) {
                             imageUrl = `https://picsum.photos/seed/${cleanHeadline.length}/400/300`;
                        }

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
            // CASE 2: Standard App Sections (Favorite or Content)
            contentContainer.className = section.type === 'favorite' ? 'tv-row-content' : 'tv-fluid-content';
            
            if (section.items) {
                section.items.forEach(item => {
                    // Inactive items are rendered with .card-disabled (hidden via CSS in normal mode,
                    // visible as greyed-out in admin mode)
                    const card = section.type === 'favorite' 
                        ? createFavoriteCard(item) 
                        : createContentCard(item, authorUrl);
                    contentContainer.appendChild(card);
                });
            }
        }

        sectionDiv.appendChild(title);
        sectionDiv.appendChild(contentContainer);
        container.appendChild(sectionDiv);
    });
}

function createFavoriteCard(item) {
    const card = document.createElement('a');
    card.className = 'app-card favorite-app-card';
    card.href = window.resolveServiceUrl ? window.resolveServiceUrl(item.url, item.proxyPath, item.altUrl) : item.url;
    card.target = '_blank';
    card.setAttribute('aria-label', item.title);

    // Disabled state: hide in normal mode, show greyed-out in admin mode
    if (item.active === false) {
        card.classList.add('card-disabled');
        card.addEventListener('click', (e) => e.preventDefault());
    }

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

// Expose for admin.js re-render calls
window.renderSections = renderSections;

function createContentCard(item, authorUrl) {
    const card = document.createElement('a');
    card.className = 'app-card content-card';
    card.href = window.resolveServiceUrl ? window.resolveServiceUrl(item.url, item.proxyPath, item.altUrl) : item.url;
    card.target = '_blank';
    card.setAttribute('aria-label', item.title);

    // Disabled state: hide in normal mode, show greyed-out in admin mode
    if (item.active === false) {
        card.classList.add('card-disabled');
        card.addEventListener('click', (e) => e.preventDefault());
    }

    const image = document.createElement('img');
    image.src = item.image || 'https://plus.unsplash.com/premium_vector-1711987852190-36c01ae235b6?q=80&w=1290&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D';
    image.alt = item.title;
    image.className = 'card-image';
    
    image.onerror = function() {
        this.src = 'https://plus.unsplash.com/premium_vector-1711987852190-36c01ae235b6?q=80&w=1290&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D';
    };

    const overlay = document.createElement('div');
    overlay.className = 'card-content-overlay';
    
    let overlayContent = `<div class="overlay-title">${item.title}</div>`;
    
    if (item.course || item.author) {
        overlayContent += `<div class="overlay-meta">`;
        if (item.course) overlayContent += `<span class="meta-course"><i class="bi bi-journal-bookmark-fill"></i> ${item.course}</span><br>`;
        if (item.author) {
            const effectiveAuthorUrl = item.authorUrl || authorUrl || null;
            const authorDisplay = effectiveAuthorUrl
                ? `<a href="${effectiveAuthorUrl}" target="_blank" rel="noopener" class="meta-author-link" onclick="event.stopPropagation();">${item.author}</a>`
                : item.author;
            overlayContent += `<span class="meta-author"><i class="bi bi-person-fill"></i> ${authorDisplay}</span>`;
        }
        overlayContent += `</div>`;
    }
    
    overlay.innerHTML = overlayContent;

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

// Expose for admin.js re-render calls
window.updateSearchFunctionality = updateSearchFunctionality;

function updateSearchFunctionality() {
    const desktopSearchInput = document.getElementById('global-search-input');
    const mobilePopupSearchInput = document.getElementById('mobile-popup-search-input');
    
    // Search filter function
    function performSearch(searchTerm) {
        const allCards = document.querySelectorAll('.app-card, .news-card');
        
        allCards.forEach(card => {
            // For app cards
            const titleElement = card.querySelector('.app-title');
            const subElement = card.querySelector('.app-sub');
            const overlayTitle = card.querySelector('.overlay-title');
            
            // For news cards
            const newsTitle = card.querySelector('.news-title');
            
            const titleText = titleElement ? titleElement.textContent.toLowerCase() : '';
            const subText = subElement ? subElement.textContent.toLowerCase() : '';
            const overlayText = overlayTitle ? overlayTitle.textContent.toLowerCase() : '';
            const newsText = newsTitle ? newsTitle.textContent.toLowerCase() : '';

            const isMatch = (
                searchTerm.length === 0 ||
                titleText.includes(searchTerm) ||
                subText.includes(searchTerm) ||
                overlayText.includes(searchTerm) ||
                newsText.includes(searchTerm)
            );

            card.classList.toggle('hidden', !isMatch);
        });
    }
    
    // Attach to desktop search
    if (desktopSearchInput) {
        const newDesktopInput = desktopSearchInput.cloneNode(true);
        desktopSearchInput.parentNode.replaceChild(newDesktopInput, desktopSearchInput);
        
        newDesktopInput.addEventListener('keyup', function() {
            const searchTerm = this.value.toLowerCase().trim();
            performSearch(searchTerm);
        });
    }
    
    // Attach to mobile popup search
    if (mobilePopupSearchInput) {
        const newMobileInput = mobilePopupSearchInput.cloneNode(true);
        mobilePopupSearchInput.parentNode.replaceChild(newMobileInput, mobilePopupSearchInput);
        
        newMobileInput.addEventListener('keyup', function() {
            const searchTerm = this.value.toLowerCase().trim();
            performSearch(searchTerm);
        });
    }
}

// -------------------------------------------------------

(function(){
    const storageKey = 'homelab-theme-v2';
    const body = document.body;
    const themeBtn = document.getElementById('theme-toggle-btn');
    const themeIcon = document.getElementById('theme-toggle-icon');
    const githubIcon = document.getElementById('github-icon');

    // --- Theme and Particle Logic ---
    function initParticles(color){
        const root = document.getElementById('particles-js');
        const old = root.querySelector('canvas'); 
        if(old) old.remove();

        // Check if particlesJS is loaded
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

    function setTheme(t){
        const isLight = t === 'light';
        if(isLight){ 
            body.classList.add('light-theme'); 
            themeIcon.className = 'bi bi-sun-fill'; 
            themeIcon.style.color = ''; 
            if(githubIcon) githubIcon.style.color = '';
            initParticles('#111111'); 
        }
        else { 
            body.classList.remove('light-theme'); 
            themeIcon.className = 'bi bi-moon-fill'; 
            themeIcon.style.color = ''; 
            if(githubIcon) githubIcon.style.color = '';
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

    // --- INITIALIZATION ---
    // Load services and greeting when DOM is ready
    function init() {
        loadServices();
        updateGreeting(); // Check time and update "Welcome" text
        updateSearchFunctionality();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();

startTime();
initWeather();
initServerStatus();

// -------------------------------------------------------
// 🔊 CARD HOVER SOUND (event delegation — works with dynamic cards)
// -------------------------------------------------------
(function () {
    var _audioCtx  = null;
    var _lastPlay  = 0;
    var COOLDOWN   = 120; // ms between sounds to prevent rapid-fire

    function getCtx() {
        if (!_audioCtx) {
            try {
                _audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            } catch (e) { return null; }
        }
        // Resume if suspended (browser autoplay policy)
        if (_audioCtx.state === 'suspended') _audioCtx.resume();
        return _audioCtx;
    }

    function navSoundEnabled() {
        // Read the setting saved by settings.js
        return localStorage.getItem('homelab-nav-sound') === 'true';
    }

    /**
     * Futuristic two-layer hover blip:
     *  Layer 1 — a short sine sweep (high → low) for the "select" feel
     *  Layer 2 — a faint noise burst for the "digital texture"
     */
    function playHoverSound() {
        var ctx = getCtx();
        if (!ctx) return;

        var now = ctx.currentTime;

        // ── Layer 1: frequency-swept sine (140 → 80 Hz) ──
        var osc1 = ctx.createOscillator();
        var g1   = ctx.createGain();
        osc1.connect(g1);
        g1.connect(ctx.destination);
        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(600, now);
        osc1.frequency.exponentialRampToValueAtTime(320, now + 0.08);
        g1.gain.setValueAtTime(0, now);
        g1.gain.linearRampToValueAtTime(0.07, now + 0.012);
        g1.gain.exponentialRampToValueAtTime(0.0001, now + 0.10);
        osc1.start(now);
        osc1.stop(now + 0.11);

        // ── Layer 2: high harmonic shimmer ──
        var osc2 = ctx.createOscillator();
        var g2   = ctx.createGain();
        osc2.connect(g2);
        g2.connect(ctx.destination);
        osc2.type = 'triangle';
        osc2.frequency.setValueAtTime(3200, now);
        osc2.frequency.exponentialRampToValueAtTime(1800, now + 0.06);
        g2.gain.setValueAtTime(0, now);
        g2.gain.linearRampToValueAtTime(0.025, now + 0.008);
        g2.gain.exponentialRampToValueAtTime(0.0001, now + 0.07);
        osc2.start(now);
        osc2.stop(now + 0.08);
    }

    function onMouseEnter(e) {
        // Only fire for .app-card elements
        var target = e.target;
        while (target && target !== this) {
            if (target.classList && target.classList.contains('app-card')) break;
            target = target.parentElement;
        }
        if (!target || !target.classList.contains('app-card')) return;

        // Cooldown guard
        var now = Date.now();
        if (now - _lastPlay < COOLDOWN) return;
        _lastPlay = now;

        // Only play if nav sound setting is enabled
        if (!navSoundEnabled()) return;

        playHoverSound();
    }

    // Attach via delegation after DOM is ready
    function init() {
        var container = document.getElementById('sections-container');
        if (container) {
            container.addEventListener('mouseenter', onMouseEnter, true);
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
