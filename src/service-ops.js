const Telegraf = require('telegraf');
const { Markup, Extra } = Telegraf;
const Contacts = require("./main-page/contacts");

class ServiceOperations {
    constructor() {}

    requestContinue(ctx, additionalMsg) {
        return ctx.reply(`Нажмите на кнопку ниже, чтобы продолжить заказ букета или ${additionalMsg}`,
            Markup.inlineKeyboard([
                Markup.callbackButton('Продолжить', '_saveAndExit')
            ]).extra());
    }

    returnToMenu(ctx, callback, sceneName) {
        callback(ctx);
        ctx.scene.leave(sceneName);
    }

    displayPhoneNumber(ctx) {
        return Contacts.showPhoneNumber(ctx);
    }

    processInputData(command, ctx, callback, sceneName = null) {
        // command = overwrite || leave
        if (command === 'overwriteData') {
            ctx.telegram.deleteMessage(ctx.update['callback_query'].message.chat.id, ctx.update['callback_query'].message['message_id']);
            callback(ctx);

        } else {
            ctx.telegram.deleteMessage(ctx.update['callback_query'].message.chat.id, ctx.update['callback_query'].message['message_id']);
            callback(ctx);
            ctx.scene.leave(sceneName);
        }
    }
}

module.exports = new ServiceOperations();