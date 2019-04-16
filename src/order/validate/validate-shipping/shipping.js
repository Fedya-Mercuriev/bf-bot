/* eslint-disable no-underscore-dangle */
/* eslint-disable indent */
/* eslint-disable import/newline-after-import */
/* eslint-disable class-methods-use-this */
const Telegraf = require('telegraf');
const { Markup, Extra } = Telegraf;
const request = require('request-promise');
const Base = require('./../../base-class');
const { sendRequest, processResponse, prepareButtons } = require('./chunks/process-shipping-info');
const order = require('./../../order');
const citiesList = require('../../../../core');

class Shipping extends Base {
    constructor() {
        super();
        this.shippingAddress = undefined;
        this.requestOptions = {
            uri: `https://geocode-maps.yandex.ru/1.x/?apikey=${process.env.MAPS_API_KEY}&format=json`,
            json: true,
        };
        this._addressButtons = [];
        this._sendRequest = sendRequest;
        this._processResponse = processResponse;
        this._prepareButtons = prepareButtons;
        this.city = null;
        this.shippingInfoProcessingStarted = false;
        this._tempButtonsStorage = [];
        this.saveDataKeysArr = {
            keyToAssignData: 'shipping',
            keyToAccessData: 'shippingAddress',
            notificationMsg: 'Сохраняю выбранный способ доставки',
            sceneName: 'shippingValidation',
        };
        this.leaveDataInfo = 'shippingValidation';
        this.overwriteDataInfo = 'requestShippingInfo';
    }

    async requestShipping(ctx) {
        if (this.shipping !== undefined) {
            this.shipping = undefined;
        }
        ctx.telegram.answerCbQuery(ctx.update.callback_query.id, 'Записываю способы доставки...');
        if (this._confirmationMessages.length) {
            this._removeMessages(ctx, '_confirmationMessages');
        }
        if (this.addressButtons.length) {
            this._removeMessages(ctx, 'addressButtons');
        }
        this.messagesToDelete = await ctx.reply('Выберите как будете забирать букет 👇',
            Markup.inlineKeyboard([
                [Markup.callbackButton('📦 Самовывоз', '_processPickUpQuery')],
                [Markup.callbackButton('🛵 Доставка', '_requestAddress')],
            ]).extra(),
        );
    }

    async _requestAddress(ctx) {
        ctx.telegram.answerCbQuery(ctx.update.callback_query.id, '✍️ Достаю ручку и блокнот...');
        ctx.deleteMessage(ctx.update.callback_query.message.message_id);
        this.shippingInfoProcessingStarted = true;
        this.messagesToDelete = await ctx.reply('Введите адрес вручную в формате "улица, дом" или отправьте мне геопозицию');
    }

    async _processPickUpQuery(ctx) {
        ctx.telegram.answerCbQuery(ctx.update.callback_query.id, '⏳ Минуточку');
        ctx.deleteMessage(ctx.update.callback_query.message.message_id);
        this.shippingAddress = false;
        this._confirmationMessages = await ctx.replyWithHTML('Вы выбрали самовывоз.\n📍 Адрес магазина: <b>Фрунзе проспект, 46</b>');
        this._requestContinue(
            ctx,
            'другой способ доставки',
            'saveDataKeysArr', {
                text: 'Выбрать другой способ доставки',
                functionName: 'requestShipping',
            },
        );
    }

    _identifyMessageType(ctx) {
        return new Promise((resolve) => {
            if (ctx.updateSubTypes.indexOf('location') !== -1) {
                resolve({
                    msgText: ctx.update.message.location,
                    msgType: 'location',
                });
            } else {
                resolve({
                    msgText: ctx.update.message.text,
                    msgType: 'text',
                });
            }
        });
    }

