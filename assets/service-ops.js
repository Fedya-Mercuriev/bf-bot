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

    returnToMenu() {
        return Markup.inlineKeyboard([
            Markup.callbackButton('Вернуться в меню', 'returnToMenu')
        ]).extra()
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