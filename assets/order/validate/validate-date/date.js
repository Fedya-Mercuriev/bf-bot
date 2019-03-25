'use strict';

const Telegraf = require('telegraf');
const { Markup, Extra } = Telegraf;
const session = require('telegraf/session');
const Stage = require('telegraf/stage');
const Scene = require('telegraf/scenes/base');
const { leave } = Stage;
const ServiceOps = require('../../../service-ops');
const order = require('../../../../core');
const Contacts = require("../../../main-page/contacts");
const identifyDate = require('./chunks/identify-date');
const validateMonth = require('./validate-month');
const validateDay = require('./chunks/validate-day');

// const identifyDate = require('./identify-data');

const dateValidation = new Scene('dateValidation');

let validateDate;

class ValidateDate {
    constructor() {
        this.months = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
        this.tempDate = null;
        this._messagesToDelete = [];
        this._saveDataMsg = null;
        this._validateMonth = validateMonth;
        this._identifyDate = identifyDate;
        this._valiadateDay = validateDay;
    }

    static russifyDate(date) {
        let months = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'],
            usedDate = new Date(date);
        return `${usedDate.getDate()} ${months[usedDate.getMonth()]} ${usedDate.getFullYear()} года`;
    }

    _cleanScene(ctx) {
        ctx.scene.messages = this._messagesToDelete;
        ctx.scene.messages.forEach(({ message_id: id }) => {
            try {
                ctx.deleteMessage(id);
            } catch (error) {
                console.log(error);
            }
        });
    }

    _invokeFunction(funcName) {
        this[funcName](arguments[1]);
    }

    _calculateDate(isToday) {
        let oneDay = 0,
            result = [],
            currentDate;

        if (!isToday) {
            oneDay = 86400000;
        }

        currentDate = new Date(Date.now() + oneDay);
        result.push(currentDate.getFullYear());
        result.push(currentDate.getMonth());
        result.push(currentDate.getDate());

        return result;
    }

    _calculateDaysInMonth(month, year) {
        return new Date(year, month + 1, 0).getDate();
    }

    requestDate(ctx) {
        ctx.reply(`Напишите дату самостоятельно.Примеры ввода дат:\n✅ 14 февраля;\n✅ 14.02;\nЕсли вы ввели не ту дату – просто напишите новую`)
            .then(message => {
                this._messagesToDelete.push(message);
            });
    }

    _validateDate(ctx, userInput) {

        // Начинаем с распознавания даты
        this._identifyDate(userInput)
            .then((result) => {
                // Затем проверяет месяц
                return this._validateMonth(result);
            }, (error) => {
                ctx.reply(error.message).then(message => {
                    this._messagesToDelete.push(message);
                });
            })
            .then((result) => {
                // Проверяет день
                return this._valiadateDay(result);
            }, (error) => {
                throw error;
            })
            .then((resultDate) => {
                // Создает объект даты с установленными проверенными месяцем и днем
                this._setTempDate(resultDate);

                ctx.reply(`✅ Хорошо, букет будет готов к ${ValidateDate.russifyDate(this.tempDate)}`)
                    .then((messages) => {
                        this._messagesToDelete.push(messages);
                        return ServiceOps.requestContinue(ctx, "введите другую дату");
                    })
                    .then(message => {
                        this._saveDataMsg = message;
                    });
            })
            .catch((error) => {
                if (error.message === "сегодня") {
                    validateDate.date = validateDate._calculateDate(true);
                    ctx.reply(`✅ Хорошо, букет будет готов к ${validateDate.russifyDate(validateDate.date)}`).then(() => {
                        ServiceOps.requestContinue(ctx, "введите другую дату");
                    });
                } else if (error.message === "завтра") {
                    validateDate.date = validateDate._calculateDate(false);
                    ctx.reply(`✅ Хорошо, букет будет готов к ${validateDate.russifyDate(validateDate.date)}`).then(() => {
                        ServiceOps.requestContinue(ctx, "введите другую дату");
                    });
                } else {
                    ctx.reply(error.message);
                }
            });
    }

