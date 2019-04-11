/* eslint-disable indent */
/* eslint-disable no-undef */
const identifyTime = require('../../order/validate/validate-time/chunks/identify-time');

describe('Testing time identification', () => {
    let counter = 0;
    beforeEach(() => {
        counter = 0;
    });
    test.each(['21 05', '21:00', '2,05', '3/5', '55 55'])
        ('(Given string -> (\'%s\')) Returns an object with hour & minute values', (timeString) => {
            let timeArr = timeString.split(/[\s/.,:\\-]/);
            let result = {};
            const [hours, minutes] = timeArr;
            result.hours = +hours;
            result.minutes = +minutes;
            return identifyTime(timeString)
                .then((identificationResult) => {
                    expect(identificationResult).toEqual(result);
                });
        });
    test.each(['aa 66', '12-a6', 'a,06', '7a/XX', 's6.00'])
        ('(Given string -> (\'%s\')) Thows an error if string has letters', (timeString) => {
            return identifyTime(timeString)
                .catch((error) => {
                    expect(error.message).toMatch('⛔️ Пожалуйста, введите корректное время!');
                });
        });
    test.each(['222 12', '22.02', '000-03445', '12/987', '12345 0998'])
        ('(Given string -> (\'%s\')) Throws an error if hour length or minute length > 2', (timeString) => {
            return identifyTime(timeString).catch((error) => {
                expect(error.message).toMatch('⛔️ Пожалуйста, введите корректное время!');
            })
        })
    test.each(['😆😉 as', '检查 😊', '试试 吧', '😂😍-😝🤨', 'ьо уук', '😟😣😎👦', '🏻🧠 🏻🧠', 'й у'])
        ('(Given string -> (\'%s\')) Throws an error if string doesn\'t contain numbers', (timeString) => {
            return identifyTime(timeString).catch((error) => {
                expect(error.message).toMatch('⛔️ Пожалуйста, введите корректное время!');
            });
        });
    test.each(['-24.00', '-4.00', '-1.00', '-10.00'])
        ('(Given string -> (\'%s\')) throws an error if given hour is less than 0',
            (timeString) => {
                return identifyTime(timeString)
                    .catch((e) => {
                        expect(e.message).toMatch('⛔️ Пожалуйста, введите корректное время!');
                    });
            });
});