    async validateShippingInfo(ctx, shippingCity) {
        const options = {
            json: true,
            uri: `https://geocode-maps.yandex.ru/1.x/?apikey=${process.env.MAPS_API_KEY}&format=json`,
            shippingCity,
        };
        if (!this.shippingInfoProcessingStarted) {
            this.messagesToDelete = await ctx.reply('⛔️ Пожалуйста, сперва выберите как будете забирать букет!');
            return;
        }
        // Если раньше уже вводился адрес были отображены кнопки для его сохранения – удалим их
        if (this.addressButtons.length || this._confirmationMessages.length) {
            this._removeMessages(ctx, 'addressButtons');
            this._removeConfirmationMessages(ctx);
        }
        this._statusMsg = await ctx.reply('Проверяю адрес...');
        // Распознаем какого типа даннеы и подготовим сообщение
        this._identifyMessageType(ctx)
            // Отправим запрос к API Яндекса
            .then(preparedMessage => this._sendRequest(preparedMessage, options))
            // Обработаем ответ (отсечем неподходящие результаты)
            .then(async(response) => {
                this._removeMessages(ctx, '_statusMsg');
                return this._processResponse(response, shippingCity);
            })
            // Соберем оставшиеся результаты в кнопки для сохранения адреса
            .then(dataArr => this._prepareButtons(dataArr))
            .then(async(buttonsArr) => {
                this._tempButtonsStorage.length = 0;
                // Заранее поместим готовые кнопки в временное хранилище
                // При клике на кнопку с адресом - информация будет браться именно отсюда
                buttonsArr.forEach((button) => {
                    const { btnText } = button;
                    this._tempButtonsStorage.push(btnText);
                });
                this.addressButtons = await ctx.reply('Вот, что мне удалось найти. Выберите свой адрес, кликнув по кнопке под сообщением или введите новый адрес.');
                // Выведем кнопки на экран
                buttonsArr.forEach(async(button) => {
                    const { btnText, position } = button;
                    ctx.reply(`🏡 ${btnText}`,
                        Markup.inlineKeyboard([
                            Markup.callbackButton('Это мой адрес', `_setShippingInfo:${position}`),
                        ]).extra({
                            disable_notification: true,
                        }),
                    ).then((msg) => {
                        this.addressButtons = msg;
                        this.messagesToDelete = msg;
                    });
                });
            })
            // Что-то пошло не так – выведем сообщение об ошибке
            .catch(async(e) => {
                this.messagesToDelete = await ctx.reply(e.message);
            });
    }

    async _setShippingInfo(ctx, buttonIndex) {
        if (this._confirmationMessages.length) {
            this._removeMessages(ctx, '_confirmationMessages');
        }
        this._removeMessages(ctx, 'addressButtons');
        ctx.telegram.answerCbQuery(ctx.update.callback_query.id, '⏳ Вывожу выбранный адрес на экран...');
        this.shippingAddress = this._tempButtonsStorage[+buttonIndex];
        this._confirmationMessages = await ctx.replyWithHTML(`Вы выбрали доставку по адресу: <b>${this.shippingAddress}</b>`);
        this._requestContinue(
            ctx,
            'введите другой адрес',
            'saveDataKeysArr', {
                text: 'Выбрать другой способ доставки',
                functionName: 'requestShipping',
            },
        );
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
        this.messagesToDelete = await ctx.reply('Выберите ваш город', Markup.inlineKeyboard(cities).extra());
    }

    async confirmShippingOverwrite(ctx, shipping) {
        // Если был выбран самовывоз или указан адрес в виде строки
        if (shipping === false || typeof shipping !== 'object') {
            shipping = (shipping === false) ? 'Самовывоз' : `(Доставка) ${shipping}`;
            this.messagesToDelete = await ctx.replyWithHTML(`⚠️ Вы ранее выбрали этот способ доставки: <b>${shipping}</b>`);
            this.messagesToDelete = await ctx.reply('Перезаписать его или оставить?',
                Markup.inlineKeyboard([
                    [Markup.callbackButton('Перезаписать', '_overwriteData:requestShipping')],
                    [Markup.callbackButton('Оставить', '_leaveData:shippingValidation')],
                ]).extra({
                    disable_notification: true,
                }));
            // Если была отправлена геопозиция
        } else {
            const [lat, lon] = shipping;
            this.messagesToDelete = await ctx.reply('⚠️ Вы ранее выбрали этот способ доставки:');
            this.messagesToDelete = await ctx.replyWithLocation(lat, lon);
            this.messagesToDelete = await ctx.reply('Перезаписать его или оставить?', Markup.inlineKeyboard([
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

    get addressButtons() {
        return this._addressButtons;
    }

    set addressButtons(buttonParam) {
        if (buttonParam === 'clearArr') {
            this._addressButtons.length = 0;
        } else {
            const { message_id: id } = buttonParam;
            this._addressButtons.push(id);
        }
    }

    get shippingCity() {
        return this.city;
    }

    set shippingCity(city) {
        this.city = city;
    }
}

const validateShipping = new Shipping();

module.exports = validateShipping;