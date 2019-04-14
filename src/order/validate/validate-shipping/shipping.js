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
const { sendRequest, processResponse } = require('./chunks/process-shipping-info');
const { leave } = Stage;
const { order, citiesList } = require('../../../../core');

const shippingValidation = new Scene('shippingValidation');

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
        this._messagesToDelete = await ctx.reply('Выберите как будете забирать букет 👇',
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
        this._messagesToDelete = await ctx.reply('Введите адрес вручную в формате "улица, дом" или отправьте мне геопозицию');
    }

    async _processPickUpQuery(ctx) {
        ctx.telegram.answerCbQuery(ctx.update.callback_query.id, '⏳ Минуточку');
        ctx.deleteMessage(ctx.update.callback_query.message.message_id);
        this.shipping = false;
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
            this._messagesToDelete = await ctx.reply('⛔️ Пожалуйста, сперва выберите как будете забирать букет!');
            return;
        }
        // Если раньше уже вводился адрес были отображены кнопки для его сохранения – удалим их
        if (this.addressButtons.length) {
            this._removeMessages(ctx, 'addressButtons');
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
            .then(async(buttonsArr) => {
                let buttonCounter = 0;
                this._tempButtonsStorage.length = 0;
                this.addressButtons = await ctx.reply('Вот, что мне удалось найти. Выберите свой адрес, кликнув по кнопке под сообщением или введите новый адрес.');
                buttonsArr.forEach(async(button) => {
                    this.addressButtons = await ctx.reply(`🏡 ${button}`,
                        Markup.inlineKeyboard([
                            Markup.callbackButton('Это мой адрес', `_setShippingInfo:${buttonCounter++}`),
                        ]).extra({
                            disable_notification: true,
                        }),
                    );
                    this._tempButtonsStorage.push(button);
                });
            })
            // Что-то пошло не так – выведем сообщение об ошибке
            .catch(async(e) => {
                this._messagesToDelete = await ctx.reply(e.message);
            });
    }

    async _setShippingInfo(ctx, buttonIndex) {
        if (this._confirmationMessages.length) {
            this._removeMessages(ctx, '_confirmationMessages');
        }
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
        // Если раньше выбирался способ доставки выполним этот блок кода
        if (shipping !== undefined) {
            validateShipping.confirmShippingOverwrite(ctx, shipping);
        } else {
            validateShipping.requestShipping(ctx);
        }
    }
});

shippingValidation.on('callback_query', (ctx) => {
    try {
        validateShipping.invokeFunction(ctx.update.callback_query.data, ctx);
    } catch (error) {
        ctx.telegram.answerCbQuery(ctx.update.callback_query.id, '⛔ Cейчас эта кнопка не доступна!');
    }
});

shippingValidation.on('message', async(ctx) => {
    if (ctx.updateSubTypes.indexOf('text') !== -1 || ctx.updateSubTypes.indexOf('location') !== -1) {
        if (ctx.update.message.text.match(/меню заказа/i)) {
            validateShipping.returnToMenu(ctx, order.displayInterface.bind(order), 'dateValidation');
        } else if (ctx.update.message.text.match(/связаться с магазином/i)) {
            validateShipping.displayPhoneNumber(ctx);
        } else if (ctx.update.message.text.match(/отменить заказ/i)) {
            ctx.reply('Отменяем заказ (пока нет)');
        } else {
            validateShipping.validateShippingInfo(ctx, order.city);
        }
    } else {
        validateShipping._messagesToDelete = await ctx.reply('⛔️ Пожалуйста, напишите адрес или отправьте геопозицию!');
    }
});

module.exports = shippingValidation;