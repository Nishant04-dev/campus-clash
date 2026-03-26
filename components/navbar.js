// Navbar Component — inline injection, no fetch required
(function () {
    function getProjectRoot() {
        const scripts = document.querySelectorAll('script[src]');
        for (const s of scripts) {
            if (s.src && s.src.includes('components/navbar.js')) {
                return s.src.replace('components/navbar.js', '');
            }
        }
        return '';
    }

    function injectNavbar() {
        const container = document.getElementById('navbar');
        if (!container) return;

        const root = getProjectRoot();

        container.innerHTML = `
<header class="navbar">
    <div class="navbar-container">
        <a href="${root}index.html" class="navbar-brand">
            <span class="brand-text">CAMPUS CLASH</span>
        </a>
        <nav class="nav-links">
            <a href="${root}index.html">Home</a>
            <a href="${root}tournaments.html">Tournaments</a>
            <a href="${root}about.html">About</a>
            <a href="${root}team.html">Team</a>
            <a href="${root}developer.html">Developer</a>
            <a href="${root}contact.html">Contact</a>
        </nav>
        <div class="right-section" id="auth-nav">
            <a href="#" class="nav-cta" onclick="openAuthModal && openAuthModal(); return false;">Sign In</a>
        </div>
    </div>
</header>`;

        // Highlight active link
        const currentPage = window.location.pathname.split('/').pop() || 'index.html';
        container.querySelectorAll('.nav-links a').forEach(link => {
            const href = link.getAttribute('href').split('/').pop();
            if (href === currentPage) link.classList.add('active');
        });

        // Load auth state async after navbar is already visible
        loadAuthState(root);
    }

    async function loadAuthState(root) {
        const authNav = document.getElementById('auth-nav');
        if (!authNav) return;
        try {
            const { authService } = await import(root + 'src/services/authService.js');
            const user = await authService.getCurrentUser();
            if (user) {
                const name = user.profile?.name || user.user_metadata?.name || user.email?.split('@')[0] || 'Profile';
                authNav.innerHTML = `
                    <a href="${root}profile.html" class="user-name">${name}</a>
                    <button class="logout-btn" onclick="handleNavLogout()">Logout</button>`;
            }
        } catch (e) {
            // auth unavailable — Sign In link already shown
        }
    }

    window.handleNavLogout = async function () {
        const root = getProjectRoot();
        try {
            const { authService } = await import(root + 'src/services/authService.js');
            await authService.signOut();
        } catch (e) { /* ignore */ }
        window.location.href = root + 'index.html';
    };

    // Run immediately if DOM is ready, otherwise wait
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', injectNavbar);
    } else {
        injectNavbar();
    }
})();
