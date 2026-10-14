/**
 * Happy Birthday - Interactive Experience JS Script
 * Developed for DecentDrashti's Happy Birthday Card Website.
 * Incorporates Canvas Particles, Confetti, Fireworks, 
 * Web Audio Synthesized Chime Music, and interactive animations.
 */

// --- STATE MANAGEMENT ---
const state = {
    activeStage: 'intro', // 'intro' or 'card'
    isCardOpen: false,
    isMusicPlaying: false,
    musicSequenceTimer: null,
    musicTimer: null,
    activeMelodyIndex: 0,
    blownCandlesCount: 0,
    totalCandles: 3,
    candleStates: [true, true, true],
    typewriterTimer: null,
    canvasEffects: null
};

// --- AUDIO CONFIGURATION (WEB AUDIO API RETRO & CHIME SYNTH) ---
const NOTE_FREQS = {
    'G4': 391.99, 'A4': 440.00, 'B4': 493.88, 'C5': 523.25,
    'D5': 587.33, 'E5': 659.25, 'F5': 698.46, 'G5': 783.99
};

const MELODY = [
    { note: 'G4', dur: 0.4 }, { note: 'G4', dur: 0.2 }, { note: 'A4', dur: 0.6 }, { note: 'G4', dur: 0.6 }, { note: 'C5', dur: 0.6 }, { note: 'B4', dur: 1.2 },
    { note: null, dur: 0.3 }, // Pause
    { note: 'G4', dur: 0.4 }, { note: 'G4', dur: 0.2 }, { note: 'A4', dur: 0.6 }, { note: 'G4', dur: 0.6 }, { note: 'D5', dur: 0.6 }, { note: 'C5', dur: 1.2 },
    { note: null, dur: 0.3 }, // Pause
    { note: 'G4', dur: 0.4 }, { note: 'G4', dur: 0.2 }, { note: 'G5', dur: 0.6 }, { note: 'E5', dur: 0.6 }, { note: 'C5', dur: 0.6 }, { note: 'B4', dur: 0.6 }, { note: 'A4', dur: 1.2 },
    { note: null, dur: 0.3 }, // Pause
    { note: 'F5', dur: 0.4 }, { note: 'F5', dur: 0.2 }, { note: 'E5', dur: 0.6 }, { note: 'C5', dur: 0.6 }, { note: 'D5', dur: 0.6 }, { note: 'C5', dur: 1.5 },
    { note: null, dur: 1.5 }  // Verse Pause
];

let audioCtx = null;
let melodyScheduleTime = 0;
let nextNoteIndex = 0;
let playbackTimeoutId = null;

function initAudio() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
}

// Play a single chime note with custom ADSR envelope
function playChime(freq, time, duration) {
    if (!audioCtx) return;

    // Custom synthetic instruments: primary chime + warm oscillator helper
    const osc1 = audioCtx.createOscillator();
    const osc2 = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    osc1.type = 'sine'; // Primary pure chime sound
    osc2.type = 'triangle'; // Add warmth

    osc1.frequency.setValueAtTime(freq, time);
    osc2.frequency.setValueAtTime(freq * 2.003, time); // Subtle detuning for depth

    // Custom synth envelope settings
    gainNode.gain.setValueAtTime(0, time);
    gainNode.gain.linearRampToValueAtTime(0.3, time + 0.05); // Rapid attack
    gainNode.gain.exponentialRampToValueAtTime(0.001, time + duration); // Long bell decay

    osc1.connect(gainNode);
    osc2.connect(gainNode);

    // Simple reverberation/delay filter
    const delay = audioCtx.createDelay();
    delay.delayTime.value = 0.15;
    const feedback = audioCtx.createGain();
    feedback.gain.value = 0.25;

    gainNode.connect(audioCtx.destination); // Direct out

    // Connect to feedback loop
    gainNode.connect(delay);
    delay.connect(feedback);
    feedback.connect(delay); // loop back
    feedback.connect(audioCtx.destination); // wet output

    osc1.start(time);
    osc2.start(time);

    osc1.stop(time + duration);
    osc2.stop(time + duration);
}

