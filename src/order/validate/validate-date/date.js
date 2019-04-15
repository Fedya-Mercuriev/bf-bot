/* eslint-disable indent */
/* eslint-disable class-methods-use-this */
/* eslint-disable padded-blocks */
/* eslint-disable no-underscore-dangle */
const Telegraf = require('telegraf');

const { Markup, Extra } = Telegraf;

const session = require('telegraf/session');

const Stage = require('telegraf/stage');

const Scene = require('telegraf/scenes/base');

const { leave } = Stage;

// Подключение всех необходимых функций и классов
const Base = require('../../base-class');

const checkCloseAvailableDates = require('./chunks/get-close-available-dates');

const { order } = require('../../../../core');

const identifyDate = require('./chunks/identify-date');

const validateMonth = require('./chunks/validate-month');

const validateDay = require('./chunks/validate-day');

const dateValidation = new Scene('dateValidation');

let validateDate;

class ValidateDate extends Base {
    constructor() {
        super();
        this.months = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
        this.tempDate = null;
        this._availableCloseDates = [];
        // saveDataMsg хранит в себе объекты сообщений с статусом и подтверждением сохранения данных
        // this._confirmationMessages = [];
        this._validateMonth = validateMonth;
        this._identifyDate = identifyDate;
        this._valiadateDay = validateDay;
        this._checkCloseAvailableDates = checkCloseAvailableDates;
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

        if (this._confirmationMessages.length !== 0) {
            this._removeConfirmationMessages(ctx);
        }
        // Выводит сообщение с подтверждением
        this._confirmationMessages = await ctx.reply(`✅ Хорошо, букет будет готов к ${ValidateDate.russifyDate(validateDate.date)}`);
        this._requestContinue(ctx, 'введите другую дату', 'saveDataKeysArr');
    }

    _calculateDaysInMonth(month, year) {
        return new Date(year, month + 1, 0).getDate();
    }

    async requestDate(ctx) {
        const now = new Date();
        this._availableCloseDates = this._checkCloseAvailableDates(now);
        this._messagesToDelete = await ctx.reply('Напишите дату самостоятельно.Примеры ввода дат:\n✅ 14 февраля;\n✅ 14.02;\nЕсли вы ввели не ту дату – просто напишите новую',
            Markup.inlineKeyboard(this._availableCloseDates).extra());
    }

    _validateDate(ctx, userInput) {
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

                if (this._confirmationMessages.length !== 0) {
                    // Этот блок выполняется если ранее уже была проверена дата и было выведено
                    // сообщение с предложением продолжить заказ
                    this._removeConfirmationMessages(ctx);
                }

                this._confirmationMessages = await ctx.reply(`✅ Хорошо, букет будет готов к ${ValidateDate.russifyDate(this.tempDate)}`);
                this._requestContinue(ctx, 'введите другую дату', 'saveDataKeysArr');
            })
            .catch(async(error) => {
                if (this._confirmationMessages.length !== 0) {
                    this._removeConfirmationMessages(ctx);
                }
                if (error.message === 'сегодня') {
                    this._setTempDate(validateDate._calculateDate(true));
                    this._confirmationMessages = await ctx.reply(`✅ Хорошо, букет будет готов к ${ValidateDate.russifyDate(this.tempDate)}`);
                    this._requestContinue(ctx, 'введите другую дату', 'saveDataKeysArr');

                } else if (error.message === 'завтра') {
                    this._setTempDate(validateDate._calculateDate(false));
                    this._confirmationMessages = await ctx.reply(`✅ Хорошо, букет будет готов к ${ValidateDate.russifyDate(this.tempDate)}`);
                    this._requestContinue(ctx, 'введите другую дату', 'saveDataKeysArr');

                } else {
                    this._messagesToDelete = await ctx.reply(error.message);
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

    confirmDateOverride(ctx, date) {
        // Функция выводит ранее выбранеую и сохраненную дату и предлагает перезаписать ее
        // или оставить
        ctx.replyWithHTML(`⚠️ Вы ранее вводили эту дату: <b>${date}</b>`)
            .then((message) => {
                this._messagesToDelete = message;
                return ctx.reply('Перезаписать ее или оставить?', Markup.inlineKeyboard([
                    [Markup.callbackButton('Перезаписать', `_overwriteData:${this.overwriteDataInfo}`)],
                    [Markup.callbackButton('Оставить', `_leaveData:${this.leaveDataInfo}`)],
                ]).extra());
            })
            .then((message) => {
                this._messagesToDelete = message;
            });
    }

    get date() {
        return this.tempDate;
    }
}

// Команды для сцены
dateValidation.enter((ctx) => {
    let { orderDate } = order.orderInfo;
    validateDate = new ValidateDate();

    if (orderDate !== undefined) {
        orderDate = ValidateDate.russifyDate(new Date(orderDate));
        validateDate.confirmDateOverride(ctx, orderDate);
    } else {
        validateDate.requestDate(ctx);
    }
});

dateValidation.on('message', async(ctx) => {

    validateDate.userMessages = ctx.update.message.message_id;
    if (ctx.updateSubTypes[0] !== 'text') {
        validateDate._messagesToDelete = await ctx.reply('⛔️ Пожалуйста, отправьте дату в виде текста');

    } else if (ctx.update.message.text.match(/меню заказа/i)) {
        validateDate.returnToMenu(ctx, order.displayInterface.bind(order), 'dateValidation');

    } else if (ctx.update.message.text.match(/связаться с магазином/i)) {
        validateDate.displayPhoneNumber(ctx);

    } else if (ctx.update.message.text.match(/отменить заказ/i)) {
        ctx.reply('Отменяем заказ (пока нет)');

    } else {
        validateDate._validateDate(ctx, ctx.message.text);
    }
});

dateValidation.on('callback_query', (ctx) => {
    try {
        validateDate.invokeFunction(ctx.update.callback_query.data, ctx);
    } catch (error) {
        ctx.telegram.answerCbQuery(ctx.update.callback_query.id, '⛔ Cейчас эта кнопка не доступна!');
    }
});

module.exports = dateValidation;