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
        this.validatedTime = undefined;
        this.workingHours = {};
    }

    get time() {
        return this.validatedTime;
    }

    set time(time) {
        this.validatedTime = time;
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
        let workingHours = {start: 0, finish: 0},
            usedDate = new Date(date);
        if (usedDate.getDay() === 6 || usedDate.getDay() === 0) {
            let { start, finish } = Contacts.workingHours.weekends;
            workingHours.start = start;
            workingHours.finish = finish;
            return workingHours;
        } else {
            let { start, finish } = Contacts.workingHours.weekdays;
            workingHours.start = start;
            workingHours.finish = finish;
            this.workingHours = workingHours;
            return workingHours;
        }
    }

    _isToday(date) {
        let usedDate = new Date(date);
        if (usedDate.getFullYear() === this.today.getFullYear() && usedDate.getMonth() === this.today.getMonth() && usedDate.getDate() === this.today.getDate()) {
            return true;
        } else {
            return false;
        }
    }

    confirmTimeOverwrite(ctx, time) {
        let minutes = "" + new Date(this.validatedTime).getMinutes();
        if (minutes.length === 1) {
            minutes = "0" + minutes;
        }
        ctx.reply(`⚠️ Вы ранее вводили это время: ${new Date(time).getHours()}:${minutes}`).then(() => {
            return ctx.reply("Перезаписать его или оставить?", Markup.inlineKeyboard([
                [Markup.callbackButton('Перезаписать', 'overwriteData')],
                [Markup.callbackButton('Оставить', 'leaveData')]
            ]).extra());
        });
    }

    requestTime(ctx) {
        let { orderDate, shipping } = order.getOrderInfo,
            estimatedTime = 2400000,
            additionalMessage = "";
            // closestTime = this._calculateClosestTime(),
            // hours = closestTime.getHours(),
            // minutes = closestTime.getMinutes();
        console.log(`${orderDate} : ${shipping}`);
        this._hasDateAndShipping(orderDate, shipping).then(
            () => {
                if (shipping !== false) {
                    estimatedTime = 5400000;
                    additionalMessage = " и доставить его к вам";
                }
                let { start, finish } = this._getWorkingHours(orderDate);
                ctx.reply(`Введите самостоятельно желаемое время, когда хотите забрать букет.\n⚠️Пожалуйста, пишите время в формате: ЧЧ:ММ.\n⚠С учетом выбранного вами способа доставки нам потребуется ${estimatedTime / 60000} мин., чтобы сделать букет${additionalMessage}. Имейте это ввиду когда будете указывать время\n🗓 Сегодня мы работаем с ${start}:00 до ${finish}:00`);
            }).catch((error) => {
                ctx.reply(`${error.message}`, Markup.inlineKeyboard(
                    [Markup.callbackButton('В меню заказа', 'openMenu')]
                ).extra());
            });
    }

    identifyTime(timeString) {
        return new Promise((resolve, reject) => {
            let timeArray;
            if (timeString.match(/(\d+)[\s\/.,:\\-](\d+)/g) !== null) {
                // Упакуем данные (часы и минуты) в массив и проверим
                timeArray = timeString.split(/[\s\/.,:\\-]/);
                for (let data in timeArray) {
                    if (isNaN(data)) {
                        // если тип данных не числовой, то выводим ошибку
                        reject(new Error("⛔️ Пожалуйста, введите корректное время"));
                    }
                }
                resolve(timeArray);
            } else {
                reject(new Error("⛔️ Пожалуйста, введите корректное время"));
            }
        });
    }

    _checkHours(date, timeToCompareWith) {
        return new Promise((resolve, reject) => {
            // date = введенные часы
            if (date.getHours() > timeToCompareWith.getHours() && date < finishWork - estTime) {
                return true;
            } else {
                return false;
            }
        });
    }

    // Высчитывает временные рамки, за которые нельзя заходить (с учетом выбранного типа доставки)
    _calculateTimeLimits(orderDate, workTime, estTime) {
        // orderDate = ms; estTime = ms; workTime = ms;
        // return (workTime * 3600000) + estTime + orderDate;
        return workTime + estTime;
    }

    // Определяет успеет ли компания сделать и доставить букет
    _compareTime(targetTime, workingHours) {
        // targetTime - введенное время, workingHours - временные рамки (начало или конец работы)
        // usedTime = ms; start = ms; finish = ms; shipping = boolean
        let {start, finish} = workingHours,
            startWork = new Date(start),
            finishWork = new Date(finish),
            // Относительно медианы будем сравнивать введенноевремя с началом работы, либо с окончанием
            median = Math.floor((finishWork.getHours() - startWork.getHours()) / 2);
        let difference = start - targetTime;
        return new Promise((resolve, reject) => {
            if (new Date(targetTime).getHours() < new Date(start).getHours() + median) {
                // Сравниваем с стартом
                if (start - targetTime <= 0) {
                    resolve();
                } else {
                    reject();
                }

            } else {
                // Сравниваем с финишем
                if (finish - targetTime >= 0) {
                    resolve();
                } else {
                    reject();
                }
            }
        });
    }

    // Проверяет правильность времени
    checkTimeRelevance(time) {
        // time = [часы, минуты]
        return new Promise((resolve, reject) => {
            if (new Date(time[0]) > 23 || new Date(time[0]) < 0) {
                reject(new Error(`⛔ Пожалуйста, введите корректное время!`));
            } else {
                resolve(time);
            }
        });
    }

    // Проверяет введенные часы
    checkTime(timeArray) {
        let [hours, minutes] = timeArray,
            { start, finish } = this.workingHours,
            { shipping, orderDate } = order.getOrderInfo,
            // По умолчанию стоит 40 мин
            estimatedTime = 2400000,
            makeErrorMsg = (time) => {
                return `⛔ К сожалению, мы не успеем сделать букет к указанному вами времени. С учетом выбранного вами способа доставки нам потребуется ${time} минут.\nПожалуйста, укажите другое время, другой способ доставки или другую дату`
            };

        return new Promise((resolve, reject) => {
            // Создаем переменную, с которой будем сравнивать начало и конец работы вместе с прибавленным или вычитанным значением необходимого
            // для создания и доставки букета времени
            // Формат: ms
            let usedTime = orderDate + (hours * 3600000) + (minutes * 60000),
                startWork = new Date(orderDate),
                finishWork = new Date(orderDate);

            // Была выбрана доставка
            if (shipping !== false) {
                // Преобразуем данные о доставке к логическому типу для удобства
                shipping = true;

                // Требуемое время 90 мин
                estimatedTime = 5400000;
                // Записываем время начала и конца работы как полноценную дату для удобства сравнения
                // start = ms; finish = ms

                // Если в качестве даты заказа был выбран сегодняшний день, тогда устанавливаем текущие часы и минуты как начало работы,
                // чтоб пользователь не смог заказать букет на время, которое уже прошло
                if (this._isToday(orderDate) && new Date().getHours() > start) {
                    start = this._calculateTimeLimits(orderDate, Date.parse(new Date().toString()), estimatedTime);
                } else {
                    // StartWork - переменная, хранящая дату вместе со временем начала работы (в качестве года, месяца и дня используются данные из заказа)
                    startWork.setHours(start);
                    startWork.setMinutes(0);
                    start = this._calculateTimeLimits(orderDate, Date.parse(startWork.toString()), estimatedTime);
                }
                finishWork.setHours(finish);
                finishWork.setMinutes(0);
                // Для финиша (с доставкой) временные рамки не установлены - ограничение стоит по умолчанию: время окончания работы
                finish = this._calculateTimeLimits(orderDate, Date.parse(finishWork.toString()), 0);

                // После проверки указанного времени либо выдаем положительный результат, либо ошибку характерную для определенного типа доставки
                this._compareTime(usedTime, {start: start, finish: finish}, shipping).then(() => {
                    resolve(usedTime);
                }, () => {
                    reject(new Error(makeErrorMsg(90)));
                });

            // Был выбран самовывоз
            } else {
                if (this._isToday(orderDate) && new Date().getHours() > start) {
                    start = this._calculateTimeLimits(orderDate, Date.parse(new Date().toString()), estimatedTime);
                } else {
                    startWork.setHours(start);
                    startWork.setMinutes(0);
                    start = this._calculateTimeLimits(orderDate, Date.parse(startWork.toString()), estimatedTime);
                }
                finishWork.setHours(finish);
                finishWork.setMinutes(0);
                // Для финиша (с самовывозом) временные рамки установлены как - 10 минут от конца работы, чтоб клиент успел прийти за букетом
                finish = this._calculateTimeLimits(orderDate, Date.parse(finishWork.toString()), -600000);
                // Требуемое время 40 мин
                this._compareTime(usedTime, {start: start, finish: finish}, shipping).then(() => {
                    resolve(usedTime);
                }, () => {
                    reject(new Error(makeErrorMsg(40)));
                });
            }
        });
    }

    validateTime(ctx, timeString = null) {
        let { orderDate } = order.getOrderInfo,
            timeArray;
        this.workingHours = this._getWorkingHours(orderDate);

        // if (this.today.getDate() === new Date(orderDate).getDate() && this.today.getMonth() === new Date(orderDate).getFullYear() && this.today.getMonth() === new Date(orderDate).getFullYear()) {
        //     console.log("• Выбранная дата: сегодня •");
        //     this.workingHours.start = new Date().getHours();
        // }
        // Паспознаем время в строке и раскидаем на часы и минуты
        this.identifyTime(timeString)
            // Проверим распознанное время на корректность
            .then((result) => {
                return this.checkTimeRelevance(result);
            })

            .then((result) => {
                return this.checkTime(result);
            })
            .then((result) => {
                let minutes = "" + new Date(result).getMinutes();
                this.time = result;
                if (minutes.length === 1) {
                    minutes = "0" + minutes;
                 }
                console.log(`Текущее выбранное время: ${this.time}`);
                ctx.reply(`✅ Хорошо, букет будет готов к ${new Date(result).getHours()}:${minutes}`).then(() => {
                    ServiceOps.requestContinue(ctx, "введите другое время");
                });;
            }, (error) => {
                ctx.reply(error.message);
            })
            .catch((error) => {
                ctx.reply(error.message);
            });
    }
}

