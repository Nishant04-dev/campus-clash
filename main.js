document.addEventListener('DOMContentLoaded', () => {
    // Mouse Glow following
    // Mouse Glow following with smooth lag and dynamic size
    const mouseGlow = document.querySelector('.mouse-glow');
    let mouseX = 0, mouseY = 0;
    let glowX = 0, glowY = 0;

    document.addEventListener('mousemove', (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;
    });

    function animateGlow() {
        // Smooth interpolation (lerp)
        glowX += (mouseX - glowX) * 0.1;
        glowY += (mouseY - glowY) * 0.1;
        
        mouseGlow.style.left = glowX + 'px';
        mouseGlow.style.top = glowY + 'px';
        
        requestAnimationFrame(animateGlow);
    }
    animateGlow();

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
                
                const rotateX = (y - centerY) / 8; // Slightly more tilt
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

    // Lumiere AI Chat Integration
    const chatWidget = document.getElementById('ai-chat-widget');
    const chatTrigger = document.getElementById('open-chat');
    const closeChat = document.getElementById('close-chat');
    const chatInput = document.getElementById('chat-input');
    const sendBtn = document.getElementById('send-chat');
    const chatMessages = document.getElementById('chat-messages');

    const API_KEY = 'lum-53d57ae849f739130f251b0b2422e796f4f81f01ef46721f';
    const ENDPOINT = 'https://hpgljlicaqhesbnjwjab.supabase.co/functions/v1/lumiere-api';

    // Start with an empty history for the API, but keep UI greeting
    let messageHistory = [];

    chatTrigger.addEventListener('click', () => {
        chatWidget.classList.add('active');
        chatTrigger.style.display = 'none';
        chatInput.focus();
    });

    closeChat.addEventListener('click', () => {
        chatWidget.classList.remove('active');
        chatTrigger.style.display = 'flex';
    });

    async function sendMessage() {
        const text = chatInput.value.trim();
        if (!text) return;

        // Add user message to UI
        addMessage(text, 'user');
        chatInput.value = '';
        messageHistory.push({ role: 'user', content: text });

        // Add loading state
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
                throw new Error('Server (502) error. The AI model might be temporarily unavailable.');
            }

            if (!response.ok) throw new Error(`API request failed with status: ${response.status}`);

            const data = await response.json();
            const botResponse = data.choices?.[0]?.message?.content || data.reply || "I'm sorry, I couldn't process that.";

            // Remove loading and add bot response
            loadingMsg.remove();
            addMessage(botResponse, 'bot');
            messageHistory.push({ role: 'assistant', content: botResponse });

        } catch (error) {
            console.error('Chat Error:', error);
            loadingMsg.textContent = "Sorry, I'm having trouble connecting right now. Please try again later.";
            loadingMsg.classList.remove('loading');
        }
    }

    function addMessage(text, type) {
        const div = document.createElement('div');
        div.className = `message ${type}`;
        div.textContent = text;
        chatMessages.appendChild(div);
        chatMessages.scrollTop = chatMessages.scrollHeight;
        return div;
    }

    sendBtn.addEventListener('click', sendMessage);
    chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') sendMessage();
    });

    // --- Hero Scroll Animation ---
    const canvas = document.getElementById('hero-canvas');
    const context = canvas.getContext('2d');
    const scrollContainer = document.querySelector('.scroll-container');
    const scrollTitle = document.querySelector('.scroll-title');
    
    const frameCount = 120;
    const currentFrame = index => (
        `assets/sequence 1/ezgif-frame-${index.toString().padStart(3, '0')}.jpg`
    );

    const images = [];
    const airship = { frame: 0 };

    // Preload images
    let loadedCount = 0;
    for (let i = 1; i <= frameCount; i++) {
        const img = new Image();
        img.src = currentFrame(i);
        img.onload = () => {
            loadedCount++;
            if (loadedCount === frameCount) {
                render(); // Initial render
            }
        };
        images.push(img);
    }

    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        render();
    }

    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    function render() {
        const img = images[airship.frame];
        if (!img || !img.complete) return;

        // DrawImage with aspect-fill (cover)
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

    window.addEventListener('scroll', () => {
        const scrollTop = window.scrollY;
        const maxScrollTop = scrollContainer.offsetHeight - window.innerHeight;
        const scrollFraction = Math.max(0, Math.min(1, scrollTop / maxScrollTop));
        
        const frameIndex = Math.min(
            frameCount - 1,
            Math.floor(scrollFraction * frameCount)
        );

        // Update Frame
        if (airship.frame !== frameIndex) {
            airship.frame = frameIndex;
            requestAnimationFrame(render);
        }

        // Title Animation
        if (scrollFraction > 0.2 && scrollFraction < 0.8) {
            scrollTitle.style.opacity = '1';
            scrollTitle.style.transform = 'translateY(0)';
        } else {
            scrollTitle.style.opacity = '0';
            scrollTitle.style.transform = 'translateY(50px)';
        }
    });
});
