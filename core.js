'use strict';

const Telegraf = require('telegraf');
const {Extra, Markup} = Telegraf;
const config = require('./config.js');
const bot = new Telegraf(config.telegraf_token);
let workingHours = "Мы работаем с 11:00 до 19:00";


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
            contactInfo: undefined,
            orderDate: undefined,
            orderTime: undefined,
            bouquetType: "",
            bouquetPrice: undefined
        };

// Эта функция проверяет были ли заполнены данные для заказа и собирает меню
// Если какой-либо пункт меню был заполнен, напротив его кнопки вместе emoji ставится галочка
    let makeOrderInterface = () => {
        let btnTypes = {
            date: {
                emoji: '📅',
                text: 'Дата',
                callback_data: 'date_order',
                data: orderInfo.orderDate
            },
            time: {
                emoji: '⏱',
                text: 'Время',
                callback_data: 'time_order',
                data: orderInfo.orderTime
            },
            clientName: {
                emoji: '📲',
                text: 'Контактные данные',
                callback_data: 'contact_info',
                data: orderInfo.contactInfo
            },
            bouqType: {
                emoji: '💐',
                text: 'Тип букета',
                callback_data: 'bouq_type',
                data: orderInfo.bouquetType
            },
            bouqPrice: {
                emoji: '💸',
                text: 'Стоимость букета',
                callback_data: 'bouq_cost',
                data: orderInfo.bouquetPrice
            }

        };
        let buttonsArr = [];
        for (let prop in btnTypes) {
            let result = [];
            if (btnTypes[prop].data) {
                result.push(Markup.callbackButton('' + '✅' + ' ' + btnTypes[prop].text, '' + btnTypes[prop].callback_data));
                buttonsArr.push(result);
            } else {
                result.push(Markup.callbackButton('' + btnTypes[prop].emoji + ' ' + btnTypes[prop].text, '' + btnTypes[prop].callback_data));
                buttonsArr.push(result);
            }
        }
        return Markup.inlineKeyboard(buttonsArr).extra();
    };

// Эта функция выводит на экран вступительное сообщение и кнопки для заполнения формы заказа
    let displayOrderInterface = (ctx) => {
        return ctx.reply("Выберите любой пункт в меню и следуйте инструкциям. \nПри правильном заполнении данных " +
            "напротив выбранного пукта меня будет стоять ✅",
            makeOrderInterface()
        );
    };

    let outputErrorMessage = (ctx, errorMsg) => {
        ctx.reply(errorMsg);
    };

    let notifyDateRewrite = (ctx) => {
        ctx.reply("Хорошо, перезапишу дату заказа. Теперь букет будет заказан на: ${orderInfo.orderDate}");
    };

