function identifyData(string) {

    return new Promise((resolve, reject) => {
        let result;

        if (result = string.match(/(\d+)[\s\/.,\-]?([а-яё]+)/i)) {
            // Результат: ["ДЕНЬ МЕСЯЦ", "ДЕНЬ", "МЕСЯЦ"]
            // Если месяц был распознан, тогда проверяем корректность введенного дня (числа)
            console.log(`Строка распознана: ${result}`);
            resolve(result);
        } else if (result = string.match(/(\d+)[\s\/.,:\\-]+(\d+)/i)) {
            // На данном этапе stringForValidation выглядит так: ["26.06"]
            // Функция validateMonth должна получать массив (например, ["26", "06"])
            result = result[0].split(/[\s\/.,:\\\-]/);
            console.log(`Строка распознана: ${result}`);
            resolve(result);
            // Иначе ищем было ли введено "сегодня" или "завтра"
        } else if (result = string.match(/^сегодня$|^завтра$/i)) {
            console.log(`Строка распознана: ${result}`);
            resolve(result);
        } else {
            reject(new Error('⛔️ Пожалуйста, введите корректную дату!'));
        }
    });
};

function identifyTime(string) {
    return new Promise((resolve, reject) => {
       // ...
    });
};

module.exports = identifyData;