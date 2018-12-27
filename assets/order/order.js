const Telegraf = require('telegraf');
const {Extra, Markup} = Telegraf;
const Invoice =  require('./invoice');
// const OrderInfo = require('./order-info');

module.exports = class Order {
    constructor() {
        this.info = {
            contactInfo: undefined,
            orderDate: undefined,
            orderTime: undefined,
            // orderDateInNumbers: undefined,
            bouquetType: undefined,
            shipping: undefined,
            bouquetPrice: undefined
        };
        this.orderIsInitialised = false;
        this.welcomeMsg = `Выберите любой пункт в меню и следуйте инструкциям.
            \nПри правильном заполнении данных напротив выбранного пукта меня будет стоять ✅`;

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
            bouquetType: {
                emoji: '💐',
                text: 'Тип букета',
                callback_data: 'bouqType',
                data: this.info.bouquetType
            },
            bouquetPrice: {
                emoji: '💸',
                text: 'Стоимость букета',
                callback_data: 'bouqCost',
                data: this.info.bouquetPrice
            },
            contactInfo: {
                emoji: '📲',
                text: 'Контактные данные',
                callback_data: 'contactInfo',
                data: this.info.contactInfo
            }
        };
    }

    get getOrderInfo() {
        return this.info;
    }

    set setOrderInfo(settings) {
        let [prop, val] = settings;
        this.info[prop] = val;
    }

    launch(ctx) {
        console.log("*** Запущена функция заказа букетов");
        this.orderIsInitialised = true;
        ctx.reply("Хорошо, давайте начнем!", Markup.keyboard([
                ['📱 Меню заказа'],
                ['📞 Связаться с магазином'],
                ['⛔ Отменить заказ️']
            ])
            .oneTime()
            .resize()
            .extra()
        );
        this.displayInterface(ctx, this.welcomeMsg);
    }

    makeInterface() {
        let buttonsArr = [];
        for (let prop in this.buttons) {
            if (!this.buttons.hasOwnProperty(prop)) continue;
            let result = [];
            console.log(`${this.buttons[prop].text} = ${this.buttons[prop].data}`)
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

    displayInterface(ctx, msg) {
        return ctx.reply(msg, this.makeInterface());
    }

    cancelOrder(ctx) {
        if (!this.orderIsInitialised) {
            return;
        }
        this.orderIsInitialised = false;
        ctx.reply("❌ Заказ отменен!");
        for (let prop in this.orderInfo) {
            if (!this.orderInfo.hasOwnProperty(prop)) continue;
            this.orderInfo[prop] = undefined;
        }
    }
};