const validateTime = new Time();

timeValidation.enter((ctx) => {
    let { orderTime } = order.getOrderInfo;
    if (orderTime !== undefined) {
        validateTime.confirmTimeOverwrite(ctx, orderTime);
    } else {
        validateTime.requestTime(ctx);
    }
});

timeValidation.on('callback_query', (ctx) => {
    ctx.telegram.answerCbQuery(ctx.update['callback_query'].id, "");
   // if (ctx.update['callback_query'].data === 'Продолжить') {
   //     ctx.reply("Нажата кнопка \"Продолжить\"");
   // }
    if (ctx.update['callback_query'].data === 'openMenu') {
        order.displayInterface(ctx);
        ctx.scene.leave();

        // Для обработки callback-кнопки "Перезаписать"
    } else if (ctx.update['callback_query'].data === 'overwriteData') {
        validateTime.requestTime(ctx);

        // Для обработки callback-кнопки "Оставить"
    } else if (ctx.update['callback_query'].data === 'leaveData') {
        ctx.deleteMessage(ctx.update['callback_query'].message.chat.id, ctx.update['callback_query'].message['message_id']);
        order.displayInterface(ctx);
        ctx.scene.leave('timeValidation');
    } else {
        // Обработать кнопку "Продолжить"
        order.setOrderInfo = ['orderTime', validateTime.time];
        let { orderTime } = order.getOrderInfo;
        console.log(`Время заказа: ${orderTime}`);
        ctx.telegram.deleteMessage(ctx.update['callback_query'].message.chat.id, ctx.update['callback_query'].message['message_id']);
        order.displayInterface(ctx, `Выберите любой пункт в меню и следуйте инструкциям.
            \nПри правильном заполнении данных напротив выбранного пукта меня будет стоять ✅`);
        ctx.scene.leave('timeValidation');
    }
});

timeValidation.on('message', (ctx) => {
    validateTime.validateTime(ctx, ctx.update.message.text);
});

module.exports = validateTime;
module.exports = timeValidation;