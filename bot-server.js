// =====================================
// TELEGRAM BOT FOR 2048 GAME
// =====================================

console.log('Starting Telegram bot for 2048 game...');

const TelegramBot = require('node-telegram-bot-api');
const fs = require('fs');

// ⚠️ YOUR BOT TOKEN (replace this!)
const TOKEN = '8561663885:AAHNBo2bUVzC1C2TY8i27NmDtb45m_THLeI';

// ⚠️ YOUR GAME URL on GitHub Pages (replace!)
const GAME_URL = 'https://andreiKornilkov.github.io/2048/';

// ⚠️ YOUR TELEGRAM ID (replace! get from @userinfobot)
const ADMIN_ID = 726653462; // example: 123456789

// File for storing users
const USERS_FILE = 'users.json';

const bot = new TelegramBot(TOKEN, { polling: true });

console.log('Bot connected to Telegram');
console.log(`Game available at: ${GAME_URL}`);
console.log(`Administrator: ${ADMIN_ID}`);

// =====================================
// USER STORAGE AND ACTIVITY TRACKING
// =====================================

let users = [];
if (fs.existsSync(USERS_FILE)) {
  try {
    const data = fs.readFileSync(USERS_FILE, 'utf8');
    users = JSON.parse(data);
    console.log(`Loaded ${users.length} users`);
  } catch (error) {
    console.log('Error loading users:', error);
  }
}

// Count active users (last 30 days)
function getActiveUsersCount() {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  return users.filter(user => {
    const lastActive = new Date(user.last_active || user.date);
    return lastActive > thirtyDaysAgo;
  }).length;
}

// Update user activity
function updateUserActivity(user) {
  const existingUserIndex = users.findIndex(u => u.id === user.id);
  
  if (existingUserIndex !== -1) {
    // Update existing user
    users[existingUserIndex].last_active = new Date().toISOString();
    users[existingUserIndex].first_name = user.first_name || users[existingUserIndex].first_name;
    users[existingUserIndex].username = user.username || users[existingUserIndex].username;
  } else {
    // Add new user
    users.push({
      id: user.id,
      username: user.username,
      first_name: user.first_name,
      last_name: user.last_name,
      date: new Date().toISOString(),
      last_active: new Date().toISOString()
    });
  }
  
  // Save to file
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
  
  if (existingUserIndex === -1) {
    console.log(`New user added: ${user.first_name} (ID: ${user.id})`);
  }
}

// =====================================
// COMMAND /START - MAIN MENU
// =====================================
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  const user = msg.from;
  
  updateUserActivity(user);
  
  const welcomeText = `Привет!\n\nЭто классическая игра 2048. Самое время поиграть.`;
  
  bot.sendMessage(chatId, welcomeText, {
    reply_markup: {
      inline_keyboard: [
        [{ text: "Начать игру", web_app: { url: GAME_URL } }],
        [{ text: "Правила", callback_data: 'rules' }]
      ]
    }
  });
});

// =====================================
// COMMAND /PLAY - QUICK START
// =====================================
bot.onText(/\/play/, (msg) => {
  const user = msg.from;
  updateUserActivity(user);
  
  bot.sendMessage(msg.chat.id, 'Нажмите кнопку, чтобы начать игру:', {
    reply_markup: {
      inline_keyboard: [
        [{ text: "Начать игру", web_app: { url: GAME_URL } }]
      ]
    }
  });
});

// =====================================
// BUTTON "RULES"
// =====================================
bot.on('callback_query', (query) => {
  const chatId = query.message.chat.id;
  const user = query.from;
  
  updateUserActivity(user);
  bot.answerCallbackQuery(query.id);
  
  if (query.data === 'rules') {
    const rulesText = `Как играть?\n\n` +
                     `Ход это свайп по горизонтали или вертикали в любую сторону, который двигает все плитки на поле.\n` +
                     `Каждый ход на поле появляется новая плитка со значением 2 или 4.\n` +
                     `Ваша задача соединить две одинаковые плитки, чтобы получить новую со значением в два раза больше.\n\n` +
                     `Цель: собрать плитку со значением 2048.`;
    
    bot.sendMessage(chatId, rulesText, {
      reply_markup: {
        inline_keyboard: [
          [{ text: "Начать игру", web_app: { url: GAME_URL } }]
        ]
      }
    });
  }
});

// =====================================
// ADMIN COMMANDS
// =====================================

