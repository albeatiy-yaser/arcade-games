class SoundEffects {
    constructor() {
        this.ctx = null;
        this.muted = localStorage.getItem('arcade_sound_muted') === 'true';
    }

    init() {
        if (!this.ctx) {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (AudioContext) {
                this.ctx = new AudioContext();
            }
        }
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    toggleMute() {
        this.muted = !this.muted;
        localStorage.setItem('arcade_sound_muted', this.muted);
        return this.muted;
    }

    playTone(frequency, type, duration, startVol = 0.15, endVol = 0.001) {
        if (this.muted) return;
        this.init();
        if (!this.ctx) return;

        try {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = type;
            osc.frequency.setValueAtTime(frequency, this.ctx.currentTime);

            gain.gain.setValueAtTime(startVol, this.ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(endVol, this.ctx.currentTime + duration);

            osc.connect(gain);
            gain.connect(this.ctx.destination);

            osc.start();
            osc.stop(this.ctx.currentTime + duration);
        } catch (e) {
            console.warn('Audio playback error', e);
        }
    }

    playMove(isX = true) {
        if (isX) {
            this.playTone(520, 'sine', 0.12, 0.2);
        } else {
            this.playTone(400, 'sine', 0.12, 0.2);
        }
    }

    playDrop() {
        if (this.muted) return;
        this.init();
        if (!this.ctx) return;

        try {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = 'triangle';
            osc.frequency.setValueAtTime(320, this.ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(140, this.ctx.currentTime + 0.18);

            gain.gain.setValueAtTime(0.25, this.ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.18);

            osc.connect(gain);
            gain.connect(this.ctx.destination);

            osc.start();
            osc.stop(this.ctx.currentTime + 0.18);
        } catch (e) {}
    }

    playFlip() {
        this.playTone(440, 'triangle', 0.08, 0.15);
    }

    playMatch() {
        if (this.muted) return;
        this.init();
        if (!this.ctx) return;

        const now = this.ctx.currentTime;
        [523.25, 659.25, 783.99].forEach((freq, idx) => {
            setTimeout(() => {
                this.playTone(freq, 'sine', 0.15, 0.18);
            }, idx * 60);
        });
    }

    playEat() {
        this.playTone(680, 'square', 0.08, 0.1);
    }

    playWin() {
        if (this.muted) return;
        this.init();
        if (!this.ctx) return;

        const notes = [440, 554.37, 659.25, 880];
        notes.forEach((freq, i) => {
            setTimeout(() => {
                this.playTone(freq, 'triangle', 0.22, 0.25);
            }, i * 90);
        });
    }

    playTie() {
        if (this.muted) return;
        this.init();
        if (!this.ctx) return;

        const notes = [380, 330, 290];
        notes.forEach((freq, i) => {
            setTimeout(() => {
                this.playTone(freq, 'sawtooth', 0.18, 0.1);
            }, i * 110);
        });
    }

    playClick() {
        this.playTone(600, 'sine', 0.04, 0.08);
    }
}

window.soundFx = new SoundEffects();
