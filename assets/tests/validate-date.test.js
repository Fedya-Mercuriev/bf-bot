const validateDay = require('../order/validate/validate-date/chunks/validate-day');
const validateLiteralMonth = require('../order/validate/validate-date/chunks/validate-literal-month');
const validateNumericMonth = require('../order/validate/validate-date/chunks/validate-numeric-month');
const identifyDate = require('../order/validate/validate-date/chunks/identify-date');

const dateStrings = ['22 фев', '09 окт', '1.февр', '17-декабря', '05,мая', '01/нояб', '12,дека', '30 июня', '05.июль'];

const dateArray = [{
    string: '22 янв',
    num: 0
}, {
    string: '22 марта',
    num: 2
}, {
    string: '22 июля',
    num: 6
}, {
    string: '22 декаб',
    num: 11
}, {
    string: '22 июля',
    num: 6
},{
    string: '22 феврал',
    num: 1
}, {
    string: '22 июн',
    num: 5
}, {
    string: '22 май',
    num: 4
}, {
    string: '88 май',
    num: 4
}];

function getRandomInt(min, max) {
    const minVal = Math.ceil(min),
        maxVal = Math.floor(max);
    return Math.floor(Math.random() * (maxVal - minVal + 1)) + minVal;
}

function generateDatesArray(datesQuantity, month, day = null, hasNegativeValues = false) {
    // Генерируем дату в формате ["день", "месяц"]
    let result = [];
    let { minDay, maxDay } = day;
    let { minMonth, maxMonth } = month;

    for (let i = 0; i < datesQuantity; i++) {
        let date = [];
        minDay = (hasNegativeValues) ? -10 : minDay;
        minMonth = (hasNegativeValues) ? -10 : minMonth;

        if (day !== null) {
            date.push(getRandomInt(minDay, maxDay));
            date.push(getRandomInt(minMonth, maxMonth));
        } else {
            date.push(getRandomInt(minMonth, maxMonth));
        }
        result.push(date.toString());
    }
    return result;
}

describe('Testing literal date input', () => {

    test.each(dateStrings)
    ('(Given string -> \'%s\') Identifies date if the string meets the requirements',
        (dateString) => {
            const expectedValue = dateString.match(/(\d{1,2})[\s\/.,\-]?([а-яё]+)/i);
            expectedValue.splice(0, 1);
            return identifyDate(dateString).then(result => {
                console.log(result);
                expect(new Set(result)).toEqual(new Set(expectedValue));
            });
        });

    test.each(['222 фев', 'окт', '123 марта', '172 октября', '005 мая', '0110 мая', '122 апреля', '300 июня', '# декабря'])
    ('Given string -> \'%s\';\nThrows an error if string doesn\'t meet the requirements (number{1,2}(symbol)string)',
        (dateString) => {
            return identifyDate(dateString).catch(err => {
                expect(err.message).toMatch('⛔️ Пожалуйста, введите корректную дату!');
            });
        });

    test.each(generateDatesArray(20, 1, 31, 1))
    ('Given string -> (\'%s\'); Throws an error if no string is provided after digits',
        (dateString) => {
            return identifyDate(dateString).catch(err => {
                expect(err.message).toMatch('⛔️ Пожалуйста, введите корректную дату!');
            });
        });

    test.each(['22фев', '09окт', '1мая', '72января', '5октября', '0март', '12янв', '30июня', '05августа'])
    ('Throws an error if no space or symbol between the two parts of an expected date is provided',
        (date) => {
            return identifyDate(date).catch(err => {
                expect(err.message).toMatch('⛔️ Пожалуйста, введите корректную дату!');
            });
        });

    test.each(['21 ноября да', 'хочу 1 декабря и только', '#. 1 января угу', 'хочу 21 марта хы', 'хочу 8 апреля', 'не хочу 3 сентября', 'хочу еще и  12 июля'])
    ('(Given string -> (\'%s\')) Must identify date of traditional format (RU)', (date) => {
        let expectedResult = date.split(' ');
        expectedResult.splice(0, 1);
        return identifyDate(date).then(result => {
            console.log(result);
            expect(Array.isArray(result)).toBeTruthy();
        });
    });
});

describe('Testing numeric date input', () => {

        test.each(generateDatesArray(20, 1, 999))
        ('(Given string -> (\'%s\'))Throws an error if day or month have more than 2 numbers', (date) => {
            const dateVals = date.split(',');
            if (dateVals[0].length > 2 || dateVals[1].length > 2) {
                return identifyDate(date).catch(err => {
                    expect(err.message).toMatch('⛔️ Пожалуйста, введите корректную дату!');
                });
            } else {
                return identifyDate(date).then(result => {
                    const expectedVal = date.split(',');
                    expect(result).toEqual(expectedVal);
                });
            }
        });

        test.each(generateDatesArray(20, 1, 99, 2))
        ('Given string -> (\'%s\') Throws an error if no space provided between digits',
            (date) => {
                const givenString = date.replace(',', '');

                return identifyDate(givenString).catch(err => {
                    expect(err.message).toMatch('⛔️ Пожалуйста, введите корректную дату!');
                });
        });

        test.each(['21.01', '01.12', '02/02', '10,10', '1-1', '3 9', '12.12'])
        ('Given string -> (\'%s\') Must identify numeric date',
            (item) => {
                identifyDate(item).then(result => {
                    let desiredResult = item.split(/[\s\/.,:\\\-]/);
                    return expect(result).toEqual(desiredResult);
                });
        });
    });

