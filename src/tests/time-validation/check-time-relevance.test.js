/* eslint-disable indent */
/* eslint-disable no-unexpected-multiline */
/* eslint-disable no-undef */
const identifyTime = require('./../../order/validate/validate-time/chunks/identify-time');
const checkTimeRelevance = require('./../../order/validate/validate-time/chunks/check-time-relevance');

describe('Testing time-relevance check', () => {
    test.each([
            { hours: 24, minutes: 0 },
            { hours: 35, minutes: 0 },
            { hours: 60, minutes: 0 },
            { hours: 32, minutes: 0 },
        ])
        ('(Given string -> (\'%o\')) Throws an error if hour in given string is greater than 23',
            (timeObj) => {
                return checkTimeRelevance(timeObj)
                    .catch((e) => {
                        const { message } = e;
                        expect(message).toMatch('введите корректное время!');
                    });
            });

    test.each([{ hours: 24, minutes: 0 },
            { hours: 12, minutes: 60 },
            { hours: 11, minutes: 70 },
            { hours: 18, minutes: 99 },
        ])
        ('(Given string -> (\'%o\')) Throws an error if minute in given string is greater than 59',
            (timeObj) => {
                return checkTimeRelevance(timeObj)
                    .catch((e) => {
                        const { message } = e;
                        expect(message).toMatch('введите корректное время!');
                    });
            });
});