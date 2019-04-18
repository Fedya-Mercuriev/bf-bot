/* eslint-disable no-restricted-syntax */
/* eslint-disable no-prototype-builtins */
/* eslint-disable no-underscore-dangle */
/* eslint-disable class-methods-use-this */
/* eslint-disable indent */
const Telegraf = require('telegraf');
const { Markup, Extra } = Telegraf;
const Invoice = require('./invoice');
const Base = require('./base-class');
const orderInfo = require('./order-info');
const { ValidateDate } = require('./../order/validate/validate-date/date');
const { Time } = require('./../order/validate/validate-time/time');

class Order extends Base {
    constructor() {
        super();
        this.orderIsInitialised = false;
        this.orderConfirmationIsDisplayed = false;
        this.messagesStorage = {
            intro: [],
            confirmation: [],
            other: [],
        };
        this.welcomeMsg = 'Выберите любой пункт в меню и следуйте инструкциям.\nПри правильном заполнении данных напротив выбранного пукта меня будет стоять ✅';
        this.buttons = {
            orderDate: {
                emoji: '📅',
                text: 'Дата',
                callback_data: 'dateValidation',
            },
            shipping: {
                emoji: '🛵',
                text: 'Способ получения букета',
                callback_data: 'shippingValidation',
            },
            orderTime: {
                emoji: '⏱',
                text: 'Время',
                callback_data: 'timeValidation',
            },
            bouquet: {
                emoji: '💐',
                text: 'Выбор букета',
                callback_data: 'bouqtypeValidation',
            },
            contactInfo: {
                emoji: '📲',
                text: 'Контактные данные',
                callback_data: 'contactInfoValidation',
            },
        };
    }

    async launch(ctx) {
        this.displayInterface(ctx, this.welcomeMsg);
    }

    // Эта функция собирает меню
    makeInterface() {
        const buttonsArr = [];
        for (const prop in this.buttons) {
            if (this.buttons.hasOwnProperty(prop)) {
                const result = [];
                if (orderInfo.orderInfo[prop] !== undefined) {
                    result.push(Markup.callbackButton(`✅ ${this.buttons[prop].text}`, `${this.buttons[prop].callback_data}`));
                    buttonsArr.push(result);
                } else {
                    result.push(Markup.callbackButton(`${this.buttons[prop].emoji} ${this.buttons[prop].text}`,
                        `${this.buttons[prop].callback_data}`));
                    buttonsArr.push(result);
                }
            }
        }
        return Markup.inlineKeyboard(buttonsArr).extra();
    }

    async displayInterface(ctx) {
        const msg = 'Выберите любой пункт в меню и следуйте инструкциям.\nПри правильном заполнении данных напротив выбранного пукта меня будет стоять ✅';
        let returnedMessage = await ctx.reply('Вы в меню заказа',
            Markup.keyboard([
                ['📞 Связаться с магазином'],
                ['⛔ Отменить заказ'],
            ])
            .oneTime()
            .resize()
            .extra());
        this.messages = {
            messageType: 'intro',
            messageObj: returnedMessage,
        };
        returnedMessage = await ctx.reply(msg, this.makeInterface());
        this.messages = {
            messageType: 'other',
            messageObj: returnedMessage,
        };
    }

    openValidationOperation(ctx, operationName) {
        if (operationName.indexOf(':') !== -1) {
            const [operation, passedArgs] = operationName.split(':');
            // this[operation](ctx, functionToinvoke);
            this.invokeFunction(`${operation}:${passedArgs}`, ctx);
        } else {
            const baseSceneName = ctx.scene.current.id;
            try {
                ctx.scene.leave(baseSceneName);
                ctx.scene.enter(operationName);
            } catch (e) {
                console.log(e.message);
                ctx.telegram.answerCbQuery(ctx.update.callback_query.id, '⛔ Что-то пошло не так!');
            }
        }
    }

