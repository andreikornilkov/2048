// TELEGRAM.js - интеграция с Telegram Web App
class TelegramIntegration {
    constructor() {
        this.tg = window.Telegram?.WebApp;
        this.isTelegram = !!this.tg;
        this.user = null;
        
        this.init();
    }
    
    init() {
        if (!this.isTelegram) {
            console.log('Запуск вне Telegram');
            this.setupStandaloneMode();
            return;
        }
        
        console.log('Запуск в Telegram Web App');
        this.setupTelegramMode();
    }
    
    setupTelegramMode() {
        this.tg.expand();
        this.user = this.tg.initDataUnsafe?.user;
        this.applyTelegramTheme();
        this.setupMainButton();
        
        this.tg.onEvent('themeChanged', this.applyTelegramTheme.bind(this));
        this.tg.onEvent('viewportChanged', this.onViewportChanged.bind(this));
        
        console.log('Telegram user:', this.user);
    }
    
    setupStandaloneMode() {
        document.body.classList.add('standalone-mode');
        console.log('Режим тестирования (вне Telegram)');
    }
    
    applyTelegramTheme() {
        if (!this.isTelegram) return;
        
        document.documentElement.style.setProperty(
            '--tg-bg-color', 
            this.tg.themeParams.bg_color || '#faf8ef'
        );
        document.documentElement.style.setProperty(
            '--tg-primary-color',
            this.tg.themeParams.button_color || '#635BFF'
        );
        document.documentElement.style.setProperty(
            '--tg-text-color',
            this.tg.themeParams.text_color || '#222222'
        );
    }
    
    setupMainButton() {
        if (!this.isTelegram) return;
        
        this.tg.MainButton.setText('Поделиться результатом');
        this.tg.MainButton.hide();
    }
    
    showShareButton(score) {
        if (!this.isTelegram) return;
        
        this.tg.MainButton.setText(`Я набрал ${score} очков в 2048! 🎮`);
        this.tg.MainButton.onClick(this.shareScore.bind(this, score));
        this.tg.MainButton.show();
    }
    
    shareScore(score) {
        if (!this.isTelegram) {
            alert(`Ваш результат: ${score} очков!`);
            return;
        }
        
        this.tg.sendData(JSON.stringify({
            action: 'share_score',
            score: score,
            game: '2048'
        }));
    }
    
    onViewportChanged() {
        console.log('Viewport changed');
    }
    
    getUserData() {
        return this.user;
    }
    
    isInTelegram() {
        return this.isTelegram;
    }
}

const TelegramApp = new TelegramIntegration();