const checkCloseAvailableDates = require('../../order/validate/validate-date/chunks/get-close-available-dates');

let givenDate;

describe('Testing checking for close dates(today or tomorrow)', () => {

    describe('Testing weekdays', () => {

        beforeEach(() => {
            givenDate = new Date();
            if (givenDate.getDay === 6 || givenDate.getDay === 0) {
                givenDate.setDate(givenDate.getDate() + 2);
            }
        });

        afterEach(() => {
            givenDate = null;
        });

        test.each([
                21, 20, 22, 23
            ])
            ('(Given hour -> %i) Returns an array with 1 button if given time is greater than or equal to 8 P.M (work ends)',
                (hour) => {
                    givenDate.setHours(hour);
                    expect(checkCloseAvailableDates(givenDate).length).toEqual(1);
                }
            );

        test.each([
                0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19
            ])
            ('(Given hour -> %i) Returns an array with 2 buttons if given time is less than 8 P.M',
                (hour) => {
                    givenDate.setHours(hour);
                    expect(checkCloseAvailableDates(givenDate).length).toEqual(2);
                }
            );
    });

    describe.only('Testing weekends', () => {
        beforeEach(() => {
            givenDate = new Date();
            const currentDay = givenDate.getDay();
            const currentDate = givenDate.getDate();
            if (currentDay !== 6 || currentDay !== 0) {
                givenDate.setDate(currentDate + (6 - currentDay));
            }
        });

        afterEach(() => {
            givenDate = null;
        });

        test.each([
                19, 20, 21, 22, 23
            ])
            ('(Given hour -> %i) Returns and array with 1 button if current time is greater than or equal to 7 P.M',
                (hour) => {
                    givenDate.setHours(hour);
                    expect(checkCloseAvailableDates(givenDate).length).toEqual(1);
                }
            );

        test.each([
                0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18
            ])
            ('(Given hour -> %i) Returns an array with 2 buttons if given time is less than 7 P.M',
                (hour) => {
                    givenDate.setHours(hour);
                    expect(checkCloseAvailableDates(givenDate).length).toEqual(2);
                }
            );
    })
});