// /admin - admin panel with active users
bot.onText(/\/admin/, (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  
  if (userId != ADMIN_ID) {
    bot.sendMessage(chatId, 'Эта команда только для администратора.');
    return;
  }
  
  const activeUsers = getActiveUsersCount();
  const today = new Date();
  const weekAgo = new Date(today);
  weekAgo.setDate(weekAgo.getDate() - 7);
  
  // Count users from last week
  const weeklyUsers = users.filter(user => {
    const lastActive = new Date(user.last_active || user.date);
    return lastActive > weekAgo;
  }).length;
  
  const adminText = `Панель администратора\n\n` +
                   `📊 Статистика пользователей:\n` +
                   `• Всего пользователей: ${users.length}\n` +
                   `• Активных (30 дней): ${activeUsers}\n` +
                   `• Новых за неделю: ${weeklyUsers}\n\n` +
                   `📋 Доступные команды:\n` +
                   `/send - Отправить рассылку\n` +
                   `/users - Список пользователей\n` +
                   `/active - Активные пользователи\n` +
                   `/stats - Детальная статистика`;
  
  bot.sendMessage(chatId, adminText);
});

// /active - active users list
bot.onText(/\/active/, (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  
  if (userId != ADMIN_ID) return;
  
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  const activeUsers = users.filter(user => {
    const lastActive = new Date(user.last_active || user.date);
    return lastActive > thirtyDaysAgo;
  });
  
  if (activeUsers.length === 0) {
    bot.sendMessage(chatId, 'Нет активных пользователей за последние 30 дней.');
    return;
  }
  
  let activeText = `Активные пользователи (30 дней): ${activeUsers.length}\n\n`;
  
  // Sort by last activity (newest first)
  activeUsers.sort((a, b) => {
    return new Date(b.last_active || b.date) - new Date(a.last_active || a.date);
  });
  
  activeUsers.slice(0, 20).forEach((user, index) => {
    const lastActiveDate = new Date(user.last_active || user.date);
    const daysAgo = Math.floor((new Date() - lastActiveDate) / (1000 * 60 * 60 * 24));
    
    activeText += `${index + 1}. ${user.first_name}`;
    if (user.username) activeText += ` (@${user.username})`;
    activeText += ` - ${daysAgo === 0 ? 'сегодня' : `${daysAgo} дн. назад`}\n`;
  });
  
  if (activeUsers.length > 20) {
    activeText += `\n... и еще ${activeUsers.length - 20} активных пользователей`;
  }
  
  bot.sendMessage(chatId, activeText);
});

// /stats - detailed statistics
bot.onText(/\/stats/, (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  
  if (userId != ADMIN_ID) return;
  
  if (users.length === 0) {
    bot.sendMessage(chatId, 'Нет данных о пользователях.');
    return;
  }
  
  // Count by periods
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekAgo = new Date(today);
  weekAgo.setDate(weekAgo.getDate() - 7);
  const monthAgo = new Date(today);
  monthAgo.setDate(monthAgo.getDate() - 30);
  
  let todayCount = 0;
  let weekCount = 0;
  let monthCount = 0;
  
  users.forEach(user => {
    const lastActive = new Date(user.last_active || user.date);
    
    if (lastActive >= today) todayCount++;
    if (lastActive >= weekAgo) weekCount++;
    if (lastActive >= monthAgo) monthCount++;
  });
  
  const statsText = `📈 Детальная статистика\n\n` +
                   `👥 Пользователи:\n` +
                   `• Всего: ${users.length}\n` +
                   `• Активные сегодня: ${todayCount}\n` +
                   `• Активные за неделю: ${weekCount}\n` +
                   `• Активные за месяц: ${monthCount}\n\n` +
                   `📊 Распределение:\n` +
                   `• ${Math.round((monthCount / users.length) * 100) || 0}% пользователей активны в течение месяца\n` +
                   `• ${Math.round((weekCount / users.length) * 100) || 0}% пользователей активны в течение недели`;
  
  bot.sendMessage(chatId, statsText);
});

