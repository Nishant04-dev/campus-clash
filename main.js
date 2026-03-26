import { config } from './src/lib/config.js';
import { authService } from './src/services/authService.js';
import { tournamentService } from './src/services/tournamentService.js';
import { settingsService } from './src/services/settingsService.js';
import { analyticsService } from './src/services/analyticsService.js';
import { registrationService } from './src/services/registrationService.js';

const API_KEY = config.lumiere.apiKey;
const ENDPOINT = config.lumiere.endpoint;

let currentUser = null;

document.addEventListener('DOMContentLoaded', async () => {
    initMouseGlow();
    initTiltEffect();
    initSmoothScroll();
    initChatWidget();
    await loadDynamicContent();
    initHeroAnimation();
});

window.updateNavigation = updateNavigation;

function updateNavigation() {
    const authNav = document.getElementById('auth-nav');
    if (!authNav) return;
    
    if (currentUser) {
        authNav.innerHTML = `
            <a href="profile.html" class="user-name">
                <span id="user-nav-name">${currentUser.profile?.name || currentUser.email?.split('@')[0] || 'Profile'}</span>
            </a>
            <button class="logout-btn" onclick="handleLogout()">Logout</button>
        `;
    } else {
        authNav.innerHTML = `
            <a href="#" class="nav-cta" onclick="openAuthModal('signin'); return false;">Sign In</a>
        `;
    }
}

window.handleLogout = async function() {
    await authService.signOut();
    currentUser = null;
    updateNavigation();
    window.location.href = 'index.html';
};

function initMouseGlow() {
    const mouseGlow = document.querySelector('.mouse-glow');
    let mouseX = 0, mouseY = 0;
    let glowX = 0, glowY = 0;

    document.addEventListener('mousemove', (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;
    });

    function animateGlow() {
        glowX += (mouseX - glowX) * 0.1;
        glowY += (mouseY - glowY) * 0.1;
        
        if (mouseGlow) {
            mouseGlow.style.left = glowX + 'px';
            mouseGlow.style.top = glowY + 'px';
        }
        
        requestAnimationFrame(animateGlow);
    }
    animateGlow();
}

function initTiltEffect() {
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    const cards = document.querySelectorAll('.game-card');
    
    if (!isTouchDevice) {
        cards.forEach(card => {
            card.addEventListener('mousemove', (e) => {
                const rect = card.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                
                const centerX = rect.width / 2;
                const centerY = rect.height / 2;
                
                const rotateX = (y - centerY) / 8;
                const rotateY = (centerX - x) / 8;
                
                card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.07, 1.07, 1.07)`;
            });
            
            card.addEventListener('mouseleave', () => {
                card.style.transition = 'transform 0.5s cubic-bezier(0.23, 1, 0.32, 1)';
                card.style.transform = `perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)`;
                setTimeout(() => {
                    card.style.transition = '';
                }, 500);
            });
        });
    }
}

function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({ behavior: 'smooth' });
            }
        });
    });
}

function initChatWidget() {
    const chatWidget = document.getElementById('ai-chat-widget');
    const chatTrigger = document.getElementById('open-chat');
    const closeChat = document.getElementById('close-chat');
    const chatInput = document.getElementById('chat-input');
    const sendBtn = document.getElementById('send-chat');
    const chatMessages = document.getElementById('chat-messages');

    let messageHistory = [];

    chatTrigger?.addEventListener('click', () => {
        chatWidget?.classList.add('active');
        chatTrigger.style.display = 'none';
        chatInput?.focus();
    });

    closeChat?.addEventListener('click', () => {
        chatWidget?.classList.remove('active');
        chatTrigger.style.display = 'flex';
    });

    async function sendMessage() {
        const text = chatInput?.value.trim();
        if (!text) return;

        addMessage(text, 'user');
        chatInput.value = '';
        messageHistory.push({ role: 'user', content: text });

        const loadingMsg = addMessage('Lumiere is thinking...', 'bot loading');

        try {
            const response = await fetch(ENDPOINT, {
                method: 'POST',
                mode: 'cors',
                headers: {
                    'Authorization': `Bearer ${API_KEY}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    messages: messageHistory,
                    mode: 'chat'
                })
            });

            if (response.status === 502) {
                throw new Error('Server unavailable');
            }

            if (!response.ok) throw new Error(`API error: ${response.status}`);

            const data = await response.json();
            const botResponse = data.content || data.choices?.[0]?.message?.content || data.reply || "I'm sorry, I couldn't process that.";

            loadingMsg.remove();
            addMessage(botResponse, 'bot');
            messageHistory.push({ role: 'assistant', content: botResponse });

        } catch (error) {
            console.error('Chat Error:', error);
            loadingMsg.textContent = "Sorry, I'm having trouble connecting right now.";
            loadingMsg.classList.remove('loading');
        }
    }

    function addMessage(text, type) {
        const div = document.createElement('div');
        div.className = `message ${type}`;
        div.textContent = text;
        chatMessages?.appendChild(div);
        chatMessages.scrollTop = chatMessages.scrollHeight;
        return div;
    }

    sendBtn?.addEventListener('click', sendMessage);
    chatInput?.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') sendMessage();
    });
}

// Modals are now handled by components/modals.js

