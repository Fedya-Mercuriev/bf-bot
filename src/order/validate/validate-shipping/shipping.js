/* eslint-disable no-underscore-dangle */
/* eslint-disable indent */
/* eslint-disable import/newline-after-import */
/* eslint-disable class-methods-use-this */
const Telegraf = require('telegraf');
const { Markup, Extra } = Telegraf;
const Base = require('./../../base-class');
const processPickUpQuery = require('./chunks/process-pickup-query');
const { sendRequest, processResponse, prepareButtons } = require('./chunks/process-shipping-info');
const citiesList = require('../../../../core');

class Shipping extends Base {
    constructor() {
        super();
        this.shippingAddress = undefined;
        // Операции, лежащие в других файлах
        this._processPickUpQuery = processPickUpQuery;
        this._sendRequest = sendRequest;
        this._processResponse = processResponse;
        this._prepareButtons = prepareButtons;
        // Прочие свойства
        this.city = null;
        // От знаечния этой переменной зависит будет ли обрабатываться сообщение с адресом
        // или будет выведена ошибка, требующая сперва выбрать способ доставки
        this.shippingInfoProcessingStarted = false;
        //  В этой переменной хранятся кнопки, которые были собраны из найденных адресов
        // При вводе нового адреса, кнопки перезаписываются
        this._tempButtonsStorage = [];
        this.messagesStorage = {
            intro: [],
            confirmation: [],
            addressButtons: [],
            statusMsg: [],
            other: [],
        };
        this.saveDataKeys = {
            keyToAssignData: 'shipping',
            keyToAccessData: 'shippingAddress',
            notificationMsg: 'Сохраняю выбранный способ доставки',
            sceneName: 'shippingValidation',
        };
        this.leaveDataInfo = 'shippingValidation';
        this.overwriteDataInfo = 'requestShippingInfo';
    }

    async requestShipping(ctx) {
        // Если в эту операцию перешли с запроса даты - удалим это сообщение
        try {
            ctx.deleteMessage(ctx.update.callback_query.message.message_id);
        } catch (e) {
            console.log(e.message);
        }
        if (this.shipping !== undefined) {
            this.shipping = undefined;
        }
        ctx.telegram.answerCbQuery(ctx.update.callback_query.id, 'Записываю способы доставки...');

        if (this.messages.confirmation.length) {
            this.removeMessagesOfSpecificType(ctx, 'confirmation');
        }
        if (this.messages.addressButtons.length !== 0) {
            this.removeMessagesOfSpecificType(ctx, 'addressButtons');
        }
        if (this.shippingInfoProcessingStarted) {
            this.shippingInfoProcessingStarted = false;
        }
        let message;
        if (this.messages.intro.length === 0) {
            message = await ctx.reply('Как будем забирать букет?',
                Markup.keyboard([
                    ['📜 Меню заказа'],
                    ['📞 Связаться с магазином'],
                    ['⛔ Отменить заказ'],
                ])
                .oneTime()
                .resize()
                .extra());
            this.messages = {
                messageType: 'intro',
                messageObj: message,
            };
        }
        message = await ctx.reply('Выберите как будете забирать букет 👇',
            Markup.inlineKeyboard([
                [Markup.callbackButton('📦 Самовывоз', '_processPickUpQuery')],
                [Markup.callbackButton('🛵 Доставка', '_requestAddress')],
            ]).extra());
        this.messages = {
            messageType: 'other',
            messageObj: message,
        };
    }

