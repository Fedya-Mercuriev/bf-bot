const validateLiteralMonth = require('../order/validate/validate-date/validate-literal-month');

describe('Test literal month validation function', () => {

    test('Identifies month properly', () => {
        const datesArray = [
            [23, 'mckd'], [23, 'cd'], [23, 'июля'], [23, 'сентяб'], [23, 'ьаьв']
        ];

        datesArray.forEach(async (date) => {
            const validationResult = await validateLiteralMonth(date);
            expect(validationResult).toBeTruthy();
        });
    });

    test('Throws an error if can\'t identify month', () => {
        const testArr = [
            [23, 'комар'], [23, 'мара'], [23, 'июпя'], [23, 'сонтябрь'], [23, 'ьаьв']
        ];

        testArr.forEach(item => {
            return expect(validateLiteralMonth(item)).rejects.toEqual('Ошибка');
        });
    });
});