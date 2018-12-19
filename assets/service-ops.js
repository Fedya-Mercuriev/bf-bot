const Telegraf = require('telegraf');
const { Markup, Extra } = Telegraf;

class ServiceOperations {
    constructor() {
    }

    requestContinue(ctx, additionalMsg) {
        return ctx.reply(`Нажмите на кнопку ниже, чтобы продолжить заказ букета или ${additionalMsg}`,
            Markup.inlineKeyboard([
                Markup.callbackButton('Продолжить', 'продолжить')
            ]).extra());
    }
}

module.exports = new ServiceOperations();