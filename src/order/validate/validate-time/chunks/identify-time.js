/* eslint-disable indent */
function identifyTime(timeString) {
    return new Promise((resolve, reject) => {
        let result = {
            hours: 0,
            minutes: 0,
        };
        if (timeString.match(/^(\d{1,2})[\s/.,:\\-](\d{1,2})/g)) {
            let timeArray = timeString.split(/[\s/.,:\\-]/);
            // Проверим является ли числом текущая ячейка массива
            timeArray = timeArray.map((item) => {
                if (isNaN(item)) {
                    // если тип данных не числовой, то выводим ошибку
                    reject(new Error('⛔️ Пожалуйста, введите корректное время!'));
                }
                return +item;
            });
            const [hours, minutes] = timeArray;
            result.hours = hours;
            result.minutes = minutes;
            resolve(timeArray);
        } else {
            reject(new Error('⛔️ Пожалуйста, введите корректное время!'));
        }
    });
}

module.exports = identifyTime;