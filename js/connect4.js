class ConnectFour {
    constructor() {
        this.rows = 6;
        this.cols = 7;
        this.board = Array(this.rows).fill(null).map(() => Array(this.cols).fill(0)); // 0: empty, 1: Red, 2: Yellow
        this.currentPlayer = 1; // 1: Red (Human), 2: Yellow (AI/P2)
        this.isGameActive = true;
        this.gameMode = 'pve'; // 'pve' or 'pvp'
        this.isDropping = false;

        this.scores = {
            p1: 0,
            p2: 0
        };

        this.loadScores();
    }

    init() {
        this.boardEl = document.getElementById('c4-board');
        this.statusText = document.getElementById('c4-status');
        this.scoreP1 = document.getElementById('c4-score-p1');
        this.scoreP2 = document.getElementById('c4-score-p2');
        this.labelP1 = document.getElementById('c4-label-p1');
        this.labelP2 = document.getElementById('c4-label-p2');

        this.buildBoard();
        this.bindEvents();
        this.updateScoreboard();
        this.resetGame();
    }

    buildBoard() {
        if (!this.boardEl) return;
        this.boardEl.innerHTML = '';

        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                const slot = document.createElement('div');
                slot.classList.add('c4-slot');
                slot.dataset.row = r;
                slot.dataset.col = c;

                const piece = document.createElement('div');
                piece.classList.add('c4-piece');
                slot.appendChild(piece);

                slot.addEventListener('click', () => this.handleColumnClick(c));
                slot.addEventListener('mouseenter', () => this.showColumnHover(c));
                this.boardEl.appendChild(slot);
            }
        }
    }

    bindEvents() {
        const modeSelect = document.getElementById('c4-mode');
        if (modeSelect) {
            modeSelect.addEventListener('change', (e) => {
                this.gameMode = e.target.value;
                if (this.labelP2) {
                    this.labelP2.textContent = this.gameMode === 'pve' ? 'AI (Yellow)' : 'Player 2 (Yellow)';
                }
                this.resetGame();
            });
        }

        const resetBtn = document.getElementById('c4-restart-btn');
        if (resetBtn) {
            resetBtn.addEventListener('click', () => {
                window.soundFx?.playClick();
                this.resetGame();
            });
        }

        const resetScoresBtn = document.getElementById('c4-reset-scores-btn');
        if (resetScoresBtn) {
            resetScoresBtn.addEventListener('click', () => {
                window.soundFx?.playClick();
                this.scores = { p1: 0, p2: 0 };
                this.saveScores();
                this.updateScoreboard();
            });
        }
    }

    showColumnHover(col) {
        if (!this.isGameActive || this.isDropping) return;
        if (this.gameMode === 'pve' && this.currentPlayer === 2) return;

        const allSlots = document.querySelectorAll('.c4-slot');
        allSlots.forEach(s => s.classList.remove('col-hover'));

        const colSlots = document.querySelectorAll(`.c4-slot[data-col='${col}']`);
        colSlots.forEach(s => s.classList.add('col-hover'));
    }

    handleColumnClick(col) {
        if (!this.isGameActive || this.isDropping) return;
        if (this.gameMode === 'pve' && this.currentPlayer === 2) return;

        this.dropPiece(col, this.currentPlayer);
    }

    findLowestEmptyRow(col) {
        for (let r = this.rows - 1; r >= 0; r--) {
            if (this.board[r][col] === 0) return r;
        }
        return -1;
    }

    async dropPiece(col, player) {
        const row = this.findLowestEmptyRow(col);
        if (row === -1) return; // Column full

        this.isDropping = true;
        this.board[row][col] = player;
        window.soundFx?.playDrop();

        // Render drop animation visually
        const slot = document.querySelector(`.c4-slot[data-row='${row}'][data-col='${col}']`);
        const piece = slot.querySelector('.c4-piece');
        piece.classList.add(player === 1 ? 'player1' : 'player2');
        piece.classList.add('drop-animate');

        await new Promise(r => setTimeout(r, 260));
        piece.classList.remove('drop-animate');

        const winResult = this.checkWin(this.board, player);
        if (winResult) {
            this.endGame(false, winResult);
            this.isDropping = false;
            return;
        }

        if (this.checkTie()) {
            this.endGame(true);
            this.isDropping = false;
            return;
        }

        this.currentPlayer = this.currentPlayer === 1 ? 2 : 1;
        this.updateStatus();
        this.isDropping = false;

        // If PVE and now AI's turn
        if (this.isGameActive && this.gameMode === 'pve' && this.currentPlayer === 2) {
            setTimeout(() => {
                if (!this.isGameActive) return;
                const aiCol = this.getAIMove();
                if (aiCol !== -1) {
                    this.dropPiece(aiCol, 2);
                }
            }, 360);
        }
    }

    updateStatus() {
        if (!this.isGameActive || !this.statusText) return;

        if (this.currentPlayer === 1) {
            this.statusText.textContent = this.gameMode === 'pve' ? '🔴 Your Turn (Red)' : '🔴 Player 1 Turn (Red)';
            this.statusText.className = 'status-bar turn-x';
        } else {
            this.statusText.textContent = this.gameMode === 'pve' ? '🟡 AI Thinking...' : '🟡 Player 2 Turn (Yellow)';
            this.statusText.className = 'status-bar turn-o';
        }
    }

    checkWin(board, player) {
        // Horizontal
        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c <= this.cols - 4; c++) {
                if (board[r][c] === player && board[r][c+1] === player &&
                    board[r][c+2] === player && board[r][c+3] === player) {
                    return { winner: player, coords: [[r,c], [r,c+1], [r,c+2], [r,c+3]] };
                }
            }
        }

        // Vertical
        for (let c = 0; c < this.cols; c++) {
            for (let r = 0; r <= this.rows - 4; r++) {
                if (board[r][c] === player && board[r+1][c] === player &&
                    board[r+2][c] === player && board[r+3][c] === player) {
                    return { winner: player, coords: [[r,c], [r+1,c], [r+2,c], [r+3,c]] };
                }
            }
        }

        // Diagonal (positive slope: bottom-left to top-right)
        for (let r = 3; r < this.rows; r++) {
            for (let c = 0; c <= this.cols - 4; c++) {
                if (board[r][c] === player && board[r-1][c+1] === player &&
                    board[r-2][c+2] === player && board[r-3][c+3] === player) {
                    return { winner: player, coords: [[r,c], [r-1,c+1], [r-2,c+2], [r-3,c+3]] };
                }
            }
        }

        // Diagonal (negative slope: top-left to bottom-right)
        for (let r = 0; r <= this.rows - 4; r++) {
            for (let c = 0; c <= this.cols - 4; c++) {
                if (board[r][c] === player && board[r+1][c+1] === player &&
                    board[r+2][c+2] === player && board[r+3][c+3] === player) {
                    return { winner: player, coords: [[r,c], [r+1,c+1], [r+2,c+2], [r+3,c+3]] };
                }
            }
        }

        return null;
    }

    checkTie() {
        return this.board[0].every(cell => cell !== 0);
    }

    endGame(isTie, winData = null) {
        this.isGameActive = false;

        if (isTie) {
            if (this.statusText) {
                this.statusText.textContent = "🤝 It's a Draw!";
                this.statusText.className = 'status-bar tie';
            }
            window.soundFx?.playTie();
        } else {
            const winner = winData.winner;
            if (winner === 1) this.scores.p1++;
            else this.scores.p2++;

            const winText = (this.gameMode === 'pve')
                ? (winner === 1 ? '🎉 You Won Connect 4!' : '🤖 AI Won Connect 4!')
                : `🎉 Player ${winner} Wins!`;

            if (this.statusText) {
                this.statusText.textContent = winText;
                this.statusText.className = `status-bar ${winner === 1 ? 'win-x' : 'win-o'}`;
            }

            // Highlight winning discs
            winData.coords.forEach(([r, c]) => {
                const slot = document.querySelector(`.c4-slot[data-row='${r}'][data-col='${c}']`);
                slot?.querySelector('.c4-piece')?.classList.add('c4-winning-piece');
            });

            window.soundFx?.playWin();
            if (this.gameMode !== 'pve' || winner === 1) {
                window.confetti?.fire(3000, 100);
            }
        }

        this.saveScores();
        this.updateScoreboard();
    }

    getAIMove() {
        const validCols = [];
        for (let c = 0; c < this.cols; c++) {
            if (this.findLowestEmptyRow(c) !== -1) validCols.push(c);
        }
        if (validCols.length === 0) return -1;

        // 1. Check if AI can win in 1 move
        for (const c of validCols) {
            const r = this.findLowestEmptyRow(c);
            this.board[r][c] = 2;
            if (this.checkWin(this.board, 2)) {
                this.board[r][c] = 0;
                return c;
            }
            this.board[r][c] = 0;
        }

        // 2. Block player if player can win in next move
        for (const c of validCols) {
            const r = this.findLowestEmptyRow(c);
            this.board[r][c] = 1;
            if (this.checkWin(this.board, 1)) {
                this.board[r][c] = 0;
                return c;
            }
            this.board[r][c] = 0;
        }

        // 3. Avoid columns that allow the opponent to win immediately above
        const safeCols = validCols.filter(c => {
            const r = this.findLowestEmptyRow(c);
            if (r - 1 >= 0) {
                this.board[r][c] = 2;
                this.board[r - 1][c] = 1;
                const opponentWins = this.checkWin(this.board, 1);
                this.board[r - 1][c] = 0;
                this.board[r][c] = 0;
                return !opponentWins;
            }
            return true;
        });

        const pool = safeCols.length > 0 ? safeCols : validCols;

        // 4. Prefer center columns (3, then 2 & 4, then 1 & 5)
        const centerPreference = [3, 2, 4, 1, 5, 0, 6];
        for (const c of centerPreference) {
            if (pool.includes(c)) return c;
        }

        return pool[Math.floor(Math.random() * pool.length)];
    }

    resetGame() {
        this.board = Array(this.rows).fill(null).map(() => Array(this.cols).fill(0));
        this.currentPlayer = 1;
        this.isGameActive = true;
        this.isDropping = false;

        const pieces = document.querySelectorAll('.c4-piece');
        pieces.forEach(p => {
            p.className = 'c4-piece';
        });

        this.updateStatus();
    }

    saveScores() {
        localStorage.setItem('c4_scores', JSON.stringify(this.scores));
    }

    loadScores() {
        try {
            const saved = localStorage.getItem('c4_scores');
            if (saved) this.scores = JSON.parse(saved);
        } catch (e) {}
    }

    updateScoreboard() {
        if (this.scoreP1) this.scoreP1.textContent = this.scores.p1;
        if (this.scoreP2) this.scoreP2.textContent = this.scores.p2;
    }
}

window.ConnectFour = ConnectFour;
