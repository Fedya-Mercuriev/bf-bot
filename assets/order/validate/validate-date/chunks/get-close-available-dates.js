const Telegraf = require('telegraf');
const { Markup, Extra } = Telegraf;
const Contacts = require('../../../../main-page/contacts');

function checkCloseAvailableDates(now) {
    // now - объект даты, созданный в момент вызова сцены выбора даты
    let workingHours,
        availableCloseDates = [
            Markup.callbackButton('Сегодня', 'Сегодня'),
            Markup.callbackButton('Завтра', 'Завтра')
        ];
    // Подберем соответствующие дню недели часы работы
    if (now.getDay() === 6 || now.getDay() === 0) {
        const { weekends } = Contacts.workingHours;
        workingHours = weekends;
    } else {
        const { weekdays } = Contacts.workingHours;
        workingHours = weekdays;
    }
    // Если в сегодняшний день киент делает заказ и время позднее (магаизн уже закрыт)
    if (now.getHours() >= workingHours.finish) {
        availableCloseDates.splice(0, 1);
        return availableCloseDates;
    } else {
        return availableCloseDates;
    }
}

module.exports = checkCloseAvailableDates;