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

const identifyTime = require('./chunks/identify-time');

const order = require('../../../../core');

const timeValidation = new Scene('timeValidation');

class Time extends Base {
    constructor() {
        super();
        this.today = new Date();
        this.validatedTime = undefined;
        this.workingHours = {};
        this.identifyTime = identifyTime;
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
        let workingHours = { start: 0, finish: 0 },
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

    async confirmTimeOverwrite(ctx, time) {
        let minutes = "" + new Date(this.validatedTime).getMinutes();
        if (minutes.length === 1) {
            minutes = "0" + minutes;
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
        let { start, finish } = workingHours,
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
        let date = new Date();
        date.setHours(time[0]);
        // time = [часы, минуты]
        return new Promise((resolve, reject) => {
            if (date.getHours() > 23 || date.getHours() < 0) {
                reject(new Error(`⛔ Пожалуйста, введите корректное время!`));
            } else {
                resolve(time);
            }
        });
    }

    // Проверяет введенные часы
    checkTime(timeArray) {
        let [hours, minutes] = timeArray;
        let { start, finish } = this.workingHours;
        const { shipping, orderDate } = order.orderInfo;
        // По умолчанию стоит 40 мин
        let estimatedTime = 2400000;
        const makeErrorMsg = (time) => {
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
                this._compareTime(usedTime, { start: start, finish: finish }, shipping).then(() => {
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
                this._compareTime(usedTime, { start: start, finish: finish }, shipping).then(() => {
                    resolve(usedTime);
                }, () => {
                    reject(new Error(makeErrorMsg(40)));
                });
            }
        });
    }

    validateTime(ctx, timeString = null) {
        const { orderDate } = order.orderInfo;
        let timeArray = [];
        this.workingHours = this._getWorkingHours(orderDate);

        // if (this.today.getDate() === new Date(orderDate).getDate() && this.today.getMonth() === new Date(orderDate).getFullYear() && this.today.getMonth() === new Date(orderDate).getFullYear()) {
        //     console.log("• Выбранная дата: сегодня •");
        //     this.workingHours.start = new Date().getHours();
        // }
        // Распознаем время в строке и раскидаем на часы и минуты
        this.identifyTime(timeString)
            // Проверим распознанное время на корректность
            .then(result => this.checkTimeRelevance(result))
            .then(result => this.checkTime(result))
            .then(async(result) => {
                let minutes = `${new Date(result).getMinutes()}`;
                this.time = result;
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
    if (ctx.updateSubTypes[0] !== 'text') {
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