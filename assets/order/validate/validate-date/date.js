const Telegraf = require('telegraf');
const { Markup, Extra } = Telegraf;
const session = require('telegraf/session');
const Stage = require('telegraf/stage');
const Scene = require('telegraf/scenes/base');
const { leave } = Stage;
const ValidateMonth = require('./month');
// const OrderInfo = require('../../order-info');
const ServiceOps = require('../../../service-ops');
// const { Order } = require('../../order');
const order = require('../../../../core');
const validateMonth = new ValidateMonth();

const identifyDate = require('./identify-data');
const russifyDate = require('./russify-date');

const dateValidation = new Scene('dateValidation');

// Пока спрячем это
// const stage = new Stage();
// stage.register(dateValidation);

class ValidateDate {
    constructor() {
        // this.validationCalled = false;
        this.months = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
        this.tempDate;
    }

    calculateDate(isToday) {
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
        console.log(`при подсчете \"Сегодня\" или \"Завтра\" получилось: ${result}`);

        return result;
    }

    _calculateDaysInMonth(month, year) {
        console.log(`Дней в месяце ${month} - ${new Date(year, month + 1, 0).getDate()}`);
        return new Date(year, month + 1, 0).getDate();
    }

    requestDate(ctx, orderInfo) {
        let { orderDate } = orderInfo,
            date = russifyDate(new Date(orderDate));
        console.log("*** Запущена функция, запрашивающая ввод даты ***");

        if (orderInfo.orderDate) {
            ctx.reply(`⚠️ Вы ранее вводили эту дату: \n ${date} \n Эта дата будет перезаписана`);
        }

        ctx.reply(`Выберите дату, на которую хотите заказать букет.
        \nНапишите дату самостоятельно или выберите из предложенных ниже вариантов.
        \nПримеры ввода дат:
        \n• 14 февраля;
        \n• 14.02;
        \nЕсли вы ввели не ту дату – просто напишите новую`,
            Markup.inlineKeyboard([
                Markup.callbackButton('Сегодня', 'Сегодня'),
                Markup.callbackButton('Завтра', 'Завтра')
            ]).extra());
    }

    checkDate(dateArr) {

        return new Promise((resolve, reject) => {
            if (dateArr) {
                // Преобразуем к JS-дате, а потом возьмем из массива имен месяцев то, что нужно
                let scheduleYear = new Date().getFullYear(),
                    currentMonth = new Date().getMonth(),
                    currentYear = new Date().getFullYear(),
                    today = new Date().getDate(),
                    [ day, month ] = dateArr,
                    result;

                if (month < currentMonth) {
                    scheduleYear++;
                } else if (month === currentMonth && day < today) {
                    scheduleYear++;
                }

                if (day !== 0 && day <= this._calculateDaysInMonth(month, scheduleYear)) {
                    console.log(`Число месяца корректно`);
                    dateArr.push(scheduleYear);
                    result = dateArr;
                    resolve(result);
                    return;
                } else {
                    reject(new Error(`⛔️ В месяце, который вы ввели, нет числа ${day}!`));
                }
            }
        });
    }

    get date() {
        return this.tempDate;
    }

    set date(date) {
        let [year, month, day] = date;
        this.tempDate = Date.parse(new Date(year, month, day, 0, 0, 0).toString());
        order.setOrderInfo = ['orderDate', this.tempDate];
    }
}

const validateDate = new ValidateDate();

// Команды для сцены
dateValidation.enter((ctx) => {
    let orderInfo = order.getOrderInfo;
    validateDate.requestDate(ctx, orderInfo);
});

dateValidation.on('message', (ctx) => {
    identifyDate(ctx.message.text)
        .then((result) => {
            // Проверяет месяц
            let validatedArr = validateMonth.validate(result);
            return validatedArr;
        },(error) => {
            ctx.reply(error.message);
        })
        .then((result) => {
            // Проверяет день
            let validatedArr = validateDate.checkDate(result);
            return validatedArr;
        }, (error) => {
            throw error;
        })
        .then((result) => {
            // Записывает дату в объект даты
            let date = result.reverse();

            validateDate.date = date;
            ctx.reply(`✅ Хорошо, букет будет готов к ${russifyDate(validateDate.date)}`).then(() => {
                ServiceOps.requestContinue(ctx, "введите другую дату");
            });
        })
        .catch((error) => {
            if (error.message === "сегодня") {
                validateDate.date = validateDate.calculateDate(true);
                ctx.reply(`✅ Хорошо, букет будет готов к ${russifyDate(validateDate.date)}`).then(() => {
                    ServiceOps.requestContinue(ctx, "введите другую дату");
                });
            } else if (error.message === "завтра") {
                validateDate.date = validateDate.calculateDate(false);
                ctx.reply(`✅ Хорошо, букет будет готов к ${russifyDate(validateDate.date)}`).then(() => {
                    ServiceOps.requestContinue(ctx, "введите другую дату");
                });
            } else {
                ctx.reply(error.message);
            }
        });
});

dateValidation.on('callback_query', (ctx) => {
    // let orderInfo = order.getOrderInfo;
    ctx.telegram.answerCbQuery(ctx.update['callback_query'].id, "");

    if (ctx.update['callback_query'].data === "Сегодня") {
        validateDate.date = validateDate.calculateDate(true);
        ctx.reply(`✅ Хорошо, букет будет готов к ${russifyDate(validateDate.date)}`).then(() => {
            ServiceOps.requestContinue(ctx, "введите другую дату");
        });

    } else if (ctx.update['callback_query'].data === "Завтра") {
        validateDate.date = validateDate.calculateDate(false);
        ctx.reply(`✅ Хорошо, букет будет готов к ${russifyDate(validateDate.date)}`).then(() => {
            ServiceOps.requestContinue(ctx, "введите другую дату");
        });

    } else {
        // Обработать кнопку "Продолжить"
        order.setOrderInfo = ['orderDate', validateDate.date];
        ctx.telegram.deleteMessage(ctx.update['callback_query'].message.chat.id, ctx.update['callback_query'].message['message_id']);
        order.displayInterface(ctx, `Выберите любой пункт в меню и следуйте инструкциям.
            \nПри правильном заполнении данных напротив выбранного пукта меня будет стоять ✅`);
        ctx.scene.leave('dateValidation');
    }
});

module.exports = dateValidation;