// Эта функция выводит сообщение с кнопкой, которую нуно нажать, чтобы продолжить вводить данные для заказа
    let requestContinue = (ctx) => {
        return ctx.reply("Нажмите на кнопку \"Продолжить\", чтобы продолжить заказ букета или введите другую дату",
            Markup.inlineKeyboard([
                // Если сегодня, тогда попросить указать точное время (эта фича под вопросом)
                Markup.callbackButton('Продолжить', 'продолжить'),
            ]).extra());
    };

    let requestDate = (ctx) => {
        console.log("*** Запущена функция, запрашивающая ввод даты");
        ctx.reply("Выберите дату, на которую хотите заказать букет. \nНапишите дату самостоятельно или выберите из предложенных ниже вариантов. \n👍 Пример даты: 14 февраля. \nЕсли вы ввели не ту дату – просто напишите новую",
            Markup.inlineKeyboard([
                // Если сегодня, тогда попросить указать точное время (эта фича под вопросом)
                Markup.callbackButton('Сегодня', 'Сегодня'),
                Markup.callbackButton('Завтра', 'Завтра')
            ]).extra());

        (() => {
            // Реагирует на кнопки внутри функции валидации даты. Этих кнопки 3: "сегодня", "завтра" и "продолжить
            bot.on('callback_query', (ctx) => {
                ctx.telegram.answerCbQuery(ctx.update['callback_query'].id, "");
                // Этот фрагмент кода выполняется если была нажата кнопка "Продолжить"
                if (ctx.update['callback_query'].data === "продолжить") {
                    ctx.telegram.answerCbQuery(ctx.update['callback_query'].id, "");
                    ctx.telegram.deleteMessage(ctx.update['callback_query'].message.chat.id, ctx.update['callback_query'].message['message_id']);
                    // Выводим меню заказа
                    displayOrderInterface(ctx);
                }

                // Этот фрагмент кода выполняется если была нажата кнопка "Сегодня"
                else if (ctx.update['callback_query'].data === "Сегодня") {
                    // Рассчитывает дату заказа на сегодня
                    orderInfo.orderDate = (() => {
                        const months = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];

                        let oneDay = 0,
                            result;
                        if (arguments[0]) oneDay = 86400000;
                        let thisDate = new Date(Date.now() + oneDay);
                        let currentMonth = months[thisDate.getMonth()],
                            currentDay = thisDate.getDate().toString();
                        result = currentDay + " " + currentMonth;
                        return result;
                    })(true);
                    ctx.reply("Хорошо, букет будет готов к " + orderInfo.orderDate);
                    return ctx.reply("Нажмите на кнопку \"Продолжить\", чтобы продолжить заказ букета или введите другую дату",
                        Markup.inlineKeyboard([
                            // Если сегодня, тогда попросить указать точное время (эта фича под вопросом)
                            Markup.callbackButton('Продолжить', 'продолжить'),
                        ]).extra());
                }
                orderInfo.orderDate = (() => {
                    const months = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
                    let result;
                    let thisDate = new Date(Date.now());
                    let currentMonth = months[thisDate.getMonth()],
                        currentDay = thisDate.getDate().toString();
                    result = currentDay + " " + currentMonth;
                    return result;
                })();
                ctx.reply("Хорошо, букет будет готов к " + orderInfo.orderDate);
                return requestContinue(ctx);
            });
            // Реагирует на текстовые сообщения внутри функции валидации даты
            bot.on('message', (ctx) => {
                if (!ctx.message.text.match(/заказать букет/i)) {
                    if(checkDate(ctx)) {
                        ctx.reply("Хорошо. Ваш букет будет готов к " + orderInfo.orderDate + ".");
                        return requestContinue(ctx);
                    } else {
                        outputErrorMessage(ctx, "Пожалуйста, ведите корректную дату!");
                    }
                }
            });
        })();
    };

    // Эта функция проверяет правильность введенного времени
    let requestTime = (ctx) => {
        ctx.reply("Введите еще, пожалуйста, примерное время, когда придете за букетом. \nПожалуйста, указывайте время не раньше, чем через 2 часа от настоящего времени \nПример ввода времени: 17:30");
        console.log("Время запрошено!");
    };

    let checkTime = (ctx) => {
        let checkTimeResult = false;
        bot.on('message', (ctx) => {
            console.log("Типа время было проверено!");
            checkTimeResult = true;
        })
        return checkTimeResult;
    };

    // Эта функция занимается проверкой введенной пользователем даты
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
            'october': {
                matchExpression: "окт",
                fullName: "октября",
                scheduleMonth: 10
            },
            'november': {
                matchExpression: "ноя",
                fullName: "ноября",
                scheduleMonth: 11
            },
            'december': {
                matchExpression: "дек",
                fullName: "декабря",
                scheduleMonth: 12
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
                matchExpression: "март",
                fullName: "марта",
                scheduleMonth: 3
            },
            'april': {
                matchExpression: "апр",
                fullName: "апреля",
                scheduleMonth: 4
            },
            'may': {
                matchExpression: ['май', 'мая'],
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
            }
        };
        console.log("*** Запущена функция валидации даты");

        // В этом обхекте хранится информация о дате. Если она проходит все проверки, то содержимое
        // этот объекта отправляется в другой объект, который будет выводиться клиенту и администратору
        let tempDateObj = {};

        // Эта функция высчитывает сколько дней в конкретном месяце конкретного года
        let daysInMonth = (month, year) => {
            return new Date(year, month, 0).getDate();
        };

        let validateMonth = matchRegexArray => {
            // matchRegexArray[1] = matchRegexArray[1].substr(0,2);
            console.log("Длина массива: " + matchRegexArray.length);
            if (matchRegexArray[1][0] === "0") matchRegexArray[1] = matchRegexArray[1].substr(1,2);
            // Этот фрагмент кода выполняется, если пользователь ввел дату так: "ДД.ММ"
            if (matchRegexArray.length === 2) {

                for (let key in scheduleDates) {
                    if (+matchRegexArray[1] > 12) return false;
                    if (!scheduleDates[key].hasOwnProperty('scheduleMonth')) continue;
                    let monthRegEx = new RegExp(scheduleDates[key].scheduleMonth, 'i');
                    let foundMonthInString = matchRegexArray[1].match(monthRegEx);
                    if (foundMonthInString !== null) {
                        //matchRegexArray[1] += (matchRegexArray[1][foundMonthInString.index + 1]) ? matchRegexArray[1][foundMonthInString.index + 1] : "";
                        if (scheduleDates[key].scheduleMonth.toString().search(matchRegexArray[1]) !== -1) {
                            tempDateObj.day = +matchRegexArray[0];
                            tempDateObj.month = scheduleDates[key];
                            console.log("Месяц проверен. Получилась вот такая дата: " + JSON.stringify(tempDateObj.month));
                            return true;
                        }
                    }
                }
                return false;
            }
            // Вычленяем месяц массива-результата
            for (let key in scheduleDates) {
                // Создаем критерий для поиска совпадений в массиве месяцев

                // Некоторые месяцы содержат массив шаблонов для регулярных выражений
                // для перебора значений массива используется фрагмент кода ниже
                if (typeof(scheduleDates[key].matchExpression) === "object" ) {
                    for (let i = 0; i < scheduleDates[key].matchExpression.length; i++) {
                        let monthRegEx = new RegExp(scheduleDates[key].matchExpression[i], 'i');
                        if (matchRegexArray[2].search(monthRegEx) !== -1) {
                            // При положительном результате в переменную-результат присваивается объект,
                            // содержащий информацию о месяце
                            tempDateObj.day = +matchRegexArray[1];
                            tempDateObj.month = scheduleDates[key];
                            console.log("Месяц проверен. Получилась вот такая дата: " + JSON.stringify(tempDateObj.month));
                            return true;
                        }
                    }
                }

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
            if (dateObject.month.scheduleMonth < thisMonth + 1) scheduleYear++;
            console.log(scheduleYear);
            if (dateObject.day !== 0 && dateObject.day <= daysInMonth(dateObject.month.scheduleMonth, scheduleYear)) {
                console.log("Число месяца корректно. Получилась такая дата: " + dateObject.day + dateObject.month.fullName);
                if (scheduleYear > new Date().getFullYear())  {
                    orderInfo.orderDate = "" + tempDateObj.day + " " + tempDateObj.month.fullName + " " + scheduleYear + " года";
                }
                orderInfo.orderDate = "" + tempDateObj.day + " " + tempDateObj.month.fullName;
                return true;
            } else {
                outputErrorMessage(ctx, "В месяце, который вы ввели, нет числа" + tempDateObj.day + "!");
                dateObject.month = undefined;
                dateObject.day = undefined;
                return false;
            }
        };

        let stringForValidation = ctx.message.text.match(/(\d+)[\s\/.,\-]?([а-яё]+)/i);
        console.log(stringForValidation);

        // Если введенные данные совпадают с форматом день-месяц, тогда ищем полное название для месяца
        if (stringForValidation) {
            // Если месяц был распознан, тогда проверяем корректность введенного дня (числа)
            let validationResult;
            validationResult = (validateMonth(stringForValidation)) ? validateDay(tempDateObj) : false;
            return validationResult;

        }
        if (stringForValidation = ctx.message.text.match(/\d+[\s\/.,:\\\-]?\d+/i)) {
            let validationResult;
            // На данном этапе stringForValidation выглядит так: ["26.06"]
            // Функция validateMonth должна получать массив (например, ["26", "06"])
            validationResult = validateMonth(stringForValidation[0].split(/[\s\/.,:\\\-]/)) ? validateDay(tempDateObj) : false;
            return validationResult;
            // Может, сюда ничего не надо вставлять и это условие вообще надо удалить
        } else {
            // Иначе ищем было ли введено "сегодня" или "завтра"
            stringForValidation = ctx.message.text.match(/(сегодня)?(завтра)?/gi);
            console.log("Пользователь ввел: " + stringForValidation);
            if (stringForValidation[0].toLowerCase().search(scheduleDates['today'].matchExpression) !== -1) {
                // Если пользователь ввел "сегодня", то вызывается функция, высчитывающая
                // дату для сегодняшнего дня
                orderInfo.orderDate = scheduleDates['today'].scheduleDate();
                requestTime(ctx);
                checkTime(ctx);
            } else {
                // Иначе дата высчитывается для завтрашнего дня
                orderInfo.orderDate = scheduleDates['tomorrow'].scheduleDate();
            }
            console.log(tempDateObj);
        }
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
        displayOrderInterface(ctx);
    }

    bot.action('date_order', (ctx) => {
        ctx.telegram.answerCbQuery(ctx.update['callback_query'].id, "Минуточку");
        requestDate(ctx);
    });

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
