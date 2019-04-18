/* eslint-disable indent */
/* eslint-disable no-underscore-dangle */
const Telegraf = require('telegraf');
const { Markup } = Telegraf;
const session = require('telegraf/session');
const Stage = require('telegraf/stage');
const Scene = require('telegraf/scenes/base');
const { leave } = Stage;
const orderInfo = require('./../order/order-info');
const order = require('../order/order');
const { validateDate, ValidateDate } = require('../order/validate/validate-date/date');
const dateValidation = new Scene('dateValidation');

// Команды для сцены
dateValidation.enter(async(ctx) => {
    ctx.telegram.answerCbQuery(ctx.update.callback_query.id, '⏳ Загружаю необходимые компоненты...');
    let { orderDate } = orderInfo.orderInfo;
    if (orderDate !== undefined) {
        orderDate = ValidateDate.russifyDate(new Date(orderDate));
        validateDate.confirmDateOverride(ctx, orderDate);
    } else {
        validateDate.requestDate(ctx);
    }
});

dateValidation.leave((ctx) => {
    validateDate.cleanScene(ctx);
});

dateValidation.on('message', async(ctx) => {
    if (ctx.updateSubTypes[0] !== 'text') {
        const message = await ctx.reply('⛔️ Пожалуйста, отправьте дату в виде текста');
        validateDate.messages = {
            messageType: 'other',
            messageObj: message,
        };
    } else if (ctx.update.message.text.match(/меню заказа/i)) {
        validateDate.returnToMenu(ctx, 'dateValidation');
    } else if (ctx.update.message.text.match(/связаться с магазином/i)) {
        validateDate.displayPhoneNumber(ctx);
    } else if (ctx.update.message.text.match(/отменить заказ/i)) {
        order.confirmCancelOrder(ctx);
    } else {
        validateDate.validateDate(ctx, ctx.message.text);
    }
});

dateValidation.on('callback_query', (ctx) => {
    try {
        validateDate.invokeFunction(ctx.update.callback_query.data, ctx);
    } catch (error) {
        ctx.telegram.answerCbQuery(ctx.update.callback_query.id, '⛔ Cейчас эта кнопка не доступна!');
    }
});

module.exports = dateValidation;