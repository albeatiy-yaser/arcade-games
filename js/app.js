document.addEventListener('DOMContentLoaded', () => {
    // Instantiate all game controllers
    const tictactoe = new window.TicTacToe();
    const connect4 = new window.ConnectFour();
    const snake = new window.NeonSnake();
    const memory = new window.MemoryMatch();

    // Initialize the default game
    tictactoe.init();
    connect4.init();
    snake.init();
    memory.init();

    // Sound toggle button
    const soundToggleBtn = document.getElementById('sound-toggle-btn');
    const updateSoundIcon = () => {
        if (!soundToggleBtn) return;
        const isMuted = window.soundFx.muted;
        soundToggleBtn.innerHTML = isMuted ? '🔇 <span class="btn-text">Muted</span>' : '🔊 <span class="btn-text">Sound ON</span>';
        soundToggleBtn.classList.toggle('muted', isMuted);
    };

    updateSoundIcon();

    soundToggleBtn?.addEventListener('click', () => {
        window.soundFx.toggleMute();
        updateSoundIcon();
        if (!window.soundFx.muted) {
            window.soundFx.playClick();
        }
    });

    // Navigation Tabs
    const navButtons = document.querySelectorAll('.nav-tab');
    const gameSections = document.querySelectorAll('.game-section');

    navButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            window.soundFx?.playClick();
            const targetGame = btn.dataset.game;

            navButtons.forEach(b => b.classList.remove('active'));
            gameSections.forEach(s => s.classList.add('hidden'));

            btn.classList.add('active');
            const targetSection = document.getElementById(`game-${targetGame}`);
            if (targetSection) {
                targetSection.classList.remove('hidden');
            }

            // Pause snake if navigating away
            if (targetGame !== 'snake' && snake.isGameActive && !snake.isPaused) {
                snake.togglePause();
            }
        });
    });
});
