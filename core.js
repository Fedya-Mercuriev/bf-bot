'use strict';

const Telegraf = require('telegraf');
const Extra = require('telegraf/extra');
const session = require('telegraf/session');
const Stage = require('telegraf/stage');
const Scene = require('telegraf/scenes/base');
const { Markup } = Telegraf;
const { leave } = Stage;
const config = require('./assets/config');
const bot = new Telegraf(process.env.TOKEN)
exports.bot = bot;
const stage = new Stage();

const MainPage = require("./assets/main-page/main-page");
const About = require("./assets/main-page/about");
const Gallery = require("./assets/main-page/gallery");
const Contacts = require("./assets/main-page/contacts");
const Cart = require("./assets/main-page/cart");
const Order = require("./assets/order/order");
// const Date = require("./src/order/validate-date/date");
const ServiceOperations = require("./assets/service-ops");

const gallery = new Gallery();
const cart = new Cart();
const about = new About();
let order = new Order();
module.exports = order;
// Сцены
const dateValidation = require('./assets/order/validate/validate-date/date');
const shippingValidation = require('./assets/order/validate/validate-shipping/shipping');
const timeValidation = require('./assets/order/validate/validate-time/time');
const bouqTypeValidation = require('./assets/order/validate/validate-bouq-type/type');
const pickPriceScene = require('./assets/order/validate/validate-price/price');
// Регистрация сцен
stage.register(dateValidation);
stage.register(shippingValidation);
stage.register(timeValidation);
stage.register(bouqTypeValidation);
stage.register(pickPriceScene);

bot.use(session());
bot.use(stage.middleware());

bot.start((ctx) => {
    MainPage.displayMainPage(ctx, MainPage.welcomeMsg);
    MainPage.offerBotHelp(ctx);
    bot.action('howtouse', (ctx) => {
        ctx.telegram.answerCbQuery(ctx.update['callback_query'].id, "");
        ctx.reply('Здесь будет инструкция');
    })
});

bot.hears(/💐 Заказать букет/, (ctx) => {
    order.launch(ctx);

    bot.hears(/Меню заказа/i, (ctx) => {
        if (!order.orderIsInitialised) {
            return;
        }
       order.displayInterface(ctx, "Выберите любой пункт в меню");
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
            resolve([ctx, "Нажмите на кнопку меню, чтобы продолжить"]);
        });

        cancelOrder.then((val) => {
            let [context, msg] = val;
            MainPage.displayMainPage(context, msg);
        });
        console.log("*** Заказ отменен ***");
    });

    bot.on('callback_query', (ctx) => {
        ctx.telegram.answerCbQuery(ctx.update['callback_query'].id, "");
       if (ctx.update['callback_query'].data === "Продолжить") {
           ctx.telegram.answerCbQuery(ctx.update['callback_query'].id, "📱 Открываю меню заказа");
           order.displayInterface(ctx, "Выберите любой пункт в меню");
       } else {
           try {
               ctx.scene.enter(ctx.update['callback_query'].data);
           } catch (error) {
               ctx.reply("☹️ Извините, эта кнопка уже не работает");
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