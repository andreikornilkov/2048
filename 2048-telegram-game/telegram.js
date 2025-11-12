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
        // Расширяем на весь экран
        this.tg.expand();
        
        // Получаем данные пользователя
        this.user = this.tg.initDataUnsafe?.user;
        
        // Настраиваем тему
        this.applyTelegramTheme();
        
        // Настраиваем кнопки
        this.setupMainButton();
        
        // Обработчики событий Telegram
        this.tg.onEvent('themeChanged', this.applyTelegramTheme.bind(this));
        this.tg.onEvent('viewportChanged', this.onViewportChanged.bind(this));
        
        console.log('Telegram user:', this.user);
    }
    
    setupStandaloneMode() {
        // Режим для тестирования вне Telegram
        document.body.classList.add('standalone-mode');
        console.log('Режим тестирования (вне Telegram)');
    }
    
    applyTelegramTheme() {
        if (!this.isTelegram) return;
        
        // Применяем цвета из Telegram
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
        
        this.tg.MainButton.setText(`Я набрал ${score} очков! 🎮`);
        this.tg.MainButton.onClick(this.shareScore.bind(this, score));
        this.tg.MainButton.show();
    }
    
    shareScore(score) {
        if (!this.isTelegram) {
            // Для standalone режима
            alert(`Ваш результат: ${score} очков!`);
            return;
        }
        
        // В Telegram можно отправить сообщение
        this.tg.sendData(JSON.stringify({
            action: 'share_score',
            score: score,
            game: '2048'
        }));
    }
    
    onViewportChanged() {
        // Адаптация к изменению размера окна
        console.log('Viewport changed');
    }
    
    // Получить данные пользователя
    getUserData() {
        return this.user;
    }
    
    // Проверить, запущено ли в Telegram
    isInTelegram() {
        return this.isTelegram;
    }
}

// Создаем глобальный экземпляр
const TelegramApp = new TelegramIntegration();