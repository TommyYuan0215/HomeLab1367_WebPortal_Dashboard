(function(){
    const storageKey = 'homelab-theme-v2';
    const body = document.body;
    const themeBtn = document.getElementById('theme-toggle-btn');
    const themeIcon = document.getElementById('theme-toggle-icon');
    const githubIcon = document.getElementById('github-icon');

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

    function checkIcons(){
        const test = document.createElement('i'); 
        test.className = 'bi bi-github'; 
        test.style.position='absolute'; 
        test.style.opacity='0'; 
        document.body.appendChild(test);
        const height = test.offsetHeight; 
        document.body.removeChild(test);
        if(!height || height < 6){
            document.querySelectorAll('.app-icon').forEach(el => el.classList.add('fallback'));
        }
    }
    setTimeout(checkIcons, 800);
})();