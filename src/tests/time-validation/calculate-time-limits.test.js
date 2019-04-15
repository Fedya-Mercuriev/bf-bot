/* eslint-disable indent */
const { calculateTimeLimits } = require('./../../order/validate/validate-time/chunks/check-time');

describe('Testing time-limits calculation', () => {
    test.each([{
            args: {
                limitType: 'start',
                time: new Date(2019, 1, 1, 10, 10),
            },
            toEqual: new Date(2019, 1, 1, 10, 50),
        }, {
            args: {
                limitType: 'start',
                time: new Date(2019, 1, 1, 10, 15),
            },
            toEqual: new Date(2019, 1, 1, 10, 55),
        }, {
            args: {
                limitType: 'start',
                time: new Date(2019, 1, 1, 10, 9),
            },
            toEqual: new Date(2019, 1, 1, 10, 49),
        }, {
            args: {
                limitType: 'start',
                time: new Date(2019, 1, 1, 10, 16),
            },
            toEqual: new Date(2019, 1, 1, 10, 56),
        }])
        ('(Given object -> (\'%o\'))Returns start-limit (greater than given time in estimated time)',
            (limitConfig) => {
                const estimatedTime = 2400000;
                let { args, toEqual } = limitConfig;
                args.time = Date.parse(args.time.toString());
                toEqual = Date.parse(toEqual.toString());
                expect(calculateTimeLimits(args, estimatedTime)).toEqual(toEqual);
            });
    test.only.each([{
            args: {
                limitType: 'finish',
                time: new Date(2019, 1, 1, 10, 10),
            },
            toEqual: new Date(2019, 1, 1, 10, 0),
        }, {
            args: {
                limitType: 'finish',
                time: new Date(2019, 1, 1, 10, 15),
            },
            toEqual: new Date(2019, 1, 1, 10, 5),
        }, {
            args: {
                limitType: 'finish',
                time: new Date(2019, 1, 1, 19, 0),
            },
            toEqual: new Date(2019, 1, 1, 18, 50),
        }, {
            args: {
                limitType: 'finish',
                time: new Date(2019, 1, 1, 20, 0),
            },
            toEqual: new Date(2019, 1, 1, 19, 50),
        }])
        ('(Given object -> (\'%o\'))Returns finish-limit (less than given time in estimated time)',
            (limitConfig) => {
                const estimatedTime = 600000;
                let { args, toEqual } = limitConfig;
                args.time = Date.parse(args.time.toString());
                toEqual = Date.parse(toEqual.toString());
                expect(calculateTimeLimits(args, estimatedTime)).toEqual(toEqual);
            });
});