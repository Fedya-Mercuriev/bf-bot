/* eslint-disable no-underscore-dangle */
/* eslint-disable indent */
/* eslint-disable import/newline-after-import */
/* eslint-disable class-methods-use-this */
const Telegraf = require('telegraf');
const { Markup, Extra } = Telegraf;
const session = require('telegraf/session');
const Stage = require('telegraf/stage');
const Scene = require('telegraf/scenes/base');
const request = require('request-promise');
const Base = require('./../../base-class');
const { leave } = Stage;
const { order, citiesList } = require('../../../../core');

const shippingValidation = new Scene('shippingValidation');

class Shipping extends Base {
    constructor() {
        super();
        this.shipping = undefined;
        // this.requestUrlBody = `geocode-maps.yandex.ru/1.x/?apikey=${mapsApiToken}&format=json`;
        // this.requestBody = 'https://geocode-maps.yandex.ru/1.x/';
        this.requestOptions = {
            uri: `https://geocode-maps.yandex.ru/1.x/?apikey=${process.env.MAPS_API_KEY}&format=json`,
            json: true,
        };
        this.city = null;
        this.shippingInfoProcessingStarted = false;
        this.saveDataKeysArr = {
            keyToAssignData: 'shipping',
            keyToAccessData: 'shipping',
            notificationMsg: 'Сохраняю выбранный способ доставки',
            sceneName: 'shippingValidation',
        };
        this.leaveDataInfo = 'shippingValidation';
        this.overwriteDataInfo = 'requestShippingInfo';
    }

    async requestShipping(ctx) {
        this._messagesToDelete = await ctx.reply('Выберите как будете забирать букет 👇',
            Markup.inlineKeyboard([
                [Markup.callbackButton('📦 Самовывоз', '_processPickUpQuery')],
                [Markup.callbackButton('🛵 Доставка', '_requestShippingInfo')],
            ]).extra(),
        );
    }

    async _requestShippingInfo(ctx) {
        ctx.answerCbQuery(ctx.update.callback_query.id, '✍️ Достаю ручку и блокнот...');
        this.shippingInfoProcessingStarted = true;
        this._messagesToDelete = await ctx.reply('Введите адрес вручную в формате "улица дом" или отправьте мне геопозицию');
    }

    async _processPickUpQuery(ctx) {
        ctx.telegram.answerCbQuery(ctx.update.callback_query.id, '⏳ Минуточку');
        this.shipping = false;
        this._confirmationMessages = await ctx.replyWithHTML('Вы выбрали самовывоз.\n📍 <b>Адрес магазина:</b> Фрунзе проспект, 46');
        this._requestContinue(ctx, 'выберите другой способ оставки', 'saveDataKeysArr');
    }

    async processShippingInfo(ctx) {
        const { json } = this.requestOptions;
        let { uri } = this.requestOptions;
        // Распознаем тип данных (текст или локация)
        if (ctx.updateSubTypes.indexOf('location') !== -1) {
            // Будем распознавать адреес по координатам
            const { latitude, longitude } = ctx.update.message.location;
            uri += `&sco=latlong&geocode=${latitude},${longitude}&kind=house&results=4`;
            console.log(uri);
        } else {
            // Будем распознавать адрес по ключевым словам
            const messageData = ctx.update.message.text.split(' ');
            if (messageData.length < 2) {
                this._messagesToDelete = await ctx.reply('⛔️ Пожалуйста, введите адрес в формате "улица дом"');
                return;
            }
            const [street, house] = messageData;
            uri += `&geocode=россия+${this.shippingCity},+${street}+${house}&kind=house&results=4`;
        }
        console.log(uri);
        uri = encodeURI(uri);
        const options = { uri, json };
        this._statusMsg = await ctx.reply('Проверяю адрес...');
        request(options)
            .then((response) => {
                console.log(response);
                this._removeMessages(ctx, this._statusMsg);
                this._processResponse(ctx, response);
            })
            .catch(async(err) => {
                this._removeMessages(ctx, this._statusMsg);
                this._statusMsg = await ctx.reply('⛔️ Упс! Что-то пошло не так. Попробуйте еще раз.');
                console.log(err.message);
            });
    }

