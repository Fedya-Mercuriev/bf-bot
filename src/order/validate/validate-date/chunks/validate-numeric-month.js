const scheduleDates = require('./months-object');

function validateNumericMonth(date) {
    // date = ["день", "месяц"]
    // Функция проверяет месяц на соотвествие следующим требованиям:
    // * Должен быть > 0;
    // * Должен быть меньше или равен 12
    const monthIndex = date.length - 1;
    const currentMonth = new Date().getMonth();

    return new Promise((resolve, reject) => {
        const inputMonth = +date[monthIndex];
        // Возвращаем ошибку если число ММ (месяц) больше 12 или меньше/равен нулю
        if (inputMonth > 12) {
            reject(new Error(`⛔️ Нет месяца #${inputMonth}`));
        } else if (inputMonth <= 0) {
            reject(new Error('⛔️ Число месяца не может быть меньше или равно нулю!'));
        } else if (inputMonth - 1 < currentMonth) {
            reject(new Error('⛔ Увы, нельзя заказывать букет на дату, которая уже прошла!'));
        } else {
            let result = null;
            for (let key in scheduleDates) {
                // Проходит по массиву объектов с датами и в данном случае берет свойство monthNumber,
                // содержащее номер месяца
                // monthRegEx используется для поиска в строке номера месяца
                let searchedMonth = scheduleDates[key].monthNumber;

                if (inputMonth === searchedMonth) {
                    // Добавляем дату в цифровом формате, который будет использован при валидации времени
                    // Вернуть месяц в числовом типе
                    result = inputMonth - 1;
                    break;
                }
            }
            date[monthIndex] = result;
            resolve(date);
        }
    });
}

module.exports = validateNumericMonth;