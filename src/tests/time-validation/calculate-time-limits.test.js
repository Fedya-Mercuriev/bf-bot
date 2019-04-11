/* eslint-disable indent */
const { calculateTimeLimits } = require('./../../order/validate/validate-time/chunks/check-time');

describe('Testing time-limits calculation', () => {
    const estimatedTime = 2400000;
    test.each([{
            limitType: 'start',
            time: new Date(2019, 1, 10, 10),
        }, {
            limitType: 'start',
            time: new Date(2019, 1, 10, 15),
        }, {
            limitType: 'start',
            time: new Date(2019, 1, 10, 9),
        }, {
            limitType: 'start',
            time: new Date(2019, 1, 10, 16),
        }])
        ('(Given object -> (\'%o\'))Returns start-limit (greater than given time in estimated time)',
            (limitConfig) => {
                limitConfig.time = Date.parse(limitConfig.time.toString());
                expect(calculateTimeLimits(limitConfig, estimatedTime) - limitConfig.time).toEqual(estimatedTime);
            });
    test.only.each([{
            limitType: 'finish',
            time: new Date(2019, 1, 10, 10),
        }, {
            limitType: 'finish',
            time: new Date(2019, 1, 10, 15),
        }, {
            limitType: 'finish',
            time: new Date(2019, 1, 10, 9),
        }, {
            limitType: 'finish',
            time: new Date(2019, 1, 10, 16),
        }])
        ('(Given object -> (\'%o\'))Returns finish-limit (less than given time in estimated time)',
            (limitConfig) => {
                limitConfig.time = Date.parse(limitConfig.time.toString());
                expect(calculateTimeLimits(limitConfig, estimatedTime) + estimatedTime).toEqual(limitConfig.time);
            });
});