    validateShippingInfo(ctx) {

    }

    _setShippingInfo(ctx, address) {

    }

    async _processResponse(ctx, responseObj) {
        const results = responseObj.response.GeoObjectCollection.featureMember;
        if (results.length > 0) {
            console.log(results);
        } else {
            this._messagesToDelete = await ctx.reply('⛔️ К сожалению, мне не удалось ничего найти по введенному вами адресу.\n Пожалуйста, попробуйте другой адрес');
        }
    }

    _setShippingCity(ctx, city) {
        ctx.deleteMessage(ctx.update.callback_query.message.message_id);
        order.city = city;
        this.shippingCity = city;
        this.requestShipping(ctx);
    }

    async displayCitiesList(ctx) {
        // Эта функция вызывается если магазин функционирует в нескольких городах
        // и пользователю нужно выбрать свой город
        const cities = citiesList.map(item => [Markup.callbackButton(item, `_setShippingCity:${item}`)]);
        this._messagesToDelete = await ctx.reply('Выберите ваш город', Markup.inlineKeyboard(cities).extra());
    }

    async confirmShippingOverwrite(ctx, shipping) {
        // Если был выбран самовывоз или указан адрес в виде строки
        if (shipping === false || typeof shipping !== 'object') {
            shipping = (shipping === false) ? 'Самовывоз' : `(Доставка) ${shipping}`;
            this._messagesToDelete = await ctx.replyWithHTML(`⚠️ Вы ранее выбрали этот способ доставки: <b>${shipping}</b>`);
            this._messagesToDelete = await ctx.reply('Перезаписать его или оставить?',
                Markup.inlineKeyboard([
                    [Markup.callbackButton('Перезаписать', '_overwriteData:requestShipping')],
                    [Markup.callbackButton('Оставить', '_leaveData:shippingValidation')],
                ]).extra({
                    disable_notification: true,
                }));
            // Если была отправлена геопозиция
        } else {
            const [lat, lon] = shipping;
            this._messagesToDelete = await ctx.reply('⚠️ Вы ранее выбрали этот способ доставки:');
            this._messagesToDelete = await ctx.replyWithLocation(lat, lon);
            this._messagesToDelete = await ctx.reply('Перезаписать его или оставить?', Markup.inlineKeyboard([
                [Markup.callbackButton('Перезаписать', '_overwriteData:requestShipping')],
                [Markup.callbackButton('Оставить', '_leaveData:shippingValidation')],
            ]).extra({
                disable_notification: true,
            }));
        }
    }

    returnShippingInfoForConfirmation(ctx) {}

    get shippingInfo() {
        return this.shipping;
    }

    get shippingCity() {
        return this.city;
    }

    set shippingCity(city) {
        this.city = city;
    }
}

const validateShipping = new Shipping();

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
        // Если раньшевыбирался способ доставки выполним этот блок кода
        if (shipping !== undefined) {
            validateShipping.confirmShippingOverwrite(ctx, shipping);
        } else {
            validateShipping.requestShipping(ctx);
        }
    }
});

shippingValidation.on('callback_query', (ctx) => {
    validateShipping.invokeFunction(ctx.update.callback_query.data, ctx);
});

shippingValidation.on('message', async(ctx) => {
    if (ctx.updateSubTypes.indexOf('text') !== -1 || ctx.updateSubTypes.indexOf('location') !== -1) {
        if (validateShipping.shippingInfoProcessingStarted) {
            validateShipping.processShippingInfo(ctx);
        } else {
            validateShipping._messagesToDelete = await ctx.reply('⛔️ Пожалуйста, сперва выберите как будете забирать букет!');
        }
    } else {
        validateShipping._messagesToDelete = await ctx.reply('⛔️ Пожалуйста, напишите адрес или отправьте геопозицию!');
    }
});

module.exports = shippingValidation;