/* eslint-disable no-restricted-syntax */
/* eslint-disable no-prototype-builtins */
/* eslint-disable no-underscore-dangle */
/* eslint-disable class-methods-use-this */
/* eslint-disable indent */
const Telegraf = require('telegraf');
const { Markup, Extra } = Telegraf;
const Invoice = require('./invoice');
class Order {
    constructor() {
        this.orderIsInitialised = false;
        this.info = {
            contactInfo: undefined,
            orderDate: undefined,
            orderTime: undefined,
            bouquet: undefined,
            shipping: undefined,
        };
        this.messagesStorage = {
            intro: [],
            confirmation: [],
            other: [],
        };
        this.welcomeMsg = 'Выберите любой пункт в меню и следуйте инструкциям.\nПри правильном заполнении данных напротив выбранного пукта меня будет стоять ✅';
        // Инвойс формируется в конце
        this.invoice = null;
        this.buttons = {
            orderDate: {
                emoji: '📅',
                text: 'Дата',
                callback_data: 'dateValidation',
                // Раньше было this.orderInfo.orderDate
                data: this.info.orderDate
            },
            shipping: {
                emoji: '🛵',
                text: 'Способ получения букета',
                callback_data: 'shippingValidation',
                data: this.info.shipping
            },
            orderTime: {
                emoji: '⏱',
                text: 'Время',
                callback_data: 'timeValidation',
                data: this.info.orderTime
            },
            bouquet: {
                emoji: '💐',
                text: 'Выбор букета',
                callback_data: 'bouqtypeValidation',
                data: this.info.bouquet
            },
            contactInfo: {
                emoji: '📲',
                text: 'Контактные данные',
                callback_data: 'contactInfoValidation',
                data: this.info.contactInfo
            },
        };
    }

    get messages() {
        return this.messagesStorage;
    }

    // Сеттер получает объект с сообщением,
    // извлекает из него id и кладет в соответствующую категорию
    set messages(options) {
        const { messageType, messageObj } = options;
        if (messageObj !== 'clear') {
            const { message_id: id } = messageObj;
            this.messagesStorage[messageType].push(id);
            console.log(`Добавили сообщение в: ${messageType}`);
        } else {
            if (messageType === 'all') {
                const messagesStorage = Object.keys(this.messagesStorage);
                messagesStorage.forEach((messageStorage) => {
                    messagesStorage[messageStorage].length = 0;
                });
                console.log('Очистили хранилище для сообщений');
            }
            this.messagesStorage[messageType].length = 0;
            console.log(`Удалили сообщения из: ${messageType}`);
        }
    }

    get orderInfo() {
        return this.info;
    }

    set orderInfo(settings) {
        const [prop, val] = settings;
        this.info[prop] = val;
    }

    russifyDate(date) {
        // Получает date в формате миллисекунд
        const months = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
        const usedDate = new Date(date);
        return `${usedDate.getDate()} ${months[usedDate.getMonth()]} ${usedDate.getFullYear()} года`;
    }

    convertTimeToReadableForm(time) {
        let minutes = new Date(time).getMinutes().toString();
        if (minutes.length === 1) {
            minutes = `0${minutes}`;
        }
        return `${new Date(time).getHours()}:${minutes}`;
    }

    removeMessagesOfSpecificType(ctx, propName) {
        this.messagesStorage[propName].forEach((id) => {
            try {
                ctx.deleteMessage(id);
            } catch (e) {
                console.log(e.message);
            }
        });
        this.messages = {
            messageType: propName,
            messageObj: 'clear',
        };
    }

    cleanScene(ctx) {
        const messagesBoxes = Object.keys(this.messagesStorage);
        ctx.scene.msgToDelete = [];
        // Склеим все массивы в один большой, по которому будем проходиться и удалять сообщения
        messagesBoxes.forEach((messageStorage) => {
            if (this.messagesStorage[messageStorage].length !== 0) {
                ctx.scene.msgToDelete = ctx.scene.msgToDelete.concat(this.messagesStorage[messageStorage]);
                // После добавления массива - очистим его
                this.messages = {
                    messageType: messageStorage,
                    messageObj: 'clear',
                };
            }
        });
        ctx.scene.msgToDelete.forEach((id) => {
            try {
                ctx.deleteMessage(id);
            } catch (error) {
                console.log(error);
            }
        });
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
                if (this.info[prop] !== undefined) {
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

    invokeFunction(passedArgs, ctx) {
        if (passedArgs.indexOf(':') !== -1) {
            // В первой ячейке должно лежать имя функции, которая будет вызвана
            const args = passedArgs.split(':');
            const funcName = args.splice(0, 1);
            return this[funcName](ctx, ...args);
        }
        const funcName = passedArgs;
        return this[funcName](ctx);
    }

    async displayFinalOrderInfo(ctx) {
        const { orderDate, orderTime, shipping, bouquet, contactInfo } = this.orderInfo;
        const { photo, name, price } = bouquet;
        // Обработаем дату
        const finalDate = this.russifyDate(orderDate);
        // Обработаем время
        const finalTime = this.convertTimeToReadableForm(orderTime);
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
                [Markup.callbackButton('✅ Да, все правильно!', 'showInvoice:null')],
                [Markup.callbackButton('✏️ Мне нужно кое-что поправить!', 'continueOrder:null')],
            ]),
        });
        this.messages = {
            messageType: 'confirmation',
            messageObj: returnedMessage,
        };
    }

    async confirmCancelOrder(ctx) {
        const returnedMessage = await ctx.replyWithHTML('⚠️ Внимание! ⚠️\nВы выбрали отмену заказа. Все введенные вами <b>данные будут стерты</b> и вы будете направлены на главную странцу! Продолжить?',
            Markup.inlineKeyboard([
                [Markup.callbackButton('❌ Отменить заказ', 'cancelOrder:null')],
                [Markup.callbackButton('🔝 Продолжить заказ', 'continueOrder:null')],
            ]).extra());
        this.messages = {
            messageType: 'confirmation',
            messageObj: returnedMessage,
        };
    }

    continueOrder(ctx) {
        ctx.telegram.answerCbQuery(ctx.update.callback_query.id, '🎉 Продолжаем заказ!');
        // ctx.deleteMessage(ctx.update.callback_query.message.message_id);
        this.removeMessagesOfSpecificType(ctx, 'confirmation');
    }

    async cancelOrder(ctx) {
        ctx.telegram.answerCbQuery(ctx.update.callback_query.id, '😔 Надеюсь на ваше скорое возвращение');
        ctx.deleteMessage(ctx.update.callback_query.message.message_id);
        const returnedMessage = await ctx.reply('❌ Заказ отменен!');
        this.messages = {
            messageType: 'other',
            messageObj: returnedMessage,
        };
        // Сбросим все значения в информации о заказе
        for (const prop in this.orderInfo) {
            if (this.orderInfo[prop] !== undefined) {
                this.orderInfo = [prop, undefined];
            }
        }
        ctx.scene.leave(ctx.scene.current.id);
    }
}

const order = new Order();

module.exports = order;