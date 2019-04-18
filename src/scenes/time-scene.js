/* eslint-disable indent */
const Telegraf = require('telegraf');
const { Markup, Extra } = Telegraf;
const session = require('telegraf/session');
const Stage = require('telegraf/stage');
const Scene = require('telegraf/scenes/base');
const order = require('../order/order');
const { validateTime } = require('./../order/validate/validate-time/time');
const { leave } = Stage;

const timeValidation = new Scene('timeValidation');

timeValidation.enter(async(ctx) => {
    ctx.telegram.answerCbQuery(ctx.update.callback_query.id, '⏳ Загружаю необходимые компоненты...');
    const { orderTime } = order.orderInfo;
    if (orderTime !== undefined) {
        validateTime.confirmTimeOverwrite(ctx, orderTime);
    } else {
        validateTime.requestTime(ctx);
    }
});

timeValidation.leave((ctx) => {
    validateTime.cleanScene(ctx);
});

timeValidation.on('callback_query', (ctx) => {
    try {
        validateTime.invokeFunction(ctx.update.callback_query.data, ctx);
    } catch (error) {
        ctx.telegram.answerCbQuery(ctx.update.callback_query.id, '⛔ Cейчас эта кнопка не доступна!');
    }
});

timeValidation.on('message', (ctx) => {
    if (ctx.updateSubTypes[0] === 'text') {
        const messageText = ctx.update.message.text;
        if (messageText.match(/Меню заказа/i)) {
            validateTime.returnToMenu(ctx, 'timeValidation');
        } else if (messageText.match(/Связаться с магазином/i)) {
            validateTime.displayPhoneNumber(ctx);
        } else if (messageText.match(/Отменить заказ/i)) {
            order.confirmCancelOrder(ctx);
        } else {
            validateTime.validateTime(ctx, messageText);
        }
    }
});

// module.exports = validateTime;
module.exports = timeValidation;