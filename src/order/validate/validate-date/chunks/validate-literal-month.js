function validateLiteralMonth(date) {
    // date = ["день", "месяц"]
    // Функция проверяет месяц на соотвествие следующим требованиям:
    // * Должен быть > 0;
    // * Должен быть меньше или равен 12
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