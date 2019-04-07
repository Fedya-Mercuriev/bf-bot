const identifyDate = require('../order/validate/validate-date/identify-data');

test('Must identify date of traditional format (RU)', () => {
    const dates = [
      '21 ноября да', 'хочу 1 декабря и только', 'хочу 1 января угу', 'хочу 21 марта хы', 'хочу 8 апреля', 'не хочу 3 сентября', 'хочу еще и  12 июля'
    ];

    dates.forEach((item) => {
        let result = identifyDate(item);
        let expectedResult = item.split(' ');
        expectedResult.splice(0, 1);
        return expect(result).resolves.toEqual(expectedResult);
    });
});

test('Must identify numeric date', () => {
    const dates = [
        '21.01', '01.12', '02/02', '10,10', '1-1', '3 9', '12.12'
    ];

    dates.forEach(item => {
        identifyDate(item).then(result => {
           let desiredResult = item.split(/[\s\/.,:\\\-]/);
           return expect(result).toEqual(desiredResult);
        });
    });
});

test('When given English date - must throw an error', () => {
    const dates = [
        '21 november', '1 december', '1 march', '21 september', '8 april', '3 january', '12 july'
    ];

    dates.forEach(item => {
        return identifyDate(item).catch(err => {
            expect(err.message).toBe('⛔️ Пожалуйста, введите корректную дату!');
        });
    });
});

test('Must identify one of the desired keywords (not case-sensitive)', () => {
    const keyWords = ['сегодня', 'завтра', 'СЕГОДНЯ', 'ЗАВТРА', 'сЕгОдНя', 'ЗаВТрА'];

    keyWords.forEach(item => {
       identifyDate(item).then(result => {
           return expect(result[0]).toBe(item.toLowerCase());
       });
    });
});