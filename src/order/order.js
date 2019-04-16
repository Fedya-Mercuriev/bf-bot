/* eslint-disable no-restricted-syntax */
/* eslint-disable no-prototype-builtins */
/* eslint-disable no-underscore-dangle */
/* eslint-disable class-methods-use-this */
/* eslint-disable indent */
const Telegraf = require('telegraf');
const { Extra, Markup } = Telegraf;
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
        this.welcomeMsg = 'Выберите любой пункт в меню и следуйте инструкциям.\nПри правильном заполнении данных напротив выбранного пукта меня будет стоять ✅';
        this._botSentMessages = [];
        // Инвойс формируется в конце
        this.invoice = new Invoice();
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

    get orderInfo() {
        return this.info;
    }

    set orderInfo(settings) {
        const [prop, val] = settings;
        this.info[prop] = val;
    }

    get _messagesToDelete() {
        return this._botSentMessages;
    }

    set _messagesToDelete(message) {
        if (message === 'clearArr') {
            this._botSentMessages.length = 0;
        } else {
            const { message_id: id } = message;
            this._botSentMessages.push(id);
        }
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
        this._messagesToDelete = await ctx.reply('Вы в меню заказа',
            Markup.keyboard([
                ['📞 Связаться с магазином'],
                ['⛔ Отменить заказ'],
            ])
            .oneTime()
            .resize()
            .extra());
        this._messagesToDelete = await ctx.reply(msg, this.makeInterface());
    }

    openValidationOperation(ctx, operationName) {
        const baseSceneName = ctx.scene.current.id;
        this.cleanScene(ctx);
        console.log(ctx.scene);
        try {
            ctx.scene.leave(baseSceneName);
            ctx.scene.enter(operationName);
        } catch (e) {
            console.log(e.message);
            ctx.telegram.answerCbQuery(ctx.update.callback_query.id, '⛔ Что-то пошло не так!');
        }
    }

    cancelOrder(ctx) {
        if (!this.orderIsInitialised) {
            return;
        }
        this.orderIsInitialised = false;
        ctx.reply("❌ Заказ отменен!");
        for (let prop in this.orderInfo) {
            this.orderInfo = [prop, undefined];
        }
    }

    cleanScene(ctx) {
        ctx.scene.msgToDelete = this._messagesToDelete;
        ctx.scene.msgToDelete.forEach((id) => {
            try {
                ctx.deleteMessage(id);
            } catch (error) {
                console.log(error);
            }
        });
        this._messagesToDelete = 'clearArr';
    }
}

const order = new Order();

module.exports = order;