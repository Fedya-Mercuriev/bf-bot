const scheduleDates = require('./months-object');

function validateLiteralMonth(date) {
    // date = ["день", "месяц"]
    // Функция проверяет месяц на соотвествие следующим требованиям:
    // * Должен быть > 0;
    // * Должен быть меньше или равен 12
    const monthIndex = date.length - 1;
    const currentMonth = new Date().getMonth();

    return new Promise((resolve, reject) => {
        for (let key in scheduleDates) {
            let monthRegEx = new RegExp(scheduleDates[key].matchExpression, 'i');

            // Некоторые месяцы содержат массив шаблонов для регулярных выражений
            // для перебора значений массива используется фрагмент кода ниже
            if (typeof(scheduleDates[key].matchExpression) === 'object') {
                const currentlyIteratedMonth = scheduleDates[key];

                scheduleDates[key].matchExpression.forEach(item => {
                    // item = String
                    let targetDate = new RegExp(item, 'i');
                    if (date[monthIndex].search(targetDate) !== -1) {
                        if (currentlyIteratedMonth.monthNumber - 1 < currentMonth) {
                            reject(new Error('⛔ Увы, нельзя заказывать букет на дату, которая уже прошла!'));
                        }
                        date[monthIndex] = currentlyIteratedMonth.monthNumber - 1;
                        resolve(date);
                    }
                });
            }
            // В ячейке номер 2 лежит строка, содержащая название месяца
            // ["25 декабря", "25", "декабря", index: 0, input: "25 декабря", groups: undefined]
            if (date[monthIndex].search(monthRegEx) !== -1) {
                if (scheduleDates[key].monthNumber - 1 < currentMonth) {
                    reject(new Error('⛔ Увы, нельзя заказывать букет на дату, которая уже прошла!'));
                }
                date[monthIndex] = scheduleDates[key].monthNumber - 1;
                resolve(date);
            }
        }
        reject(new Error('⛔️ Пожалуйста, введите корректную дату!'));
    });
}

module.exports = validateLiteralMonth;