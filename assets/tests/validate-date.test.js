const validateDay = require('../order/validate/validate-date/chunks/validate-day');
const validateMonth = require('../order/validate/validate-date/month');
const identifyDate = require('../order/validate/validate-date/chunks/identify-date');

let dates;
const dateStrings = ['22 фев', '09 окт', '1.02', '17-12', '05 мая', '01/10', '12,12', '30 июня', '05.07'];
const templates = [1, 9, 1, 11, 4, 9, 11, 5, 6];

beforeEach(() => {
    dates = dateStrings.map((item, index) => {
        return {
            string: item,
            monthNum: templates[index]
        };
    });
});

afterEach(() => {
    dates = null;
});

describe('Day validation', () => {

    test('If date has expired - throws an error', () => {
        const currentMonth = new Date().getMonth();

        dates.forEach(item => {
            identifyDate(item.string)
                .then(result => {
                    return validateMonth(result);
                })
                .then(result => {
                    if (item.monthNum < currentMonth) {
                        expect(validateDay(result)).rejects.toBe('⛔️ Дата, которую вы ввели уже прошла')
                            .catch(err => {
                                console.log(err.message);
                            });
                    } else {
                        expect(validateDay(result)).resolves.toEqual(result);
                    }
                });
        });
    });
});