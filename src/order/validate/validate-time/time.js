/* eslint-disable no-underscore-dangle */
/* eslint-disable semi */
/* eslint-disable indent */
const Telegraf = require('telegraf');
const { Markup, Extra } = Telegraf;
const Contacts = require('../../../main-page/contacts');
const Base = require('./../../base-class');
// Импортируем операции для валидации времени
const identifyTime = require('./chunks/identify-time');
const checkTimeRelevance = require('./chunks/check-time-relevance');
const { checkTime } = require('./chunks/check-time');
const order = require('./../../order');

class Time extends Base {
    constructor() {
        super();
        this.today = new Date();
        this.tempTime = null;
        this.workingHours = {};
        this.identifyTime = identifyTime;
        this._checkTime = checkTime;
        this._checkTimeRelevance = checkTimeRelevance;
        this.messagesStorage = {
            intro: [],
            confirmation: [],
            other: [],
        };
        this.saveDataKeys = {
            keyToAssignData: 'orderTime',
            keyToAccessData: 'tempTime',
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
        const workingHours = { start: 0, finish: 0 };
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
        let minutes = new Date(time).getMinutes().toString();
        if (minutes.length === 1) {
            minutes = `0${minutes}`;
        }
        let message = await ctx.replyWithHTML(`⚠️ Вы ранее вводили это время: <b>${new Date(time).getHours()}:${minutes}</b>`);
        this.messages = {
            messageType: 'confirmation',
            messageObj: message,
        };
        message = await ctx.reply('Перезаписать его или оставить?',
            Markup.inlineKeyboard([
                [Markup.callbackButton('Перезаписать', '_overwriteData:requestTime')],
                [Markup.callbackButton('Оставить', '_leaveData:timeValidation')],
            ]).extra());
        this.messages = {
            messageType: 'confirmation',
            messageObj: message,
        };
    }

    requestTime(ctx) {
        const { orderDate, shipping } = order.orderInfo;
        let estimatedTime = 2400000;
        let additionalMessage = '';
        this._hasDateAndShipping(orderDate, shipping)
            .then(async() => {
                if (shipping !== false) {
                    estimatedTime = 5400000;
                    additionalMessage = ' и доставить его к вам';
                }
                const { start, finish } = this._getWorkingHours(orderDate);
                const message = await ctx.replyWithHTML(`Введите самостоятельно желаемое время, когда хотите забрать букет.\n⚠️Пожалуйста, пишите время в формате: ЧЧ:ММ.\n⚠Нам потребуется <b>${estimatedTime / 60000} мин.</b>, чтобы сделать букет${additionalMessage}. Имейте это ввиду когда будете указывать время\n🗓 Сегодня мы работаем с ${start}:00 до ${finish}:00`);
                this.messages = {
                    messageType: 'intro',
                    messageObj: message,
                };
            })
            .catch(async(error) => {
                const message = await ctx.reply(`${error.message}`,
                    Markup.inlineKeyboard(
                        [Markup.callbackButton('В меню заказа', 'returnToMenu:timeValidation')],
                    ).extra());
                this.messages = {
                    messageType: 'other',
                    messageObj: message,
                };
            });
    }

    validateTime(ctx, timeString = null) {
        const { orderDate, shipping } = order.orderInfo;
        this.workingHours = this._getWorkingHours(orderDate);

        // Если время ранее было проверено и было введено новое – удаляем старое
        if (this.messages.confirmation.length !== 0) {
            this.removeMessagesOfSpecificType(ctx, 'confirmation');
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
                if (shipping) {
                    const message = await ctx.reply(`✅ Хорошо, букет будет готов и доставлен к ${new Date(result).getHours()}:${minutes}`);
                    this.messages = {
                        messageType: 'confirmation',
                        messageObj: message,
                    };
                } else {
                    const message = await ctx.reply(`✅ Хорошо, букет будет готов к ${new Date(result).getHours()}:${minutes}`);
                    this.messages = {
                        messageType: 'confirmation',
                        messageObj: message,
                    };
                }
                this._requestContinue(ctx, 'введите другое время', 'saveDataKeys');
            }, async(error) => {
                const message = await ctx.reply(error.message);
                this.messages = {
                    messageType: 'other',
                    messageObj: message,
                };
            })
            .catch(async(error) => {
                const message = await ctx.reply(error.message);
                this.messages = {
                    messageType: 'other',
                    messageObj: message,
                };
            });
    }
}

const validateTime = new Time();

module.exports = validateTime;