async function loadDynamicContent() {
    console.log('Campus Clash: Loading dynamic content...');
    
    try {
        const { data: settings } = await settingsService.getSettings();
        if (settings) {
            if (settings.hero_text) {
                const scrollTitle = document.querySelector('.scroll-title');
                if (scrollTitle) scrollTitle.textContent = settings.hero_text;
            }
            if (settings.logo_url) {
                const logo = document.querySelector('.cu-logo-large');
                if (logo) logo.src = settings.logo_url;
            }
            if (settings.announcement_text) {
                const badge = document.getElementById('season-badge');
                if (badge) badge.textContent = settings.announcement_text;
            }
            if (settings.prize_pool) {
                const prize = document.getElementById('prize-pool-display');
                if (prize) prize.textContent = settings.prize_pool;
            }
            if (settings.hero_poster_url) {
                const poster = document.querySelector('.hero-poster');
                if (poster) poster.src = settings.hero_poster_url;
            }
        }

        const { data: tournaments } = await tournamentService.getAll();
        const grid = document.getElementById('game-grid');
        
        if (tournaments && tournaments.length > 0 && grid) {
            grid.innerHTML = tournaments.map(t => `
                <div class="game-card ${t.game?.toLowerCase().replace(/\s/g, '') || 'default'}">
                    <div class="card-bg" style="background-image: linear-gradient(to top, var(--bg-dark), transparent), url('${t.banner_url || 'assets/VALORANT.jpg'}')"></div>
                    <div class="card-content">
                        <h3>${t.title || t.game}</h3>
                        <p>${t.game || 'Game'} | ${(t.mode || 'Squad').toUpperCase()}</p>
                        <p style="color:var(--secondary); font-size:0.8rem; margin-bottom:10px;">${t.prize_pool || 'Prize TBA'}</p>
                        <button class="btn btn-primary" onclick="window.openReg('${t.id}', '${t.title}', '${t.registration_link || ''}', '${t.game}', '${t.mode}')">REGISTER</button>
                    </div>
                </div>
            `).join('');
            
            tournaments.forEach(t => analyticsService.trackView(t.id));
            initTiltEffect();
            console.log('Campus Clash: Content loaded successfully.');
        }
    } catch (err) {
        console.error('Campus Clash: Error loading content:', err);
    }
}

function initHeroAnimation() {
    const canvas = document.getElementById('hero-canvas');
    if (!canvas) return;
    
    const context = canvas.getContext('2d');
    const scrollContainer = document.querySelector('.scroll-container');
    const scrollTitle = document.querySelector('.scroll-title');
    const loaderOverlay = document.getElementById('loader-overlay');
    const loaderBar = document.getElementById('loader-bar');
    const loaderText = document.getElementById('loader-text');
    
    const frameCount = 120;
    const currentFrameURL = index => (
        `assets/sequence 1/ezgif-frame-${index.toString().padStart(3, '0')}.jpg`
    );

    const images = [];
    let airship = { frame: 0, targetFrame: 0 };

    let loadedCount = 0;
    for (let i = 1; i <= frameCount; i++) {
        const img = new Image();
        img.src = currentFrameURL(i);
        img.onload = () => {
            loadedCount++;
            const progress = Math.round((loadedCount / frameCount) * 100);
            if (loaderBar) loaderBar.style.width = `${progress}%`;
            if (loaderText) loaderText.textContent = `PRELOADING ASSETS... ${progress}%`;
            
            if (loadedCount === frameCount) {
                setTimeout(() => {
                    loaderOverlay?.classList.add('fade-out');
                    render();
                    requestAnimationFrame(animate);
                }, 500);
            }
        };
        images.push(img);
    }

    function resizeCanvas() {
        if (!canvas) return;
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        render();
    }

    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    function render() {
        const frameIdx = Math.max(0, Math.min(frameCount - 1, Math.round(airship.frame)));
        const img = images[frameIdx];
        if (!img || !img.complete) return;

        const canvasAspect = canvas.width / canvas.height;
        const imgAspect = img.width / img.height;
        let drawWidth, drawHeight, offsetX, offsetY;

        if (canvasAspect > imgAspect) {
            drawWidth = canvas.width;
            drawHeight = canvas.width / imgAspect;
            offsetX = 0;
            offsetY = (canvas.height - drawHeight) / 2;
        } else {
            drawHeight = canvas.height;
            drawWidth = canvas.height * imgAspect;
            offsetX = (canvas.width - drawWidth) / 2;
            offsetY = 0;
        }

        context.clearRect(0, 0, canvas.width, canvas.height);
        context.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
    }

    function animate() {
        const lerpFactor = 0.1;
        const diff = airship.targetFrame - airship.frame;
        
        if (Math.abs(diff) > 0.01) {
            airship.frame += diff * lerpFactor;
            render();
        }
        requestAnimationFrame(animate);
    }

    window.addEventListener('scroll', () => {
        if (!scrollContainer || !scrollTitle) return;
        
        const scrollTop = window.scrollY;
        const containerOffset = scrollContainer.offsetTop;
        const containerHeight = scrollContainer.offsetHeight;
        
        const relativeScroll = scrollTop - containerOffset;
        const maxScroll = containerHeight - window.innerHeight;
        const scrollFraction = Math.max(0, Math.min(1, relativeScroll / maxScroll));
        
        airship.targetFrame = scrollFraction * (frameCount - 1);

        if (scrollFraction > 0.1 && scrollFraction < 0.9) {
            scrollTitle.style.opacity = '1';
            scrollTitle.style.transform = 'translateY(0)';
        } else {
            scrollTitle.style.opacity = '0';
            scrollTitle.style.transform = 'translateY(50px)';
        }
    });
}