    async _requestAddress(ctx) {
        ctx.telegram.answerCbQuery(ctx.update.callback_query.id, '✍️ Достаю ручку и блокнот...');
        ctx.deleteMessage(ctx.update.callback_query.message.message_id);
        this.shippingInfoProcessingStarted = true;
        const message = await ctx.reply('Введите адрес вручную в формате "улица, дом" или отправьте мне геопозицию',
            Markup.inlineKeyboard([
                [Markup.callbackButton('Выбрать другой способ доставки', 'requestShipping')],
            ]).extra());
        this.messages = {
            messageType: 'other',
            messageObj: message,
        };
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

    displayButtons(ctx, buttonsArray) {
        buttonsArray.forEach(async(button) => {
            const { btnText, position } = button;
            ctx.reply(`🏡 ${btnText}`,
                Markup.inlineKeyboard([
                    Markup.callbackButton('Это мой адрес', `_setShippingInfo:${position}`),
                ]).extra({
                    disable_notification: true,
                }),
            ).then((returnedMessage) => {
                this.messages = {
                    messageType: 'addressButtons',
                    messageObj: returnedMessage,
                };
                this.messages = {
                    messageType: 'other',
                    messageObj: returnedMessage,
                };
            });
        });
    }

    async validateShippingInfo(ctx, shippingCity) {
        const options = {
            json: true,
            uri: `https://geocode-maps.yandex.ru/1.x/?apikey=${process.env.MAPS_API_KEY}&format=json`,
            shippingCity,
        };
        if (!this.shippingInfoProcessingStarted) {
            const message = await ctx.reply('⛔️ Пожалуйста, сперва выберите как будете забирать букет!');
            this.messages = {
                messageType: 'other',
                messageObj: message,
            };
            return;
        }
        // Если раньше уже вводился адрес были отображены кнопки для его сохранения – удалим их
        if (this.messages.addressButtons.length || this.messages.confirmation.length) {
            this.removeMessagesOfSpecificType(ctx, 'addressButtons');
            this.removeMessagesOfSpecificType(ctx, 'confirmation');
        }
        const message = await ctx.reply('Проверяю адрес...');
        this.messages = {
            messageType: 'statusMsg',
            messageObj: message,
        };
        // Распознаем какого типа данные и подготовим сообщение
        this._identifyMessageType(ctx)
            // Отправим запрос к API Яндекса
            .then(preparedMessage => this._sendRequest(preparedMessage, options))
            // Обработаем ответ (отсечем неподходящие результаты)
            .then(async(response) => {
                this.removeMessagesOfSpecificType(ctx, 'statusMsg');
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
                const msg = await ctx.reply('Вот, что мне удалось найти. Выберите свой адрес, кликнув по кнопке под сообщением или введите новый адрес.');
                this.messages = {
                    messageType: 'addressButtons',
                    messageObj: msg,
                };
                // Выведем кнопки на экран
                this.displayButtons(ctx, buttonsArr);
            })
            // Что-то пошло не так – выведем сообщение об ошибке
            .catch(async(e) => {
                if (this.messages.statusMsg.length !== 0) {
                    this.removeMessagesOfSpecificType(ctx, 'statusMsg');
                }
                const msg = await ctx.reply(e.message);
                this.messages = {
                    messageType: 'other',
                    messageObj: msg,
                };
            });
    }

    async _setShippingInfo(ctx, buttonIndex) {
        if (this.messages.confirmation.length) {
            this.removeMessagesOfSpecificType(ctx, 'confirmation');
        }
        this.removeMessagesOfSpecificType(ctx, 'addressButtons');
        ctx.telegram.answerCbQuery(ctx.update.callback_query.id, '⏳ Вывожу выбранный адрес на экран...');
        this.shippingAddress = this._tempButtonsStorage[+buttonIndex];
        const message = await ctx.replyWithHTML(`Вы выбрали доставку по адресу: <b>${this.shippingAddress}</b>`);
        this.messages = {
            messageType: 'confirmation',
            messageObj: message,
        };
        this._requestContinue(
            ctx,
            'введите другой адрес',
            'saveDataKeys', {
                text: 'Выбрать другой способ доставки',
                functionName: 'requestShipping',
            },
        );
    }

    _setShippingCity(ctx, city) {
        ctx.deleteMessage(ctx.update.callback_query.message.message_id);
        this.city = city;
        this.requestShipping(ctx);
    }

    async displayCitiesList(ctx) {
        // Эта функция вызывается если магазин функционирует в нескольких городах
        // и пользователю нужно выбрать свой город
        const cities = citiesList.map(item => [Markup.callbackButton(item, `_setShippingCity:${item}`)]);
        const message = await ctx.reply('Выберите ваш город', Markup.inlineKeyboard(cities).extra());
        this.messages = {
            messageType: 'other',
            messageObj: message,
        };
    }

    async confirmShippingOverwrite(ctx, shipping) {
        // Если был выбран самовывоз или указан адрес в виде строки
        shipping = (shipping === false) ? 'Самовывоз' : `(Доставка) ${shipping}`;
        let message = await ctx.replyWithHTML(`⚠️ Вы ранее выбрали этот способ доставки: <b>${shipping}</b>`);
        this.messages = {
            messageType: 'confirmation',
            messageObj: message,
        };
        message = await ctx.reply('Перезаписать его или оставить?',
            Markup.inlineKeyboard([
                [Markup.callbackButton('Перезаписать', '_overwriteData:requestShipping')],
                [Markup.callbackButton('Оставить', '_leaveData:shippingValidation')],
            ]).extra({
                disable_notification: true,
            }));
        this.messages = {
            messageType: 'confirmation',
            messageObj: message,
        };
    }

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

module.exports = validateShipping;