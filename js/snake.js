class NeonSnake {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.gridSize = 20;
        this.tileCount = 20;

        this.snake = [];
        this.direction = { x: 0, y: 0 };
        this.nextDirection = { x: 0, y: 0 };
        this.food = { x: 10, y: 10 };
        this.foodType = 'apple';

        this.score = 0;
        this.highScore = parseInt(localStorage.getItem('snake_highscore') || '0', 10);
        this.speed = 110; // ms per tick
        this.gameLoop = null;
        this.isGameActive = false;
        this.isPaused = false;

        this.particles = [];
    }

    init() {
        this.canvas = document.getElementById('snake-canvas');
        if (!this.canvas) return;
        this.ctx = this.canvas.getContext('2d');

        this.scoreEl = document.getElementById('snake-score');
        this.highScoreEl = document.getElementById('snake-high-score');
        this.statusEl = document.getElementById('snake-status');

        if (this.highScoreEl) this.highScoreEl.textContent = this.highScore;

        this.bindEvents();
        this.resetGame();
    }

    bindEvents() {
        window.addEventListener('keydown', (e) => {
            // Only capture if snake tab is active
            const snakeContainer = document.getElementById('game-snake');
            if (!snakeContainer || snakeContainer.classList.contains('hidden')) return;

            switch (e.key) {
                case 'ArrowUp':
                case 'w':
                case 'W':
                    e.preventDefault();
                    this.changeDirection(0, -1);
                    break;
                case 'ArrowDown':
                case 's':
                case 'S':
                    e.preventDefault();
                    this.changeDirection(0, 1);
                    break;
                case 'ArrowLeft':
                case 'a':
                case 'A':
                    e.preventDefault();
                    this.changeDirection(-1, 0);
                    break;
                case 'ArrowRight':
                case 'd':
                case 'D':
                    e.preventDefault();
                    this.changeDirection(1, 0);
                    break;
                case ' ':
                    e.preventDefault();
                    this.togglePause();
                    break;
            }
        });

        // Touch / On-screen D-Pad buttons
        const dpadUp = document.getElementById('dpad-up');
        const dpadDown = document.getElementById('dpad-down');
        const dpadLeft = document.getElementById('dpad-left');
        const dpadRight = document.getElementById('dpad-right');

        dpadUp?.addEventListener('click', () => this.changeDirection(0, -1));
        dpadDown?.addEventListener('click', () => this.changeDirection(0, 1));
        dpadLeft?.addEventListener('click', () => this.changeDirection(-1, 0));
        dpadRight?.addEventListener('click', () => this.changeDirection(1, 0));

        const startBtn = document.getElementById('snake-start-btn');
        startBtn?.addEventListener('click', () => {
            window.soundFx?.playClick();
            this.startGame();
        });

        const speedSelect = document.getElementById('snake-speed');
        speedSelect?.addEventListener('change', (e) => {
            const speeds = { slow: 150, normal: 105, fast: 70 };
            this.speed = speeds[e.target.value] || 105;
            if (this.isGameActive && !this.isPaused) {
                clearInterval(this.gameLoop);
                this.gameLoop = setInterval(() => this.tick(), this.speed);
            }
        });
    }

    changeDirection(x, y) {
        // Prevent 180 reverse turns
        if (this.direction.x !== 0 && x === -this.direction.x) return;
        if (this.direction.y !== 0 && y === -this.direction.y) return;

        this.nextDirection = { x, y };

        if (!this.isGameActive) {
            this.startGame();
        }
    }

    startGame() {
        this.resetGame();
        this.isGameActive = true;
        this.isPaused = false;
        this.direction = { x: 1, y: 0 };
        this.nextDirection = { x: 1, y: 0 };

        if (this.statusEl) {
            this.statusEl.textContent = '🐍 Slithering... Use Arrow Keys / WASD';
            this.statusEl.className = 'status-bar';
        }

        clearInterval(this.gameLoop);
        this.gameLoop = setInterval(() => this.tick(), this.speed);
    }

    togglePause() {
        if (!this.isGameActive) return;
        this.isPaused = !this.isPaused;
        if (this.statusEl) {
            this.statusEl.textContent = this.isPaused ? '⏸️ Paused (Press Space to Resume)' : '🐍 Slithering...';
        }
    }

    resetGame() {
        clearInterval(this.gameLoop);
        this.gameLoop = null;
        this.isGameActive = false;
        this.isPaused = false;
        this.score = 0;
        this.particles = [];

        if (this.scoreEl) this.scoreEl.textContent = '0';
        if (this.statusEl) {
            this.statusEl.textContent = 'Press Start or any Arrow key to begin!';
            this.statusEl.className = 'status-bar';
        }

        this.snake = [
            { x: 8, y: 10 },
            { x: 7, y: 10 },
            { x: 6, y: 10 }
        ];
        this.direction = { x: 0, y: 0 };
        this.nextDirection = { x: 0, y: 0 };
        this.spawnFood();
        this.draw();
    }

    spawnFood() {
        let newX, newY;
        let collision;
        do {
            newX = Math.floor(Math.random() * this.tileCount);
            newY = Math.floor(Math.random() * this.tileCount);
            collision = this.snake.some(segment => segment.x === newX && segment.y === newY);
        } while (collision);

        this.food = { x: newX, y: newY };
    }

    tick() {
        if (this.isPaused) return;

        this.direction = { ...this.nextDirection };
        const head = {
            x: this.snake[0].x + this.direction.x,
            y: this.snake[0].y + this.direction.y
        };

        // Wall collisions
        if (head.x < 0 || head.x >= this.tileCount || head.y < 0 || head.y >= this.tileCount) {
            this.gameOver();
            return;
        }

        // Self collision
        for (let i = 0; i < this.snake.length; i++) {
            if (head.x === this.snake[i].x && head.y === this.snake[i].y) {
                this.gameOver();
                return;
            }
        }

        this.snake.unshift(head);

        // Check food collision
        if (head.x === this.food.x && head.y === this.food.y) {
            this.score += 10;
            if (this.scoreEl) this.scoreEl.textContent = this.score;

            if (this.score > this.highScore) {
                this.highScore = this.score;
                localStorage.setItem('snake_highscore', this.highScore);
                if (this.highScoreEl) this.highScoreEl.textContent = this.highScore;
            }

            window.soundFx?.playEat();
            this.createFoodBurst(head.x * this.gridSize + 10, head.y * this.gridSize + 10);
            this.spawnFood();
        } else {
            this.snake.pop();
        }

        this.draw();
    }

    createFoodBurst(x, y) {
        for (let i = 0; i < 12; i++) {
            this.particles.push({
                x, y,
                vx: (Math.random() - 0.5) * 5,
                vy: (Math.random() - 0.5) * 5,
                alpha: 1,
                color: '#10b981'
            });
        }
    }

    gameOver() {
        clearInterval(this.gameLoop);
        this.isGameActive = false;
        window.soundFx?.playTie();

        if (this.statusEl) {
            this.statusEl.textContent = `💥 Game Over! Final Score: ${this.score}`;
            this.statusEl.className = 'status-bar tie';
        }

        if (this.score >= 100) {
            window.confetti?.fire(2000, 70);
        }
    }

    draw() {
        if (!this.ctx) return;
        const width = this.canvas.width;
        const height = this.canvas.height;

        // Dark neon grid background
        this.ctx.fillStyle = '#0f172a';
        this.ctx.fillRect(0, 0, width, height);

        // Subtle grid lines
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
        this.ctx.lineWidth = 1;
        for (let i = 0; i <= this.tileCount; i++) {
            this.ctx.beginPath();
            this.ctx.moveTo(i * this.gridSize, 0);
            this.ctx.lineTo(i * this.gridSize, height);
            this.ctx.stroke();

            this.ctx.beginPath();
            this.ctx.moveTo(0, i * this.gridSize);
            this.ctx.lineTo(width, i * this.gridSize);
            this.ctx.stroke();
        }

        // Draw food with glowing effect
        this.ctx.save();
        this.ctx.fillStyle = '#ec4899';
        this.ctx.shadowColor = '#f43f5e';
        this.ctx.shadowBlur = 12;
        this.ctx.beginPath();
        const fx = this.food.x * this.gridSize + this.gridSize / 2;
        const fy = this.food.y * this.gridSize + this.gridSize / 2;
        this.ctx.arc(fx, fy, this.gridSize / 2 - 2, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.restore();

        // Draw snake
        this.snake.forEach((segment, index) => {
            this.ctx.save();
            const sx = segment.x * this.gridSize;
            const sy = segment.y * this.gridSize;

            if (index === 0) {
                // Head
                this.ctx.fillStyle = '#10b981';
                this.ctx.shadowColor = '#34d399';
                this.ctx.shadowBlur = 10;
                this.roundRect(this.ctx, sx + 1, sy + 1, this.gridSize - 2, this.gridSize - 2, 6);
                this.ctx.fill();

                // Eyes
                this.ctx.fillStyle = '#ffffff';
                const eyeOffset = 4;
                const eyeSize = 3;
                let e1x = sx + eyeOffset;
                let e1y = sy + eyeOffset;
                let e2x = sx + this.gridSize - eyeOffset - eyeSize;
                let e2y = sy + eyeOffset;

                if (this.direction.y === 1) { // moving down
                    e1y = sy + this.gridSize - eyeOffset - eyeSize;
                    e2y = sy + this.gridSize - eyeOffset - eyeSize;
                } else if (this.direction.x === 1) { // moving right
                    e1x = sx + this.gridSize - eyeOffset - eyeSize;
                    e1y = sy + eyeOffset;
                    e2x = sx + this.gridSize - eyeOffset - eyeSize;
                    e2y = sy + this.gridSize - eyeOffset - eyeSize;
                } else if (this.direction.x === -1) { // moving left
                    e1x = sx + eyeOffset;
                    e1y = sy + eyeOffset;
                    e2x = sx + eyeOffset;
                    e2y = sy + this.gridSize - eyeOffset - eyeSize;
                }

                this.ctx.fillRect(e1x, e1y, eyeSize, eyeSize);
                this.ctx.fillRect(e2x, e2y, eyeSize, eyeSize);

            } else {
                // Body gradient / color
                const colorRatio = index / this.snake.length;
                this.ctx.fillStyle = colorRatio > 0.5 ? '#059669' : '#10b981';
                this.roundRect(this.ctx, sx + 2, sy + 2, this.gridSize - 4, this.gridSize - 4, 4);
                this.ctx.fill();
            }
            this.ctx.restore();
        });

        // Draw particles
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.alpha -= 0.04;

            if (p.alpha <= 0) {
                this.particles.splice(i, 1);
                continue;
            }

            this.ctx.save();
            this.ctx.fillStyle = p.color;
            this.ctx.globalAlpha = p.alpha;
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.restore();
        }
    }

    roundRect(ctx, x, y, width, height, radius) {
        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.lineTo(x + width - radius, y);
        ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
        ctx.lineTo(x + width, y + height - radius);
        ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        ctx.lineTo(x + radius, y + height);
        ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
        ctx.lineTo(x, y + radius);
        ctx.quadraticCurveTo(x, y, x + radius, y);
        ctx.closePath();
    }
}

window.NeonSnake = NeonSnake;
