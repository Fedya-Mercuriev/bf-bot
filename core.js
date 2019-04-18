/* eslint-disable indent */
const dotenv = require('dotenv');
dotenv.config();
const Telegraf = require('telegraf');
const Extra = require('telegraf/extra');
const session = require('telegraf/session');
const Stage = require('telegraf/stage');
const Scene = require('telegraf/scenes/base');
const { Markup } = Telegraf;
const { leave } = Stage;
const bot = new Telegraf(process.env.BOT_TOKEN);
const stage = new Stage();
const order = require('./src/order/order');
const MainPage = require('./src/main-page/main-page');
const About = require('./src/main-page/about');
const Gallery = require('./src/main-page/gallery');
const Contacts = require('./src/main-page/contacts');
const Cart = require('./src/main-page/cart');
const gallery = new Gallery();
const cart = new Cart();
const about = new About();
// Город в котором функционирует магазин
const citiesList = 'Томск';
module.exports = citiesList;
// Сцены
const orderScene = require('./src/scenes/order-scene');
const dateValidation = require('./src/scenes/date-scene');
const shippingValidation = require('./src/scenes/shipping-scene');
const timeValidation = require('./src/scenes/time-scene');
const bouqTypeValidation = require('./src/scenes/bouq-type-scene');
const contactInfoValidation = require('./src/scenes/contact-info-scene');
// Регистрация сцен
stage.register(
    orderScene,
    dateValidation,
    shippingValidation,
    timeValidation,
    bouqTypeValidation,
    contactInfoValidation,
);

bot.use(session());
bot.use(stage.middleware());

bot.start((ctx) => {
    MainPage.displayMainPage(ctx, MainPage.welcomeMsg);
    MainPage.offerBotHelp(ctx);
});

bot.action('howtouse', (ctx) => {
    ctx.telegram.answerCbQuery(ctx.update.callback_query.id, 'Открываю инструкцию');
    ctx.reply('Здесь будет инструкция');
});

bot.hears(/💐 Заказать букет/, (ctx) => {
    ctx.scene.enter('orderScene');

    bot.on('callback_query', (ctx) => {
        ctx.telegram.answerCbQuery(ctx.update['callback_query'].id, "");
        try {
            ctx.scene.enter(ctx.update['callback_query'].data);
        } catch (error) {
            ctx.reply("☹️ Извините, эта кнопка уже не работает");
        }
    });

    bot.on('pre_checkout_query', ({ answerPreCheckoutQuery }) => answerPreCheckoutQuery(true));
    bot.on('successful_payment', (ctx) => {
        order.postOrder(ctx);
    });
});

bot.hears('Фотогалерея', (ctx) => {
    gallery.show(ctx);
});

bot.hears('Контакты', (ctx) => {
    Contacts.displayContactInfo(ctx);
    bot.action('Показать адрес', (ctx) => {
        Contacts.showAddress(ctx);
    });
});

bot.hears('О нас', (ctx) => {
    about.displayInfo(ctx);
});

bot.hears('Моя корзина', (ctx) => {
    cart.show(ctx);
});

bot.startPolling();