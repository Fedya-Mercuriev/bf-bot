const Telegraf = require('telegraf');
const { Extra, Markup } = Telegraf;

class MainPage {
    constructor() {
        this.keyboard = [
            ['💐 Заказать букет'],
            ['Фотогалерея', 'Контакты'],
            ['О нас', 'Моя корзина']
        ];

        this.welcomeMsg = "Еще раз привет! \nЯ бот помощник цветочного магазина \"Блюменфрау\". Помогу вам заказать букет вашей мечты и покажу что мы уже сделали в нашем магазинчике. Нажмите на кнопку меню, чтобы продолжить! ";
    }

    displayMainPage(ctx, msg) {
        ctx.reply(msg, Markup.keyboard(this.keyboard)
            .oneTime()
            .resize()
            .extra()
        );
    }

    offerBotHelp(ctx) {
        ctx.reply("🙋️Если вы не знаете как пользоваться ботом. нажмите на кнопку ниже и я вам все расскажу и покажу",
            Markup.inlineKeyboard([Markup.callbackButton('Как пользоваться ботом?', 'howtouse')]).extra()
        )
    }
}

module.exports = new MainPage();