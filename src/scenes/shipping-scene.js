/* eslint-disable no-lonely-if */
/* eslint-disable indent */
const Telegraf = require('telegraf');
const session = require('telegraf/session');
const Stage = require('telegraf/stage');
const Scene = require('telegraf/scenes/base');
const { leave } = Stage;
const order = require('../order/order');
const citiesList = require('../../core');
const validateShipping = require('../order/validate/validate-shipping/shipping');

const shippingValidation = new Scene('shippingValidation');

shippingValidation.enter((ctx) => {
    const { shipping } = order.orderInfo;

    if (!order.city && typeof citiesList === 'object') {
        // Если способ доставки выбирается впервые, а также магазин функционирует
        // в нескольких городах - выводится список городов
        validateShipping.displayCitiesList(ctx);
    } else if (!order.city && typeof citiesList === 'string') {
        // Если способ доставки выбирается впервые, но магазин функционирует лишь
        // в одном городе - город устанавливается автоматически
        order.city = citiesList;
        validateShipping.shippingCity = citiesList;
        if (shipping !== undefined) {
            validateShipping.confirmShippingOverwrite(ctx, shipping);
        } else {
            validateShipping.requestShipping(ctx);
        }
    } else {
        // Если раньше выбирался способ доставки выполним этот блок кода
        if (shipping !== undefined) {
            validateShipping.confirmShippingOverwrite(ctx, shipping);
        } else {
            validateShipping.requestShipping(ctx);
        }
    }
});

shippingValidation.on('callback_query', (ctx) => {
    try {
        validateShipping.invokeFunction(ctx.update.callback_query.data, ctx);
    } catch (error) {
        ctx.telegram.answerCbQuery(ctx.update.callback_query.id, '⛔ Cейчас эта кнопка не доступна!');
    }
});

shippingValidation.on('message', async(ctx) => {
    if (ctx.updateSubTypes.indexOf('text') !== -1) {
        if (ctx.update.message.text.match(/меню заказа/i)) {
            validateShipping.returnToMenu(ctx, 'shippingValidation');
        } else if (ctx.update.message.text.match(/связаться с магазином/i)) {
            validateShipping.displayPhoneNumber(ctx);
        } else if (ctx.update.message.text.match(/отменить заказ/i)) {
            ctx.reply('Отменяем заказ (пока нет)');
        } else {
            validateShipping.validateShippingInfo(ctx, order.city);
        }
    } else if (ctx.updateSubTypes.indexOf('location') !== -1) {
        validateShipping.validateShippingInfo(ctx, order.city);
    } else {
        validateShipping.messagesToDelete = await ctx.reply('⛔️ Пожалуйста, напишите адрес или отправьте геопозицию!');
    }
});

module.exports = shippingValidation;