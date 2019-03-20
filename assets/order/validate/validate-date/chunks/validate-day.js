function validateDay(dateArr) {
    'use strict';

    function calculateDaysInMonth(month, year) {
        return new Date(year, month + 1, 0).getDate();
    }

    return new Promise((resolve, reject) => {
        if (dateArr) {
            // Преобразуем к JS-дате, а потом возьмем из массива имен месяцев то, что нужно
            let scheduleYear = new Date().getFullYear(),
                currentMonth = new Date().getMonth(),
                today = new Date().getDate(),
                [ day, inputMonth ] = dateArr,
                result;

            if (inputMonth < currentMonth) {
                reject(new Error('⛔️ Дата, которую вы ввели уже прошла'));
            }
            // else if (month === currentMonth && day < today) {
            //     scheduleYear++;
            // }

            if (day !== 0 && day <= calculateDaysInMonth(inputMonth, scheduleYear)) {
                // dateArr.push(scheduleYear);
                result = dateArr;
                resolve(result);
            } else {
                reject(new Error(`⛔️ В месяце, который вы ввели, нет числа ${day}!`));
            }
        }
    });
}

module.exports = validateDay;