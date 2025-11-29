// game.js - ОБНОВЛЕННАЯ ВЕРСИЯ С РАЗДЕЛЕННЫМ ЛУЧШИМ СЧЕТОМ И МГНОВЕННЫМ СОХРАНЕНИЕМ
class Game2048 {
    constructor() {
        this.config = window.AppConfig;
        this.elements = this.cacheElements();
        this.state = this.initialState();
        this.init();
    }
    
    cacheElements() {
        const elements = {};
        const ids = [
            'main-menu', 'game-screen', 'board', 'score', 'best-score',
            'game-end-modal', 'best-tile', 'time-left', 'time-container', 
            'best-tile-container', 'new-record-badge', 'total-games', 
            'total-wins', 'best-score-overall', 'cheat-input', 'apply-cheat-btn', 
            'cheat-modal', 'close-cheat', 'main-cheat-btn', 'game-cheat-btn',
            'main-menu-modal', 'in-game-menu-modal', 'themes-modal', 'stats-modal',
            'confirm-modal', 'start-time-modal', 'yazhopka-modal', 'close-stats',
            'reset-best-score-btn', 'reset-all-stats-btn', 'stats-total-games',
            'stats-total-wins', 'stats-best-score', 'stats-best-speed-score',
            'confirm-message', 'confirm-yes', 'confirm-no', 'confirm-close',
            'close-game-menu', 'restart-game-btn', 'to-lobby-btn', 'game-stats-btn',
            'game-cheat-modal', 'close-game-cheat', 'game-cheat-input', 'close-yazhopka',
            'game-end-title', 'game-end-tile', 'game-end-score', 'game-end-main-menu-btn',
            'start-time-btn', 'close-start-time', 'game-themes-btn', 'stats-best-time-tile',
            'stats-best-classic-tile'
        ];
        
        ids.forEach(id => {
            const element = document.getElementById(id);
            if (element) elements[id] = element;
        });
        return elements;
    }
    
    initialState() {
        return {
            size: 4,
            board: [],
            score: 0,
            bestScore: 0,
            bestSpeedScore: 0,
            isGameOver: false,
            moveCount: 0,
            lastAddedTile: null,
            gameMode: '4x4',
            targetTile: 2048,
            hasWon: false,
            history: [],
            bestTile: 0,
            timeLeft: 90,
            timerInterval: null,
            totalGames: 0,
            totalWins: 0,
            currentTheme: 'default',
            gamePaused: false,
            bestTimeTile: 0,
            lastBestTile: 0,
            bestClassicTile: 0,
            gameStarted: false,
            // НОВЫЕ ПОЛЯ ДЛЯ РАЗДЕЛЕННОЙ СТАТИСТИКИ
            totalClassicGames: 0,
            totalTimeGames: 0,
            totalClassicWins: 0,
            totalTimeWins: 0
        };
    }
    
