import { authService } from '../src/services/authService.js';
import { registrationService } from '../src/services/registrationService.js';
import { analyticsService } from '../src/services/analyticsService.js';

const modalHtml = `
    <!-- Auth Modal -->
    <div id="auth-modal" class="modal-overlay">
        <div class="modal">
            <div class="modal-header">
                <h3 id="auth-title">SIGN IN</h3>
                <button type="button" id="close-auth-modal" class="modal-close">&times;</button>
            </div>
            <form id="auth-form-main">
                <input type="text" id="auth-name" placeholder="Full Name" style="display:none;">
                <div class="form-group">
                    <input type="email" id="auth-email" placeholder="Email" required>
                </div>
                <div class="form-group">
                    <input type="password" id="auth-password" placeholder="Password" required>
                </div>
                <div id="auth-error" class="auth-error"></div>
                <button type="submit" class="btn btn-primary" style="width:100%;" id="auth-submit-btn">CONTINUE</button>
            </form>
            <p style="text-align:center; margin-top:1rem; font-size:0.8rem; color:#a0a0a0;">
                <span id="auth-toggle-text">Don't have an account?</span>
                <a href="#" id="toggle-auth" class="text-secondary">Sign Up</a>
            </p>
        </div>
    </div>

    <!-- Registration Modal -->
    <div id="registration-modal" class="modal-overlay">
        <div class="modal" style="max-width:500px;">
            <div class="modal-header">
                <h3 style="color:var(--secondary);" id="reg-tournament-name">Register</h3>
                <button type="button" id="close-reg-modal" class="modal-close">&times;</button>
            </div>
            
            <div class="reg-tournament-info">
                <p style="margin:0 0 0.5rem; color:var(--secondary); font-weight:700;" id="reg-game-info"></p>
                <p style="margin:0; color:#a0a0a0; font-size:0.85rem;" id="reg-mode-info"></p>
            </div>

            <form id="registration-form">
                <input type="hidden" name="tournament_id" id="reg-tournament-id">
                
                <div class="form-group">
                    <label>Team/Squad Name *</label>
                    <input type="text" name="team_name" required placeholder="Your team name">
                </div>

                <div style="display:grid; grid-template-columns:1fr 1fr; gap:1rem;">
                    <div class="form-group">
                        <label>In-Game ID *</label>
                        <input type="text" name="game_id" required placeholder="Your player ID">
                    </div>
                    <div class="form-group">
                        <label>Rank/Level</label>
                        <input type="text" name="rank" placeholder="e.g. Diamond">
                    </div>
                </div>

                <div class="form-group">
                    <label>Contact Number *</label>
                    <input type="tel" name="phone" required placeholder="+91 XXXXX XXXXX">
                </div>

                <div class="form-group">
                    <label style="display:flex; align-items:center; gap:0.5rem; cursor:pointer;">
                        <input type="checkbox" name="agree_rules" required style="width:auto; margin:0;">
                        <span style="color:#a0a0a0; font-size:0.85rem;">I agree to the tournament rules</span>
                    </label>
                </div>

                <div id="reg-error" class="reg-error"></div>

                <button type="submit" id="reg-submit-btn" class="btn btn-primary" style="width:100%;">SUBMIT REGISTRATION</button>
            </form>

            <p style="text-align:center; margin-top:1rem; font-size:0.8rem; color:#666;">
                <a href="profile.html" class="text-secondary">View my registrations</a>
            </p>
        </div>
    </div>
`;

