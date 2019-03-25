function validateNumericMonth(date) {
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
        const inputMonth = +date[monthIndex];
        // Возвращаем ошибку если число ММ (месяц) больше 12 или меньше/равен нулю
        if (inputMonth > 12) {
            reject(new Error(`⛔️ Нет месяца #${inputMonth}`));
        } else if (inputMonth <= 0) {
            reject(new Error(`⛔️ Число месяца не может быть меньше или равно нулю!`));
        } else if (inputMonth - 1 < currentMonth) {
            reject(new Error('⛔ Увы, нельзя заказывать букет на дату, которая уже прошла!'));
        } else {
            for (let key in scheduleDates) {
                // Проходит по массиву объектов с датами и в данном случае берет свойство monthNumber,
                // содержащее номер месяца
                // monthRegEx используется для поиска в строке номера месяца
                let searchedMonth = scheduleDates[key].monthNumber;

                if (inputMonth === searchedMonth) {
                    // Добавляем дату в цифровом формате, который будет использован при валидации времени
                    // Вернуть месяц в числовом типе
                    date[monthIndex] = inputMonth - 1;
                    resolve(date);
                }
            }
        }
    });
}

module.exports = validateNumericMonth;

