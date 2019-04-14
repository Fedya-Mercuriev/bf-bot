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

const MainPage = require('./src/main-page/main-page');
const About = require('./src/main-page/about');
const Gallery = require('./src/main-page/gallery');
const Contacts = require('./src/main-page/contacts');
const Cart = require('./src/main-page/cart');
const Order = require('./src/order/order');
const ServiceOperations = require('./src/service-ops');

const gallery = new Gallery();
const cart = new Cart();
const about = new About();
const order = new Order();
// Город в котором функционирует магазин
const citiesList = 'Томск';
module.exports = { order, citiesList };
const dateValidation = require('./src/order/validate/validate-date/date');
const shippingValidation = require('./src/order/validate/validate-shipping/shipping');
const timeValidation = require('./src/order/validate/validate-time/time');
const bouqTypeValidation = require('./src/order/validate/validate-bouq-type/type');

stage.register(dateValidation);
stage.register(shippingValidation);
stage.register(timeValidation);
stage.register(bouqTypeValidation);

bot.use(session());
bot.use(stage.middleware());

bot.start((ctx) => {
    MainPage.displayMainPage(ctx, MainPage.welcomeMsg);
    MainPage.offerBotHelp(ctx);
    bot.action('howtouse', (ctx) => {
        ctx.telegram.answerCbQuery(ctx.update['callback_query'].id, '');
        ctx.reply('Здесь будет инструкция');
    })
});

bot.hears(/💐 Заказать букет/, (ctx) => {
    order.launch(ctx);

    bot.hears(/Меню заказа/i, (ctx) => {
        if (!order.orderIsInitialised) {
            return;
        }
        order.displayInterface(ctx, 'Выберите любой пункт в меню');
    });

    bot.hears(/Связаться с магазином/i, (ctx) => {
        if (!order.orderIsInitialised) {
            return;
        }
        return Contacts.showPhoneNumber(ctx);
    });

    bot.hears(/Отменить заказ/i, (ctx) => {
        if (!order.orderIsInitialised) {
            return;
        }
        let cancelOrder = new Promise((resolve) => {
            order.cancelOrder(ctx);
            resolve([ctx, 'Нажмите на кнопку меню, чтобы продолжить']);
        });

        cancelOrder.then((val) => {
            let [context, msg] = val;
            MainPage.displayMainPage(context, msg);
        });
        console.log('*** Заказ отменен ***');
    });

    bot.on('callback_query', (ctx) => {
        ctx.telegram.answerCbQuery(ctx.update['callback_query'].id, '');
        if (ctx.update['callback_query'].data === 'Продолжить') {
            ctx.telegram.answerCbQuery(ctx.update['callback_query'].id, '📱 Открываю меню заказа');
            order.displayInterface(ctx, 'Выберите любой пункт в меню');
        } else {
            try {
                console.log(ctx.update['callback_query'].data);
                ctx.scene.enter(ctx.update['callback_query'].data);
            } catch (error) {
                // ctx.telegram.answerCbQuery(ctx.update['callback_query'].id, "");
                ctx.reply('☹️ Извините, эта кнопка уже не работает');
            }

        }
    });
});


bot.hears('Фотогалерея', (ctx) => {
    gallery.show(ctx);
});


bot.hears('Контакты', (ctx) => {
    Contacts.displayContactInfo(ctx);
    bot.action('Показать адрес', (ctx) => {
        Contacts.showAddress(ctx);
    })
});


bot.hears('О нас', (ctx) => {
    about.displayInfo(ctx);
});


bot.hears('Моя корзина', (ctx) => {
    cart.show(ctx);
});

bot.startPolling();