export function initModals() {
    if (!document.getElementById('auth-modal')) {
        const div = document.createElement('div');
        div.innerHTML = modalHtml;
        document.body.appendChild(div);
    }

    // Auth Logic
    const authModal = document.getElementById('auth-modal');
    const closeAuthBtn = document.getElementById('close-auth-modal');
    const toggleLink = document.getElementById('toggle-auth');
    const authForm = document.getElementById('auth-form-main');
    const nameInput = document.getElementById('auth-name');
    const titleEl = document.getElementById('auth-title');
    const toggleText = document.getElementById('auth-toggle-text');
    const authErrorDiv = document.getElementById('auth-error');
    
    let isSignUp = false;

    window.openAuthModal = function(mode = 'signin') {
        isSignUp = mode === 'signup';
        updateAuthMode();
        authModal.style.display = 'flex';
    };

    function updateAuthMode() {
        titleEl.textContent = isSignUp ? 'SIGN UP' : 'SIGN IN';
        nameInput.style.display = isSignUp ? 'block' : 'none';
        toggleText.textContent = isSignUp ? 'Already have an account?' : "Don't have an account?";
        toggleLink.textContent = isSignUp ? 'Sign In' : 'Sign Up';
        authErrorDiv.style.display = 'none';
    }

    closeAuthBtn?.addEventListener('click', () => {
        authModal.style.display = 'none';
    });

    authModal?.addEventListener('click', (e) => {
        if (e.target === authModal) {
            authModal.style.display = 'none';
        }
    });

    toggleLink?.addEventListener('click', (e) => {
        e.preventDefault();
        isSignUp = !isSignUp;
        updateAuthMode();
    });

    authForm?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('auth-email').value;
        const password = document.getElementById('auth-password').value;
        const name = nameInput.value;
        const submitBtn = document.getElementById('auth-submit-btn');
        
        submitBtn.textContent = 'Please wait...';
        submitBtn.disabled = true;
        authErrorDiv.style.display = 'none';

        let result;
        if (isSignUp) {
            result = await authService.signUp(email, password, name);
        } else {
            result = await authService.signIn(email, password);
        }

        if (result.error) {
            authErrorDiv.textContent = result.error.message;
            authErrorDiv.style.display = 'block';
            submitBtn.textContent = 'CONTINUE';
            submitBtn.disabled = false;
        } else {
            authModal.style.display = 'none';
            authForm.reset();
            submitBtn.textContent = 'CONTINUE';
            submitBtn.disabled = false;
            
            // Trigger navigation update if function exists
            if (window.updateNavigation) window.updateNavigation();
            
            if (isSignUp) {
                alert('Account created! Please check your email to verify your account.');
            } else {
                window.location.reload(); // Simplest way to refresh all components
            }
        }
    });

    // Registration Logic
    const regModal = document.getElementById('registration-modal');
    const closeRegBtn = document.getElementById('close-reg-modal');
    const regForm = document.getElementById('registration-form');
    const regErrorDiv = document.getElementById('reg-error');

    window.openReg = async function(id, title, registrationLink, game = '', mode = '') {
        const user = await authService.getCurrentUser();
        
        if (!user) {
            window.openAuthModal('signin');
            alert('Please login or create an account to register for tournaments.');
            return;
        }

        document.getElementById('reg-tournament-id').value = id;
        document.getElementById('reg-tournament-name').textContent = title;
        document.getElementById('reg-game-info').textContent = game.toUpperCase();
        document.getElementById('reg-mode-info').textContent = `${title} - ${mode.toUpperCase()} Mode`;
        regErrorDiv.style.display = 'none';
        regForm.reset();
        regModal.style.display = 'flex';
    };

    window.closeRegistrationModal = function() {
        regModal.style.display = 'none';
    };

    closeRegBtn?.addEventListener('click', window.closeRegistrationModal);

    regModal?.addEventListener('click', (e) => {
        if (e.target === regModal) {
            window.closeRegistrationModal();
        }
    });

    regForm?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const data = Object.fromEntries(formData);
        const submitBtn = document.getElementById('reg-submit-btn');
        
        submitBtn.textContent = 'Processing...';
        submitBtn.disabled = true;
        regErrorDiv.style.display = 'none';

        const { data: result, error } = await registrationService.register(data);

        if (error) {
            regErrorDiv.textContent = error.message;
            regErrorDiv.style.display = 'block';
            submitBtn.textContent = 'SUBMIT REGISTRATION';
            submitBtn.disabled = false;
            return;
        }

        await analyticsService.trackRegistration(data.tournament_id, result?.user_id);

        submitBtn.textContent = 'Success!';
        submitBtn.style.background = '#00ff88';
        
        setTimeout(() => {
            window.closeRegistrationModal();
            alert('Registration submitted successfully! Check your profile for status updates.');
            submitBtn.textContent = 'SUBMIT REGISTRATION';
            submitBtn.style.background = '#ff004c';
            submitBtn.disabled = false;
        }, 1500);
    });
}
