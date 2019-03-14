'use strict';

const validateNumericDate = require('../order/validate/validate-date/validate-numeric-date');
let dates = null;

function getRandomInt(min, max) {
    const minVal = Math.ceil(min),
        maxVal = Math.floor(max);
    return Math.floor(Math.random() * (maxVal - minVal + 1)) + minVal;
}

function generateDatesArray(datesQuantity, hasNegativeValues) {
    // Генерируем дату в формате ["день", "месяц"]
    let result = [],
        min = 0,
        max = 20;

    if (hasNegativeValues) {
        min = -10;
    }
    for (let i = 0; i < datesQuantity; i++) {
        let date = [];
        // Генерируем день
        date.push(getRandomInt(min, max));
        // Генерируем месяц
        date.push(getRandomInt(min, max));
        result.push(date);
    }
    return result;
}

afterEach(() => {
    dates = null;
});

describe('Testing numeric date validation', () => {

    test('Throws an error if month value is greater than or equal to 0', () => {
        dates = generateDatesArray(15, true);

        dates.forEach((date) => {
            if (date[1] <= 0) {
                expect(validateNumericDate(date)).rejects.toThrowError('⛔️ Число месяца не может быть меньше нуля!');
            } else if (date[1] > 12) {
                expect(validateNumericDate(date)).rejects.toThrowError(`⛔️ Нет месяца #${date[1]}`);
            } else {
                expect(validateNumericDate(date)).resolves.toEqual(date);
            }

        });

    });

    test('Month value is number', () => {
        dates = generateDatesArray(15, true);
        dates.forEach(item => {
            item.forEach(dateVal => dateVal.toString());
            expect(item).not.toBeNaN();
        });
    });
});