// /send - mailing with buttons
bot.onText(/\/send/, (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  
  if (userId != ADMIN_ID) {
    bot.sendMessage(chatId, 'Эта команда только для администратора.');
    return;
  }
  
  const activeUsers = getActiveUsersCount();
  
  const instructions = `📨 Отправьте сообщение для рассылки\n\n` +
                      `Доступно ${activeUsers} активным пользователям\n\n` +
                      `Специальные команды в тексте:\n` +
                      `{button} - добавить кнопку "Играть"\n` +
                      `{button_текст} - кнопка с вашим текстом\n\n` +
                      `Пример:\n` +
                      `"Новое обновление игры! {button}"\n` +
                      `или\n` +
                      `"Заходите играть! {button_Попробовать сейчас}"`;
  
  bot.sendMessage(chatId, instructions)
    .then(sentMsg => {
      bot.once('message', (replyMsg) => {
        if (replyMsg.from.id === ADMIN_ID && replyMsg.chat.id === chatId) {
          let messageToSend = replyMsg.text;
          let hasButton = false;
          let buttonText = "Играть";
          
          // Check for special commands
          if (messageToSend.includes('{button_')) {
            // Extract button text {button_Text}
            const match = messageToSend.match(/\{button_([^}]+)\}/);
            if (match) {
              buttonText = match[1];
              messageToSend = messageToSend.replace(match[0], '');
              hasButton = true;
            }
          } else if (messageToSend.includes('{button}')) {
            // Simple button {button}
            messageToSend = messageToSend.replace('{button}', '');
            hasButton = true;
          }
          
          // Prepare keyboard
          let replyMarkup = null;
          if (hasButton) {
            replyMarkup = {
              inline_keyboard: [
                [{ text: buttonText, web_app: { url: GAME_URL } }]
              ]
            };
          }
          
          // Message preview
          let previewText = `🔍 Предпросмотр сообщения:\n\n` +
                           `${messageToSend}\n\n` +
                           `Кому: ${activeUsers} активных пользователей\n` +
                           `Кнопка: ${hasButton ? '✅ Да (' + buttonText + ')' : '❌ Нет'}`;
          
          const previewOptions = {};
          
          if (replyMarkup) {
            previewOptions.reply_markup = replyMarkup;
          }
          
          bot.sendMessage(chatId, previewText, previewOptions)
            .then(() => {
              const confirmText = `📤 Подтвердите рассылку\n\n` +
                                 `Отправить это сообщение ${activeUsers} пользователям?`;
              
              bot.sendMessage(chatId, confirmText, {
                reply_markup: {
                  inline_keyboard: [
                    [{ text: "✅ Отправить", callback_data: 'confirm_send' }],
                    [{ text: "❌ Отменить", callback_data: 'cancel_send' }],
                    [{ text: "✏️ Изменить текст", callback_data: 'edit_send' }]
                  ]
                }
              });
              
              // Save mailing data
              global.pendingBroadcast = {
                text: messageToSend,
                hasButton: hasButton,
                buttonText: buttonText,
                adminChatId: chatId,
                replyMarkup: replyMarkup
              };
            });
        }
      });
    });
});

// /users - full users list
bot.onText(/\/users/, (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  
  if (userId != ADMIN_ID) return;
  
  if (users.length === 0) {
    bot.sendMessage(chatId, 'Пользователей пока нет.');
    return;
  }
  
  let usersText = `Всего пользователей: ${users.length}\n\n`;
  
  // Sort by registration date (newest first)
  const sortedUsers = [...users].sort((a, b) => {
    return new Date(b.date) - new Date(a.date);
  });
  
  sortedUsers.slice(0, 15).forEach((user, index) => {
    const regDate = new Date(user.date).toISOString().split('T')[0];
    const lastActive = new Date(user.last_active || user.date);
    const daysSinceActive = Math.floor((new Date() - lastActive) / (1000 * 60 * 60 * 24));
    
    usersText += `${index + 1}. ${user.first_name}`;
    if (user.username) usersText += ` (@${user.username})`;
    usersText += `\n   ID: ${user.id}`;
    usersText += `\n   Регистрация: ${regDate}`;
    usersText += `\n   Активность: ${daysSinceActive === 0 ? 'сегодня' : `${daysSinceActive} дн. назад`}\n\n`;
  });
  
  if (users.length > 15) {
    usersText += `\n... и еще ${users.length - 15} пользователей`;
  }
  
  bot.sendMessage(chatId, usersText);
});

