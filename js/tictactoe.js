class TicTacToe {
    constructor() {
        this.board = Array(9).fill('');
        this.currentPlayer = 'X';
        this.isGameActive = true;
        this.gameMode = 'pve'; // 'pve' or 'pvp'
        this.difficulty = 'hard'; // 'easy', 'medium', 'hard'
        this.theme = 'classic'; // 'classic', 'cyber', 'animals', 'elements'

        this.themes = {
            classic: { X: 'X', O: 'O', nameX: 'Player X', nameO: 'Player O' },
            cyber: { X: '⚡', O: '🔮', nameX: 'Spark', nameO: 'Orb' },
            animals: { X: '🐱', O: '🐶', nameX: 'Cat', nameO: 'Dog' },
            elements: { X: '🔥', O: '❄️', nameX: 'Fire', nameO: 'Ice' }
        };

        this.scores = {
            X: 0,
            O: 0,
            ties: 0
        };

        this.winningCombos = [
            [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
            [0, 3, 6], [1, 4, 7], [2, 5, 8], // cols
            [0, 4, 8], [2, 4, 6]             // diagonals
        ];

        this.loadScores();
    }

    init() {
        this.cells = document.querySelectorAll('#ttt-board .cell');
        this.statusText = document.getElementById('ttt-status');
        this.scoreX = document.getElementById('ttt-score-x');
        this.scoreO = document.getElementById('ttt-score-o');
        this.scoreTies = document.getElementById('ttt-score-ties');
        this.labelX = document.getElementById('ttt-label-x');
        this.labelO = document.getElementById('ttt-label-o');

        this.bindEvents();
        this.updateThemeLabels();
        this.updateScoreboard();
        this.resetGame();
    }

    bindEvents() {
        this.cells.forEach(cell => {
            cell.addEventListener('click', (e) => this.handleCellClick(e));
        });

        const modeSelect = document.getElementById('ttt-mode');
        if (modeSelect) {
            modeSelect.addEventListener('change', (e) => {
                this.gameMode = e.target.value;
                const diffContainer = document.getElementById('ttt-difficulty-container');
                if (diffContainer) {
                    diffContainer.style.display = this.gameMode === 'pve' ? 'flex' : 'none';
                }
                this.resetGame();
            });
        }

        const diffSelect = document.getElementById('ttt-difficulty');
        if (diffSelect) {
            diffSelect.addEventListener('change', (e) => {
                this.difficulty = e.target.value;
                this.resetGame();
            });
        }

        const themeSelect = document.getElementById('ttt-theme');
        if (themeSelect) {
            themeSelect.addEventListener('change', (e) => {
                this.theme = e.target.value;
                this.updateThemeLabels();
                this.renderBoard();
            });
        }

        const resetBtn = document.getElementById('ttt-restart-btn');
        if (resetBtn) {
            resetBtn.addEventListener('click', () => {
                window.soundFx?.playClick();
                this.resetGame();
            });
        }

        const resetScoresBtn = document.getElementById('ttt-reset-scores-btn');
        if (resetScoresBtn) {
            resetScoresBtn.addEventListener('click', () => {
                window.soundFx?.playClick();
                this.scores = { X: 0, O: 0, ties: 0 };
                this.saveScores();
                this.updateScoreboard();
            });
        }
    }

    updateThemeLabels() {
        const t = this.themes[this.theme];
        if (this.labelX) this.labelX.textContent = `${t.X} (${this.gameMode === 'pve' ? 'You' : 'P1'})`;
        if (this.labelO) this.labelO.textContent = `${t.O} (${this.gameMode === 'pve' ? 'AI' : 'P2'})`;
    }

    handleCellClick(e) {
        const index = parseInt(e.target.dataset.index, 10);
        if (this.board[index] !== '' || !this.isGameActive) return;

        this.makeMove(index, this.currentPlayer);

        if (this.isGameActive && this.gameMode === 'pve' && this.currentPlayer === 'O') {
            // AI Turn
            this.setTurnIndicator(false);
            setTimeout(() => {
                if (!this.isGameActive) return;
                const aiMove = this.getAIMove();
                if (aiMove !== null) {
                    this.makeMove(aiMove, 'O');
                }
            }, 320);
        }
    }

    makeMove(index, player) {
        this.board[index] = player;
        window.soundFx?.playMove(player === 'X');
        this.renderBoard();

        const winResult = this.checkWin(this.board, player);
        if (winResult) {
            this.endGame(false, winResult);
            return;
        }

        if (this.checkTie(this.board)) {
            this.endGame(true);
            return;
        }

        this.currentPlayer = this.currentPlayer === 'X' ? 'O' : 'X';
        this.setTurnIndicator(true);
    }

    renderBoard() {
        const t = this.themes[this.theme];
        this.cells.forEach((cell, idx) => {
            const val = this.board[idx];
            cell.textContent = val ? t[val] : '';
            cell.classList.remove('x-cell', 'o-cell');
            if (val === 'X') cell.classList.add('x-cell');
            if (val === 'O') cell.classList.add('o-cell');
        });
    }

    setTurnIndicator(canPlay = true) {
        const t = this.themes[this.theme];
        if (!this.isGameActive) return;

        const isPlayerTurn = this.gameMode === 'pve' ? (this.currentPlayer === 'X') : true;
        const name = this.currentPlayer === 'X'
            ? (this.gameMode === 'pve' ? 'Your' : `${t.nameX}'s`)
            : (this.gameMode === 'pve' ? "AI's Thinking..." : `${t.nameO}'s`);

        if (this.statusText) {
            this.statusText.textContent = `${name} Turn (${t[this.currentPlayer]})`;
            this.statusText.className = `status-bar turn-${this.currentPlayer.toLowerCase()}`;
        }
    }

    checkWin(board, player) {
        for (const combo of this.winningCombos) {
            const [a, b, c] = combo;
            if (board[a] === player && board[b] === player && board[c] === player) {
                return { combo, winner: player };
            }
        }
        return null;
    }

    checkTie(board) {
        return board.every(cell => cell !== '');
    }

    endGame(isTie, winData = null) {
        this.isGameActive = false;
        const t = this.themes[this.theme];

        if (isTie) {
            this.scores.ties++;
            if (this.statusText) {
                this.statusText.textContent = "🤝 It's a Tie Game!";
                this.statusText.className = 'status-bar tie';
            }
            window.soundFx?.playTie();
        } else {
            const winner = winData.winner;
            this.scores[winner]++;
            const winnerName = (this.gameMode === 'pve')
                ? (winner === 'X' ? '🎉 You Win!' : '🤖 AI Wins!')
                : `🎉 ${t['name' + winner]} Wins!`;

            if (this.statusText) {
                this.statusText.textContent = winnerName;
                this.statusText.className = `status-bar win-${winner.toLowerCase()}`;
            }

            // Highlight winning cells
            winData.combo.forEach(idx => {
                this.cells[idx].classList.add('winning-cell');
            });

            window.soundFx?.playWin();
            if (this.gameMode !== 'pve' || winner === 'X') {
                window.confetti?.fire(3000, 100);
            }
        }

        this.saveScores();
        this.updateScoreboard();
    }

    getAIMove() {
        const available = this.board.map((v, i) => v === '' ? i : null).filter(v => v !== null);
        if (available.length === 0) return null;

        // Difficulty handling
        if (this.difficulty === 'easy') {
            return available[Math.floor(Math.random() * available.length)];
        }

        if (this.difficulty === 'medium') {
            // 60% chance to play optimal minimax, 40% random
            if (Math.random() > 0.6) {
                return available[Math.floor(Math.random() * available.length)];
            }
        }

        // Hard: Unbeatable Minimax
        return this.minimaxBestMove();
    }

    minimaxBestMove() {
        let bestScore = -Infinity;
        let bestMove = null;
        const available = this.board.map((v, i) => v === '' ? i : null).filter(v => v !== null);

        // If it's the very first move and center is free, pick center or corner
        if (available.length >= 8) {
            if (this.board[4] === '') return 4;
            const corners = [0, 2, 6, 8].filter(c => this.board[c] === '');
            if (corners.length > 0) return corners[Math.floor(Math.random() * corners.length)];
        }

        for (const idx of available) {
            this.board[idx] = 'O';
            const score = this.minimax(this.board, 0, false, -Infinity, Infinity);
            this.board[idx] = '';
            if (score > bestScore) {
                bestScore = score;
                bestMove = idx;
            }
        }

        return bestMove !== null ? bestMove : available[0];
    }

    minimax(board, depth, isMaximizing, alpha, beta) {
        if (this.checkWin(board, 'O')) return 10 - depth;
        if (this.checkWin(board, 'X')) return depth - 10;
        if (this.checkTie(board)) return 0;
        if (depth >= 6) return 0; // Optimization depth cap

        const available = board.map((v, i) => v === '' ? i : null).filter(v => v !== null);

        if (isMaximizing) {
            let maxEval = -Infinity;
            for (const idx of available) {
                board[idx] = 'O';
                const score = this.minimax(board, depth + 1, false, alpha, beta);
                board[idx] = '';
                maxEval = Math.max(maxEval, score);
                alpha = Math.max(alpha, score);
                if (beta <= alpha) break;
            }
            return maxEval;
        } else {
            let minEval = Infinity;
            for (const idx of available) {
                board[idx] = 'X';
                const score = this.minimax(board, depth + 1, true, alpha, beta);
                board[idx] = '';
                minEval = Math.min(minEval, score);
                beta = Math.min(beta, score);
                if (beta <= alpha) break;
            }
            return minEval;
        }
    }

    resetGame() {
        this.board = Array(9).fill('');
        this.currentPlayer = 'X';
        this.isGameActive = true;
        this.cells.forEach(cell => {
            cell.textContent = '';
            cell.className = 'cell';
        });
        this.updateThemeLabels();
        this.setTurnIndicator(true);
    }

    saveScores() {
        localStorage.setItem('ttt_scores', JSON.stringify(this.scores));
    }

    loadScores() {
        try {
            const saved = localStorage.getItem('ttt_scores');
            if (saved) this.scores = JSON.parse(saved);
        } catch (e) {}
    }

    updateScoreboard() {
        if (this.scoreX) this.scoreX.textContent = this.scores.X;
        if (this.scoreO) this.scoreO.textContent = this.scores.O;
        if (this.scoreTies) this.scoreTies.textContent = this.scores.ties;
    }
}

window.TicTacToe = TicTacToe;
