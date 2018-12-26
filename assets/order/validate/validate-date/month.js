module.exports =  class ValidateMonth {
    constructor() {
        this.scheduleDates = {
            'october': {
                matchExpression: "окт",
                fullName: "октября",
                monthNumber: 10
            },
            'november': {
                matchExpression: "нояб",
                fullName: "ноября",
                monthNumber: 11
            },
            'december': {
                matchExpression: "дек",
                fullName: "декабря",
                monthNumber: 12
            },
            'january': {
                matchExpression: "янв",
                fullName: "января",
                monthNumber: 1
            },
            'february': {
                matchExpression: "фев",
                fullName: "февраля",
                monthNumber: 2
            },
            'march': {
                matchExpression: "март",
                fullName: "марта",
                monthNumber: 3
            },
            'april': {
                matchExpression: "апр",
                fullName: "апреля",
                monthNumber: 4
            },
            'may': {
                matchExpression: ['май', 'мая'],
                fullName: "мая",
                monthNumber: 5
            },
            'june': {
                matchExpression: "июн",
                fullName: "июня",
                monthNumber: 6
            },
            'july': {
                matchExpression: "июл",
                fullName: "июля",
                monthNumber: 7
            },
            'august': {
                matchExpression: "авгус",
                fullName: "августа",
                monthNumber: 8
            },
            'september': {
                matchExpression: "сент",
                fullName: "сентября",
                monthNumber: 9
            }
        };
    }

    validate(dateArray) {

        return new Promise((resolve, reject) => {
            let monthIndex = dateArray.length - 1,
                dayIndex = dateArray.length - 2;

            if (dateArray.length === 1) {
                reject(new Error(dateArray[0].toLowerCase()));
            // Проверяем дату формата "01.01"
            }
            else if (dateArray.length === 2) {
                for (let key in this.scheduleDates) {
                    let monthRegEx = new RegExp(this.scheduleDates[key].monthNumber.toString(), 'i'),
                        foundMonthInString = dateArray[monthIndex].match(monthRegEx);

                    // if (dateArray[monthIndex].indexOf(this.scheduleDates[key].monthNumber.toString()) !== -1) {
                    //
                    // }

                    // Возвращаем ошибку если число ММ (месяц) больше 12
                    if (+dateArray[monthIndex] > 12) {
                        reject(new Error(`⛔️ Нет месяца #${dateArray[monthIndex]}`));
                    }

                    if (foundMonthInString !== null) {
                        let result = [];
                        // ex: key = 'october'
                        // if (this.scheduleDates[key].monthNumber.toString().search(dateArray[monthIndex]) !== -1) {
                            // Добавляем дату в цифровом формате, который будет использован при валидации времени
                            // Вернуть месяц в числовом типе
                            // result.push(dateArray[dayIndex]);
                            dateArray[monthIndex] = dateArray[monthIndex] - 1;
                            // result.push(this.scheduleDates[key].monthNumber - 1);
                            resolve(dateArray);
                            break;
                        // }
                    }
                }
                // Проверяем дату формата "1 января"
            }
            else if (dateArray.length === 3) {
                for (let key in this.scheduleDates) {
                    let monthRegEx = new RegExp(this.scheduleDates[key].matchExpression, 'i');

                // Некоторые месяцы содержат массив шаблонов для регулярных выражений
                // для перебора значений массива используется фрагмент кода ниже
                if (typeof(this.scheduleDates[key].matchExpression) === 'object' ) {
                    for (let i = 0; i < this.scheduleDates[key].matchExpression.length; i++) {
                        let RegEx = new RegExp(this.scheduleDates[key].matchExpression[i], 'i');
                        if (dateArray[monthIndex].search(RegEx) !== -1) {
                            // При положительном результате массив с датой возвразается через resolve
                            console.log(`Месяц проверен. Получилось: ${this.scheduleDates[key].matchExpression[i]}`);
                            dateArray[monthIndex] = this.scheduleDates[key].monthNumber - 1;
                            dateArray.splice(0, 1);
                            resolve(dateArray);
                            return;
                        }
                    }
                }

                    // В ячейке номер 2 лежит строка, содержащая название месяца
                    // ["25 декабря", "25", "декабря", index: 0, input: "25 декабря", groups: undefined]
                    if (dateArray[monthIndex].search(monthRegEx) !== -1) {
                        dateArray[monthIndex] = this.scheduleDates[key].monthNumber - 1;
                        console.log(`При проверке месяца вышло это: ${dateArray}`);
                        dateArray.splice(0, 1);
                        resolve(dateArray);
                        return;
                    }
                }
                reject(new Error("⛔️ Пожалуйста, введите корректную дату!"));
            }
            else {
                reject(new Error("⛔️ Пожалуйста, введите корректную дату!"));
            }
        });
    }
};