    init() {
        this.loadStatistics();
        this.loadSettings();
        this.applyTheme(this.state.currentTheme);
        
        // ИСПРАВЛЕНИЕ: Ждем полной загрузки DOM перед настройкой обработчиков
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                this.setupEventListeners();
                this.showMainMenu();
            });
        } else {
            this.setupEventListeners();
            this.showMainMenu();
        }
    }
    
    // ФОРМАТИРОВАНИЕ ЧИСЕЛ
    formatNumber(num) {
        if (num <= 999999) {
            return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
        } else if (num <= 999999999) {
            return (num / 1000000).toFixed(2).replace('.', ',') + ' M';
        } else if (num <= 999999999999) {
            return (num / 1000000000).toFixed(2).replace('.', ',') + ' B';
        } else {
            return (num / 1000000000000).toFixed(2).replace('.', ',') + ' T';
        }
    }
    
    formatGameScore(num) {
        if (num <= 9999999) {
            return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
        } else if (num <= 999999999) {
            return (num / 1000000).toFixed(2).replace('.', ',') + ' M';
        } else if (num <= 999999999999) {
            return (num / 1000000000).toFixed(2).replace('.', ',') + ' B';
        } else {
            return (num / 1000000000000).toFixed(2).replace('.', ',') + ' T';
        }
    }
    
    // ПАУЗА ТАЙМЕРА
    pauseTimer() {
        if (this.state.gameMode === '4x4-time' && this.state.timerInterval) {
            this.stopTimer();
            this.state.gamePaused = true;
        }
    }
    
    resumeTimer() {
        if (this.state.gameMode === '4x4-time' && this.state.gamePaused) {
            this.startTimer();
            this.state.gamePaused = false;
        }
    }
    
    showMainMenu() {
        this.elements['main-menu'].style.display = 'flex';
        this.elements['game-screen'].style.display = 'none';
        this.elements['game-end-modal'].style.display = 'none';
        this.closeAllModals();
        this.updateMainMenuStats();
    }
    
    showGameScreen() {
        this.elements['main-menu'].style.display = 'none';
        this.elements['game-screen'].style.display = 'flex';
        this.elements['game-end-modal'].style.display = 'none';
    }
    
    start(gameMode) {
        // Сбрасываем флаг начала игры
        this.state.gameStarted = false;
        
        this.initializeGame(gameMode);
        
        if (gameMode === '4x4-time') {
            setTimeout(() => this.showStartTimeModal(), 0);
        }
    }
    
    initializeGame(gameMode, isRestart = false) {
        const modeSettings = {
            '4x4': { size: 4, target: 2048, showTime: false, showBestTile: true },
            '5x5': { size: 5, target: 4096, showTime: false, showBestTile: true },
            '4x4-time': { size: 4, target: 2048, showTime: true, showBestTile: false },
            '5x5-zen': { size: 5, target: null, showTime: false, showBestTile: true }
        };
        
        const settings = modeSettings[gameMode];
        if (!settings) return;
        
        Object.assign(this.state, {
            gameMode: gameMode,
            size: settings.size,
            targetTile: settings.target,
            board: this.createEmptyBoard(settings.size),
            score: 0,
            isGameOver: false,
            hasWon: false,
            moveCount: 0,
            lastAddedTile: null,
            bestTile: 0,
            history: [],
            timeLeft: this.config.GAME.TIME_ATTACK_DURATION,
            gamePaused: false,
            lastBestTile: 0,
            gameStarted: false
        });
        
        this.elements['time-container'].style.display = settings.showTime ? 'block' : 'none';
        this.elements['best-tile-container'].style.display = settings.showBestTile ? 'block' : 'none';
        this.elements['new-record-badge'].style.display = 'none';
        
        this.updateAllScores();
        this.setupBoardDOM();
        
        for (let i = 0; i < this.config.GAME.INITIAL_TILES; i++) {
            this.addRandomTile();
        }
        
        this.saveToHistory();
        this.render();
        this.showGameScreen();
        
        // ИСПРАВЛЕНИЕ: Не добавляем игру в счетчик при перезапуске
        if (!isRestart) {
            // Для режима на время игра добавляется только после нажатия "Начать"
            if (gameMode !== '4x4-time') {
                this.state.totalGames++;
                this.state.totalClassicGames++;
                this.saveStatistics();
                this.updateMainMenuStats();
            }
        }
        
        window.TelegramApp?.tg?.MainButton.hide();
    }
    
    // НОВЫЙ МЕТОД: Начать игру на время (добавляет в статистику)
    startTimeGame() {
        this.state.gameStarted = true;
        this.state.totalGames++;
        this.state.totalTimeGames++;
        this.saveStatistics();
        this.updateMainMenuStats();
        this.startTimer();
    }
    
    showStartTimeModal() {
        const modal = document.getElementById('start-time-modal');
        if (modal) modal.style.display = 'flex';
    }
    
    startTimer() {
        this.stopTimer();
        this.updateTimeDisplay();
        
        this.state.timerInterval = setInterval(() => {
            this.state.timeLeft--;
            this.updateTimeDisplay();
            
            if (this.state.timeLeft <= 0) {
                this.stopTimer();
                this.gameOver();
            }
        }, 1000);
    }
    
    stopTimer() {
        if (this.state.timerInterval) {
            clearInterval(this.state.timerInterval);
            this.state.timerInterval = null;
        }
    }
    
    updateTimeDisplay() {
        if (this.elements['time-left']) {
            this.elements['time-left'].textContent = this.state.timeLeft.toString();
        }
    }
    
    createEmptyBoard(size) {
        return Array.from({ length: size }, () => Array(size).fill(0));
    }
    
    setupBoardDOM() {
        const { size } = this.state;
        const board = this.elements['board'];
        if (!board) return;
        
        // Очищаем доску
        board.innerHTML = '';
        
        if (size === 4) {
            // Для режима 4x4 - 282x282px с расстоянием 9px между клетками
            board.style.display = 'grid';
            board.style.gridTemplateColumns = `repeat(4, 63.5px)`;
            board.style.gridTemplateRows = `repeat(4, 63.5px)`;
            board.style.gap = '9px';
            board.style.width = '282px';
            board.style.height = '282px';
            board.style.zIndex = '10';
            board.style.position = 'absolute';
            board.style.top = '50%';
            board.style.left = '50%';
            board.style.transform = 'translate(-50%, -50%)';
        } else {
            // Для режима 5x5 - клетки 50x50px с расстоянием 6px
            const tileSize = 50;
            const gap = 6;
            const boardSize = size * tileSize + (size - 1) * gap;
            
            board.style.display = 'grid';
            board.style.gridTemplateColumns = `repeat(${size}, ${tileSize}px)`;
            board.style.gridTemplateRows = `repeat(${size}, ${tileSize}px)`;
            board.style.gap = `${gap}px`;
            board.style.width = `${boardSize}px`;
            board.style.height = `${boardSize}px`;
            board.style.zIndex = '10';
            board.style.position = 'absolute';
            board.style.top = '50%';
            board.style.left = '50%';
            board.style.transform = 'translate(-50%, -50%)';
        }
        
        const fragment = document.createDocumentFragment();
        
        for (let r = 0; r < size; r++) {
            for (let c = 0; c < size; c++) {
                const cell = document.createElement('div');
                cell.className = 'cell';
                cell.id = `cell-${r}-${c}`;
                
                // Устанавливаем стили для клеток в зависимости от размера
                if (size === 5) {
                    cell.style.width = '50px';
                    cell.style.height = '50px';
                    cell.style.borderRadius = '16px';
                }
                
                fragment.appendChild(cell);
            }
        }
        board.appendChild(fragment);
    }
    
    addRandomTile() {
        const emptyCells = [];
        
        for (let r = 0; r < this.state.size; r++) {
            for (let c = 0; c < this.state.size; c++) {
                if (this.state.board[r][c] === 0) {
                    emptyCells.push({ r, c });
                }
            }
        }
        
        if (emptyCells.length === 0) return false;
        
        const randomCell = emptyCells[Math.floor(Math.random() * emptyCells.length)];
        const value = Math.random() < this.config.GAME.PROBABILITY_4 ? 4 : 2;
        
        this.state.board[randomCell.r][randomCell.c] = value;
        this.state.lastAddedTile = { r: randomCell.r, c: randomCell.c, value: value };
        
        this.updateBestTile();
        return true;
    }
    
    updateBestTile() {
        let currentBest = 0;
        for (let r = 0; r < this.state.size; r++) {
            for (let c = 0; c < this.state.size; c++) {
                if (this.state.board[r][c] > currentBest) {
                    currentBest = this.state.board[r][c];
                }
            }
        }
        
        if (currentBest > this.state.bestTile) {
            this.state.bestTile = currentBest;
            if (this.elements['best-tile']) {
                this.elements['best-tile'].textContent = currentBest;
            }
        }
    }
    
    makeMove(direction) {
        if (this.state.isGameOver || this.state.hasWon) return;
        
        const { moved, newBoard, scoreIncrease, merged } = this.move(this.state.board, direction);
        
        if (moved) {
            this.saveToHistory('move', { direction, scoreIncrease });
            
            this.state.board = newBoard;
            this.state.score += scoreIncrease;
            this.state.moveCount++;
            
            this.addRandomTile();
            this.render();
            this.updateAllScores();
            this.updateBestTile();
            
            // ИСПРАВЛЕНИЕ: Сохраняем статистику сразу после хода
            this.saveStatistics();
            
            this.checkWinCondition();
            
            if (!this.canMove(this.state.board)) {
                this.gameOver();
            }
        }
    }
    
    updateAllScores() {
        // ИСПРАВЛЕНИЕ: Полностью разделяем статистику для разных режимов
        if (this.state.gameMode !== '4x4-time') {
            // Классические режимы (4x4, 5x5, 5x5-zen) - обновляем только классическую статистику
            const shouldUpdateBest = this.state.score > this.state.bestScore;
            
            if (shouldUpdateBest) {
                this.state.bestScore = this.state.score;
                if (this.elements['new-record-badge']) {
                    this.elements['new-record-badge'].style.display = 'block';
                }
            }
            
            if (this.state.bestTile > this.state.bestClassicTile) {
                this.state.bestClassicTile = this.state.bestTile;
            }
        } else {
            // Режим на время (4x4-time) - обновляем только статистику на время
            const shouldUpdateBest = this.state.score > this.state.bestSpeedScore;
            
            if (shouldUpdateBest) {
                this.state.bestSpeedScore = this.state.score;
                if (this.elements['new-record-badge']) {
                    this.elements['new-record-badge'].style.display = 'block';
                }
            }
            
            if (this.state.bestTile > this.state.bestTimeTile) {
                this.state.bestTimeTile = this.state.bestTile;
            }
        }
        
        if (this.elements['score']) {
            this.elements['score'].textContent = this.formatGameScore(this.state.score);
        }
        
        // Отображаем соответствующий лучший счет в зависимости от режима
        if (this.elements['best-score']) {
            if (this.state.gameMode !== '4x4-time') {
                this.elements['best-score'].textContent = this.formatNumber(this.state.bestScore);
            } else {
                this.elements['best-score'].textContent = this.formatNumber(this.state.bestSpeedScore);
            }
        }
        
        if (window.TelegramApp) {
            window.TelegramApp.showShareButton(this.state.score);
        }
    }
    
    checkWinCondition() {
        if (this.state.hasWon || !this.state.targetTile) return;
        
        for (let r = 0; r < this.state.size; r++) {
            for (let c = 0; c < this.state.size; c++) {
                if (this.state.board[r][c] === this.state.targetTile) {
                    // ИСПРАВЛЕНИЕ: Сохраняем статистику для режима на время при победе
                    if (this.state.gameMode === '4x4-time') {
                        this.state.totalTimeWins++;
                        // Обновляем лучший счет на время
                        if (this.state.score > this.state.bestSpeedScore) {
                            this.state.bestSpeedScore = this.state.score;
                        }
                        
                        // Обновляем лучшую плитку на время
                        if (this.state.bestTile > this.state.bestTimeTile) {
                            this.state.bestTimeTile = this.state.bestTile;
                        }
                    } else {
                        this.state.totalClassicWins++;
                        // Для классических режимов обновляем классическую статистику
                        if (this.state.score > this.state.bestScore) {
                            this.state.bestScore = this.state.score;
                        }
                        if (this.state.bestTile > this.state.bestClassicTile) {
                            this.state.bestClassicTile = this.state.bestTile;
                        }
                    }
                    
                    this.saveStatistics();
                    this.showGameEndScreen(true);
                    return;
                }
            }
        }
    }
    
    // ОБНОВЛЕННЫЙ МЕТОД ДЛЯ НОВОГО ОКНА ЗАВЕРШЕНИЯ ИГРЫ
    showGameEndScreen(isWin) {
        this.state.isGameOver = true;
        this.stopTimer();
        
        // Обновляем содержимое нового окна завершения игры
        const titleElement = this.elements['game-end-title'];
        const tileElement = this.elements['game-end-tile'];
        const scoreElement = this.elements['game-end-score'];
        
        if (isWin) {
            this.state.totalWins++;
            if (titleElement) titleElement.textContent = 'Вы победили!';
            if (tileElement) tileElement.textContent = this.state.targetTile || 2048;
        } else if (this.state.gameMode === '4x4-time' && this.state.timeLeft <= 0) {
            if (titleElement) titleElement.textContent = 'Время вышло!';
            if (tileElement) tileElement.textContent = this.state.bestTile;
        } else {
            if (titleElement) titleElement.textContent = 'Игра окончена';
            if (tileElement) tileElement.textContent = this.state.bestTile;
        }
        
        if (scoreElement) {
            scoreElement.textContent = this.formatGameScore(this.state.score);
        }
        
        // ИСПРАВЛЕНИЕ: Сохраняем статистику в зависимости от режима игры
        if (this.state.gameMode === '4x4-time') {
            // Для режима на время обновляем статистику на время
            if (this.state.score > this.state.bestSpeedScore) {
                this.state.bestSpeedScore = this.state.score;
            }
            if (this.state.bestTile > this.state.bestTimeTile) {
                this.state.bestTimeTile = this.state.bestTile;
            }
        } else {
            // Для классических режимов обновляем классическую статистику
            if (this.state.score > this.state.bestScore) {
                this.state.bestScore = this.state.score;
            }
            if (this.state.bestTile > this.state.bestClassicTile) {
                this.state.bestClassicTile = this.state.bestTile;
            }
        }
        
        this.saveStatistics();
        
        const modal = this.elements['game-end-modal'];
        if (!modal) return;
        
        modal.style.display = 'flex';
        
        // Обработчик для кнопки главного меню в новом окне
        const mainMenuButton = this.elements['game-end-main-menu-btn'];
        if (mainMenuButton) {
            mainMenuButton.onclick = () => {
                this.showMainMenu();
            };
        }
        
        if (window.TelegramApp) {
            window.TelegramApp.showShareButton(this.state.score);
        }
    }
    
    getMaxTile() {
        let maxTile = 0;
        for (let r = 0; r < this.state.size; r++) {
            for (let c = 0; c < this.state.size; c++) {
                if (this.state.board[r][c] > maxTile) {
                    maxTile = this.state.board[r][c];
                }
            }
        }
        return maxTile;
    }
    
    // ОБНОВЛЕННЫЙ МЕТОД: Сохранение статистики при завершении игры
    gameOver() {
        // ИСПРАВЛЕНИЕ: Сохраняем статистику для режима на время
        if (this.state.gameMode === '4x4-time') {
            // Обновляем лучший счет на время
            if (this.state.score > this.state.bestSpeedScore) {
                this.state.bestSpeedScore = this.state.score;
            }
            
            // Обновляем лучшую плитку на время
            if (this.state.bestTile > this.state.bestTimeTile) {
                this.state.bestTimeTile = this.state.bestTile;
            }
        } else {
            // Для классических режимов обновляем классическую статистику
            if (this.state.score > this.state.bestScore) {
                this.state.bestScore = this.state.score;
            }
            if (this.state.bestTile > this.state.bestClassicTile) {
                this.state.bestClassicTile = this.state.bestTile;
            }
        }
        
        this.saveStatistics();
        this.showGameEndScreen(false);
    }
    
    // ЧИТ-КОДЫ
    applyCheatCode(code) {
        const upperCode = code.toUpperCase().trim();
        
        const cheats = {
            'NONONO': () => this.cheatUndo(),
            'IHATETWOTOO': () => this.cheatRemoveTwos(),
            'BIGBADABOOM': () => this.cheatExplode70(),
            'ALLTIMEMYTIME': () => this.cheatAddTime(),
            'GIVEMEMY2048': () => this.cheatAddTile(2048),
            'OHMYGOD4096': () => this.cheatAddTile(4096),
            'LOVEMYCLEAN': () => this.cheatOrganizeTilesDiagonal(),
            'CHACHACHAOS': () => this.cheatShuffleTiles(),
            'DOUBLEBOUBLE': () => this.cheatDoubleTiles(),
            'MILLIONADONA': () => this.cheatAddMillion(),
            'YAZHOPKA': () => this.cheatYazhopka()
        };
        
        if (cheats[upperCode]) {
            const success = cheats[upperCode]();
            
            if (success) {
                // Для обычных чит-кодов закрываем все модальные окна
                if (upperCode !== 'YAZHOPKA') {
                    this.closeAllModals();
                    
                    if (this.state.gameMode === '4x4-time' && this.state.gamePaused) {
                        this.resumeTimer();
                    }
                } else {
                    // Для YAZHOPKA закрываем только окно ввода чит-кода
                    document.getElementById('game-cheat-modal').style.display = 'none';
                }
                
                return true;
            }
        }
        return false;
    }
    
    cheatUndo() {
        if (this.state.history.length <= 1) {
            return false;
        }
        
        const lastAction = this.state.history.pop();
        this.state.board = this.cloneMatrix(lastAction.board);
        this.state.score = lastAction.score;
        this.state.moveCount = lastAction.moveCount;
        
        this.render();
        this.updateAllScores();
        this.updateBestTile();
        return true;
    }
    
    cheatRemoveTwos() {
        let removedCount = 0;
        
        for (let r = 0; r < this.state.size; r++) {
            for (let c = 0; c < this.state.size; c++) {
                if (this.state.board[r][c] === 2) {
                    this.state.board[r][c] = 0;
                    removedCount++;
                }
            }
        }
        
        if (removedCount > 0) {
            this.addRandomTile();
            this.render();
            this.updateBestTile();
            return true;
        } else {
            return false;
        }
    }
    
    cheatExplode70() {
        const tiles = [];
        
        for (let r = 0; r < this.state.size; r++) {
            for (let c = 0; c < this.state.size; c++) {
                if (this.state.board[r][c] > 0) {
                    tiles.push({ r, c, value: this.state.board[r][c] });
                }
            }
        }
        
        const totalTilesBefore = tiles.length;
        
        if (totalTilesBefore <= 1) {
            if (totalTilesBefore === 1) {
                this.state.board[tiles[0].r][tiles[0].c] = 0;
            }
            this.render();
            return true;
        }
        
        const removeCount = Math.max(1, Math.floor(totalTilesBefore * 0.7));
        tiles.sort((a, b) => a.value - b.value);
        
        const removedTiles = tiles.slice(0, removeCount);
        
        for (const tile of removedTiles) {
            this.state.board[tile.r][tile.c] = 0;
        }
        
        this.addRandomTile();
        this.render();
        this.updateBestTile();
        return true;
    }
    
    cheatAddTime() {
        if (this.state.gameMode === '4x4-time') {
            this.state.timeLeft += 7;
            this.updateTimeDisplay();
            return true;
        }
        return false;
    }
    
    cheatAddTile(value) {
        const emptyCells = [];
        
        for (let r = 0; r < this.state.size; r++) {
            for (let c = 0; c < this.state.size; c++) {
                if (this.state.board[r][c] === 0) {
                    emptyCells.push({ r, c });
                }
            }
        }
        
        if (emptyCells.length === 0) return false;
        
        const randomCell = emptyCells[Math.floor(Math.random() * emptyCells.length)];
        this.state.board[randomCell.r][randomCell.c] = value;
        this.state.lastAddedTile = { r: randomCell.r, c: randomCell.c, value: value };
        
        this.state.score += value;
        this.updateAllScores();
        
        this.updateBestTile();
        this.render();
        
        setTimeout(() => {
            if (!this.state.isGameOver) {
                this.showGameEndScreen(true);
            }
        }, 1500);
        
        return true;
    }
    
    cheatOrganizeTilesDiagonal() {
        const tiles = [];
        
        for (let r = 0; r < this.state.size; r++) {
            for (let c = 0; c < this.state.size; c++) {
                if (this.state.board[r][c] > 0) {
                    tiles.push({
                        value: this.state.board[r][c],
                        r: r,
                        c: c
                    });
                }
            }
        }
        
        tiles.sort((a, b) => b.value - a.value);
        
        const positions = [
            {r: 0, c: 3}, {r: 0, c: 2}, {r: 0, c: 1}, {r: 0, c: 0},
            {r: 1, c: 0}, {r: 1, c: 1}, {r: 1, c: 2}, {r: 1, c: 3},
            {r: 2, c: 3}, {r: 2, c: 2}, {r: 2, c: 1}, {r: 2, c: 0},
            {r: 3, c: 0}, {r: 3, c: 1}, {r: 3, c: 2}, {r: 3, c: 3}
        ];
        
        const newBoard = this.createEmptyBoard(this.state.size);
        
        for (let i = 0; i < Math.min(tiles.length, positions.length); i++) {
            const pos = positions[i];
            newBoard[pos.r][pos.c] = tiles[i].value;
        }
        
        for (let r = 0; r < this.state.size; r++) {
            for (let c = 0; c < this.state.size; c++) {
                this.state.board[r][c] = newBoard[r][c];
            }
        }
        
        this.render();
        this.updateBestTile();
        return true;
    }
    
    cheatShuffleTiles() {
        const tiles = [];
        const positions = [];
        
        for (let r = 0; r < this.state.size; r++) {
            for (let c = 0; c < this.state.size; c++) {
                if (this.state.board[r][c] > 0) {
                    tiles.push(this.state.board[r][c]);
                    positions.push({ r, c });
                }
            }
        }
        
        for (let i = tiles.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [tiles[i], tiles[j]] = [tiles[j], tiles[i]];
        }
        
        for (let i = 0; i < positions.length; i++) {
            const { r, c } = positions[i];
            this.state.board[r][c] = tiles[i];
        }
        
        this.render();
        return true;
    }
    
    cheatDoubleTiles() {
        let doubled = false;
        let totalAddedScore = 0;
        
        for (let r = 0; r < this.state.size; r++) {
            for (let c = 0; c < this.state.size; c++) {
                if (this.state.board[r][c] > 0) {
                    const originalValue = this.state.board[r][c];
                    this.state.board[r][c] *= 2;
                    
                    totalAddedScore += this.state.board[r][c];
                    doubled = true;
                }
            }
        }
        
        if (doubled) {
            this.state.score += totalAddedScore;
            this.updateAllScores();
            this.updateBestTile();
            this.render();
        }
        
        return doubled;
    }
    
    cheatAddMillion() {
        this.state.score += 1000000;
        this.updateAllScores();
        return true;
    }
    
    cheatYazhopka() {
        const modal = document.getElementById('yazhopka-modal');
        if (!modal) return false;
        
        if (this.state.gameMode === '4x4-time') {
            this.pauseTimer();
        }
        
        // Открываем окно Yazhopka с задержкой для плавного перехода
        setTimeout(() => {
            modal.style.display = 'flex';
        }, 0);
        
        return true;
    }
    
    // СИСТЕМА СТАТИСТИКИ
    loadStatistics() {
        const stats = JSON.parse(localStorage.getItem('tg_2048_stats')) || {
            totalGames: 0, 
            totalWins: 0, 
            bestScore: 0, 
            bestSpeedScore: 0, 
            bestTile: 0, 
            bestTimeTile: 0,
            bestClassicTile: 0,
            totalClassicGames: 0,
            totalTimeGames: 0,
            totalClassicWins: 0,
            totalTimeWins: 0
        };
        
        Object.assign(this.state, stats);
    }
    
    saveStatistics() {
        const stats = {
            totalGames: this.state.totalGames,
            totalWins: this.state.totalWins,
            bestScore: this.state.bestScore,
            bestSpeedScore: this.state.bestSpeedScore,
            bestTile: this.state.bestTile,
            bestTimeTile: this.state.bestTimeTile,
            bestClassicTile: this.state.bestClassicTile,
            totalClassicGames: this.state.totalClassicGames,
            totalTimeGames: this.state.totalTimeGames,
            totalClassicWins: this.state.totalClassicWins,
            totalTimeWins: this.state.totalTimeWins
        };
        
        localStorage.setItem('tg_2048_stats', JSON.stringify(stats));
        this.updateMainMenuStats();
    }
    
    updateMainMenuStats() {
        const elements = this.elements;
        if (elements['total-games']) elements['total-games'].textContent = this.state.totalGames;
        if (elements['total-wins']) elements['total-wins'].textContent = this.state.totalWins;
        if (elements['best-score-overall']) {
            // ИСПРАВЛЕНИЕ: Показываем лучший счет из всех режимов (классический или на время)
            const bestOverallScore = Math.max(this.state.bestScore, this.state.bestSpeedScore);
            elements['best-score-overall'].textContent = this.formatNumber(bestOverallScore);
        }
    }
    
    resetBestScore() {
        // ИСПРАВЛЕНИЕ: Сбрасываем только счет, а не плитки
        this.state.bestScore = 0;
        this.state.bestSpeedScore = 0;
        this.saveStatistics();
        this.updateMainMenuStats();
        document.getElementById('stats-modal').style.display = 'none';
    }
    
    resetAllStatistics() {
        // ИСПРАВЛЕНИЕ: Сбрасываем всю статистику
        Object.assign(this.state, {
            totalGames: 0, 
            totalWins: 0, 
            bestScore: 0, 
            bestSpeedScore: 0, 
            bestTile: 0, 
            bestTimeTile: 0,
            bestClassicTile: 0,
            totalClassicGames: 0,
            totalTimeGames: 0,
            totalClassicWins: 0,
            totalTimeWins: 0
        });
        this.saveStatistics();
        this.updateMainMenuStats();
        document.getElementById('stats-modal').style.display = 'none';
    }
    
    closeAllModals() {
        const modalsToClose = [
            'cheat-modal', 'game-cheat-modal', 'main-menu-modal', 'in-game-menu-modal', 
            'themes-modal', 'stats-modal', 'confirm-modal', 
            'start-time-modal', 'yazhopka-modal'
        ];
        
        modalsToClose.forEach(modalId => {
            const modal = document.getElementById(modalId);
            if (modal) {
                modal.style.display = 'none';
            }
        });
    }
    
    // СИСТЕМА ТЕМ
    applyTheme(themeName) {
        console.log('Попытка применить тему:', themeName);
        
        const theme = this.config.THEMES[themeName];
        if (!theme) {
            console.warn('Тема не найдена:', themeName);
            return;
        }
        
        const docStyle = document.documentElement.style;
        docStyle.setProperty('--tg-bg-color', theme.bgColor);
        docStyle.setProperty('--tg-primary-color', theme.primaryColor);
        docStyle.setProperty('--tg-secondary-color', theme.secondaryColor);
        docStyle.setProperty('--tg-text-color', theme.textColor);
        
        // Устанавливаем атрибут темы для body
        document.body.setAttribute('data-theme', themeName);
        
        this.state.currentTheme = themeName;
        this.saveSettings();
        
        console.log('Тема успешно применена:', themeName);
        
        // Применяем фон ко всем основным элементам
        document.body.style.backgroundColor = theme.bgColor;
        const mainMenu = document.querySelector('.main-menu');
        if (mainMenu) mainMenu.style.backgroundColor = theme.bgColor;
        const gameScreen = document.querySelector('.game-screen');
        if (gameScreen) gameScreen.style.backgroundColor = theme.bgColor;
    }
    
    loadSettings() {
        const settings = JSON.parse(localStorage.getItem('tg_2048_settings')) || {
            theme: 'default'
        };
        
        this.state.currentTheme = settings.theme;
    }
    
    saveSettings() {
        const settings = {
            theme: this.state.currentTheme
        };
        localStorage.setItem('tg_2048_settings', JSON.stringify(settings));
    }
    
    // ИГРОВАЯ ЛОГИКА
    move(board, direction) {
        const size = board.length;
        let moved = false;
        let scoreIncrease = 0;
        let merged = 0;
        
        const newBoard = this.cloneMatrix(board);
        
        const processRow = (rowIndex, getCell, setCell) => {
            const row = [];
            
            for (let i = 0; i < size; i++) {
                const cell = getCell(rowIndex, i);
                if (cell !== 0) row.push(cell);
            }
            
            for (let i = 0; i < row.length - 1; i++) {
                if (row[i] === row[i + 1]) {
                    row[i] *= 2;
                    scoreIncrease += row[i];
                    row.splice(i + 1, 1);
                    merged++;
                }
            }
            
            while (row.length < size) row.push(0);
            
            for (let i = 0; i < size; i++) {
                const oldValue = getCell(rowIndex, i);
                const newValue = row[i];
                setCell(rowIndex, i, newValue);
                
                if (oldValue !== newValue) moved = true;
            }
        };
        
        switch (direction) {
            case 'left':
                for (let r = 0; r < size; r++) {
                    processRow(r, (row, col) => newBoard[row][col], (row, col, value) => newBoard[row][col] = value);
                }
                break;
                
            case 'right':
                for (let r = 0; r < size; r++) {
                    processRow(r, (row, col) => newBoard[row][size - 1 - col], 
                              (row, col, value) => newBoard[row][size - 1 - col] = value);
                }
                break;
                
            case 'up':
                for (let c = 0; c < size; c++) {
                    processRow(c, (col, row) => newBoard[row][col], 
                              (col, row, value) => newBoard[row][col] = value);
                }
                break;
                
            case 'down':
                for (let c = 0; c < size; c++) {
                    processRow(c, (col, row) => newBoard[size - 1 - row][col],
                              (col, row, value) => newBoard[size - 1 - row][col] = value);
                }
                break;
        }
    
        return { moved, newBoard, scoreIncrease, merged };
    }
    
    cloneMatrix(matrix) {
        return matrix.map(row => [...row]);
    }
    
    canMove(matrix) {
        const size = matrix.length;
        
        for (let r = 0; r < size; r++) {
            for (let c = 0; c < size; c++) {
                if (matrix[r][c] === 0) return true;
                
                if (c < size - 1 && matrix[r][c] === matrix[r][c + 1]) return true;
                if (r < size - 1 && matrix[r][c] === matrix[r + 1][c]) return true;
            }
        }
        
        return false;
    }
    
    // ОБНОВЛЕННЫЙ МЕТОД RENDER ДЛЯ НОВЫХ ПЛИТОК
    render() {
        const { board, size } = this.state;
        
        for (let r = 0; r < size; r++) {
            for (let c = 0; c < size; c++) {
                const cell = document.getElementById(`cell-${r}-${c}`);
                const value = board[r][c];
                
                if (cell) {
                    cell.innerHTML = '';
                    
                    if (value !== 0) {
                        // Создаем контейнер для плитки
                        const tileContainer = document.createElement('div');
                        tileContainer.className = 'tile-container';
                        
                        // Создаем размытый фон
                        const tileBackground = document.createElement('div');
                        tileBackground.className = 'tile-background';
                        
                        // Создаем плитку
                        const tile = document.createElement('div');
                        tile.className = 'tile';
                        tile.setAttribute('data-value', value);
                        
                        // Создаем градиентный бордер
                        const tileBorder = document.createElement('div');
                        tileBorder.className = 'tile-border';
                        
                        // Создаем заливку
                        const tileFill = document.createElement('div');
                        tileFill.className = 'tile-fill';
                        
                        // Создаем число
                        const tileNumber = document.createElement('div');
                        tileNumber.className = 'tile-number';
                        tileNumber.textContent = value;
                        
                        // Собираем структуру
                        tile.appendChild(tileBorder);
                        tile.appendChild(tileFill);
                        tile.appendChild(tileNumber);
                        
                        tileContainer.appendChild(tileBackground);
                        tileContainer.appendChild(tile);
                        
                        // Устанавливаем стили для плиток в режиме 5x5
                        if (size === 5) {
                            tile.style.borderRadius = '16px';
                            tileBorder.style.borderRadius = '16px';
                            tileBackground.style.borderRadius = '16px';
                        }
                        
                        if (this.state.lastAddedTile && 
                            this.state.lastAddedTile.r === r && 
                            this.state.lastAddedTile.c === c) {
                            tile.classList.add('new');
                        }
                        
                        cell.appendChild(tileContainer);
                    }
                }
            }
        }
        
        this.state.lastAddedTile = null;
    }
    
    saveToHistory(type = 'move', data = {}) {
        if (this.state.history.length >= 20) {
            this.state.history.shift();
        }
        
        this.state.history.push({
            type, board: this.cloneMatrix(this.state.board),
            score: this.state.score, moveCount: this.state.moveCount,
            timestamp: Date.now(), ...data
        });
    }
    
    // ИСПРАВЛЕННЫЙ МЕТОД ДЛЯ ОКНА СТАТИСТИКИ
    showStatsModal() {
        const modal = document.getElementById('stats-modal');
        if (!modal) return;
        
        // Обновляем статистические данные
        document.getElementById('stats-total-games').textContent = this.state.totalGames;
        document.getElementById('stats-total-wins').textContent = this.state.totalWins;
        document.getElementById('stats-best-score').textContent = this.formatNumber(this.state.bestScore);
        document.getElementById('stats-best-classic-tile').textContent = this.state.bestClassicTile;
        document.getElementById('stats-best-speed-score').textContent = this.formatNumber(this.state.bestSpeedScore);
        document.getElementById('stats-best-time-tile').textContent = this.state.bestTimeTile;
        
        modal.style.display = 'flex';
        
        // Обработчик закрытия
        const closeStats = document.getElementById('close-stats');
        if (closeStats) {
            closeStats.onclick = () => {
                modal.style.display = 'none';
                if (this.elements['game-screen'].style.display === 'flex') {
                    document.getElementById('in-game-menu-modal').style.display = 'flex';
                } else {
                    document.getElementById('main-menu-modal').style.display = 'flex';
                }
            };
        }
        
        // Обработчики кнопок сброса статистики
        const resetBestScoreBtn = document.getElementById('reset-best-score-btn');
        if (resetBestScoreBtn) {
            resetBestScoreBtn.onclick = () => {
                this.showConfirmModal('Вы точно хотите стереть лучший счет?', 
                    () => this.resetBestScore()
                );
            };
        }
        
        const resetAllStatsBtn = document.getElementById('reset-all-stats-btn');
        if (resetAllStatsBtn) {
            resetAllStatsBtn.onclick = () => {
                this.showConfirmModal('Вы точно хотите стереть всю статистику?', 
                    () => this.resetAllStatistics()
                );
            };
        }
    }
    
    // ИСПРАВЛЕННЫЙ МЕТОД ДЛЯ МОДАЛЬНОГО ОКНА ПОДТВЕРЖДЕНИЯ
    showConfirmModal(message, callback) {
        const confirmMessage = document.getElementById('confirm-message');
        const confirmModal = document.getElementById('confirm-modal');
        
        if (confirmMessage) confirmMessage.textContent = message;
        
        if (confirmModal) {
            confirmModal.style.display = 'flex';
            
            // Временно сохраняем callback
            this._tempConfirmCallback = callback;
            
            // Используем onclick вместо addEventListener для простоты
            const confirmYes = document.getElementById('confirm-yes');
            const confirmNo = document.getElementById('confirm-no');
            const confirmClose = document.getElementById('confirm-close');
            
            if (confirmYes) {
                confirmYes.onclick = () => {
                    if (this._tempConfirmCallback) {
                        this._tempConfirmCallback();
                    }
                    confirmModal.style.display = 'none';
                    this._tempConfirmCallback = null;
                };
            }
            
            if (confirmNo) {
                confirmNo.onclick = () => {
                    confirmModal.style.display = 'none';
                    this._tempConfirmCallback = null;
                };
            }
            
            if (confirmClose) {
                confirmClose.onclick = () => {
                    confirmModal.style.display = 'none';
                    this._tempConfirmCallback = null;
                };
            }
        }
    }
    
    // НОВЫЙ МЕТОД ДЛЯ ЗАКРЫТИЯ ОКНА ТЕМ
    closeThemesModal() {
        const themesModal = document.getElementById('themes-modal');
        if (!themesModal) return;
        
        themesModal.style.display = 'none';
        
        // Определяем контекст открытия
        const isGameActive = this.elements['game-screen'].style.display === 'flex';
        const isInGameMenuOpen = document.getElementById('in-game-menu-modal').style.display === 'flex';
        
        if (isGameActive || isInGameMenuOpen) {
            // Если открыто из игры или игрового меню - возвращаемся в игровое меню
            document.getElementById('in-game-menu-modal').style.display = 'flex';
        }
        // Если открыто с главной страницы (кнопка "Темы" в правом верхнем углу) - просто закрываем
        // Главное меню остается открытым автоматически
    }
    
    setupEventListeners() {
        console.log('Настройка обработчиков событий...');
        
        // Кнопки режимов игры
        const modeButtons = document.querySelectorAll('.mode-btn');
        console.log('Найдено кнопок режимов:', modeButtons.length);
        
        modeButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const mode = e.currentTarget.getAttribute('data-mode');
                console.log('Нажата кнопка режима:', mode);
                if (mode) this.start(mode);
            });
        });
        
        // Главное меню
        const mainMenuBtn = document.getElementById('main-menu-btn');
        if (mainMenuBtn) {
            mainMenuBtn.addEventListener('click', () => {
                document.getElementById('main-menu-modal').style.display = 'flex';
            });
        }
        
        const mainThemesBtn = document.getElementById('main-themes-btn');
        if (mainThemesBtn) {
            mainThemesBtn.addEventListener('click', () => {
                document.getElementById('themes-modal').style.display = 'flex';
            });
        }
        
        const closeMainMenu = document.getElementById('close-main-menu');
        if (closeMainMenu) {
            closeMainMenu.addEventListener('click', () => {
                document.getElementById('main-menu-modal').style.display = 'none';
            });
        }
        
        // Статистика
        const mainStatsBtn = document.getElementById('main-stats-btn');
        if (mainStatsBtn) {
            mainStatsBtn.addEventListener('click', () => {
                document.getElementById('main-menu-modal').style.display = 'none';
                this.showStatsModal();
            });
        }
        
        // Чит-коды - главное меню (только информация)
        const mainCheatBtn = document.getElementById('main-cheat-btn');
        if (mainCheatBtn) {
            mainCheatBtn.addEventListener('click', () => {
                document.getElementById('cheat-modal').style.display = 'flex';
            });
        }

        // Чит-коды - игровое меню (с возможностью ввода)
        const gameCheatBtn = document.getElementById('game-cheat-btn');
        if (gameCheatBtn) {
            gameCheatBtn.addEventListener('click', () => {
                if (this.state.gameMode === '4x4-time') {
                    this.pauseTimer();
                }
                document.getElementById('in-game-menu-modal').style.display = 'none';
                document.getElementById('game-cheat-modal').style.display = 'flex';
            });
        }
        
        // ДОБАВЛЕН ОБРАБОТЧИК ДЛЯ КНОПКИ "ТЕМЫ" В ИГРОВОМ МЕНЮ
        const gameThemesBtn = document.getElementById('game-themes-btn');
        if (gameThemesBtn) {
            gameThemesBtn.addEventListener('click', () => {
                document.getElementById('in-game-menu-modal').style.display = 'none';
                document.getElementById('themes-modal').style.display = 'flex';
            });
        }
        
        // ДОБАВЛЕН ОБРАБОТЧИК ДЛЯ КНОПКИ ЗАКРЫТИЯ В ОКНЕ НАЧАЛА ИГРЫ НА ВРЕМЯ
        const closeStartTime = document.getElementById('close-start-time');
        if (closeStartTime) {
            closeStartTime.addEventListener('click', () => {
                document.getElementById('start-time-modal').style.display = 'none';
                // ИСПРАВЛЕНИЕ: При закрытии окна начала игры возвращаемся в главное меню
                this.showMainMenu();
            });
        }
        
        // ОБРАБОТЧИК ДЛЯ ПОЛЯ ВВОДА ЧИТ-КОДА В ИГРЕ
        const gameCheatInput = document.getElementById('game-cheat-input');
        if (gameCheatInput) {
            gameCheatInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    const code = gameCheatInput.value.trim();
                    if (code) {
                        const success = this.applyCheatCode(code);
                        if (success) {
                            // Для YAZHOPKA окно ввода уже закрыто в applyCheatCode
                            if (code.toUpperCase() !== 'YAZHOPKA') {
                                document.getElementById('game-cheat-modal').style.display = 'none';
                                gameCheatInput.value = '';
                                
                                // Возвращаемся в игру
                                if (this.state.gameMode === '4x4-time' && this.state.gamePaused) {
                                    this.resumeTimer();
                                }
                            } else {
                                // Для YAZHOPKA просто очищаем поле ввода
                                gameCheatInput.value = '';
                            }
                        } else {
                            // Неверный код - очищаем поле и показываем сообщение
                            gameCheatInput.value = '';
                            gameCheatInput.placeholder = 'Неверный код! Попробуйте снова';
                            setTimeout(() => {
                                gameCheatInput.placeholder = 'Введите чит-код здесь';
                            }, 2000);
                        }
                    }
                }
            });
        }
        
        // Закрытие окна чит-кода для игры
        const closeGameCheat = document.getElementById('close-game-cheat');
        if (closeGameCheat) {
            closeGameCheat.addEventListener('click', () => {
                document.getElementById('game-cheat-modal').style.display = 'none';
                
                // Очищаем поле ввода при закрытии
                const gameCheatInput = document.getElementById('game-cheat-input');
                if (gameCheatInput) {
                    gameCheatInput.value = '';
                    gameCheatInput.placeholder = 'Введите чит-код здесь';
                }
                
                // ИСПРАВЛЕНИЕ: Возвращаемся в игровое меню, а не в игру
                document.getElementById('in-game-menu-modal').style.display = 'flex';
                
                // Если игра на время была на паузе, остаемся на паузе
                if (this.state.gameMode === '4x4-time' && this.state.gamePaused) {
                    // Не возобновляем таймер, остаемся в меню
                }
            });
        }
        
        // Закрытие окна чит-кода для главного меню
        const closeCheat = document.getElementById('close-cheat');
        if (closeCheat) {
            closeCheat.addEventListener('click', () => {
                document.getElementById('cheat-modal').style.display = 'none';
                document.getElementById('main-menu-modal').style.display = 'flex';
            });
        }
        
        // Закрытие окна Yazhopka
        const closeYazhopka = document.getElementById('close-yazhopka');
        if (closeYazhopka) {
            closeYazhopka.addEventListener('click', () => {
                document.getElementById('yazhopka-modal').style.display = 'none';
                if (this.state.gameMode === '4x4-time' && this.state.gamePaused) {
                    this.resumeTimer();
                }
            });
        }
        
        // Кнопки управления в игре
        const gameMenuBtn = document.getElementById('game-menu-btn');
        if (gameMenuBtn) {
            gameMenuBtn.addEventListener('click', () => {
                this.pauseTimer();
                document.getElementById('in-game-menu-modal').style.display = 'flex';
            });
        }
        
        // НОВЫЙ ОБРАБОТЧИК ДЛЯ КНОПКИ "НАЧАТЬ" В ОКНЕ НАЧАЛА ИГРЫ НА ВРЕМЯ
        const startTimeBtn = document.getElementById('start-time-btn');
        if (startTimeBtn) {
            startTimeBtn.addEventListener('click', () => {
                document.getElementById('start-time-modal').style.display = 'none';
                this.startTimeGame(); // Используем новый метод для начала игры
            });
        }
        
        const restartGameBtn = document.getElementById('restart-game-btn');
        if (restartGameBtn) {
            restartGameBtn.addEventListener('click', () => {
                this.stopTimer();
                this.state.gamePaused = false;
                this.initializeGame(this.state.gameMode, true); // Передаем true для isRestart
                document.getElementById('in-game-menu-modal').style.display = 'none';
                
                if (this.state.gameMode === '4x4-time') {
                    setTimeout(() => this.showStartTimeModal(), 0);
                }
            });
        }
        
        const toLobbyBtn = document.getElementById('to-lobby-btn');
        if (toLobbyBtn) {
            toLobbyBtn.addEventListener('click', () => {
                this.showMainMenu();
                document.getElementById('in-game-menu-modal').style.display = 'none';
            });
        }
        
        const closeGameMenu = document.getElementById('close-game-menu');
        if (closeGameMenu) {
            closeGameMenu.addEventListener('click', () => {
                this.resumeTimer();
                document.getElementById('in-game-menu-modal').style.display = 'none';
            });
        }
        
        // Статистика из игры
        const gameStatsBtn = document.getElementById('game-stats-btn');
        if (gameStatsBtn) {
            gameStatsBtn.addEventListener('click', () => {
                document.getElementById('in-game-menu-modal').style.display = 'none';
                this.showStatsModal();
            });
        }
        
        // ТЕМЫ - ОБНОВЛЕННЫЙ ОБРАБОТЧИК ЗАКРЫТИЯ
        const closeThemes = document.getElementById('close-themes');
        if (closeThemes) {
            closeThemes.addEventListener('click', () => {
                this.closeThemesModal();
            });
        }
        
        // Правильные обработчики для кнопок тем
        document.querySelectorAll('.theme-btn').forEach(themeBtn => {
            themeBtn.addEventListener('click', (e) => {
                const themeName = e.currentTarget.getAttribute('data-theme');
                console.log('Выбрана тема:', themeName);
                if (themeName) {
                    this.applyTheme(themeName);
                }
            });
        });
        
        // Управление стрелками
        document.addEventListener('keydown', this.handleKeyPress.bind(this));
        this.setupSwipeControls();
        
        console.log('Обработчики событий настроены успешно');
    }
    
    handleKeyPress(e) {
        if (this.state.isGameOver) return;
        
        const keyMap = {
            'ArrowLeft': 'left', 
            'ArrowRight': 'right', 
            'ArrowUp': 'up', 
            'ArrowDown': 'down',
            'KeyA': 'left', 
            'KeyD': 'right', 
            'KeyW': 'up', 
            'KeyS': 'down'
        };
        
        const direction = keyMap[e.key];
        if (direction) {
            e.preventDefault();
            this.makeMove(direction);
        }
    }
    
    setupSwipeControls() {
        const board = this.elements['board'];
        if (!board) return;
        
        let touchStartX, touchStartY;
        
        board.addEventListener('touchstart', (e) => {
            touchStartX = e.touches[0].clientX;
            touchStartY = e.touches[0].clientY;
            e.preventDefault();
        }, { passive: false });
        
        board.addEventListener('touchend', (e) => {
            if (!touchStartX || !touchStartY) return;
            
            const touchEndX = e.changedTouches[0].clientX;
            const touchEndY = e.changedTouches[0].clientY;
            
            const dx = touchEndX - touchStartX;
            const dy = touchEndY - touchStartY;
            const minSwipeDistance = 30;
            
            if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > minSwipeDistance) {
                this.makeMove(dx > 0 ? 'right' : 'left');
            } else if (Math.abs(dy) > minSwipeDistance) {
                this.makeMove(dy > 0 ? 'down' : 'up');
            }
            
            touchStartX = touchStartY = null;
            e.preventDefault();
        }, { passive: false });
    }
}

// Инициализация игры
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM загружен, инициализация игры...');
    window.Game2048 = new Game2048();
});