// Play positive celebration chime
function playSuccessFanfare() {
    initAudio();
    const now = audioCtx.currentTime;
    const notes = ['C5', 'E5', 'G5', 'C6'];
    const times = [0, 0.15, 0.3, 0.45];

    notes.forEach((note, i) => {
        let freq;
        if (note === 'C6') freq = 1046.50;
        else if (note === 'G5') freq = 783.99;
        else if (note === 'E5') freq = 659.25;
        else freq = 523.25;

        // Play warm synth sound
        const osc = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();

        osc.type = 'sine';
        osc.frequency.value = freq;

        gainNode.gain.setValueAtTime(0, now + times[i]);
        gainNode.gain.linearRampToValueAtTime(0.4, now + times[i] + 0.02);
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + times[i] + 0.4);

        osc.connect(gainNode);
        gainNode.connect(audioCtx.destination);

        osc.start(now + times[i]);
        osc.stop(now + times[i] + 0.5);
    });
}

// Melody Scheduler loop
function scheduler() {
    if (!state.isMusicPlaying) return;

    // Schedule ahead
    while (melodyScheduleTime < audioCtx.currentTime + 0.3) {
        const currentNoteInfo = MELODY[nextNoteIndex];
        const duration = currentNoteInfo.dur * 1.5; // slow down slightly for emotion

        if (currentNoteInfo.note) {
            const frequency = NOTE_FREQS[currentNoteInfo.note];
            playChime(frequency, melodyScheduleTime, duration);
        }

        melodyScheduleTime += duration;
        nextNoteIndex = (nextNoteIndex + 1) % MELODY.length;
    }

    playbackTimeoutId = setTimeout(scheduler, 50);
}

function startMusic() {
    initAudio();
    state.isMusicPlaying = true;
    melodyScheduleTime = audioCtx.currentTime + 0.1;
    nextNoteIndex = 0;

    document.getElementById('music-btn').classList.add('playing');
    scheduler();
}

function stopMusic() {
    state.isMusicPlaying = false;
    document.getElementById('music-btn').classList.remove('playing');
    if (playbackTimeoutId) {
        clearTimeout(playbackTimeoutId);
    }
}

function toggleMusic() {
    if (state.isMusicPlaying) {
        stopMusic();
    } else {
        startMusic();
    }
}

// --- CANVAS PARTICLE/CELEBRATION ENGINE ---
class CanvasEffects {
    constructor() {
        this.canvas = document.getElementById('effectsCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.particles = [];
        this.sparkles = [];
        this.fireworks = [];
        this.active = true;

        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());

        // Add ambient sparkles right away
        for (let i = 0; i < 40; i++) {
            this.sparkles.push(this.createSparkle(true));
        }

        this.animate();
    }

    resizeCanvas() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    createSparkle(randomY = false) {
        return {
            x: Math.random() * this.canvas.width,
            y: randomY ? Math.random() * this.canvas.height : this.canvas.height + 10,
            size: Math.random() * 2.5 + 0.5,
            speedY: -(Math.random() * 0.7 + 0.2),
            speedX: (Math.random() - 0.5) * 0.4,
            opacity: Math.random() * 0.8 + 0.2,
            pulseSpeed: Math.random() * 0.02 + 0.01,
            color: `rgba(255, 223, 100, ${Math.random() * 0.4 + 0.1})`
        };
    }

