/* eslint-disable no-underscore-dangle */
/* eslint-disable indent */
const Telegraf = require('telegraf');
const { Extra, Markup } = Telegraf;
const Stage = require('telegraf/stage');
const session = require('telegraf/session');
const Scene = require('telegraf/scenes/base');
const order = require('../order/order');
const orderScene = new Scene('orderScene');

orderScene.enter((ctx) => {
    order.displayInterface(ctx);
});

orderScene.on('callback_query', (ctx) => {
    try {
        order.openValidationOperation(ctx, ctx.update.callback_query.data);
    } catch (error) {
        ctx.telegram.answerCbQuery(ctx.update.callback_query.id, '⛔ Cейчас эта кнопка не доступна!');
    }
});

orderScene.on('message', async(ctx) => {
    if (ctx.updateSubTypes[0] !== 'text') {
        order.messagesToDelete = await ctx.reply('⛔️ Пожалуйста, выберите пункт в меню!');
    }
});

orderScene.hears(/связаться с магазином/, (ctx) => {
    order.displayPhoneNumber(ctx);
});

orderScene.hears(/отменить заказ/, async(ctx) => {
    order.messagesToDelete = await ctx.reply('Отменяем заказ (пока нет)');
});

module.exports = orderScene;