    async displayFinalOrderInfo(ctx, comment = undefined) {
        const { orderDate, orderTime, shipping, bouquet, contactInfo } = orderInfo.orderInfo;
        const { photo, name, price } = bouquet;
        // Обработаем дату
        const finalDate = ValidateDate.russifyDate(orderDate);
        // Обработаем время
        const finalTime = Time.convertTimeToReadableForm(orderTime);
        // Обработаем информацию о доставке
        const shippingInfo = (shipping === false) ? 'самовывоз' : shipping;
        // Соберем всю обработанную информацию
        let bouquetCaption;
        if (comment) {
            bouquetCaption = `<b>Дата:</b> ${finalDate};\n<b>Время:</b> ${finalTime};\n<b>Доставка:</b> ${shippingInfo};\n<b>Контактный телефон:</b> ${contactInfo};\n<b>Название букета:</b> ${name};\n<b>Стоимость:</b> ${price};<b>Комментарий:</b> ${comment}`;
        } else {
            bouquetCaption = `<b>Дата:</b> ${finalDate};\n<b>Время:</b> ${finalTime};\n<b>Доставка:</b> ${shippingInfo};\n<b>Контактный телефон:</b> ${contactInfo};\n<b>Название букета:</b> ${name};\n<b>Стоимость:</b> ${price};`;
        }
        let returnedMessage = await ctx.reply('Пожалуйста, проверьте введенную информацию!');
        this.messages = {
            messageType: 'confirmation',
            messageObj: returnedMessage,
        };
        returnedMessage = await ctx.telegram.sendPhoto(ctx.chat.id, photo, {
            caption: bouquetCaption,
            parse_mode: 'HTML',
            reply_markup: Markup.inlineKeyboard([
                [Markup.callbackButton('✅ Да, все правильно!', 'showInvoice:null')],
                [Markup.callbackButton('✏️ Мне нужно кое-что поправить!', 'continueOrder:null')],
            ]),
        });
        this.messages = {
            messageType: 'confirmation',
            messageObj: returnedMessage,
        };
    }

    // async confirmCancelOrder(ctx) {
    //     const returnedMessage = await ctx.replyWithHTML('⚠️ Внимание! ⚠️\nВы выбрали отмену заказа. Все введенные вами <b>данные будут стерты</b> и вы будете направлены на главную странцу! Продолжить?',
    //         Markup.inlineKeyboard([
    //             [Markup.callbackButton('❌ Отменить заказ', 'cancelOrder:true')],
    //             [Markup.callbackButton('🔝 Продолжить заказ', 'continueOrder:null')],
    //         ]).extra());
    //     this.messages = {
    //         messageType: 'confirmation',
    //         messageObj: returnedMessage,
    //     };
    // }

    async continueOrder(ctx) {
        ctx.telegram.answerCbQuery(ctx.update.callback_query.id, '🎉 Продолжаем заказ!');
        this.removeMessagesOfSpecificType(ctx, 'confirmation');
        const returnedMessage = await ctx.reply('Кликните на пункт меню, информацию в котором вы хотите исправить.');
        this.messages = {
            messageType: 'other',
            messageObj: returnedMessage,
        };
    }

    async cancelOrder(ctx, cancelConfirmed = false) {
        if (!cancelConfirmed) {
            // Этот блок выполнится если была вызвана функция отмена заказа
            const returnedMessage = await ctx.replyWithHTML('⚠️ Внимание! ⚠️\nВы выбрали отмену заказа. Все введенные вами <b>данные будут стерты</b> и вы будете направлены на главную странцу! Продолжить?',
                Markup.inlineKeyboard([
                    [Markup.callbackButton('❌ Отменить заказ', 'cancelOrder:true')],
                    [Markup.callbackButton('🔝 Продолжить заказ', 'continueOrder:null')],
                ]).extra());
            this.messages = {
                messageType: 'confirmation',
                messageObj: returnedMessage,
            };
        } else {
            // Этот блок выполнится если отмена заказа была подстверждена
            ctx.telegram.answerCbQuery(ctx.update.callback_query.id, '😔 Надеюсь на ваше скорое возвращение');
            ctx.deleteMessage(ctx.update.callback_query.message.message_id);
            const returnedMessage = await ctx.reply('❌ Заказ отменен!');
            this.messages = {
                messageType: 'other',
                messageObj: returnedMessage,
            };
            // Сбросим все значения в информации о заказе
            for (const prop in orderInfo.orderInfo) {
                if (orderInfo.orderInfo[prop] !== undefined) {
                    orderInfo.orderInfo = [prop, undefined];
                }
            }
            ctx.scene.leave(ctx.scene.current.id);
        }
    }
}

const order = new Order();

module.exports = order;