const validateNumericMonth = require('./chunks/validate-numeric-month');
const validateLiteralMonth = require('./chunks/validate-literal-month');

function validateMonth(date) {

    const scheduleDates = {
        'october': {
            matchExpression: "окт",
            fullName: "октября",
            monthNumber: 10
        },
        'november': {
            matchExpression: "нояб",
            fullName: "ноября",
            monthNumber: 11
        },
        'december': {
            matchExpression: "дек",
            fullName: "декабря",
            monthNumber: 12
        },
        'january': {
            matchExpression: "янв",
            fullName: "января",
            monthNumber: 1
        },
        'february': {
            matchExpression: "фев",
            fullName: "февраля",
            monthNumber: 2
        },
        'march': {
            matchExpression: "март",
            fullName: "марта",
            monthNumber: 3
        },
        'april': {
            matchExpression: "апр",
            fullName: "апреля",
            monthNumber: 4
        },
        'may': {
            matchExpression: ['май', 'мая'],
            fullName: "мая",
            monthNumber: 5
        },
        'june': {
            matchExpression: "июн",
            fullName: "июня",
            monthNumber: 6
        },
        'july': {
            matchExpression: "июл",
            fullName: "июля",
            monthNumber: 7
        },
        'august': {
            matchExpression: "авгус",
            fullName: "августа",
            monthNumber: 8
        },
        'september': {
            matchExpression: "сент",
            fullName: "сентября",
            monthNumber: 9
        }
    };
    // Функция получает массив
    // Предусматривается несколько вариантов данного массива:
    // *

    return new Promise((resolve, reject) => {
        let monthIndex = date.length - 1;

        if (typeof date !== 'object') {
            // Выводит ошибку с сообщением (сегодня/завтра), которое будет перехвачено в самом конце проверки даты
            reject(new Error(date));

        } else {
            // Данное условие проверяет дату в формате ["Number", "Number"]
            if (!isNaN(date[monthIndex])) {
                validateLiteralMonth(date);
            } else {
                validateNumericMonth(date);
            }
        }
    });
}

module.exports = validateMonth;