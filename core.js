'use strict';

const Telegraf = require('telegraf');
const Extra = require('telegraf/extra');
const session = require('telegraf/session');
const Stage = require('telegraf/stage');
const Scene = require('telegraf/scenes/base');
const { Markup } = Telegraf;
const { leave } = Stage;
const config = require('./assets/config');
const bot = new Telegraf(config.telegram_token);
exports.bot = bot;
const stage = new Stage();

const MainPage = require("./assets/main-page/main-page");
const About = require("./assets/main-page/about");
const Gallery = require("./assets/main-page/gallery");
const Contacts = require("./assets/main-page/contacts");
const Cart = require("./assets/main-page/cart");
const Order = require("./assets/order/order");
// const Date = require("./assets/order/validate-date/date");
const ServiceOperations = require("./assets/service-ops");

const gallery = new Gallery();
const cart = new Cart();
const about = new About();
const order = new Order();
module.exports = order;
const dateValidation = require('./assets/order/validate/validate-date/date');
stage.register(dateValidation);

// (function order() {
//     // Вшить в корень функции постоянную проверку специальной переменной для того, чтобы понять
//     // нужно ли ей завершить работу преждевременно или нет
//
//     let invoice = {
//         provider_token: config.payment_token,
//         start_parameter: 'time-machine-sku',
//         title: 'Working Time Machine',
//         description: 'Want to visit your great-great-great-grandparents? Make a fortune at the races? Shake hands with Hammurabi and take a stroll in the Hanging Gardens? Order our Working Time Machine today!',
//         currency: 'RUB',
//         photo_url: 'https://img.clipartfest.com/5a7f4b14461d1ab2caaa656bcee42aeb_future-me-fredo-and-pidjin-the-webcomic-time-travel-cartoon_390-240.png',
//         is_flexible: true,
//         prices: [
//             { label: 'Working Time Machine', amount: 100000 },
//             { label: 'Gift wrapping', amount: 110 }
//         ],
//         payload: {
//             coupon: 'BLACK FRIDAY'
//         }
//     };
//     let orderIsInitialised = false,
//         orderInfo = {
//             contactInfo: undefined,
//             orderDate: undefined,
//             orderTime: undefined,
//             orderDateInNumbers: [],
//             bouquetType: undefined,
//             shipping: undefined,
//             bouquetPrice: undefined
//         };
//     let validateOperations = {
//         validateDateCalled: false,
//         validateTimeCalled: false
//     };
//
// // Эта функция проверяет были ли заполнены данные для заказа и собирает меню
// // Если какой-либо пункт меню был заполнен, напротив его кнопки вместе emoji ставится галочка
//     function makeOrderInterface() {
//         let btnTypes = {
//             date: {
//                 emoji: '📅',
//                 text: 'Дата',
//                 callback_data: 'date_order',
//                 data: orderInfo.orderDate
//             },
//             time: {
//                 emoji: '⏱',
//                 text: 'Время',
//                 callback_data: 'time_order',
//                 data: orderInfo.orderTime
//             },
//             shipping: {
//               emoji: '🛵',
//               text: 'Способ получения букета',
//               callback_data: 'shipping_type',
//               data: orderInfo.shippingType
//             },
//             clientName: {
//                 emoji: '📲',
//                 text: 'Контактные данные',
//                 callback_data: 'contact_info',
//                 data: orderInfo.contactInfo
//             },
//             bouqType: {
//                 emoji: '💐',
//                 text: 'Тип букета',
//                 callback_data: 'bouq_type',
//                 data: orderInfo.bouquetType
//             },
//             bouqPrice: {
//                 emoji: '💸',
//                 text: 'Стоимость букета',
//                 callback_data: 'bouq_cost',
//                 data: orderInfo.bouquetPrice
//             }
//         };
//         let buttonsArr = [];
//         for (let prop in btnTypes) {
//             let result = [];
//             if (btnTypes[prop].data !== undefined) {
//                 result.push(Markup.callbackButton('' + '✅' + ' ' + btnTypes[prop].text, '' + btnTypes[prop].callback_data));
//                 buttonsArr.push(result);
//             } else {
//                 result.push(Markup.callbackButton('' + btnTypes[prop].emoji + ' ' + btnTypes[prop].text, '' + btnTypes[prop].callback_data));
//                 buttonsArr.push(result);
//             }
//         }
//         return Markup.inlineKeyboard(buttonsArr).extra();
//     }
//
// // Эта функция выводит на экран вступительное сообщение и кнопки для заполнения формы заказа
//     let displayOrderInterface = (ctx) => {
//         return ctx.reply("Выберите любой пункт в меню и следуйте инструкциям. \nПри правильном заполнении данных напротив выбранного пукта меня будет стоять ✅",
//             makeOrderInterface()
//         );
//     };
//
//     let outputErrorMessage = (ctx, errorMsg) => {
//         ctx.reply("⛔️" + errorMsg);
//     };
//
// // Эта функция выводит сообщение с кнопкой, которую нуно нажать, чтобы продолжить вводить данные для заказа
//     let requestContinue = (ctx, additionalMsg) => {
//         return ctx.reply(`Нажмите на кнопку ниже, чтобы продолжить заказ букета или ${additionalMsg}`,
//             Markup.inlineKeyboard([
//                 Markup.callbackButton('Продолжить', 'продолжить'),
//             ]).extra());
//     };
//
//     let answerCbQueryAndShowMenu = (ctx) => {
//         ctx.telegram.answerCbQuery(ctx.update['callback_query'].id, "Загружаю меню ⌛️");
//         ctx.telegram.deleteMessage(ctx.update['callback_query'].message.chat.id, ctx.update['callback_query'].message['message_id']);
//         for (let key in validateOperations) {
//             if (validateOperations[key]) {
//                 validateOperations[key] = false;
//             }
//         }
//         // Выводим меню заказа
//         displayOrderInterface(ctx);
//     };
//
//     function requestDate(ctx) {
//         validateOperations.validateDateCalled = true;
//         console.log("*** Запущена функция, запрашивающая ввод даты");
//         if (orderInfo.orderDate) {
//           ctx.reply(`⚠️ Вы ранее вводили эту дату: \n ${orderInfo.orderDate} \n Эта дата будет перезаписана`);
//         }
//         ctx.reply("Выберите дату, на которую хотите заказать букет. \nНапишите дату самостоятельно или выберите из предложенных ниже вариантов. \n👍 Пример даты: 14 февраля. \nЕсли вы ввели не ту дату – просто напишите новую",
//             Markup.inlineKeyboard([
//                 // Если сегодня, тогда попросить указать точное время (эта фича под вопросом)
//                 Markup.callbackButton('Сегодня', 'Сегодня'),
//                 Markup.callbackButton('Завтра', 'Завтра')
//             ]).extra());
//         bot.on('callback_query', (ctx) => {
//             ctx.telegram.answerCbQuery(ctx.update['callback_query'].id, "");
//             // Этот фрагмент кода выполняется если была нажата кнопка "Продолжить"
//             if (ctx.update['callback_query'].data === "продолжить") {
//                 // ctx.telegram.answerCbQuery(ctx.update['callback_query'].id, "Загружаю меню ⌛️");
//                 // ctx.telegram.deleteMessage(ctx.update['callback_query'].message.chat.id, ctx.update['callback_query'].message['message_id']);
//                 // validateDateCalled = false;
//                 // // Выводим меню заказа
//                 // displayOrderInterface(ctx);
//                 answerCbQueryAndShowMenu(ctx);
//             }
//             // Этот фрагмент кода выполняется если была нажата кнопка "Сегодня"
//             else if (ctx.update['callback_query'].data === "Сегодня") {
//                 // Рассчитывает дату заказа на сегодня
//                 if (validateOperations.validateDateCalled) {
//                     orderInfo.orderDate = (() => {
//                         const months = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
//                         let oneDay = 0,
//                             result;
//                         let thisDate = new Date(Date.now() + oneDay);
//                         let currentMonth = months[thisDate.getMonth()],
//                             currentDay = thisDate.getDate().toString();
//                         result = currentDay + " " + currentMonth;
//                         return result;
//                     })();
//                     ctx.reply("✅ Хорошо, букет будет готов к " + orderInfo.orderDate);
//                     return requestContinue(ctx, "введите другую дату");
//                 }
//             } else {
//                 if (validateOperations.validateDateCalled) {
//                     orderInfo.orderDate = (() => {
//                         const months = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
//                         let result;
//                         let oneDay = 86400000;
//                         let thisDate = new Date(Date.now() + oneDay);
//                         let currentMonth = months[thisDate.getMonth()],
//                             currentDay = thisDate.getDate().toString();
//                         result = currentDay + " " + currentMonth;
//                         return result;
//                     })();
//                     ctx.reply(`✅ Хорошо, букет будет готов к ${orderInfo.orderDate}`);
//                     requestContinue(ctx, "введите другую дату");
//                 }
//             }
//         });
//         // Реагирует на текстовые сообщения внутри функции валидации даты
//         bot.on('message', (ctx) => {
//             if (validateOperations.validateDateCalled) {
//                 if(checkDate(ctx)) {
//                     ctx.reply(`✅ Хорошо. Ваш букет будет готов к ${orderInfo.orderDate}.`);
//                     requestContinue(ctx, "введите другую дату");
//                 } else {
//                     outputErrorMessage(ctx, "Пожалуйста, ведите корректную дату!");
//                 }
//             }
//         });
//     }
//
//     // Эта функция занимается проверкой введенной пользователем даты
//     function checkDate(ctx) {
//         const scheduleDates = {
//             'today': {
//                 matchExpression: "сегодн",
//                 fullName: "сегодня",
//                 scheduleDate() {
//                     const months = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
//
//                     let oneDay = 0,
//                         result;
//                     if (arguments[0]) oneDay = 86400000;
//                     let thisDate = new Date(Date.now() + oneDay);
//                     let currentMonth = months[thisDate.getMonth()],
//                         currentDay = thisDate.getDate().toString();
//                     result = currentDay + " " + currentMonth;
//                     return result;
//                 },
//                 specifyTime: true
//             },
//             'tomorrow': {
//                 matchExpression: "завтр",
//                 fullName: "завтра",
//                 scheduleDate() {
//                     const months = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
//
//                     let oneDay = 86400000,
//                         result;
//                     let thisDate = new Date(Date.now() + oneDay);
//                     let currentMonth = months[thisDate.getMonth()],
//                         currentDay = thisDate.getDate().toString();
//                     result = currentDay + " " + currentMonth;
//                     return result;
//                 },
//                 specifyTime: true
//             },
//             'october': {
//                 matchExpression: "окт",
//                 fullName: "октября",
//                 monthNumber: 10
//             },
//             'november': {
//                 matchExpression: "нояб",
//                 fullName: "ноября",
//                 monthNumber: 11
//             },
//             'december': {
//                 matchExpression: "дек",
//                 fullName: "декабря",
//                 monthNumber: 12
//             },
//             'january': {
//                 matchExpression: "янв",
//                 fullName: "января",
//                 monthNumber: 1
//             },
//             'february': {
//                 matchExpression: "фев",
//                 fullName: "февраля",
//                 monthNumber: 2
//             },
//             'march': {
//                 matchExpression: "март",
//                 fullName: "марта",
//                 monthNumber: 3
//             },
//             'april': {
//                 matchExpression: "апр",
//                 fullName: "апреля",
//                 monthNumber: 4
//             },
//             'may': {
//                 matchExpression: ['май', 'мая'],
//                 fullName: "мая",
//                 monthNumber: 5
//             },
//             'june': {
//                 matchExpression: "июн",
//                 fullName: "июня",
//                 monthNumber: 6
//             },
//             'july': {
//                 matchExpression: "июл",
//                 fullName: "июля",
//                 monthNumber: 7
//             },
//             'august': {
//                 matchExpression: "авгус",
//                 fullName: "августа",
//                 monthNumber: 8
//             },
//             'september': {
//                 matchExpression: "сент",
//                 fullName: "сентября",
//                 monthNumber: 9
//             }
//         };
//         console.log("*** Запущена функция валидации даты");
//
//         // В этом обхекте хранится информация о дате. Если она проходит все проверки, то содержимое
//         // этот объекта отправляется в другой объект, который будет выводиться клиенту и администратору
//         let resultDateObject = {};
//
//         // Эта функция высчитывает сколько дней в конкретном месяце конкретного года
//         let daysInMonth = (month, year) => {
//             return new Date(year, month, 0).getDate();
//         };
//
//         function validateMonth(matchRegexArray) {
//             // matchRegexArray[1] = matchRegexArray[1].substr(0,2);
//             console.log("Длина массива: " + matchRegexArray.length);
//
//             if (matchRegexArray.length === 1) {
//                 outputErrorMessage(ctx, "Пожалуйста, введите корректную дату!");
//             }
//             if (matchRegexArray[1][0] === "0") {
//                 matchRegexArray[1] = matchRegexArray[1].substr(1,2);
//             }
//             // Этот фрагмент кода выполняется, если пользователь ввел дату так: "ДД.ММ"
//             if (matchRegexArray.length === 2) {
//
//                 for (let key in scheduleDates) {
//                     // Возвращаем ошибку если число ММ (месяц) больше 12
//                     if (+matchRegexArray[1] > 12) return false;
//                     // Для экономии сил пропускаем шаги ниже если в объекте даты нет свойства "monthNumber",
//                     // содержащего номер месяца для распознавания (таких свойств нет у "сегодня" и "завтра")
//                     if (!scheduleDates[key].hasOwnProperty('monthNumber')) continue;
//                     let monthRegEx = new RegExp(scheduleDates[key].monthNumber, 'i');
//                     let foundMonthInString = matchRegexArray[1].match(monthRegEx);
//                     if (foundMonthInString !== null) {
//
//                         if (scheduleDates[key].monthNumber.toString().search(matchRegexArray[1]) !== -1) {
//                             resultDateObject.day = +matchRegexArray[0];
//                             resultDateObject.month = scheduleDates[key];
//                             // Добавляем дату в цифровом формате, который будет использован при валидации времени
//                             orderInfo.orderDateInNumbers[1] = (scheduleDates[key].monthNumber - 1);
//                             console.log("Месяц проверен. Получилась вот такая дата: " + JSON.stringify(resultDateObject.month));
//                             return true;
//                         }
//                     }
//                 }
//                 return false;
//             }
//             // Вычленяем месяц массива-результата
//             for (let key in scheduleDates) {
//
//                 // Некоторые месяцы содержат массив шаблонов для регулярных выражений
//                 // для перебора значений массива используется фрагмент кода ниже
//                 if (typeof(scheduleDates[key].matchExpression) === "object" ) {
//                     for (let i = 0; i < scheduleDates[key].matchExpression.length; i++) {
//                         let monthRegEx = new RegExp(scheduleDates[key].matchExpression[i], 'i');
//                         if (matchRegexArray[2].search(monthRegEx) !== -1) {
//                             // При положительном результате в переменную-результат присваивается объект,
//                             // содержащий информацию о месяце
//                             resultDateObject.day = +matchRegexArray[1];
//                             resultDateObject.month = scheduleDates[key];
//                             orderInfo.orderDateInNumbers[1] = scheduleDates[key].monthNumber - 1;
//                             console.log("Месяц проверен. Получилась вот такая дата: " + JSON.stringify(resultDateObject.month));
//                             return true;
//                         }
//                     }
//                 }
//
//                 let monthRegEx = new RegExp(scheduleDates[key].matchExpression, 'i');
//                 // В ячейке номер 2 лежит строка, содержащая название месяца
//                 // ["25 декабря", "25", "декабря", index: 0, input: "25 декабря", groups: undefined]
//                 if (matchRegexArray[2].search(monthRegEx) !== -1) {
//                     // При положительном результате в переменную-результат присваивается объект,
//                     // содержащий информацию о месяце
//                     resultDateObject.day = +matchRegexArray[1];
//                     // ВОзможно, нужно заменить объект на номер месяца в формате JS
//                     resultDateObject.month = scheduleDates[key];
//                     orderInfo.orderDateInNumbers[1] = (scheduleDates[key].monthNumber - 1);
//                     console.log("Месяц проверен. Получилась вот такая дата: " + JSON.stringify(resultDateObject.month));
//                     return true;
//                 }
//             }
//             return false;
//         }
//
//         function validateDay(resultDateObject) {
//             console.log(resultDateObject);
//             let scheduleYear = new Date().getFullYear(),
//                 thisMonth = new Date().getMonth(),
//                 thisYear = new Date().getFullYear();
//             let {month, day} = resultDateObject;
//
//             if (month.monthNumber < thisMonth + 1) scheduleYear++;
//             console.log("Год записи: " + scheduleYear);
//             if (day !== 0 && day <= daysInMonth(month.monthNumber, scheduleYear)) {
//                 console.log("Число месяца корректно. Получилась такая дата: " + day + " " + month.fullName);
//                 if (scheduleYear > thisYear)  {
//                     // В orderInfo.orderDateInNumbers[0] хранится выбранное число месяца
//                     orderInfo.orderDateInNumbers[0] = day;
//                     orderInfo.orderDate = "" + day + " " + month.fullName + " " + scheduleYear + " года";
//                     return true;
//                 }
//                 orderInfo.orderDate = "" + day + " " + month.fullName;
//                 return true;
//             } else {
//                 outputErrorMessage(ctx, "В месяце, который вы ввели, нет числа " + resultDateObject.day + "!");
//                 resultDateObject.month = undefined;
//                 resultDateObject.day = undefined;
//                 return false;
//             }
//         }
//
//         // Строка формата "Число месяц" (пр. 21 сентября)
//         let stringForValidation;
//
//         // Если введенные данные совпадают с форматом день-месяц, тогда ищем полное название для месяца
//         if (stringForValidation = ctx.message.text.match(/(\d+)[\s\/.,\-]?([а-яё]+)/i)) {
//             // Если месяц был распознан, тогда проверяем корректность введенного дня (числа)
//             let validationResult;
//             if (validateMonth(stringForValidation)) {
//                 validationResult = (validateDay(resultDateObject)) ? true : false;
//             }
//             return validationResult;
//         } else if (stringForValidation = ctx.message.text.match(/(\d+)[\s\/.,:\\-](\d+)/i)) {
//             let validationResult;
//             // На данном этапе stringForValidation выглядит так: ["26.06"]
//             // Функция validateMonth должна получать массив (например, ["26", "06"])
//             validationResult = validateMonth(stringForValidation[0].split(/[\s\/.,:\\\-]/)) ? validateDay(resultDateObject) : false;
//             return validationResult;
//         } else if (stringForValidation = ctx.message.text.match(/(сегодня)?(завтра)?/i)) {
//             // Иначе ищем было ли введено "сегодня" или "завтра"
//             console.log("Пользователь ввел: " + stringForValidation);
//             if (stringForValidation[0].toLowerCase().search(scheduleDates['today'].matchExpression) !== -1) {
//                 // Если пользователь ввел "сегодня", то вызывается функция, высчитывающая
//                 // дату для сегодняшнего дня
//                 orderInfo.orderDate = scheduleDates['today'].scheduleDate();
//                  return true;
//             } else {
//                 // Иначе дата высчитывается для завтрашнего дня
//                 orderInfo.orderDate = scheduleDates['tomorrow'].scheduleDate();
//                 return true;
//             }
//             console.log(resultDateObject);
//         } else {
//             return false;
//         }
//     }
//
//     // Эта функция проверяет правильность введенного времени
//     function requestTime(ctx) {
//         validateOperations.validateTimeCalled = true;
//         let finishWork = 20,
//             startWork = 10;
//         ctx.telegram.answerCbQuery(ctx.update['callback_query'].id, "");
//         let result = false;
//         let today = new Date();
//         let workingHoursMsg = "⏰ Сегодня мы работаем с " + startWork + ":00 до " + finishWork + ":00";
//         if (today.getDay() === 6 || today.getDay() === 5) {
//             startWork = 11;
//             finishWork = 19;
//         }
//         if (orderInfo.shipping === undefined) {
//           requestShipping(ctx);
//         }
//
//         ctx.reply("Введите, пожалуйста, примерное время, когда хотите забрать букет. \nПожалуйста, указывайте время не раньше, чем +2 часа к настоящему времени \nПример ввода времени: 17:30");
//         ctx.reply(workingHoursMsg);
//         // Функция расчитывает ближайшее досупное время для callback-кнопки
//         function calculateClosestTime() {
//             let now = new Date(),
//                 time;
//             if (now.getHours() > (startWork + 2) && now.getHours() < (finishWork - 2)) {
//                 if (now.getMinutes() > 20) {
//                     time = (now.getHours() + 2) + ":00";
//                 } else if (now.getMinutes() > 45)
//                     time = "" + (now.getHours() + 3) + ":00";
//             } else {
//                 time = "" + (startWork + 2) + ":00 (завтра)";
//             }
//             if (arguments[0]) {
//                 let data = (time < now) ? time + "+" : time;
//                 console.log("Данные для callback query: " + data);
//                 return data;
//             } else {
//                 console.log("Отображаемое в кнопке время: " + time);
//                 return time;
//             }
//         };
//         ctx.reply("Вы также можете выбрать ближайшее время ниже", Markup.inlineKeyboard([
//             // Если сегодня, тогда попросить указать точное время (эта фича под вопросом)
//             Markup.callbackButton(calculateClosestTime(), calculateClosestTime("generateData"))
//         ]).extra());
//         console.log("Время запрошено!");
//
//         if (validateOperations.validateTimeCalled) {
//             // Обрабатывает нажатие разных кнопок ("Продолжить" или "предложенное время")
//             bot.on('callback_query', (ctx) => {
//                 ctx.telegram.answerCbQuery(ctx.update['callback_query'].id, "");
//                 console.log(ctx.update['callback_query'].data);
//                 if (ctx.update['callback_query'].data === "продолжить") {
//                     answerCbQueryAndShowMenu(ctx);
//                 } else {
//                     orderInfo.orderTime = ctx.update['callback_query'].data;
//                     console.log("Время заказа: " + orderInfo.orderTime);
//                     answerCbQueryAndShowMenu(ctx);
//                 }
//             });
//             bot.on('message', (ctx) => {
//                 if (validateOperations.validateTimeCalled) {
//                     if (checkTime(startWork, finishWork)) {
//                         requestContinue(ctx, "введите другое время");
//                     }
//                     return result;
//                 }
//             });
//         }
//     }
//
//     function checkTime(startWork, finishWork) {
//         let timeInputIsValid = false,
//             now = new Date(),
//             timeInString;
//         bot.on('message', (ctx) => {
//             console.log("*** Начинаем распознавание времени");
//             timeInString = ctx.message.text.match(/(\d\d?)[.\\:,](\d\d?)/i);
//             console.log(timeInString);
//             // Проверяем введенную строку со временем на валидность
//             timeInputIsValid = (+timeInString[2] >= 0 && +timeInString[2] <= 59) ? ((time) => {
//                 if (+time[1] >= 0 && +time[1] <= 23) return true;
//             })(timeInString) : false;
//         });
//         return outputErrorMessage(ctx, "Пожалуйста, введите корректное время!");
//
//     }
//
//     function requestShipping(ctx) {
//       ctx.reply("Выберите как будете забирать букет",  Markup.inlineKeyboard([
//         Markup.callbackButton('Самовывоз', 'самовывоз'),
//         Markup.callbackButton('Доставка', 'доставка')
//       ]).extra());
//       bot.on('callback_query', (ctx) => {
//         ctx.telegram.answerCbQuery(ctx.update['callback_query'].id, `Вы выбрали способ: ${ctx.update['callback_query'].data}`);
//         if (ctx.update['callback_query'].data === 'доставка')  {
//           orderInfo.shipping = true;
//         } else {
//           orderInfo.shipping = false;
//         }
//       });
//       bot.hears(/'самовывоз'/i, (ctx) => {
//         orderInfo.shipping = false;
//       })
//       bot.hears(/'доставка'/i, (ctx) => {
//         orderInfo.shipping = true;
//       })
//     }
//
//     // Эта функция запрашивает у пользователя тип букета и предлагает несколько вариантов, как пример
//     let chooseBouquetType = ctx => {
//         let requestBouquetType = ctx => {
//             return ctx.reply("Напишите, пожалуйста, тип букета или выберите из нескольких примеров ниже!", Markup.inlineKeyboard([
//                 // Если сегодня, тогда попросить указать точное время (эта фича под вопросом)
//                 Markup.callbackButton('Свадебный', 'свадебный'),
//                 Markup.callbackButton('Для девушки', 'для девушки')
//             ],[Markup.callbackButton('Для жены', 'для жены')]).extra())
//         };
//         requestBouquetType(ctx);
//     };
//
//     function provideContactInfo(ctx) {
//
//     }
//
//     function launch(ctx) {
//         console.log("*** Запущена функция заказа букетов");
//         orderIsInitialised = true;
//         ctx.reply("Хорошо, давайте начнем!", Markup.keyboard([
//             ['📱 Меню заказа'],
//             ['📞 Связаться с магазином'],
//             ['⛔️Отменить заказ️']
//         ])
//             .oneTime()
//             .resize()
//             .extra()
//         );
//
//         displayOrderInterface(ctx);
//     }
//
//     bot.action('date_order', (ctx) => {
//         ctx.telegram.answerCbQuery(ctx.update['callback_query'].id, "Минуточку");
//         requestDate(ctx);
//     });
//
//     bot.action('time_order', (ctx) => {
//         ctx.telegram.answerCbQuery(ctx.update['callback_query'].id);
//         requestTime(ctx);
//     });
//
//     bot.hears(/Меню заказа/i, (ctx) => {
//         for (let key in validateOperations) {
//             if (validateOperations[key]) {
//                 validateOperations[key] = false;
//             }
//         }
//         displayOrderInterface(ctx);
//     });
//
//     bot.hears(/Отменить заказа/i, () => {
//         cancelOrder();
//     });
//
//     global.order = launch;
//     global.orderInitialized = orderIsInitialised;
// })();
bot.use(session());
bot.use(stage.middleware());

