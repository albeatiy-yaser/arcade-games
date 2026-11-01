class MemoryMatch {
    constructor() {
        this.icons = ['🚀', '💎', '🍕', '🐱', '🌟', '👾', '🎈', '🎮'];
        this.cards = [];
        this.flippedCards = [];
        this.matchedPairs = 0;
        this.moves = 0;
        this.timer = 0;
        this.timerInterval = null;
        this.isLocked = false;
        this.bestMoves = parseInt(localStorage.getItem('memory_best_moves') || '0', 10);
    }

    init() {
        this.gridEl = document.getElementById('memory-grid');
        this.movesEl = document.getElementById('memory-moves');
        this.timerEl = document.getElementById('memory-timer');
        this.bestEl = document.getElementById('memory-best');
        this.statusEl = document.getElementById('memory-status');

        if (this.bestEl) {
            this.bestEl.textContent = this.bestMoves > 0 ? this.bestMoves : '-';
        }

        const restartBtn = document.getElementById('memory-restart-btn');
        restartBtn?.addEventListener('click', () => {
            window.soundFx?.playClick();
            this.restart();
        });

        this.restart();
    }

    restart() {
        clearInterval(this.timerInterval);
        this.timerInterval = null;
        this.timer = 0;
        this.moves = 0;
        this.matchedPairs = 0;
        this.flippedCards = [];
        this.isLocked = false;

        if (this.movesEl) this.movesEl.textContent = '0';
        if (this.timerEl) this.timerEl.textContent = '00:00';
        if (this.statusEl) {
            this.statusEl.textContent = 'Flip two cards to find matching pairs!';
            this.statusEl.className = 'status-bar';
        }

        // Duplicate icons for pairs and shuffle
        this.cards = [...this.icons, ...this.icons];
        this.shuffle(this.cards);
        this.renderGrid();
    }

    shuffle(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }

    startTimer() {
        if (this.timerInterval) return;
        this.timerInterval = setInterval(() => {
            this.timer++;
            const mins = String(Math.floor(this.timer / 60)).padStart(2, '0');
            const secs = String(this.timer % 60).padStart(2, '0');
            if (this.timerEl) this.timerEl.textContent = `${mins}:${secs}`;
        }, 1000);
    }

    renderGrid() {
        if (!this.gridEl) return;
        this.gridEl.innerHTML = '';

        this.cards.forEach((icon, index) => {
            const card = document.createElement('div');
            card.classList.add('memory-card');
            card.dataset.index = index;
            card.dataset.icon = icon;

            card.innerHTML = `
                <div class="card-inner">
                    <div class="card-front">?</div>
                    <div class="card-back">${icon}</div>
                </div>
            `;

            card.addEventListener('click', () => this.handleCardClick(card));
            this.gridEl.appendChild(card);
        });
    }

    handleCardClick(card) {
        if (this.isLocked) return;
        if (card.classList.contains('flipped') || card.classList.contains('matched')) return;

        this.startTimer();

        card.classList.add('flipped');
        window.soundFx?.playFlip();
        this.flippedCards.push(card);

        if (this.flippedCards.length === 2) {
            this.moves++;
            if (this.movesEl) this.movesEl.textContent = this.moves;
            this.checkMatch();
        }
    }

    checkMatch() {
        const [card1, card2] = this.flippedCards;
        const match = card1.dataset.icon === card2.dataset.icon;

        if (match) {
            window.soundFx?.playMatch();
            card1.classList.add('matched');
            card2.classList.add('matched');
            this.matchedPairs++;
            this.flippedCards = [];

            if (this.matchedPairs === this.icons.length) {
                this.handleWin();
            }
        } else {
            this.isLocked = true;
            setTimeout(() => {
                card1.classList.remove('flipped');
                card2.classList.remove('flipped');
                this.flippedCards = [];
                this.isLocked = false;
            }, 850);
        }
    }

    handleWin() {
        clearInterval(this.timerInterval);
        this.timerInterval = null;

        if (this.bestMoves === 0 || this.moves < this.bestMoves) {
            this.bestMoves = this.moves;
            localStorage.setItem('memory_best_moves', this.bestMoves);
            if (this.bestEl) this.bestEl.textContent = this.bestMoves;
        }

        window.soundFx?.playWin();
        window.confetti?.fire(3500, 110);

        if (this.statusEl) {
            this.statusEl.textContent = `🎉 Fantastic! Completed in ${this.moves} moves!`;
            this.statusEl.className = 'status-bar win-x';
        }
    }
}

window.MemoryMatch = MemoryMatch;
