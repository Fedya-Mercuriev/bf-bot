const Telegraf = require('telegraf');
const { Markup, Extra } = Telegraf;
const Contacts = require('../main-page/contacts');

class Base {
    constructor() {
        this._userMessages = [];
    }

    get _messagesToDelete() {
        return this._userMessages;
    }

    set _messagesToDelete(message) {
        if (message === 'delete') {
            this._userMessages.length = 0;
        } else {
            const { message_id: id } = message;
            this._userMessages.push(id);
        }
    }

    async _requestContinue(ctx, additionalMsg) {
        return ctx.reply(`Нажмите на кнопку ниже, чтобы продолжить заказ букета или ${additionalMsg}`,
            Markup.inlineKeyboard([
                Markup.callbackButton('Продолжить', '_saveAndExit')
            ]).extra())
    }

    returnToMenu(ctx, sceneName) {
        ctx.scene.leave(sceneName);
    }

    displayPhoneNumber(ctx) {
        return Contacts.showPhoneNumber(ctx);
    }


}

module.exports = Base;