document.addEventListener('DOMContentLoaded', () => {
    // Mouse Glow following
    const mouseGlow = document.querySelector('.mouse-glow');
    document.addEventListener('mousemove', (e) => {
        mouseGlow.style.left = e.clientX + 'px';
        mouseGlow.style.top = e.clientY + 'px';
    });

    // Detect Touch Device
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

    // 3D Tilt Effect for Game Cards (Only for Desktop)
    const cards = document.querySelectorAll('.game-card');
    if (!isTouchDevice) {
        cards.forEach(card => {
            card.addEventListener('mousemove', (e) => {
                const rect = card.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                
                const centerX = rect.width / 2;
                const centerY = rect.height / 2;
                
                const rotateX = (y - centerY) / 10;
                const rotateY = (centerX - x) / 10;
                
                card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.05, 1.05, 1.05)`;
            });
            
            card.addEventListener('mouseleave', () => {
                card.style.transform = `perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)`;
            });
        });
    } else {
        // Subtle hover state for touch instead of 3D tilt
        cards.forEach(card => {
            card.addEventListener('touchstart', () => {
                card.style.transform = `scale(0.98)`;
            }, { passive: true });
            card.addEventListener('touchend', () => {
                card.style.transform = `scale(1)`;
            }, { passive: true });
        });
    }

    // Smooth scrolling for navigation
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            document.querySelector(this.getAttribute('href')).scrollIntoView({
                behavior: 'smooth'
            });
        });
    });

    // Section Fade-in on Scroll
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, observerOptions);

    document.querySelectorAll('section, .game-card, .hero-poster').forEach(el => {
        el.classList.add('reveal-on-scroll');
        observer.observe(el);
    });
});