bot.start((ctx) => {
    MainPage.displayMainPage(ctx, MainPage.welcomeMsg);
    MainPage.offerBotHelp(ctx);
    bot.action('howtouse', (ctx) => {
        ctx.telegram.answerCbQuery(ctx.update['callback_query'].id, "");
        ctx.reply('https://telegra.ph/CHernoviki-11-17');
    })
});

bot.hears(/💐 Заказать букет/, (ctx) => {
    order.launch(ctx);

    bot.hears(/Меню заказа/i, (ctx) => {
        if (!order.orderIsInitialised) {
            return;
        }
       order.displayInterface(ctx, "Выберите любой пункт в меню");
    });

    bot.hears(/Связаться с магазином/i, (ctx) => {
        if (!order.orderIsInitialised) {
            return;
        }
        return Contacts.showPhoneNumber(ctx);
    });

    bot.hears(/Отменить заказ/i, (ctx) => {
        if (!order.orderIsInitialised) {
            return;
        }
        let cancelOrder = new Promise((resolve) => {
            order.cancelOrder(ctx);
            resolve([ctx, "Нажмите на кнопку меню, чтобы продолжить"]);
        });

        cancelOrder.then((val) => {
            let [context, msg] = val;
            MainPage.displayMainPage(context, msg);
        });
        console.log("*** Заказ отменен ***");
    });

    bot.on('callback_query', (ctx) => {
        ctx.telegram.answerCbQuery(ctx.update['callback_query'].id, "");
       if (ctx.update['callback_query'].data === "Продолжить") {
           ctx.telegram.answerCbQuery(ctx.update['callback_query'].id, "📱 Открываю меню заказа");
           order.displayInterface(ctx, "Выберите любой пункт в меню");
       } else {
           console.log(ctx.update['callback_query'].data);
           ctx.scene.enter(ctx.update['callback_query'].data);
       }
    });
});


bot.hears('Фотогалерея', (ctx) => {
    gallery.show(ctx);
});


bot.hears('Контакты', (ctx) => {
    Contacts.displayContactInfo(ctx);
    bot.action('Показать адрес', (ctx) => {
        Contacts.showAddress(ctx);
    })
});


bot.hears('О нас', (ctx) => {
    about.displayInfo(ctx);
});


bot.hears('Моя корзина', (ctx) => {
    cart.show(ctx);
});


bot.startPolling();