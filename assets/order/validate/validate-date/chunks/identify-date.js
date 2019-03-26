function identifyDate(string) {

    return new Promise((resolve, reject) => {
        let result;

        if (string.match(/^(\d{1,2})[\s\/.,\-]{1,}([а-яё]+)$/i)) {
            result = string.match(/(\d{1,2})[\s\/.,\-]{1,}([а-яё]+)/i);
            result = result.splice(1, 2);
            // Результат: ["день", "месяц"]
            resolve(result);

        } else if (string.match(/^(\d{1,2})[\s\/.,:\\-]{1,}(\d{1,2})$/i)) {
            result = string.match(/(\d{1,2})[\s\/.,:\\-]{1,}(\d{1,2})/i);
            // На данном этапе result выглядит так: ["26.06"]
            result = result.splice(1, 2);
            // Результат: (Array) ["день", "месяц"]
            resolve(result);

            // Иначе ищем было ли введено "сегодня" или "завтра"
        } else if (string.match(/^сегодня$|^завтра$/i)) {
            result = string.match(/^сегодня$|^завтра$/i);
            result = result.toString().toLowerCase();
            // Результат: (String) сегодня/завтра
            resolve(result);

        } else {
            reject(new Error('⛔️ Пожалуйста, введите корректную дату!'));
        }
    });
}

module.exports = identifyDate;