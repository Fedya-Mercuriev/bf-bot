/* eslint-disable no-underscore-dangle */
/* eslint-disable semi */
/* eslint-disable indent */
const Telegraf = require('telegraf');
const { Markup, Extra } = Telegraf;
const session = require('telegraf/session');
const Stage = require('telegraf/stage');
const Scene = require('telegraf/scenes/base');
const Contacts = require('../../../main-page/contacts');
const { leave } = Stage;
const Base = require('./../../base-class');
// Импортируем операции для валидации времени
const identifyTime = require('./chunks/identify-time');
const checkTimeRelevance = require('./chunks/check-time-relevance');
const { checkTime } = require('./chunks/check-time');
const order = require('../../../../core');

const timeValidation = new Scene('timeValidation');

class Time extends Base {
    constructor() {
        super();
        this.today = new Date();
        this.tempTime = null;
        this.workingHours = {};
        this.identifyTime = identifyTime;
        this._checkTime = checkTime;
        this._checkTimeRelevance = checkTimeRelevance;
        this.saveDataKeysArr = {
            keyToAssignData: 'orderTime',
            keyToAccessData: 'time',
            notificationMsg: 'Сохраняю выбранное время',
            sceneName: 'timeValidation',
        };
        this.leaveDataInfo = 'timeValidation';
        this.overwriteDataInfo = 'requestTime';
    }

    get time() {
        return this.validatedTime;
    }

    _hasDateAndShipping(date, shipping) {
        return new Promise((resolve, reject) => {
            if (date !== undefined && shipping !== undefined) {
                resolve(date);
            } else {
                reject(Error('⛔️ Укажите сначала дату и способ получения букета. Для этого пройдите в меню заказа'));
            }
        })
    }

    _getWorkingHours(date) {
        let workingHours = { start: 0, finish: 0 };
        const usedDate = new Date(date);
        if (usedDate.getDay() === 6 || usedDate.getDay() === 0) {
            const { start, finish } = Contacts.workingHours.weekends;
            workingHours.start = start;
            workingHours.finish = finish;
            return workingHours;
        }
        const { start, finish } = Contacts.workingHours.weekdays;
        workingHours.start = start;
        workingHours.finish = finish;
        this.workingHours = workingHours;
        return workingHours;
    }

    async confirmTimeOverwrite(ctx, time) {
        let minutes = new Date(this.validatedTime).getMinutes().toString();
        if (minutes.length === 1) {
            minutes = `0${minutes}`;
        }
        this._messagesToDelete = ctx.replyWithHTML(`⚠️ Вы ранее вводили это время: <b>${new Date(time).getHours()}:${minutes}</b>`);
        this._messagesToDelete = await ctx.reply('Перезаписать его или оставить?',
            Markup.inlineKeyboard([
                [Markup.callbackButton('Перезаписать', 'overwriteData')],
                [Markup.callbackButton('Оставить', 'leaveData')],
            ]).extra());
    }

    requestTime(ctx) {
        const { orderDate, shipping } = order.orderInfo;
        let estimatedTime = 2400000;
        let additionalMessage = '';
        // closestTime = this._calculateClosestTime(),
        // hours = closestTime.getHours(),
        // minutes = closestTime.getMinutes();
        this._hasDateAndShipping(orderDate, shipping)
            .then(async() => {
                if (shipping !== false) {
                    estimatedTime = 5400000;
                    additionalMessage = ' и доставить его к вам';
                }
                const { start, finish } = this._getWorkingHours(orderDate);
                this._messagesToDelete = await ctx.replyWithHTML(`Введите самостоятельно желаемое время, когда хотите забрать букет.\n⚠️Пожалуйста, пишите время в формате: ЧЧ:ММ.\n⚠С учетом выбранного вами способа доставки нам потребуется <b>${estimatedTime / 60000} мин.</b>, чтобы сделать букет${additionalMessage}. Имейте это ввиду когда будете указывать время\n🗓 Сегодня мы работаем с ${start}:00 до ${finish}:00`);
            })
            .catch(async(error) => {
                this._messagesToDelete = await ctx.reply(`${error.message}`,
                    Markup.inlineKeyboard(
                        [Markup.callbackButton('В меню заказа', 'returnToMenu:timeValidation')],
                    ).extra());
            });
    }

    validateTime(ctx, timeString = null) {
        const { orderDate, shipping } = order.orderInfo;
        this.workingHours = this._getWorkingHours(orderDate);

        // Если время ранее было проверено и было введено новое – удаляем старое
        if (this.tempTime) {
            this._removeConfirmationMessages(ctx);
        }
        // Распознаем время в строке и раскидаем на часы и минуты
        this.identifyTime(timeString)
            // Проверим распознанное время на корректность
            .then(result => this._checkTimeRelevance(result))
            .then(result => this._checkTime(result, this.workingHours, { orderDate, shipping }))
            .then(async(result) => {
                let minutes = `${new Date(result).getMinutes()}`;
                this.tempTime = result;
                if (minutes.length === 1) {
                    minutes = `0${minutes}`;
                }
                this._confirmationMessages = await ctx.reply(`✅ Хорошо, букет будет готов к ${new Date(result).getHours()}:${minutes}`)
                this._confirmationMessages = this._requestContinue(ctx, 'введите другое время');
            }, async(error) => {
                this._messagesToDelete = await ctx.reply(error.message);
            })
            .catch(async(error) => {
                this._messagesToDelete = await ctx.reply(error.message);
            });
    }
}

const validateTime = new Time();

timeValidation.enter((ctx) => {
    const { orderTime } = order.orderInfo;
    if (orderTime !== undefined) {
        validateTime.confirmTimeOverwrite(ctx, orderTime);
    } else {
        validateTime.requestTime(ctx);
    }
});

timeValidation.on('callback_query', (ctx) => {
    try {
        validateTime.invokeFunction(ctx.update.callback_query.data, ctx);
    } catch (error) {
        ctx.telegram.answerCbQuery(ctx.update.callback_query.id, '⛔ Cейчас эта кнопка не доступна!');
    }
});

timeValidation.on('message', (ctx) => {
    if (ctx.updateSubTypes[0] === 'text') {
        const messageText = ctx.update.message.text;
        if (messageText.match(/Меню заказа/i)) {
            validateTime.returnToMenu(ctx, 'timeValidation');
        } else if (messageText.match(/Связаться с магазином/i)) {
            validateTime.displayPhoneNumber(ctx);
        } else if (messageText.match(/Отменить заказ/i)) {
            ctx.reply('Отменяем заказ (пока нет)');
        } else {
            validateTime.validateTime(ctx, messageText);
        }
    }
});

// module.exports = validateTime;
module.exports = timeValidation;