// =====================================
// ADMIN BUTTON HANDLERS
// =====================================
bot.on('callback_query', (query) => {
  const chatId = query.message.chat.id;
  const userId = query.from.id;
  
  // Handle admin buttons
  if (userId == ADMIN_ID) {
    bot.answerCallbackQuery(query.id);
    
    // Confirm mailing
    if (query.data === 'confirm_send') {
      if (!global.pendingBroadcast) {
        bot.sendMessage(chatId, 'Нет сообщения для рассылки.');
        return;
      }
      
      const { text, hasButton, buttonText, replyMarkup, adminChatId } = global.pendingBroadcast;
      const activeUsers = getActiveUsersCount();
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const usersToSend = users.filter(user => {
        const lastActive = new Date(user.last_active || user.date);
        return lastActive > thirtyDaysAgo;
      });
      
      bot.sendMessage(adminChatId, `📤 Начинаю рассылку\n\n` +
                                  `Получателей: ${usersToSend.length}\n` +
                                  `Кнопка: ${hasButton ? '✅ (' + buttonText + ')' : '❌'}`);
      
      let sentCount = 0;
      let errorCount = 0;
      
      usersToSend.forEach((user, index) => {
        setTimeout(() => {
          const messageOptions = {};
          if (replyMarkup) {
            messageOptions.reply_markup = replyMarkup;
          }
          
          bot.sendMessage(user.id, text, messageOptions)
            .then(() => {
              sentCount++;
              // Update progress every 10 messages
              if (sentCount % 10 === 0 || sentCount === usersToSend.length) {
                const progress = Math.round((sentCount / usersToSend.length) * 100);
                bot.sendMessage(adminChatId, `📊 Прогресс: ${sentCount}/${usersToSend.length} (${progress}%)`);
              }
              
              if (sentCount + errorCount === usersToSend.length) {
                bot.sendMessage(adminChatId, `✅ Рассылка завершена!\n\n` +
                                            `✅ Успешно: ${sentCount}\n` +
                                            `❌ Ошибок: ${errorCount}\n` +
                                            `📈 Доставлено: ${Math.round((sentCount / usersToSend.length) * 100)}%`);
                delete global.pendingBroadcast;
              }
            })
            .catch(error => {
              errorCount++;
              console.log(`Error sending to user ${user.id}:`, error.message);
              
              if (error.response && error.response.statusCode === 403) {
                // User blocked bot - remove from list
                users = users.filter(u => u.id !== user.id);
                fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
              }
              
              if (sentCount + errorCount === usersToSend.length) {
                bot.sendMessage(adminChatId, `✅ Рассылка завершена!\n\n` +
                                            `✅ Успешно: ${sentCount}\n` +
                                            `❌ Ошибок: ${errorCount}`);
                delete global.pendingBroadcast;
              }
            });
        }, index * 100); // 100ms delay between messages
      });
    }
    
    // Cancel mailing
    if (query.data === 'cancel_send') {
      delete global.pendingBroadcast;
      bot.sendMessage(chatId, 'Рассылка отменена.');
    }
    
    // Edit mailing text
    if (query.data === 'edit_send') {
      delete global.pendingBroadcast;
      bot.sendMessage(chatId, 'Отправьте новый текст для рассылки:');
      // This will trigger the /send command handler again
    }
  }
});

// =====================================
// COMMAND /HELP
// =====================================
bot.onText(/\/help/, (msg) => {
  const user = msg.from;
  updateUserActivity(user);
  
  const helpText = `Доступные команды:\n\n` +
                  `/start - Главное меню\n` +
                  `/play - Начать игру\n` +
                  `/help - Эта справка`;
  
  bot.sendMessage(msg.chat.id, helpText);
});

console.log('✅ Bot is ready!');
console.log('📱 Send /start to your bot in Telegram');
console.log('👑 Admin commands: /admin, /stats, /active, /users, /send');

// =====================================
// SIMPLE WEB SERVER FOR RENDER HEALTH CHECK
// =====================================
const http = require('http');

const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/html' });
  res.end(`
    <!DOCTYPE html>
    <html>
      <head><title>2048 Telegram Bot</title></head>
      <body style="font-family: Arial, sans-serif; padding: 20px;">
        <h1>🎮 2048 Telegram Bot</h1>
        <p>✅ Bot is running successfully!</p>
        <p>👥 Users: ${users.length}</p>
        <p>📊 Active users (30 days): ${getActiveUsersCount()}</p>
        <p>🔗 Game URL: <a href="${GAME_URL}">${GAME_URL}</a></p>
        <p>⏰ Started: ${new Date().toLocaleString()}</p>
      </body>
    </html>
  `);
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🌐 Web server listening on port ${PORT}`);
  console.log(`📊 Stats: ${users.length} users, ${getActiveUsersCount()} active`);
});
