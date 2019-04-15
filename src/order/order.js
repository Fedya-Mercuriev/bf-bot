/* eslint-disable no-restricted-syntax */
/* eslint-disable no-prototype-builtins */

/* eslint-disable no-underscore-dangle */
/* eslint-disable class-methods-use-this */
/* eslint-disable indent */
const Telegraf = require('telegraf');
const { Extra, Markup } = Telegraf;
const session = require('telegraf/session');
const Scene = require('telegraf/scenes/base');
const Base = require('./base-class');
const Invoice = require('./invoice');
const orderScene = new Scene('orderScene');

class Order extends Base {
    constructor() {
        super();
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
        console.log('*** Запущена функция заказа букетов');
        this.orderIsInitialised = true;
        this._messagesToDelete = await ctx.reply('Хорошо, давайте начнем!',
            Markup.keyboard([
                ['📱 Меню заказа'],
                ['📞 Связаться с магазином'],
                ['⛔ Отменить заказ️'],
            ])
            .oneTime()
            .resize()
            .extra());
        this.displayInterface(ctx, this.welcomeMsg);
    }

    // Эта функция собирает меню
    makeInterface() {
        const buttonsArr = [];
        for (const prop in this.buttons) {
            if (!this.buttons.hasOwnProperty(prop)) continue;
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
        return Markup.inlineKeyboard(buttonsArr).extra();
    }

    async displayInterface(ctx) {
        const msg = 'Выберите любой пункт в меню и следуйте инструкциям.\nПри правильном заполнении данных напротив выбранного пукта меня будет стоять ✅';
        this._messagesToDelete = await ctx.reply(msg, this.makeInterface());
    }

    openValidationOperation(ctx, operationName) {
        this.cleanScene(ctx);
        try {
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

orderScene.enter((ctx) => {
    order.launch(ctx);
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
        orderScene._messagesToDelete = await ctx.reply('⛔️ Пожалуйста, выберите пункт в меню!');
    }
});

orderScene.hears(/меню заказа/, (ctx) => {
    orderScene.displayInterface(ctx);
});

orderScene.hears(/связаться с магазином/, (ctx) => {
    orderScene.displayPhoneNumber(ctx);
});

orderScene.hears(/отменить заказ/, async(ctx) => {
    this._messagesToDelete = await ctx.reply('Отменяем заказ (пока нет)');
});

module.exports = { order, orderScene };