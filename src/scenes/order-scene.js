/* eslint-disable no-lonely-if */
/* eslint-disable no-underscore-dangle */
/* eslint-disable indent */
const Telegraf = require('telegraf');
const { Extra, Markup } = Telegraf;
const Stage = require('telegraf/stage');
const session = require('telegraf/session');
const Scene = require('telegraf/scenes/base');
const order = require('../order/order');
const orderScene = new Scene('orderScene');

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
            if (checkIfAllInfoComplete(order.orderInfo)) {
                // Сперва покажем информацию для подтверждения, а затем выведем это сообщение
                const message = await ctx.reply('Как будете рассчитываться?\nПри оплате в Телеграме можно внести лишь предоплату',
                    Markup.inlineKeyboard([
                        [Markup.callbackButton('При получении', 'postOrder')],
                        [Markup.callbackButton('В Телеграме', 'showInvoice')],
                    ]));
                order.messages = {
                    messageType: 'other',
                    messageObj: message,
                };
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
        const message = await ctx.reply('⛔️ Пожалуйста, выберите пункт в меню!');
        order.messages = {
            messageType: 'other',
            messageObj: message,
        };
    } else {
        if (ctx.update.message.text.match(/меню заказа/i)) {
            order.returnToMenu(ctx, order.displayInterface.bind(order), 'dateValidation');
        } else if (ctx.update.message.text.match(/связаться с магазином/i)) {
            order.displayPhoneNumber(ctx);
        } else if (ctx.update.message.text.match(/отменить заказ/i)) {
            order.confirmCancelOrder(ctx);
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