describe('Month validation', () => {

    describe('Testing literal date input', () => {

        test.each(['22 так', '05 лушдц', '3 брюмера', '5 комара', '17 июпя', '0 sept'])
        ('Given string -> (\'%s\') Throws an error If no month was found in string (literal)',
            (dateString) => {
                return identifyDate(dateString).then(result => {
                    return validateLiteralMonth(result);
                }).catch(err => {
                    expect(err.message).toMatch('⛔️ Пожалуйста, введите корректную дату!');
                });
        });

        test.each([{
            string: '22 март',
            num: 2
        }, {
            string: '22 марта',
            num: 2
        }, {
            string: '22 июля',
            num: 6
        }, {
            string: '22 декаб',
            num: 11
        }, {
            string: '22 июля',
            num: 6
        },{
            string: '22 сент',
            num: 8
        }, {
            string: '22 июн',
            num: 5
        }, {
            string: '22 май',
            num: 4
        }, {
            string: '1 янв',
            num: 0
        }, {
            string: '88 май',
            num: 4
        }])('Given string -> (\'%o\') Return numeric js-month',
            (dateObj) => {
            const { string, num } = dateObj;

                return identifyDate(string).then(result => {
                    const expectedVal = num;
                    return validateLiteralMonth(result).then(validateMonthResult => {
                        expect(validateMonthResult[1]).toEqual(expectedVal);
                    });
                });
        });

        test('Month in the returned array is a number', () => {
            const dateArray = ['22 янв', '22 марта', '22 июля', '22 декаб', '22 июля', '22 феврал', '22 июн', '22 май', '88 май'];

            dateArray.forEach(dateString => {
                return identifyDate(dateString).then(result => {
                    return validateLiteralMonth(result).then(validateMonthResult => {
                        expect(validateMonthResult[1]).toBeInstanceOf(Number);
                    });
                });
            });
        });

        test('Throws error If input month is less than current month', () => {
            const datesArray = ['12 февраля', '3 января', '1 фев', '2 янв', '2 янв', '15 фев'];

            datesArray.forEach(dateString => {
                return identifyDate(dateString).then(dateArr => {
                    expect(validateLiteralMonth(dateArr)).rejects.toEqual('⛔ Увы, нельзя заказывать букет на дату, которая уже прошла!')
                });
            });
        });
    });

    describe('Testing numeric month validation', () => {

        // Doesn't work!!!
        test.each(dateArray)
        ('(Given date object -> %o) Return numeric js-month',
            (dateObj) => {
            const { string, num } = dateObj;
                return identifyDate(string)
                    .then(result => {
                        return validateNumericMonth(result);
                    })
                    .then(validateMonthResult => {
                        expect(validateMonthResult[1]).toEqual(num);
                    });
        });

        test.each(['12.01', '3 02', '1.2', '2/01', '2-1', '15,02'])(
            '(Given string -> \'%s\') Throws error If input month is less than current month',
            (dateString) => {
                return identifyDate(dateString)
                    .then(dateArr => {
                        return validateNumericMonth(dateArr);
                    })
                    .catch(err => {
                        expect(err.message).toMatch('⛔ Увы, нельзя заказывать букет на дату, которая уже прошла!');
                    });
            }
        );

        test.each(generateDatesArray(20, 3, 12))(
            '(Given arguments [%s]) – month in the returned array must be a number',
            (dateStr) => {
                return identifyDate(dateStr).then(dateArray => {
                    return validateNumericMonth(dateArray)
                        .then(arrWithValidatedMonth => {
                            expect(typeof arrWithValidatedMonth[1] === 'number').toBeTruthy();
                        });
                });
            }
        );
    });
});

// test('If date has expired - throws an error', () => {
//     const currentMonth = new Date().getMonth();
//
//     dates.forEach(item => {
//         identifyDate(item.string)
//             .then(result => {
//                 return validateMonth(result);
//             })
//             .then(result => {
//                 if (item.monthNum < currentMonth) {
//                     expect(validateDay(result)).rejects.toBe('⛔️ Дата, которую вы ввели уже прошла')
//                         .catch(err => {
//                             console.log(err.message);
//                         });
//                 } else {
//                     expect(validateDay(result)).resolves.toEqual(result);
//                 }
//             });
//     });
// });