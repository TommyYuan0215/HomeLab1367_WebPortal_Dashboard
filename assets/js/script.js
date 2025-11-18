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
    // This assumes you have already fixed the ID to 'real-time-clock'
    document.getElementById('real-time-clock').innerHTML = h + ":" + m + ":" + s;
    // The recursive call now works because startTime is a global function
    setTimeout(startTime, 1000); 
}

// -------------------------------------------------------

(function(){
    const storageKey = 'homelab-theme-v2';
    const body = document.body;
    const themeBtn = document.getElementById('theme-toggle-btn');
    const themeIcon = document.getElementById('theme-toggle-icon');
    const githubIcon = document.getElementById('github-icon');

    // --- Search Filtering Logic ---
    const searchInput = document.getElementById('global-search-input');
    const allCards = document.querySelectorAll('.app-card');

    function filterCards() {
        const searchTerm = searchInput.value.toLowerCase().trim();

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
    }

    searchInput.addEventListener('keyup', filterCards);

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
})();

startTime();