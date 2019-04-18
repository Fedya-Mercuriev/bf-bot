/* eslint-disable indent */
/* eslint-disable class-methods-use-this */
/* eslint-disable padded-blocks */
/* eslint-disable no-underscore-dangle */
const Telegraf = require('telegraf');
const { Markup, Extra } = Telegraf;
// Подключение всех необходимых функций и классов
const Base = require('../../base-class');
const checkCloseAvailableDates = require('./chunks/get-close-available-dates');
const identifyDate = require('./chunks/identify-date');
const validateMonth = require('./chunks/validate-month');
const validateDay = require('./chunks/validate-day');

class ValidateDate extends Base {
    constructor() {
        super();
        // this.months = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
        this.tempDate = null;
        this._availableCloseDates = [];
        this._validateMonth = validateMonth;
        this._identifyDate = identifyDate;
        this._valiadateDay = validateDay;
        this._checkCloseAvailableDates = checkCloseAvailableDates;
        this.messagesStorage = {
            intro: [],
            confirmation: [],
            other: [],
        };
        this.saveDataKeysArr = {
            keyToAssignData: 'orderDate',
            keyToAccessData: 'date',
            notificationMsg: 'Сохраняю выбранную дату',
            sceneName: 'dateValidation',
        };
        this.leaveDataInfo = 'dateValidation';
        this.overwriteDataInfo = 'requestDate';
    }

    static russifyDate(date) {
        // Получает date в формате миллисекунд
        const months = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
        const usedDate = new Date(date);
        return `${usedDate.getDate()} ${months[usedDate.getMonth()]} ${usedDate.getFullYear()} года`;
    }

    _calculateDate(isToday) {
        let oneDay = 0;
        let result = [];
        let currentDate;
        if (!isToday) {
            oneDay = 86400000;
        }
        currentDate = new Date(Date.now() + oneDay);
        result.push(currentDate.getDate());
        result.push(currentDate.getMonth());
        return result;
    }

    async _quickDatePick(ctx, chosenDate) {
        // В качестве аргумента получает строку "сегодня" или "завтра"
        // Эта строка получается исходя из нажатой кнопки
        // Затем высчитывает дату в формате js для сегодня или завтра и возвращает ее
        ctx.telegram.answerCbQuery(ctx.update.callback_query.id, '🗓 Рассчитываю дату...');
        // Устанавливает временную дату
        if (chosenDate === 'сегодня') {
            this._setTempDate(this._calculateDate(true));
        } else {
            this._setTempDate(this._calculateDate(false));
        }

        if (this.messages.confirmation.length !== 0) {
            this.removeMessagesOfSpecificType(ctx, 'confirmation');
        }
        // Выводит сообщение с подтверждением
        const message = await ctx.reply(`✅ Хорошо, букет будет готов к ${ValidateDate.russifyDate(this.date)}`);
        this.messages = {
            messageType: 'confirmation',
            messageObj: message,
        };
        this._requestContinue(ctx, 'введите другую дату', 'saveDataKeysArr');
    }

    _calculateDaysInMonth(month, year) {
        return new Date(year, month + 1, 0).getDate();
    }

    async requestDate(ctx) {
        const now = new Date();
        this._availableCloseDates = this._checkCloseAvailableDates(now);
        let message = await ctx.reply('Давайте проверим дату',
            Markup.keyboard([
                ['📜 Меню заказа'],
                ['📞 Связаться с магазином'],
                ['⛔ Отменить заказ'],
            ])
            .oneTime()
            .resize()
            .extra());
        this.messages = {
            messageType: 'other',
            messageObj: message,
        };
        message = await ctx.reply('Напишите дату самостоятельно.Примеры ввода дат:\n✅ 14 февраля;\n✅ 14.02;\nЕсли вы ввели не ту дату – просто напишите новую',
            Markup.inlineKeyboard(this._availableCloseDates).extra());
        this.messages = {
            messageType: 'intro',
            messageObj: message,
        };
    }

    validateDate(ctx, userInput) {
        // Начинаем с распознавания даты
        this._identifyDate(userInput)
            // Затем проверяем месяц
            .then(result => this._validateMonth(result))
            // Проверяем день
            .then(
                result => this._valiadateDay(result),
                (error) => {
                    throw error;
                },
            )
            .then(async(resultDate) => {
                // Вызываем функцию для записи получившейся даты в временное хранилище (переменную)
                // эта дата еще не записана в информацию о заказе
                this._setTempDate(resultDate);

                if (this.messages.confirmation.length !== 0) {
                    // Этот блок выполняется если ранее уже была проверена дата и было выведено
                    // сообщение с предложением продолжить заказ
                    this.removeMessagesOfSpecificType(ctx, 'confirmation');
                }

                const message = await ctx.reply(`✅ Хорошо, букет будет готов к ${ValidateDate.russifyDate(this.tempDate)}`);
                this.messages = {
                    messageType: 'confirmation',
                    messageObj: message,
                };
                this._requestContinue(ctx, 'введите другую дату', 'saveDataKeysArr');
            })
            .catch(async(error) => {
                if (this.messages.confirmation.length !== 0) {
                    this.removeMessagesOfSpecificType(ctx, 'confirmation');
                }
                if (error.message === 'сегодня') {
                    this._setTempDate(this._calculateDate(true));
                    const message = await ctx.reply(`✅ Хорошо, букет будет готов к ${ValidateDate.russifyDate(this.tempDate)}`);
                    this.messages = {
                        messageType: 'confirmation',
                        messageObj: message,
                    };
                    this._requestContinue(ctx, 'введите другую дату', 'saveDataKeysArr');

                } else if (error.message === 'завтра') {
                    this._setTempDate(this._calculateDate(false));
                    const message = await ctx.reply(`✅ Хорошо, букет будет готов к ${ValidateDate.russifyDate(this.tempDate)}`);
                    this.messages = {
                        messageType: 'confirmation',
                        messageObj: message,
                    };
                    this._requestContinue(ctx, 'введите другую дату', 'saveDataKeysArr');

                } else {
                    const message = await ctx.reply(error.message);
                    this.messages = {
                        messageType: 'other',
                        messageObj: message,
                    };
                }
            });
    }

    _setTempDate(date) {
        // Дата в объекте orderInfo хранится в формате миллисекунд, потому надо преобразовать
        // получившуюся
        let result = new Date();
        const [day, month] = date;
        result.setDate(day);
        result.setMonth(month);
        this.tempDate = Date.parse(result);
    }

    async confirmDateOverride(ctx, date) {
        // Функция выводит ранее выбранеую и сохраненную дату и предлагает перезаписать ее
        // или оставить
        let message = await ctx.replyWithHTML(`⚠️ Вы ранее вводили эту дату: <b>${date}</b>`);
        this.messages = {
            messageType: 'confirmation',
            messageObj: message,
        };
        message = ctx.reply('Перезаписать ее или оставить?', Markup.inlineKeyboard([
            [Markup.callbackButton('Перезаписать', `_overwriteData:${this.overwriteDataInfo}`)],
            [Markup.callbackButton('Оставить', `_leaveData:${this.leaveDataInfo}`)],
        ]).extra());
        this.messages = {
            messageType: 'confirmation',
            messageObj: message,
        };
    }

    get date() {
        return this.tempDate;
    }
}

const validateDate = new ValidateDate();

module.exports = { validateDate, ValidateDate };