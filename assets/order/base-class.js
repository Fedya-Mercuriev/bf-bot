const Telegraf = require('telegraf');
const { Markup, Extra } = Telegraf;
const Contacts = require('../main-page/contacts');

class Base {
    // Здесь находятся все общие для всех сцен свойства и методы
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

    invokeFunction(funcName) {
        const context = arguments[1];
        if (funcName.indexOf(':') !== -1) {
            const args = funcName.split(':');
            return this[args.splice(0, 1)](context, ...args);
        }
        return this[funcName](context);
    }

    _removeConfirmationMessages(ctx) {
        this._saveDataMsg.forEach(({ message_id: id }) => {
            try {
                ctx.deleteMessage(id);
            } catch (e) {
                console.log(e.message);
            }
        });
        this._saveDataMsg.length = 0;
    }

    _cleanScene(ctx) {
        if (this._saveDataMsg.length !== 0) {
            ctx.scene.msgToDelete = this._messagesToDelete.concat(this._saveDataMsg);
        } else {
            ctx.scene.msgToDelete = this._messagesToDelete;
        }
        ctx.scene.msgToDelete.forEach(({ message_id: id }) => {
            try {
                ctx.deleteMessage(id);
            } catch (error) {
                console.log(error);
            }
        });
        this._messagesToDelete.length = 0;
    }

    _requestContinue(ctx, additionalMsg) {
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