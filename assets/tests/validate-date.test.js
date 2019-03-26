'use strict';
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
}, {
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

function generateDatesArray(dateSettings) {
    // Генерируем дату в формате ["день", "месяц"]
    let result = [];
    let { minDay, maxDay, minMonth, maxMonth, datesQuantity } = dateSettings;

    for (let i = 0; i < datesQuantity; i++) {
        let date = [];

        if (minDay !== null && maxDay !== null) {
            date.push(getRandomInt(minDay, maxDay));
            date.push(getRandomInt(minMonth, maxMonth));
        } else {
            date.push(getRandomInt(minMonth, maxMonth));
        }
        result.push(date.toString());
    }
    return result;
}

function calculateDaysInMonth(month, year) {
    return new Date(year, month + 1, 0).getDate();
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

    test.each([
            '18. njkcd',
            '01 sept',
            '17. xxx',
            '31. march',
            '29-abc',
            '22/ december',
            '8,  jul',
            '14. fgh'
        ])
        ('(Given string -> (\'%s\')) Throws an error If is provided with str containing latin letters',
            dateStr => {
                return identifyDate(dateStr).catch(e => {
                    expect(e.message).toMatch('⛔️ Пожалуйста, введите корректную дату!');
                });
            })

    test.only.each([
            '18. 日期',
            '01 👿👩‍🎨📍',
            '17. 呵呵',
            '31. 错误',
            '29-😃😀😎',
            '29/ 😃😀😎',
            '22/ 日期',
            '22， 日期',
            '8,  👿👩‍🎨📍',
            '14. 检查'
        ])
        ('(Given string -> (\'%s\')) Throws an error If is provided with other non-cyrillic characters',
            dateStr => {
                return identifyDate(dateStr).catch(e => {
                    expect(e.message).toMatch('⛔️ Пожалуйста, введите корректную дату!');
                });
            })
});

describe('Testing numeric date input', () => {

    test.each(['05, 4', '29.6', '1/2', '15-11'])
        ('(Given string -> (\'%s\')) Throws an error if day or month have more than 2 numbers',
            (date) => {
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
        }, {
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

        test.each([{
                string: '22.04',
                num: 3
            }, {
                string: '06.11',
                num: 10
            }, {
                string: '06.04',
                num: 3
            }])
            ('(Given date object -> %o) Returns numeric js-month',
                (dateObj) => {
                    const dateArr = dateObj.string.split('.');

                    return validateNumericMonth(dateArr)
                        .then(validateMonthResult => {
                            expect(validateMonthResult[1]).toEqual(dateObj.num);
                        });

                }
            );

        test.each([
            '12, 01',
            '3, 02',
            '1, 2',
            '2, 01',
            '2, 1',
            '15, 02'
        ])(
            '(Given array -> \'[%s]\') Throws error If input month is less than current month',
            (dateArr) => {
                return validateNumericMonth(dateArr)
                    .catch(err => {
                        expect(err.message).toMatch('⛔ Увы, нельзя заказывать букет на дату, которая уже прошла!');
                    });
            }
        );

        test.each([
                '21,04',
                '01, 12',
                '02, 03',
                '10, 10',
                '1, 8',
                '3, 9',
                '12, 12'
            ])
            ('(Given arguments -> [%s]) – month in the returned array must be a number',
                (dateString) => {
                    const dateArray = dateString.split(',');
                    return validateNumericMonth(dateArray)
                        .then(arrWithValidatedMonth => {
                            expect(typeof arrWithValidatedMonth[1] === 'number').toBeTruthy();
                        });
                }
            );

        test.each([
                '21, 04',
                '01,0',
                '02,0',
                '10,0',
                '1,0',
                '3,0',
                '12,0'
            ])
            ('(Given string -> \'%s\') Throws an error if month value is 0',
                async(dateStr) => {
                    const dateArr = await identifyDate(dateStr);
                    if (+dateArr[1] !== 0) {
                        return validateNumericMonth(dateArr)
                            .then(result => {
                                expect(result).toEqual(dateArr);
                            })
                    } else {
                        return validateNumericMonth(dateArr)
                            .catch(e => {
                                expect(e.message).toMatch('⛔️ Число месяца не может быть меньше или равно нулю!');
                            })
                    }
                })
    });
});

describe('Testing day validation', () => {

    test.each([
            '21, 2',
            '1, 2',
            '15, 2',
            '24, 2',
            '5, 2',
            '8, 2',
            '14, 2',
        ])
        ('(Given date -> %s) Throws an error if input month = current, but day is < current day',
            (dateStr) => {
                let dateArray = dateStr.split(',');
                dateArray[1] = +dateArray[1];

                validateDay(dateArray).catch(e => {
                    expect(e.message).toMatch('⛔️ Дата, которую вы ввели уже прошла');
                })

            });

    test.each([
            '21, 3',
            '1, 10',
            '15, 4',
            '24, 7',
            '5, 11',
            '8, 8',
            '14, 5',
        ])
        ('(Given string -> \'%s\') Day value in the resolved arr is a number',
            (dateStr) => {
                let dateArray = dateStr.split(',');
                dateArray[1] = +dateArray[1];

                validateDay(dateArray).then(result => {
                    expect(typeof result[0] === 'number').toBeTruthy();
                })
            })

    test.each(generateDatesArray({ datesQuantity: 20, minDay: 30, maxDay: 32, minMonth: 3, maxMonth: 11 }))
        ('(Given string -> \'%s\') Throws an error if day value exceeds max value in given month; otherwise resolves date array',
            (dateString) => {
                return identifyDate(dateString)
                    .then(dateArr => {
                        return validateNumericMonth(dateArr);
                    })
                    .then(arrWithValidatedMonth => {
                        if (arrWithValidatedMonth[0] > calculateDaysInMonth(arrWithValidatedMonth[1], new Date().getFullYear())) {
                            expect(validateDay(arrWithValidatedMonth)).rejects.toMatch('⛔️ В месяце, который вы ввели, нет числа');
                        } else {
                            expect(validateDay(arrWithValidatedMonth)).resolves.toEqual(arrWithValidatedMonth);
                        }
                    })
            });
});