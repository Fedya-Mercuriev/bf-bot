const Telegraf = require('telegraf');
const { Markup, Extra } = Telegraf;
const session = require('telegraf/session');
const Stage = require('telegraf/stage');
const Scene = require('telegraf/scenes/base');
const Contacts = require("../../../main-page/contacts");
const { leave } = Stage;
const order = require('../../../../core');
const ServiceOps = require('../../../service-ops');

const timeValidation = new Scene('timeValidation');

class Time {
    constructor() {
        this.today = new Date();
        this.time = undefined;
    }

    get getTime() {
        return this.time;
    }

    set setTime(time) {
        this.time = time;
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

    _isToday(date) {
        return new Promise((resolve, reject) => {
            if (this.today.getFullYear() === date.getFullYear() && this.today.getMonth() === date.getMonth() && this.today.getDate() === date.getDate()) {
                resolve(date);
            } else {
                reject(date);
            }
        })
    }

    _isWeekend(date) {
            if (date.getDay() === 6 || date.getDay() === 0) {
                return true;
            } else {
                return false;
            }
    }

    _getWorkingHours(date) {
        let workingHours = {start: 0, end: 0};
        if (date.getDay() === 6 || date.getDay() === 0) {
            let { start, end } = Contacts.workingHours.weekdays;
            workingHours.start = start;
            workingHours.end = end;
            return workingHours;
        } else {
            let { start, end } = Contacts.workingHours.weekends;
            workingHours.start = start;
            workingHours.end = end;
            return workingHours;
        }
    }

    requestTime(ctx) {
        let { orderDate, shipping } = order.getOrderInfo;
            // closestTime = this._calculateClosestTime(),
            // hours = closestTime.getHours(),
            // minutes = closestTime.getMinutes();
        console.log(`${orderDate} : ${shipping}`);
        this._hasDateAndShipping(orderDate, shipping).then(
            () => {
                ctx.reply(`Введите самостоятельно желаемое время, когда хотите забрать букет.\n⚠️Пожалуйста, пишите время в формате: ЧЧ:ММ.`);
            }).catch((error) => {
                ctx.reply(`${error.message}`, Markup.inlineKeyboard(
                    [Markup.callbackButton('В меню заказа', 'menu')]
                ).extra());
            });
        // if (this._isToday(orderDate)) {
        //     ctx.reply("Введите самостоятельно желаемое время, когда хотите забрать букет; или выберите предложенное время ниже");
        // }
    }

    validateTime(ctx, timeString = null) {
        let { orderDate } = order.getOrderInfo,
            workingHours = this._getWorkingHours(orderDate);
        // Разобьем строку со временем на части
        let timeArray = timeString.match('/()/g')
        ctx.reply(`Проверяем время: ${time}`);
    }
}

const time = new Time();

timeValidation.enter((ctx) => {
    time.requestTime(ctx);
});

timeValidation.on('callback_query', (ctx) => {
    ctx.telegram.answerCbQuery(ctx.update['callback_query'].id, "");
   // if (ctx.update['callback_query'].data === 'Продолжить') {
   //     ctx.reply("Нажата кнопка \"Продолжить\"");
   // }
    if (ctx.update['callback_query'].data === 'menu') {
        order.displayInterface(ctx, `Выберите любой пункт в меню и следуйте инструкциям.
            \nПри правильном заполнении данных напротив выбранного пукта меня будет стоять ✅`);
        ctx.scene.leave();
    }
});

timeValidation.on('message', (ctx) => {
    time.validateTime(ctx, ctx.update.message.text);
});

module.exports = time;
module.exports = timeValidation;