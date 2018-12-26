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
                [Markup.callbackButton('🛵 Доставка', 'доставка')]
            ]).extra()
        )
    }

    requestShippingInfo(ctx) {
        ctx.reply('Введите адрес вручную или отправьте мне геопозицию');
    }

    processShippingInfo(address) {
        this.shipping = address;
    }

    returnShippingInfoForConfirmation(ctx) {
        if (typeof this.shipping === 'string') {
            ctx.reply(`🗺 Вы ввели этот адрес: ${this.shipping}`);
        } else {
            let [latitude, longitude] = this.shipping;
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
    validateShipping.requestShipping(ctx);
});

shippingValidation.on('callback_query', (ctx) => {
    ctx.telegram.answerCbQuery(ctx.update['callback_query'].id, "");
    if (ctx.update['callback_query'].data === 'самовывоз') {
        validateShipping.shippingInfo = false;
        ctx.reply(`Вы выбрали: ${ctx.update['callback_query'].data}.\n📍 Наш адрес: Фрунзе проспект, 46`).then(() => {
            ServiceOps.requestContinue(ctx, "выберите другой способ получения букета");
        });

    } else if (ctx.update['callback_query'].data === 'доставка') {
        validateShipping.requestShippingInfo(ctx);

    } else {
        order.setOrderInfo = ['shipping', validateShipping.shippingInfo];
        ctx.telegram.deleteMessage(ctx.update['callback_query'].message.chat.id, ctx.update['callback_query'].message['message_id']);
        order.displayInterface(ctx, "Выберите любой пункт в меню и следуйте инструкциям");
        ctx.scene.leave('shippingValidation');
    }
});

shippingValidation.hears('/Меню заказа/gi', (ctx) => {
    order.displayInterface(ctx, `Выберите любой пункт в меню и следуйте инструкциям.
            \nПри правильном заполнении данных напротив выбранного пукта меня будет стоять ✅`);
});

shippingValidation.hears('/Связаться с магазином/gi', (ctx) => {
    Contacts.showPhoneNumber(ctx);
});

shippingValidation.hears('/⛔Отменить заказ/gi', (ctx) => {
    order.cancelOrder(ctx);
    ctx.scene.leave();
});

shippingValidation.on('message', (ctx) => {
    if (ctx.updateSubTypes.indexOf('location') !== -1) {
        validateShipping.shippingInfo = [ctx.update.message.location.latitude, ctx.update.message.location.longitude];
        let [latitude, longitude] = validateShipping.shippingInfo;
        ctx.reply("Вот что вы ввели:");
        ctx.telegram.sendLocation(ctx.chat.id, latitude, longitude).then(() => {
            ServiceOps.requestContinue(ctx, "введите другой адрес");
        })
        // ctx.reply(`Пожалуйста, проверьте правильность введенной информации.\nЕсли что-то не так, напишите новый адрес или отправьте другую геопозицию`);
    } else if (ctx.updateSubTypes.indexOf('text') !== -1) {
        validateShipping.shippingInfo = (ctx.update.message.text);
        ctx.reply(`🗺 Вы ввели этот адрес: ${validateShipping.shippingInfo}`).then(() => {
            ServiceOps.requestContinue(ctx, "введите другой адрес");
        });
    } else {
        ctx.reply("⛔️ Пожалуйста, напишите адрес или отправьте геопозицию!");
    }
    console.log(ctx);
});

module.exports = validateShipping;
module.exports = shippingValidation;


