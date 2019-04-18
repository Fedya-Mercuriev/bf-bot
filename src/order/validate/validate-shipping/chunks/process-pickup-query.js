async function processPickUpQuery(ctx) {
    ctx.telegram.answerCbQuery(ctx.update.callback_query.id, '⏳ Минуточку');
    ctx.deleteMessage(ctx.update.callback_query.message.message_id);
    this.shippingAddress = false;
    const message = await ctx.replyWithHTML('Вы выбрали самовывоз.\n📍 Адрес магазина: <b>Фрунзе проспект, 46</b>');
    this.messages = {
        messageType: 'confirmation',
        messageObj: message,
    };
    this._requestContinue(
        ctx,
        'другой способ доставки',
        'saveDataKeys', {
            text: 'Выбрать другой способ доставки',
            functionName: 'requestShipping',
        },
    );
};

module.exports = processPickUpQuery;