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
                // date = ["день", "месяц"]
                // Функция проверяет месяц на соотвествие следующим требованиям:
                // * Должен быть > 0;
                // * Должен быть меньше или равен 12

                const monthIndex = date.length - 1;

                return new Promise((resolve, reject) => {
                    const inputMonth = +date[monthIndex];
                    // Возвращаем ошибку если число ММ (месяц) больше 12 или меньше/равен нулю
                    if (inputMonth > 12) {
                        reject(new Error(`⛔️ Нет месяца #${inputMonth}`));
                    } else if (inputMonth <= 0) {
                        reject(new Error(`⛔️ Число месяца не может быть меньше нуля!`));
                    } else {
                        for (let key in scheduleDates) {
                            // Проходит по массиву объектов с датами и в данном случае берет свойство monthNumber,
                            // содержащее номер месяца
                            // monthRegEx используется для поиска в строке номера месяца
                            let searchedMonth = +scheduleDates[key].monthNumber;

                            if (inputMonth === searchedMonth) {
                                // Добавляем дату в цифровом формате, который будет использован при валидации времени
                                // Вернуть месяц в числовом типе
                                date[monthIndex] = monthIndex - 1;
                                resolve(date);
                            }
                        }
                    }
                });
            } else {
                for (let key in scheduleDates) {
                    let monthRegEx = new RegExp(scheduleDates[key].matchExpression, 'i');

                    // Некоторые месяцы содержат массив шаблонов для регулярных выражений
                    // для перебора значений массива используется фрагмент кода ниже
                    if (typeof(scheduleDates[key].matchExpression) === 'object' ) {

                        scheduleDates[key].matchExpression.forEach(item => {
                            let targetDate = new RegExp(item, 'i');
                            if (date[monthIndex].search(targetDate) !== -1) {
                                date[monthIndex] = item.monthNumber - 1;
                                resolve(date);
                            }
                        });
                    }
                    // В ячейке номер 2 лежит строка, содержащая название месяца
                    if (date[monthIndex].search(monthRegEx) !== -1) {
                        date[monthIndex] = scheduleDates[key].monthNumber - 1;
                        resolve(date);
                    }
                }
                reject(new Error('⛔️ Пожалуйста, введите корректную дату!'));
            }
        }
    });
}

module.exports = validateMonth;