    createConfetti(x, y, count = 60) {
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 10 + 5;
            const colors = ['#ff285a', '#09d7a0', '#ffba1a', '#0c7a9f', '#e056fd', '#f0932b', '#b33939'];

            this.particles.push({
                x: x || this.canvas.width / 2,
                y: y || this.canvas.height * 0.6,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed - (Math.random() * 4 + 3), // lift up
                width: Math.random() * 8 + 6,
                height: Math.random() * 12 + 8,
                color: colors[Math.floor(Math.random() * colors.length)],
                rotation: Math.random() * 360,
                rotationSpeed: (Math.random() - 0.5) * 15,
                gravity: 0.22,
                friction: 0.98,
                fadeSpeed: Math.random() * 0.005 + 0.005,
                opacity: 1
            });
        }
    }

    createFirework(x, y) {
        const hues = [0, 45, 120, 190, 280, 320];
        const baseHue = hues[Math.floor(Math.random() * hues.length)];
        const sparkCount = 100 + Math.floor(Math.random() * 50);

        // Create sound feedback synth when firework explodes
        initAudio();
        if (audioCtx) {
            // Crackle generator
            const now = audioCtx.currentTime;
            const osc = audioCtx.createOscillator();
            const noiseGain = audioCtx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(120 - Math.random() * 40, now);
            osc.frequency.exponentialRampToValueAtTime(10, now + 0.3);

            noiseGain.gain.setValueAtTime(0.08, now);
            noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
            osc.connect(noiseGain);
            noiseGain.connect(audioCtx.destination);
            osc.start(now);
            osc.stop(now + 0.4);
        }

        for (let i = 0; i < sparkCount; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 11 + 2;
            const hue = (baseHue + (Math.random() - 0.5) * 20 + 360) % 360;
            const lightness = 60 + Math.floor(Math.random() * 20);

            this.fireworks.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                size: Math.random() * 2.5 + 1.2,
                color: `hsla(${hue}, 100%, ${lightness}%, `,
                gravity: 0.12,
                friction: 0.94,
                fade: Math.random() * 0.015 + 0.008,
                opacity: 1.0
            });
        }
    }

    animate() {
        if (!this.active) return;
        requestAnimationFrame(() => this.animate());

        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // 1. Draw Ambient Sparkles
        if (this.sparkles.length < 50 && Math.random() < 0.15) {
            this.sparkles.push(this.createSparkle());
        }

        for (let i = this.sparkles.length - 1; i >= 0; i--) {
            const s = this.sparkles[i];
            s.y += s.speedY;
            s.x += s.speedX;
            s.opacity += s.pulseSpeed;
            if (s.opacity > 0.8 || s.opacity < 0.15) {
                s.pulseSpeed = -s.pulseSpeed;
            }

            this.ctx.fillStyle = s.color;
            this.ctx.beginPath();
            this.ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
            this.ctx.fill();

            // Remove off-screen sparkles
            if (s.y < -10) {
                this.sparkles.splice(i, 1);
            }
        }

        // 2. Update and Draw Confetti
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];

            p.vy += p.gravity;
            p.vx *= p.friction;
            p.vy *= p.friction;

            p.x += p.vx;
            p.y += p.vy;

            p.rotation += p.rotationSpeed;
            p.opacity -= p.fadeSpeed;

            if (p.opacity <= 0 || p.y > this.canvas.height + 20) {
                this.particles.splice(i, 1);
                continue;
            }

            this.ctx.save();
            this.ctx.translate(p.x, p.y);
            this.ctx.rotate((p.rotation * Math.PI) / 180);
            this.ctx.fillStyle = p.color;
            this.ctx.globalAlpha = p.opacity;

            // Draw rectangular confetti piece
            this.ctx.fillRect(-p.width / 2, -p.height / 2, p.width, p.height);
            this.ctx.restore();
        }

        // 3. Update and Draw Fireworks
        for (let i = this.fireworks.length - 1; i >= 0; i--) {
            const f = this.fireworks[i];
            f.vy += f.gravity;
            f.vx *= f.friction;
            f.vy *= f.friction;
            f.x += f.vx;
            f.y += f.vy;
            f.opacity -= f.fade;

            if (f.opacity <= 0) {
                this.fireworks.splice(i, 1);
                continue;
            }

            this.ctx.fillStyle = f.color + f.opacity + ')';
            this.ctx.beginPath();
            this.ctx.arc(f.x, f.y, f.size, 0, Math.PI * 2);
            this.ctx.fill();

            // draw subtle light trails
            this.ctx.save();
            this.ctx.globalAlpha = f.opacity * 0.3;
            this.ctx.strokeStyle = f.color + '0.5)';
            this.ctx.lineWidth = f.size * 0.7;
            this.ctx.beginPath();
            this.ctx.moveTo(f.x, f.y);
            this.ctx.lineTo(f.x - f.vx * 1.5, f.y - f.vy * 1.5);
            this.ctx.stroke();
            this.ctx.restore();
        }
    }
}

