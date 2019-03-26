const validateNumericMonth = require('./chunks/validate-numeric-month');
const validateLiteralMonth = require('./chunks/validate-literal-month');

function validateMonth(date) {
    // Функция получает массив
    // Предусматривается несколько вариантов данного массива:
    // *

    let monthIndex = date.length - 1;

    if (typeof date !== 'object') {
        // Выводит ошибку с сообщением (сегодня/завтра), которое будет перехвачено в самом конце проверки даты
        reject(new Error(date));

    } else {
        // Данное условие проверяет дату в формате ["Number", "Number"]
        if (!isNaN(date[monthIndex])) {
            return validateNumericMonth(date);
        } else {
            return validateLiteralMonth(date);
        }
    }
}

module.exports = validateMonth;