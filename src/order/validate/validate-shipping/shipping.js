/* eslint-disable class-methods-use-this */
const Telegraf = require('telegraf');
const { Markup, Extra } = Telegraf;
const session = require('telegraf/session');
const Stage = require('telegraf/stage');
const Scene = require('telegraf/scenes/base');
const Contacts = require("../../../main-page/contacts");
const { leave } = Stage;
const order = require('../../../../core');
const ServiceOps = require('../../../service-ops');

const shippingValidation = new Scene('shippingValidation');

class Shipping {
    constructor() {
        this.shipping = undefined;
    }

    requestShipping(ctx) {
        ctx.reply("Выберите как будете забирать букет 👇",
            Markup.inlineKeyboard([
                [Markup.callbackButton('📦 Самовывоз', 'самовывоз')],
                [Markup.callbackButton('🛵 Доставка', 'доставка')],
            ]).extra(),
        );
    }

    confirmShippingOverwrite(ctx, shipping) {
        // Если был выбран самовывоз или указан адрес в виде строки
        if (shipping === false || typeof shipping !== 'object') {
            shipping = (shipping === false) ? "Самовывоз" : `(Доставка) ${shipping}`;
            ctx.replyWithHTML(`⚠️ Вы ранее выбрали этот способ доставки: <b>${shipping}</b>`).then(() => {
                return ctx.reply("Перезаписать его или оставить?", Markup.inlineKeyboard([
                    [Markup.callbackButton('Перезаписать', 'overwriteData')],
                    [Markup.callbackButton('Оставить', 'leaveData')]
                ]).extra());
            });

            // Если была отправлена геопозиция
        } else {
            let [lat, lon] = shipping;
            ctx.reply(`⚠️ Вы ранее выбрали этот способ доставки:`).then(() => {
                return ctx.replyWithLocation(lat, lon);
            }).then(() => {
                return ctx.reply("Перезаписать его или оставить?", Markup.inlineKeyboard([
                    [Markup.callbackButton('Перезаписать', 'overwriteData')],
                    [Markup.callbackButton('Оставить', 'leaveData')]
                ]).extra());
            });
            console.log(shipping);
        }
    }

    requestShippingInfo(ctx) {
        ctx.reply('Введите адрес вручную или отправьте мне геопозицию');
    }

    returnShippingInfoForConfirmation(ctx) {
        if (typeof this.shipping === 'string') {
            ctx.reply(`🗺 Вы ввели этот адрес: ${this.shipping}`);
        } else {
            let [latitude, longitude] = this.shipping;
            ctx.reply("Вы отправили эту геопозицию:");
            ctx.replyWithLocation(ctx.chat.id, latitude, longitude);
        }
    }

    get shippingInfo() {
        return this.shipping;
    }

    set shippingInfo(address) {
        this.shipping = address;
    }
};

const validateShipping = new Shipping();

shippingValidation.enter((ctx) => {
    let { shipping } = order.orderInfo;

    if (shipping !== undefined) {
        validateShipping.confirmShippingOverwrite(ctx, shipping);
    } else {
        validateShipping.requestShipping(ctx);
    }
});

shippingValidation.on('callback_query', (ctx) => {
    ctx.answerCbQuery(ctx.update['callback_query'].id, "");

    if (ctx.update['callback_query'].data === 'самовывоз') {
        validateShipping.shippingInfo = false;
        ctx.reply(`Вы выбрали: ${ctx.update['callback_query'].data}.\n📍 Наш адрес: Фрунзе проспект, 46`).then(() => {
            ServiceOps.requestContinue(ctx, "выберите другой способ получения букета");
        });

    } else if (ctx.update['callback_query'].data === 'доставка') {
        validateShipping.requestShippingInfo(ctx);

    } else if (ctx.update['callback_query'].data === 'overwriteData') {
        ServiceOps.processInputData(ctx.update['callback_query'].data, ctx, validateShipping.requestShipping.bind(validateShipping));

    } else if (ctx.update['callback_query'].data === 'leaveData') {
        ServiceOps.processInputData(ctx.update['callback_query'].data, ctx, order.displayInterface.bind(order), 'shippingValidation');

    } else {
        order.orderInfo = ['shipping', validateShipping.shippingInfo];
        ctx.telegram.deleteMessage(ctx.update['callback_query'].message.chat.id, ctx.update['callback_query'].message['message_id']);
        order.displayInterface(ctx);
        ctx.scene.leave('shippingValidation');
    }
});

shippingValidation.on('message', (ctx) => {
    // Обрабатывает контактные данные
    if (ctx.updateSubTypes.indexOf('location') !== -1) {
        validateShipping.shippingInfo = [ctx.update.message.location.latitude, ctx.update.message.location.longitude];
        let [latitude, longitude] = validateShipping.shippingInfo;
        ctx.reply("Вот выслали эту геопозицию:");
        ctx.telegram.sendLocation(ctx.chat.id, latitude, longitude).then(() => {
                ServiceOps.requestContinue(ctx, "введите другой адрес");
            })
            // ctx.reply(`Пожалуйста, проверьте правильность введенной информации.\nЕсли что-то не так, напишите новый адрес или отправьте другую геопозицию`);
    } else if (ctx.updateSubTypes.indexOf('text') !== -1) {
        let message = ctx.message.text;
        // Если была нажата кнопка "меню заказа" или введено аналогичное сообщение
        if (message.match(/Меню заказа/gi)) {
            ServiceOps.returnToMenu(ctx, order.displayInterface.bind(order), 'shippingValidation');

        } else if (message.match(/Связаться с магазином/gi)) {
            ServiceOps.displayPhoneNumber(ctx);

        } else if (message.match(/Отменить заказ/gi)) {
            order.cancelOrder(ctx);

        } else {
            validateShipping.shippingInfo = (ctx.update.message.text);
            ctx.reply(`🗺 Вы ввели этот адрес: ${validateShipping.shippingInfo}`).then(() => {
                ServiceOps.requestContinue(ctx, "введите другой адрес");
            });
        }
    } else {
        ctx.reply("⛔️ Пожалуйста, напишите адрес или отправьте геопозицию!");
    }
    console.log(ctx);
});

module.exports = validateShipping;
module.exports = shippingValidation;