// --- TYPEWRITER EFFECT ---
function startTypewriter(element, text, speed = 40, callback) {
    element.innerHTML = '';
    let index = 0;

    if (state.typewriterTimer) clearInterval(state.typewriterTimer);

    state.typewriterTimer = setInterval(() => {
        if (index < text.length) {
            element.innerHTML += text.charAt(index);
            index++;
        } else {
            clearInterval(state.typewriterTimer);
            state.typewriterTimer = null;
            if (callback) callback();
        }
    }, speed);
}

// --- CELEBRATION SEQUENCES & STAGE TRIGGERS ---
function triggerFireworksShow() {
    let count = 0;
    const launchFirework = () => {
        if (count > 25) return; // End fireworks show
        const x = Math.random() * window.innerWidth * 0.8 + window.innerWidth * 0.1;
        const y = Math.random() * window.innerHeight * 0.4 + window.innerHeight * 0.15;

        if (state.canvasEffects) {
            state.canvasEffects.createFirework(x, y);
        }
        count++;
        setTimeout(launchFirework, Math.random() * 400 + 150);
    };
    launchFirework();
}

function blowCandle(candleDiv) {
    if (!candleDiv.classList.contains('active')) return;

    candleDiv.classList.remove('active');
    candleDiv.classList.add('blown-out');

    // Fire spark canvas particle at candle location
    const rect = candleDiv.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;

    if (state.canvasEffects) {
        state.canvasEffects.createConfetti(x, y, 12);
    }

    // Play soft chime sound on extinguishing
    initAudio();
    if (audioCtx) {
        const now = audioCtx.currentTime;
        const osc = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(500 - (state.blownCandlesCount * 80), now);
        osc.frequency.exponentialRampToValueAtTime(100, now + 0.15);
        gainNode.gain.setValueAtTime(0.15, now);
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
        osc.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        osc.start(now);
        osc.stop(now + 0.2);
    }

    state.blownCandlesCount++;

    // Check if all candles are blown
    if (state.blownCandlesCount === state.totalCandles) {
        // Blow out complete!
        document.getElementById('cakePrompt').innerText = "Make a wish... Confirmed! ✨";

        setTimeout(() => {
            // Trigger canvas fireworks show
            triggerFireworksShow();
            // Fanfare audio
            playSuccessFanfare();
            // Reveal message
            const wishesMsg = document.getElementById('wishesMessage');
            wishesMsg.classList.remove('hidden');
            wishesMsg.classList.add('fade-in');
        }, 600);
    }
}

function openSurpriseGift() {
    const giftBox = document.getElementById('interactiveGift');
    giftBox.classList.add('open');

    // Pulse the launch button
    document.getElementById('open-gift-btn').disabled = true;
    document.getElementById('open-gift-btn').innerText = "Opening Box... 🎁";

    // Confetti explosion from box coordinates
    const rect = giftBox.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;

    initAudio();

    // Launch initial confetti
    setTimeout(() => {
        if (state.canvasEffects) {
            state.canvasEffects.createConfetti(x, y, 100);
        }
        // Whoosh / Pop synth sound
        if (audioCtx) {
            const now = audioCtx.currentTime;
            const osc = audioCtx.createOscillator();
            const gainNode = audioCtx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(150, now);
            osc.frequency.exponentialRampToValueAtTime(800, now + 0.3);
            gainNode.gain.setValueAtTime(0.1, now);
            gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
            osc.connect(gainNode);
            gainNode.connect(audioCtx.destination);
            osc.start(now);
            osc.stop(now + 0.4);
        }
    }, 350);

    // Transition to main card screen after box lid explodes
    setTimeout(() => {
        // Start music loop upon user click interaction (unlocks browser policies)
        startMusic();

        const introStage = document.getElementById('intro-stage');
        const cardStage = document.getElementById('card-stage');

        introStage.classList.add('fade-out');

        setTimeout(() => {
            introStage.classList.remove('active');
            cardStage.classList.add('active');

            // Trigger subtle entryway confetti
            if (state.canvasEffects) {
                state.canvasEffects.createConfetti(window.innerWidth / 2, window.innerHeight * 0.3, 50);
            }
        }, 500);
    }, 1300);
}