    _setTempDate(date) {
        let result = new Date();
        const [day, month] = date;
        result.setDate(day);
        result.setMonth(month);
        this.tempDate = Date.parse(result);
    }

    confirmDateOverride(ctx, date) {
        ctx.replyWithHTML(`⚠️ Вы ранее вводили эту дату: <b>${date}</b>`)
            .then(message => {
                this._messagesToDelete.push(message);
                return ctx.reply("Перезаписать ее или оставить?", Markup.inlineKeyboard([
                    [Markup.callbackButton('Перезаписать', '_overwriteData')],
                    [Markup.callbackButton('Оставить', '_leaveData')]
                ]).extra());
            })
            .then(message => {
                this._messagesToDelete.push(message);
            });
    }

    // _valiadateDay(dateArr) {

    //     return new Promise((resolve, reject) => {
    //         if (dateArr) {
    //             // Преобразуем к JS-дате, а потом возьмем из массива имен месяцев то, что нужно
    //             let scheduleYear = new Date().getFullYear(),
    //                 currentMonth = new Date().getMonth(),
    //                 today = new Date().getDate(),
    //                 [day, inputMonth] = dateArr,
    //                 result;

    //             if (inputMonth < currentMonth) {
    //                 reject(new Error('⛔️ Дата, которую вы ввели уже прошла'));
    //             }
    //             // else if (month === currentMonth && day < today) {
    //             //     scheduleYear++;
    //             // }

    //             if (day !== 0 && day <= this._calculateDaysInMonth(inputMonth, scheduleYear)) {
    //                 // dateArr.push(scheduleYear);
    //                 result = dateArr;
    //                 resolve(result);
    //             } else {
    //                 reject(new Error(`⛔️ В месяце, который вы ввели, нет числа ${day}!`));
    //             }
    //         }
    //     });
    // }

    get date() {
        return this.tempDate;
    }

    // set date(date) {
    //     let [year, month, day] = date;
    //     this.tempDate = Date.parse(new Date(year, month, day, 0, 0, 0).toString());
    //     order.orderInfo = ['orderDate', this.tempDate];
    // }
}

// Команды для сцены
dateValidation.enter((ctx) => {
    let { orderDate } = order.orderInfo;
    validateDate = new ValidateDate();

    if (orderDate !== undefined) {
        orderDate = ValidateDate.russifyDate(new Date(orderDate));
        validateDate.confirmDateOverride(ctx, orderDate);
    } else {
        validateDate.requestDate(ctx, orderDate);
    }
});

dateValidation.on('message', (ctx) => {
    if (ctx.update.message.text.match(/меню заказа/i)) {
        ServiceOps.returnToMenu(ctx, order.displayInterface.bind(order), 'dateValidation');

    } else if (ctx.update.message.text.match(/связаться с магазином/i)) {
        ServiceOps.displayPhoneNumber(ctx);

    } else if (ctx.update.message.text.match(/отменить заказ/i)) {
        ctx.reply("Отменяем заказ (пока нет)");

    } else {
        validateDate._validateDate(ctx, ctx.message.text);
    }
});

dateValidation.on('callback_query', (ctx) => {
    ctx.telegram.answerCbQuery(ctx.update['callback_query'].id, "");

    if (ctx.update['callback_query'].data === '_overwriteData') {
        ServiceOps.processInputData(ctx.update['callback_query'].data, ctx, validateDate.requestDate.bind(validateDate));

        // Для обработки callback-кнопки "Оставить"
    } else if (ctx.update['callback_query'].data === '_leaveData') {
        ServiceOps.processInputData(ctx.update['callback_query'].data, ctx, order.displayInterface.bind(order), 'dateValidation');

    } else {
        // Обработать кнопку "Продолжить"
        order.orderInfo = ['orderDate', validateDate.date];
        ctx.telegram.deleteMessage(ctx.update['callback_query'].message.chat.id, ctx.update['callback_query'].message['message_id']);
        order.displayInterface(ctx, `Выберите любой пункт в меню и следуйте инструкциям.
            \nПри правильном заполнении данных напротив выбранного пукта меня будет стоять ✅`);
        ctx.scene.leave('dateValidation');
    }
});

module.exports = dateValidation;