 'use strict';

const Telegraf = require('telegraf');
const {Extra, Markup} = Telegraf;
const config = require('./config.js');
const bot = new Telegraf(config.telegraf_token);
var workingHours = "Мы работаем с 11:00 до 19:00";

 // НАЧАЛО ФУНКЦИИ ЗАКАЗА БУКЕТА
//  (function processOrder() {
//      let invoice = require('./process-order/invoice');
//      invoice.provider_token = PAYMENT_TOKEN;
//
//      let launch = require('./process-order/launch');
//
// // ВОЗМОЖНО НУЖНО СПРЯТАТЬ ИЛИ ЗАМЕНИТЬ ОСНОВНОЕ МЕНЮ ПРИ ЗАКАЗЕ БУКЕТА
// // noinspection JSAnnotator
//
//      //let validateDateInput = require('./process-order/validate-date-input');
//
//
//      //launch.requireDate = require('./process-order/require-date');
//      //launch.checkDate = validateDateInput;
//
//      global.order = launch;
//  })();

 (function order() {
     let invoice = {
         provider_token: config.payment_token,
         start_parameter: 'time-machine-sku',
         title: 'Working Time Machine',
         description: 'Want to visit your great-great-great-grandparents? Make a fortune at the races? Shake hands with Hammurabi and take a stroll in the Hanging Gardens? Order our Working Time Machine today!',
         currency: 'RUB',
         photo_url: 'https://img.clipartfest.com/5a7f4b14461d1ab2caaa656bcee42aeb_future-me-fredo-and-pidjin-the-webcomic-time-travel-cartoon_390-240.png',
         is_flexible: true,
         prices: [
             { label: 'Working Time Machine', amount: 100000 },
             { label: 'Gift wrapping', amount: 110 }
         ],
         payload: {
             coupon: 'BLACK FRIDAY'
         }
     };
     let orderIsInitialised = false,
         orderInfo = {
             clientName: "",
             orderDate: undefined,
             bouquetType: ""
         },
         dateIsAlreadyChosen = false;

     function outputErrorMessage(ctx, errorMsg) {
         ctx.reply(errorMsg);
     }

     function notifyDateRewrite(ctx) {
         ctx.reply("Хорошо, перезапишу дату заказа. Теперь букет будет заказан на: ${orderInfo.orderDate}");
     }

     function requestDate(ctx) {
         console.log("*** Запущена функция, запрашивающая ввод даты");
         ctx.reply("Выберите дату, на которую хотите заказать букет. \nНапишите дату самостоятельно или выберите из предложенных ниже вариантов. \n👍 Пример даты: 14 февраля. \nЕсли вы ввели не ту дату – просто напишите новую",
             Markup.inlineKeyboard([
                 // Если сегодня, тогда попросить указать точное время (эта фича под вопросом)
                 Markup.callbackButton('Сегодня', 'Сегодня'),
                 Markup.callbackButton('Завтра', 'Завтра')
             ]).extra());
         return checkDate(ctx);
     }

     // Эта функция проверяет правильность введенного времени
     function requestTime(ctx) {
         ctx.reply("Введите еще, пожалуйста, примерную дату, когда придете за букетом. \nПожалуйста, указывайте время не раньше, чем через 2 часа от настоящего времени");
         console.log("Время запрошено!");
     }

     // Эта функция занимается проверкой введенной пользователем даты
     // ПЕРЕДЕЛАТЬ! Она должна распознавать разные форматы [ДД.ММ, ДД МЕСЯЦ]
     function checkDate(ctx) {
         const scheduleDates = {
             'today': {
                 matchExpression: "сегодн",
                 fullName: "сегодня",
                 scheduleDate() {
                     const months = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];

                     let oneDay = 0,
                         result;
                     if (arguments[0]) oneDay = 86400000;
                     let thisDate = new Date(Date.now() + oneDay);
                     let currentMonth = months[thisDate.getMonth()],
                         currentDay = thisDate.getDate().toString();
                     result = currentDay + " " + currentMonth;
                     return result;
                 },
                 specifyTime: true
             },
             'tomorrow': {
                 matchExpression: "завтр",
                 fullName: "завтра",
                 scheduleDate() {
                     const months = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];

                     let oneDay = 0,
                         result;
                     if (arguments[0]) oneDay = 86400000;
                     let thisDate = new Date(Date.now() + oneDay);
                     let currentMonth = months[thisDate.getMonth()],
                         currentDay = thisDate.getDate().toString();
                     result = currentDay + " " + currentMonth;
                     return result;
                 },
                 specifyTime: true
             },
             'december': {
                 matchExpression: "дек",
                 fullName: "декабря",
                 scheduleMonth: 0
             },
             'january': {
                 matchExpression: "янв",
                 fullName: "января",
                 scheduleMonth: 1
             },
             'february': {
                 matchExpression: "фев",
                 fullName: "февраля",
                 scheduleMonth: 2
             },
             'march': {
                 matchExpression: "мар",
                 fullName: "марта",
                 scheduleMonth: 3
             },
             'april': {
                 matchExpression: "апр",
                 fullName: "апреля",
                 scheduleMonth: 4
             },
             'may': {
                 matchExpression: "ма",
                 fullName: "мая",
                 scheduleMonth: 5
             },
             'june': {
                 matchExpression: "июн",
                 fullName: "июня",
                 scheduleMonth: 6
             },
             'july': {
                 matchExpression: "июл",
                 fullName: "июля",
                 scheduleMonth: 7
             },
             'august': {
                 matchExpression: "авг",
                 fullName: "августа",
                 scheduleMonth: 8
             },
             'september': {
                 matchExpression: "сен",
                 fullName: "сентября",
                 scheduleMonth: 9
             },
             'october': {
                 matchExpression: "окт",
                 fullName: "октября",
                 scheduleMonth: 10
             },
             'november': {
                 matchExpression: "ноя",
                 fullName: "ноября",
                 scheduleMonth: 11
             }
         };
         // Проверяем была ли запущена функция инициирующая заказ букета
         if (!orderIsInitialised) {
             console.log("Изначальная функция не была вызвана");
             return;
         }
         console.log("*** Запущена функция валидации даты");

         // В этом обхекте хранится информация о дате. Если она проходит все проверки, то содержимое
         // этот объекта отправляется в другой объект, который будет выводиться клиенту и администратору
         let tempDateObj = {};

         // Эта функция высчитывает сколько дней в конкретном месяце конкретного года
         let daysInMonth = (month, year) => {
             return new Date(year, month, 0).getDate();
         };

         let validateMonth = matchRegexArray => {
             // Вычленяем месяц массива-результата
             for (let key in scheduleDates) {
                 // Создаем критерий для поиска совпадений в массиве месяцев
                 let monthRegEx = new RegExp(scheduleDates[key].matchExpression, 'i');
                 // В ячейке номер 2 лежит строка, содержащая название месяца
                 // ["25 декабря", "25", "декабря", index: 0, input: "25 декабря", groups: undefined]
                 if (matchRegexArray[2].search(monthRegEx) !== -1) {
                     // При положительном результате в переменную-результат присваивается объект,
                     // содержащий информацию о месяце
                     tempDateObj.day = +matchRegexArray[1];
                     tempDateObj.month = scheduleDates[key];
                     break;
                 }
             }
             console.log("Месяц проверен. Получилась вот такая дата: " + JSON.stringify(tempDateObj.month));
             return true;
         };

         let validateDay = dateObject => {
             let scheduleYear = new Date().getFullYear(),
                 thisMonth = new Date().getMonth();
             if (dateObject.month.scheduleMonth < thisMonth) scheduleYear++;
             if (dateObject.day !== 0 && dateObject.day <= daysInMonth(dateObject.month.scheduleMonth, scheduleYear)) {
                 console.log("Число месяца корректно. Получилась такая дата: " + dateObject.day + dateObject.month.fullName);
                 orderInfo.orderDate = "" + tempDateObj.day + " " + tempDateObj.month.fullName;
                 return true;
             } else {
                 outputErrorMessage(ctx, "В месяце, который вы ввели нет числа ${dateObject.day}!");
                 dateObject.month = undefined;
                 dateObject.day = undefined;
                 return false;
             }
         };

         let identifyDate = new Promise((resolve, reject) => {
             let stringForValidation = ctx.message.text;
             if (stringForValidation.match(/(\d+)[\s\/.,\-]?([а-яё]+)/i)) {
                 resolve(stringForValidation);
             } else {
                 reject(stringForValidation);
             }
         });

         identifyDate.then(result => {

         })

         let stringForValidation = ctx.message.text.match(/(\d+)[\s\/.,\-]?([а-яё]+)/i);
         console.log(stringForValidation);
         // Если введенные данные совпадают с форматом день-месяц, тогда ищем полное название для месяца
         if (stringForValidation) {
             // Если месяц был распознан, тогда проверяем корректность введенного дня (числа)
             if (validateMonth(stringForValidation)) {
                 return validateDay(tempDateObj);
             }
         } else if(stringForValidation) {
             // Может, сюда ничего не надо вставлять и это условие вообще надо удалить
         } else {
             // Иначе ищем было ли введено "сегодня" или "завтра"
             stringForValidation = ctx.message.text.match(/(сегодня)?(завтра)?/gi);
             if (stringForValidation[0].toLowerCase() === scheduleDates['today'].matchExpression) {
                 // Если пользователь ввел "сегодня", то вызывается функция, высчитывающая
                 // дату для сегодняшнего дня
                 orderInfo.orderDate = scheduleDates['today'].scheduleDate();
                 requestTime(ctx);
             } else {
                 // Иначе дата высчитывается для завтрашнего дня
                 orderInfo.orderDate = scheduleDates['tomorrow'].scheduleDate();
             }
             console.log(tempDateObj);
         }

         (function() {
             bot.on('callback_query', (ctx) => {
                 console.log(ctx.update['callback_query'].data);
                 ctx.telegram.answerCbQuery(ctx.update['callback_query'].id, "Букет заказан на " + ctx.update['callback_query'].data.toLowerCase());
                 if (ctx.update['callback_query'].data === "Сегодня") {
                     orderInfo.orderDate = new Date().getDate() + 1 + " " + new Date().getMonth();
                 }
             });

             bot.on('message', (ctx) => {
                 if(checkDate(ctx)) {
                     ctx.reply("Хорошо. Ваш букет будет заказан на " + orderInfo.orderDate);
                     return true;
                 } else {
                     outputErrorMessage(ctx, "Пожалуйста, ведите корректную дату!");
                 }
             });
         })();
     }

     // Эта функция запрашивает у пользователя тип букета и предлагает несколько вариантов, как пример
     let chooseBouquetType = ctx => {
         let requestBouquetType = ctx => {
           return ctx.reply("Напишите, пожалуйста, тип букета или выберите из нескольких примеров ниже!", Markup.inlineKeyboard([
               // Если сегодня, тогда попросить указать точное время (эта фича под вопросом)
               Markup.callbackButton('Свадебный', 'свадебный'),
               Markup.callbackButton('Для девушки', 'для девушки'),
           ],[Markup.callbackButton('Для жены', 'для жены')]).extra())
         };
         requestBouquetType(ctx);
     };

     function launch(ctx) {
         orderIsInitialised = true;
         console.log("*** Запущена функция заказа букетов");
         ctx.reply("Что ж, давайте начнем. Ответьте на пару вопросов и готово!");
         requestDate(ctx);
     }

     launch.requestDate = requestDate;
     launch.checkDate = checkDate;
     launch.chooseBouquetType = chooseBouquetType;

     global.order = launch;
 })();

 // КОНЕЦ ФУНКЦИИ ЗАКАЗА БУКЕТА


  bot.start(({ reply }) => {
    return reply('Еще раз привет! \nЯ бот помощник цветочного магазина \"Блюменфрау\". Помогу вам заказать букет вашей мечты и покажу что мы уже сделали в нашем магазинчике. Нажмите на кнопку меню, чтобы продолжить! :)',
    Markup.keyboard([
        ['💐 Заказать букет'],
        ['Фотогалерея', 'Контакты'],
        ['О нас', 'Моя корзина']
      ])
      .oneTime()
      .resize()
      .extra()
    );
  });

 bot.hears(/Заказать букет/gim, (ctx) => {
     order(ctx);
     return;
 });


  bot.hears('Фотогалерея', (ctx) => {
      ctx.replyWithMediaGroup([
          {
              'media': 'https://pp.userapi.com/c631920/v631920791/1b3ab/u5uhgBHTXTM.jpg',
              'caption': 'Экстравагантный, для смелых\n' + 'В составе букета: Альстромерия, роза, рускус, салал',
              'type': 'photo'
          },{
              'media': 'https://pp.userapi.com/c631920/v631920791/1b3a1/xyMMIlCkLaY.jpg',
              'caption': 'Стильный и интересный букет \n' + 'В составе букета: Роза “кабарет”, седум, альстремерия желтая и красная, салал, рускус',
              'type': 'photo'
          },{
              'media': 'https://pp.userapi.com/c625521/v625521791/450dc/gx5T6IXewTY.jpg',
              'caption': 'В составе букета: Хризантема одиночная "Шамрок", хризантема кустовая, альстремерия оранжевая, сантини, рускус',
              'type': 'photo'
          }
      ]);
  });


  bot.hears('Контакты', (ctx) => {
      ctx.telegram.sendMessage(ctx.chat.id, "Звоните").then(function() {
          return ctx.telegram.sendContact(ctx.chat.id, '+79138201801', 'Людмила', 'Горкольцева', Extra.notifications(false));
      }).then(function() {
          return ctx.reply(workingHours, Extra.notifications(false));
      }).then(function() {
          return ctx.reply("Показать адрес магазина?",
              Markup.inlineKeyboard([
                  Markup.callbackButton('Показать адрес', 'Показать адрес')
              ]).extra(), Extra.notifications(false)
          );
      });
  });


 bot.action('Показать адрес', (ctx) => {
     ctx.telegram.answerCbQuery(ctx.update['callback_query'].id, "Загружаю карту 🤔");
     ctx.telegram.deleteMessage(ctx.update['callback_query'].message.chat.id, ctx.update['callback_query'].message['message_id']);
     ctx.telegram.sendVenue(ctx.chat.id, 56.4766215, 84.9634409, "Приходите в гости", "Фрунзе проспект, 46", Extra.notifications(false))
         .then(function() {
             return ctx.reply("А еще у нас есть Instagram",
                 Markup.inlineKeyboard([
                     Markup.urlButton("Подписаться", 'https://www.instagram.com/bf_tomsk')
                 ]).extra(),Extra.notifications(false));
         });
 });


 bot.hears('О нас', (ctx) => {
     ctx.replyWithSticker('CAADAgADgwADIIEVAAHe1ptG1BvPVAI');
     ctx.reply('Блаблабла. Хуе-мае');
 });


 bot.hears('Моя корзина', (ctx) => {
     return ctx.reply("Данный раздел пока в разработке. Вы все увидите, когда Глеб меня доделает");
 })


  bot.startPolling();