function handleCardToggled() {
    const card = document.getElementById('bCard');
    const tapeInstruction = document.getElementById('tapInstruction');

    if (card.classList.contains('open')) {
        // Clicked to fold back card
        card.classList.remove('open');
        tapeInstruction.innerText = "Tap card to open 👆";
        tapeInstruction.style.display = 'block';

        // Stop typewriter text
        if (state.typewriterTimer) {
            clearInterval(state.typewriterTimer);
            state.typewriterTimer = null;
        }
    } else {
        // Clicked to Open Card
        card.classList.add('open');
        tapeInstruction.style.display = 'none';

        // Trigger typewriter animation inside the card text container
        const msgElement = document.getElementById('typewriterMessage');
        const fullMessageText = msgElement.getAttribute('data-message');

        // Add floating hearts when card is opened
        triggerHeartsUp();

        startTypewriter(msgElement, fullMessageText, 35, () => {
            // reveal cake interaction immediately after writing completes
            const cakeStage = document.getElementById('cakeStage');
            cakeStage.classList.remove('hidden');
            cakeStage.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        });
    }
}

function triggerHeartsUp() {
    if (!state.canvasEffects) return;
    const count = 15;
    for (let i = 0; i < count; i++) {
        setTimeout(() => {
            const cardEl = document.getElementById('bCard');
            const rect = cardEl.getBoundingClientRect();
            const x = rect.left + rect.width / 2 + (Math.random() - 0.5) * 100;
            const y = rect.top + rect.height / 2;

            state.canvasEffects.createConfetti(x, y, 3);
        }, i * 80);
    }
}

// Reset variables and stages to re-deliver the surprise
function replaySurprise() {
    // Clear any timers
    if (state.typewriterTimer) clearInterval(state.typewriterTimer);
    state.blownCandlesCount = 0;

    // Re-candle properties
    document.querySelectorAll('.candle').forEach(c => {
        c.classList.remove('blown-out');
        c.classList.add('active');
    });

    // Reset stages
    document.getElementById('wishesMessage').classList.add('hidden');
    document.getElementById('cakeStage').classList.add('hidden');
    document.getElementById('bCard').classList.remove('open');
    document.getElementById('tapInstruction').style.display = 'block';
    document.getElementById('interactiveGift').classList.remove('open');

    const openBtn = document.getElementById('open-gift-btn');
    openBtn.disabled = false;
    openBtn.innerText = "Click to Open Your Surprise 🎁";

    // Animation transition
    document.getElementById('card-stage').classList.remove('active');

    const intro = document.getElementById('intro-stage');
    intro.classList.remove('fade-out');
    intro.classList.add('active');

    // Confetti burst
    setTimeout(() => {
        if (state.canvasEffects) {
            state.canvasEffects.createConfetti(window.innerWidth / 2, window.innerHeight * 0.4, 40);
        }
    }, 100);
}

// --- SETUP EVENT LISTENERS ---
document.addEventListener('DOMContentLoaded', () => {
    // Initialize canvas effects
    state.canvasEffects = new CanvasEffects();

    // Event: Music toggle button
    document.getElementById('music-btn').addEventListener('click', toggleMusic);

    // Event: Gift intro animations
    const openGiftBtn = document.getElementById('open-gift-btn');
    const giftBox = document.getElementById('interactiveGift');

    openGiftBtn.addEventListener('click', openSurpriseGift);
    giftBox.addEventListener('click', openSurpriseGift);

    // Event: 3D Card click toggles
    document.getElementById('bCard').addEventListener('click', handleCardToggled);

    // Event: Blowing Cake Candles
    document.querySelectorAll('.candle').forEach(candle => {
        candle.addEventListener('click', (e) => {
            e.stopPropagation(); // prevent card toggles if clicked nested elements (fallback)
            blowCandle(candle);
        });
    });

    // Event: Replay button
    document.getElementById('replay-btn').addEventListener('click', replaySurprise);
});
