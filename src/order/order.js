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
const generateInvoice = require('./invoice');
const MainPage = require('./../main-page/main-page');

class Order extends Base {
    constructor() {
        super();
        this.orderIsInitialised = false;
        this.orderConfirmationIsDisplayed = false;
        this.messagesStorage = {
            intro: [],
            confirmation: [],
            invoice: [],
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

    async displayFinalOrderInfo(ctx) {
        const { orderDate, orderTime, shipping, bouquet, contactInfo } = orderInfo.orderInfo;
        const { photo, name, price } = bouquet;
        // Обработаем дату
        const finalDate = ValidateDate.russifyDate(orderDate);
        // Обработаем время
        const finalTime = Time.convertTimeToReadableForm(orderTime);
        // Обработаем информацию о доставке
        const shippingInfo = (shipping === false) ? 'самовывоз' : shipping;
        // Соберем всю обработанную информацию
        const bouquetCaption = `<b>Дата:</b> ${finalDate};\n<b>Время:</b> ${finalTime};\n<b>Доставка:</b> ${shippingInfo};\n<b>Контактный телефон:</b> ${contactInfo};\n<b>Название букета:</b> ${name};\n<b>Стоимость:</b> ${price};`;
        let returnedMessage = await ctx.reply('Пожалуйста, проверьте введенную информацию!');
        this.messages = {
            messageType: 'confirmation',
            messageObj: returnedMessage,
        };
        returnedMessage = await ctx.telegram.sendPhoto(ctx.chat.id, photo, {
            caption: bouquetCaption,
            parse_mode: 'HTML',
            reply_markup: Markup.inlineKeyboard([
                [Markup.callbackButton('✅ Да, все правильно!', 'askPayment:null')],
                [Markup.callbackButton('✏️ Мне нужно кое-что поправить!', 'reviewInfo:null')],
            ]),
        });
        this.messages = {
            messageType: 'confirmation',
            messageObj: returnedMessage,
        };
    }

    async reviewInfo(ctx) {
        ctx.telegram.answerCbQuery(ctx.update.callback_query.id, '⏳ Загружаю меню заказа...');
        await this.cleanScene(ctx);
        await this.displayInterface(ctx);
        const returnedMessage = await ctx.reply('Кликните на пункт меню, информацию в котором вы хотите исправить.');
        this.messages = {
            messageType: 'other',
            messageObj: returnedMessage,
        };
    }

    async askPayment(ctx, action = undefined) {
        if (action === 'reviewPaymentMethod') {
            ctx.deleteMessage(ctx.update.callback_query.message.message_id);
        }
        ctx.telegram.answerCbQuery(ctx.update.callback_query.id, '⏳ Загружаю варианты платежей...');
        const returnedMessage = ctx.reply('Как будете платить за букет?\nПри оплате в Телеграме можно внести предоплату',
            Markup.inlineKeyboard([
                [Markup.callbackButton('✈️ В Телеграме', 'showInvoice:null')],
                [Markup.callbackButton('🏭 В магазине', 'postOrder:null')],
            ]).extra());
        this.messages = {
            messageType: 'confirmation',
            messageObj: returnedMessage,
        };
    }

    async showInvoice(ctx) {
        const { replyWithInvoice } = ctx;
        ctx.deleteMessage(ctx.update.callback_query.message.message_id);
        ctx.telegram.answerCbQuery(ctx.update.callback_query.id, '⏳ Подготавливаю чек...');
        const { bouquet, shipping } = orderInfo.orderInfo;
        const invoice = generateInvoice({
            bouquet,
            shipping,
        });
        const replyOptions = Markup.inlineKeyboard([
            [Markup.payButton('Оплатить заказ')],
            [Markup.callbackButton('Выбрать другой способ оплаты', 'askPayment:reviewPaymentMethod')],
        ]).extra();
        const returnedMessage = await replyWithInvoice(invoice, replyOptions);
        this.messages = {
            messageType: 'invoice',
            messageObj: returnedMessage,
        };
    }

    answerPrecheckout({ answerPreCheckoutQuery }) {
        answerPreCheckoutQuery(true);
    }

    async postOrder(ctx) {
        // Распарсим информацию о заказе
        const { orderDate, orderTime, bouquet, shipping, contactInfo } = orderInfo.orderInfo;
        const { name, photo, price } = bouquet;
        let cardCaption;
        if (shipping !== false) {
            cardCaption = `ℹ️ <b>Название:</b> ${name};\n💰 <b>Стоимость:</b> ${price};\n🗓 <b>Сделать и доставить заказ к:</b> ${orderDate}-${orderTime};\n📲 <b>Номер телефона клиента:</b> ${contactInfo}`;
        }
        cardCaption = `ℹ️ <b>Название:</b> ${name};\n<b>Стоимость:</b> ${price};\n🗓 <b>Сделать заказ к:</b> ${ValidateDate.russifyDate(orderDate)}-${Time.convertTimeToReadableForm(orderTime)};\n📲 <b>Номер телефона клиента:</b> ${contactInfo}`;
        // Уведомим пользователя о том, что заказ был отправлен
        try {
            const returnedMessage = await ctx.reply('✅ Ваш заказ был отправлен!');
            this.messages = {
                messageType: 'other',
                messageObj: returnedMessage,
            };
        } catch (e) {
            const returnedMessage = await ctx.reply('⛔️ Упс! Что-то пошло не так! Попробуйте еще раз.');
            this.messages = {
                messageType: 'other',
                messageObj: returnedMessage,
            };
        }
        // Информация о заказе отправялется в админ группу
        await ctx.telegram.sendMessage(process.env.TEST_ADMIN_GROUP_ID, '🎉 Новый заказ! 🎉');
        await ctx.telegram.sendPhoto(process.env.TEST_ADMIN_GROUP_ID, photo,
            Markup.inlineKeyboard([
                [Markup.callbackButton('✅ Заказ готов', `orderDone:${ctx.chat.id}`)],
            ]).extra({
                caption: cardCaption,
                parse_mode: 'HTML',
            }));
        MainPage.displayMainPage(ctx, 'Вы в главном меню!');
        ctx.scene.leave(ctx.scene.id);
    }

    async continueOrder(ctx) {
        ctx.telegram.answerCbQuery(ctx.update.callback_query.id, '🎉 Продолжаем заказ!');
        this.removeMessagesOfSpecificType(ctx, 'confirmation');
    }

    async cancelOrder(ctx, cancelConfirmed = false) {
        cancelConfirmed = (cancelConfirmed === 'true') ? true : false;
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