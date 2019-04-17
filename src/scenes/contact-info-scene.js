/* eslint-disable indent */
const Telegraf = require('telegraf');
const session = require('telegraf/session');
const Stage = require('telegraf/stage');
const Scene = require('telegraf/scenes/base');
const order = require('./../order/order');
const validateContactInfo = require('./../order/validate/validate-contact-info/contact-info');

const contactInfoValidation = new Scene('contactInfoValidation');

contactInfoValidation.enter((ctx) => {
    ctx.telegram.answerCbQuery(ctx.update.callback_query.id, '⏳ Загружаю все необходимые компоненты');
    const { contactInfo } = order.orderInfo;
    if (contactInfo !== undefined) {
        validateContactInfo.confirmInfoOverwrite(ctx, contactInfo);
    } else {
        validateContactInfo.requestContactInfo(ctx);
    }
});

contactInfoValidation.on('message', async(ctx) => {
    if (ctx.updateSubTypes[0] === 'text') {
        if (ctx.update.message.text.match(/меню заказа/i)) {
            validateContactInfo.returnToMenu(ctx, 'contactInfoValidation');
        } else if (ctx.update.message.text.match(/связаться с магазином/i)) {
            validateContactInfo.displayPhoneNumber(ctx);
        } else if (ctx.update.message.text.match(/отменить заказ/i)) {
            validateContactInfo.cancelOrder(ctx);
        } else {
            validateContactInfo.identifyDataType(ctx, ctx.updateSubTypes[0]);
        }
    } else if (ctx.updateSubTypes[0] === 'contact') {
        validateContactInfo.identifyDataType(ctx, ctx.updateSubTypes[0]);
    } else {
        const message = await ctx.reply('К сожалению, в данном разделе я воспринимаю только текст 😐');
        this.messages = {
            messageType: 'other',
            messageObj: message,
        };
    }
});

contactInfoValidation.on('callback_query', (ctx) => {
    try {
        validateContactInfo.invokeFunction(ctx.update.callback_query.data, ctx);
    } catch (error) {
        ctx.telegram.answerCbQuery(ctx.update.callback_query.id, '⛔ Cейчас эта кнопка не доступна!');
    }
});

module.exports = contactInfoValidation;