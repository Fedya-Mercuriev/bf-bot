/* eslint-disable no-lonely-if */
/* eslint-disable indent */
function calculateTimeLimits(limitConfig, estTime) {
    // @workTime - обозначает время начала или конца работы (зависит от того что  будет передано)
    // estTime = ms; time = ms;
    const { time, limitType } = limitConfig;
    if (limitType === 'start') {
        return time + estTime;
    }
    return time - estTime;
}

function isToday(date) {
    // @date - дата заказа в миллисекундах
    const usedDate = new Date(date);
    const today = new Date();
    if (usedDate.getFullYear() === today.getFullYear() &&
        usedDate.getMonth() === today.getMonth() &&
        usedDate.getDate() === today.getDate()) {
        return true;
    }
    return false;
}

function checkIfGivenTimeIsEnough(targetTime, timeLimits) {
    // @targetTime - введенное время;
    // @timeLimits - временные рамки, которые были
    // определены calculateTimeLimits (начало или конец работы);
    // @start = ms; @finish = ms;
    const { start, finish } = timeLimits;
    const startWork = new Date(start);
    const finishWork = new Date(finish);
    // Медиана используется для обозначения половины, относительно которой
    // введенное время будет сравниваться с стартом или финишем
    const median = Math.floor((finishWork.getHours() - startWork.getHours()) / 2);

    return new Promise((resolve, reject) => {
        if (new Date(targetTime).getHours() < new Date(start).getHours() + median && new Date(targetTime).getHours() > 0) {
            // Сравниваем с стартом
            if (start - targetTime <= 0) {
                resolve(targetTime);
            } else {
                reject(new Error('⛔ К сожалению, мы не успеем сделать букет к указанному вами времени! Пожалуйста, выберите другое время.'));
            }
        } else {
            // Сравниваем с финишем
            if (finish - targetTime >= 0) {
                resolve(targetTime);
            } else {
                reject(new Error('⛔ В указанное вами время мы уже не работаем! Пожалуйста, выберите другое время.'));
            }
        }
    });
}

function checkTime(timeObj, timeLimits, requiredOrderInfo) {
    // @timeObg - объект с свойствами hours(Number), minutes(Number)
    // (был получен при распознавании строки) (Object)
    // @timeLimits - объект с свойствами start(Number), finish(Number)
    // @requiredOrderInfo - объект с свойствами orderDate(Number), shipping([Boolean, String])
    const { hours, minutes } = timeObj;
    let { start, finish } = timeLimits;
    let { shipping } = requiredOrderInfo;
    const { orderDate } = requiredOrderInfo;
    // Estimatedtime хранит время необходимое на приготовление букета (по умолчанию 40 мин)
    let estimatedTime = 2400000;
    // const makeErrorMsg = time => `⛔ К сожалению, мы не успеем сделать букет к указанному вами времени. С учетом выбранного вами способа доставки нам потребуется ${time} минут.\nПожалуйста, укажите другое время, другой способ доставки или другую дату`;

    return new Promise((resolve, reject) => {
        // Создаем переменную, с которой будем сравнивать начало и конец работы вместе с прибавленным или вычитанным значением необходимого
        // для создания и доставки букета времени
        // Формат: ms
        const usedTime = orderDate + (hours * 3600000) + (minutes * 60000);
        const startWork = new Date(orderDate);
        const finishWork = new Date(orderDate);

        // Была выбрана доставка
        // Отодвинем временные рамки с 10 ура до 8 утра (начало) и до 22:00 (конец)
        if (shipping !== false) {
            // Преобразуем данные о доставке к логическому типу для удобства
            shipping = true;
            // Требуемое время 90 мин
            estimatedTime = 5400000;
            // Записываем время начала и конца работы как полноценную дату для удобства сравнения
            // start = ms; finish = ms

            // Если в качестве даты заказа был выбран сегодняшний день, тогда
            // устанавливаем текущие часы и минуты как начало работы,
            // чтоб пользователь не смог заказать букет на время, которое уже прошло
            if (isToday(orderDate) && new Date().getHours() > start) {
                start = calculateTimeLimits({
                    limitType: 'start',
                    time: Date.parse(new Date().toString()),
                }, estimatedTime);
            } else {
                // StartWork - переменная, хранящая дату вместе со временем начала работы
                // (в качестве года, месяца и дня используются данные из заказа)
                startWork.setHours(8);
                startWork.setMinutes(0);
                start = calculateTimeLimits({
                    limitType: 'start',
                    time: Date.parse(startWork.toString()),
                }, estimatedTime);
            }
            finishWork.setHours(22);
            finishWork.setMinutes(0);
            finish = calculateTimeLimits({
                limitType: 'finish',
                time: Date.parse(finishWork.toString()),
            }, estimatedTime);

            // После проверки указанного времени либо выдаем положительный результат,
            // либо ошибку характерную для определенного типа доставки
            checkIfGivenTimeIsEnough(usedTime, { start, finish })
                .then((time) => {
                    resolve(time);
                }, (e) => {
                    reject(e);
                });
            // Был выбран самовывоз
        } else {
            // При самовывозе обязательно должны быть установлены временные рамки
            if (isToday(orderDate) && new Date().getHours() > start) {
                // Если дата заказа – сегодня, тогда в качестве времени начала работы
                // установим текущий час, чтобы пользователь не смог заказать букет на время,
                // которое уже прошло
                start = calculateTimeLimits(Date.parse(new Date().toString()), estimatedTime);
            } else {
                // Установим время начала работы, взяв часы работы из предоставленного расписания
                startWork.setHours(start);
                startWork.setMinutes(0);
                start = calculateTimeLimits(Date.parse(startWork.toString()), estimatedTime);
            }
            finishWork.setHours(finish);
            finishWork.setMinutes(0);
            // Для финиша (с самовывозом) временные рамки установлены как - 10 минут
            // от конца работы, чтоб клиент успел прийти за букетом
            finish = calculateTimeLimits(Date.parse(finishWork.toString()), -600000);
            // Требуемое время 40 мин
            checkIfGivenTimeIsEnough(usedTime, { start, finish }, shipping)
                .then((time) => {
                    resolve(time);
                }, (e) => {
                    reject(e);
                });
        }
    });
}

module.exports = { calculateTimeLimits, checkIfGivenTimeIsEnough, checkTime };