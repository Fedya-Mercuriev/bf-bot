/* eslint-disable indent */
/* eslint-disable no-unexpected-multiline */
/* eslint-disable no-undef */
const identifyTime = require('./../../order/validate/validate-time/chunks/identify-time');
const checkTimeRelevance = require('./../../order/validate/validate-time/chunks/check-time-relevance');

describe('Testing time-relevance check', () => {
    test.each(['24, 00', '25, 00', '246, 00', '2412, 00'])
        ('(Given string -> (\'%s\')) Throws an error if hour in given strign is greater tahn 23',
            (timeString) => {
                return identifyTime(timeString)
                    .then((identifiedTime) => {
                        return checkTimeRelevance(identifiedTime);
                    })
                    .catch((e) => {
                        expect(e.message).toMatch('⛔️ Пожалуйста, введите корректное время!');
                    });
            });
});