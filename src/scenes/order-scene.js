/* eslint-disable no-lonely-if */
/* eslint-disable no-underscore-dangle */
/* eslint-disable indent */
const Telegraf = require('telegraf');
const { Extra, Markup } = Telegraf;
const Stage = require('telegraf/stage');
const session = require('telegraf/session');
const Scene = require('telegraf/scenes/base');
const orderInfo = require('./../order/order-info');
const order = require('../order/order');
const orderScene = new Scene('orderScene');
const bot = require('./../../core');

function checkIfAllInfoComplete(infoObj) {
    let result = true;
    const props = Object.values(infoObj);
    props.forEach((value) => {
        if (value === undefined) {
            result = false;
        }
    });
    return result;
}

orderScene.enter(async(ctx) => {
    order.displayInterface(ctx)
        .then(async() => {
            if (checkIfAllInfoComplete(orderInfo.orderInfo)) {
                order.displayFinalOrderInfo(ctx);
            }
        });
});

orderScene.leave((ctx) => {
    order.cleanScene(ctx);
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
        if (ctx.updateSubTypes[0] === 'successful_payment') {
            order.postOrder(ctx);
            ctx.scene.leave(ctx.scene.id);
        } else if (ctx.updateSubTypes[0] === 'pre_checkout_query') {
            return order.answerPrecheckout(ctx);
        } else {
            const message = await ctx.reply('⛔️ Пожалуйста, выберите пункт в меню!');
            order.messages = {
                messageType: 'other',
                messageObj: message,
            };
        }
    } else {
        if (ctx.update.message.text.match(/меню заказа/i)) {
            order.returnToMenu(ctx, order.displayInterface.bind(order), 'dateValidation');
        } else if (ctx.update.message.text.match(/связаться с магазином/i)) {
            order.displayPhoneNumber(ctx);
        } else if (ctx.update.message.text.match(/отменить заказ/i)) {
            order.cancelOrder(ctx, false);
        } else if (order.orderConfirmationIsDisplayed) {
            order.displayFinalOrderInfo(ctx, ctx.update.message.text);
        } else {
            const returnedMessage = await ctx.reply('😐 Увы, я не понимаю что вы написали. Может, лучше продолжить заказ букета? 😁');
            order.messages = {
                messageType: 'other',
                messageObj: returnedMessage,
            };
        }
    }
});

module.exports = orderScene;