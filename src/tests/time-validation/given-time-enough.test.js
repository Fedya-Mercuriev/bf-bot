/* eslint-disable indent */
const { checkIfGivenTimeIsEnough, calculateTimeLimits } = require('./../../order/validate/validate-time/chunks/check-time');

describe('Checking the function that calculates if given time is enough to make a bouquet', () => {
    // estimatedTime = 40 мин
    const estimatedTime = 2400000;
    //  Рассчитаем временные ограничения
    let timeLimits = {
        start: calculateTimeLimits({
            time: Date.parse(new Date(2019, 3, 11, 10).toString()),
            limitType: 'start',
        }, estimatedTime),
        finish: calculateTimeLimits({
            time: Date.parse(new Date(2019, 3, 11, 20).toString()),
            limitType: 'finish',
        }, estimatedTime),
    };
    test.each([{
            targetTime: new Date(2019, 3, 11, 10, 40),
            timeLimits,
        }, {
            targetTime: new Date(2019, 3, 11, 11, 40),
            timeLimits,
        }, {
            targetTime: new Date(2019, 3, 11, 12, 40),
            timeLimits,
        }, {
            targetTime: new Date(2019, 3, 11, 13, 40),
            timeLimits,
        }, {
            targetTime: new Date(2019, 3, 11, 14, 40),
            timeLimits,
        }, {
            targetTime: new Date(2019, 3, 11, 15, 40),
            timeLimits,
        }, {
            targetTime: new Date(2019, 3, 11, 17, 40),
            timeLimits,
        }, {
            targetTime: new Date(2019, 3, 11, 18, 40),
            timeLimits,
        }, {
            targetTime: new Date(2019, 3, 11, 19, 20),
            timeLimits,
        }])
        ('(Given ibject -> (%o)) Resolves true if time does not exceed provided limits', (args) => {
            let { targetTime, timeLimits } = args;
            targetTime = Date.parse(args.targetTime.toString());
            return checkIfGivenTimeIsEnough(targetTime, timeLimits)
                .then((result) => {
                    expect(result).toEqual(targetTime);
                });
        });

    test.each([{
            targetTime: new Date(2019, 3, 11, 20, 0),
            timeLimits,
        }, {
            targetTime: new Date(2019, 3, 11, 9, 40),
            timeLimits,
        }, {
            targetTime: new Date(2019, 3, 11, 8, 40),
            timeLimits,
        }, {
            targetTime: new Date(2019, 3, 11, 7, 1),
            timeLimits,
        }, {
            targetTime: new Date(2019, 3, 11, 6, 40),
            timeLimits,
        }, {
            targetTime: new Date(2019, 3, 11, 5, 30),
            timeLimits,
        }, {
            targetTime: new Date(2019, 3, 11, 4, 40),
            timeLimits,
        }, {
            targetTime: new Date(2019, 3, 11, 3, 0),
            timeLimits,
        }, {
            targetTime: new Date(2019, 3, 11, 2, 20),
            timeLimits,
        }])
        ('Throws an error if provided time exceeds given limits (testing start limit only)', (args) => {
            let { targetTime, timeLimits } = args;
            targetTime = Date.parse(args.targetTime.toString());
            return checkIfGivenTimeIsEnough(targetTime, timeLimits)
                .catch((e) => {
                    expect(e.message).toMatch('⛔ К сожалению, мы не успеем сделать букет к указанному вами времени! Пожалуйста, выберите другое время.');
                });
        });

    test.each([{
            targetTime: new Date(2019, 3, 11, 10, 0),
            timeLimits,
        }, {
            targetTime: new Date(2019, 3, 11, 9, 40),
            timeLimits,
        }, {
            targetTime: new Date(2019, 3, 11, 8, 40),
            timeLimits,
        }, {
            targetTime: new Date(2019, 3, 11, 7, 1),
            timeLimits,
        }, {
            targetTime: new Date(2019, 3, 11, 6, 40),
            timeLimits,
        }, {
            targetTime: new Date(2019, 3, 11, 5, 30),
            timeLimits,
        }, {
            targetTime: new Date(2019, 3, 11, 4, 40),
            timeLimits,
        }, {
            targetTime: new Date(2019, 3, 11, 3, 0),
            timeLimits,
        }, {
            targetTime: new Date(2019, 3, 11, 2, 20),
            timeLimits,
        }])
        ('Throws an error if provided time exceeds given limits (testing start limit only)', (args) => {
            let { targetTime, timeLimits } = args;
            targetTime = Date.parse(args.targetTime.toString());
            return checkIfGivenTimeIsEnough(targetTime, timeLimits)
                .catch((e) => {
                    expect(e.message).toMatch('⛔ К сожалению, мы не успеем сделать букет к указанному вами времени! Пожалуйста, выберите другое время.');
                });
        });

    test.each([{
            targetTime: new Date(2019, 3, 11, 20, 0),
            timeLimits,
        }, {
            targetTime: new Date(2019, 3, 11, 19, 50),
            timeLimits,
        }, {
            targetTime: new Date(2019, 3, 11, 20, 40),
            timeLimits,
        }, {
            targetTime: new Date(2019, 3, 11, 21, 0),
            timeLimits,
        }, {
            targetTime: new Date(2019, 3, 11, 22, 40),
            timeLimits,
        }, {
            targetTime: new Date(2019, 3, 11, 23, 30),
            timeLimits,
        }, {
            targetTime: new Date(2019, 3, 11, 22, 40),
            timeLimits,
        }, {
            targetTime: new Date(2019, 3, 11, 21, 10),
            timeLimits,
        }, {
            targetTime: new Date(2019, 3, 11, 23, 20),
            timeLimits,
        }])
        ('Throws an error if provided time exceeds given limits (testing finish limit only)', (args) => {
            let { targetTime, timeLimits } = args;
            targetTime = Date.parse(args.targetTime.toString());
            return checkIfGivenTimeIsEnough(targetTime, timeLimits)
                .catch((e) => {
                    expect(e.message).toMatch('⛔ В указанное вами время мы уже не работаем! Пожалуйста, выберите другое время.');
                });
        });
});