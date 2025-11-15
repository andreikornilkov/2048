// TELEGRAM.js - интеграция с Telegram Web App
class TelegramIntegration {
    constructor() {
        this.tg = window.Telegram?.WebApp;
        this.isTelegram = !!this.tg;
        this.user = null;
        this.init();
    }
    
    init() {
        this.isTelegram ? this.setupTelegramMode() : this.setupStandaloneMode();
    }
    
    setupTelegramMode() {
        this.tg.expand();
        this.user = this.tg.initDataUnsafe?.user;
        this.applyTelegramTheme();
        this.setupMainButton();
        this.tg.onEvent('themeChanged', this.applyTelegramTheme.bind(this));
    }
    
    setupStandaloneMode() {
        document.body.classList.add('standalone-mode');
    }
    
    applyTelegramTheme() {
        if (!this.isTelegram) return;
        
        const theme = this.tg.themeParams;
        const docStyle = document.documentElement.style;
        
        docStyle.setProperty('--tg-bg-color', theme.bg_color || '#faf8ef');
        docStyle.setProperty('--tg-primary-color', theme.button_color || '#635BFF');
        docStyle.setProperty('--tg-text-color', theme.text_color || '#222222');
    }
    
    setupMainButton() {
        if (!this.isTelegram) return;
        this.tg.MainButton.setText('Поделиться результатом');
        this.tg.MainButton.hide();
    }
    
    showShareButton(score) {
        if (!this.isTelegram) return;
        
        this.tg.MainButton.setText(`Я набрал ${score} очков! 🎮`);
        this.tg.MainButton.onClick(() => this.shareScore(score));
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
    
    getUserData() {
        return this.user;
    }
    
    isInTelegram() {
        return this.isTelegram;
    }
}

const TelegramApp = new TelegramIntegration();