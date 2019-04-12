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

function resetTimeForOrderDate(orderDate) {
    const result = new Date(orderDate);
    result.setHours(0);
    result.setMinutes(0);
    result.setSeconds(0);
    return Date.parse(result.toString());
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
    // определены calculateTimeLimits в миллисекундах (начало или конец работы);
    // @start = ms; @finish = ms;
    const startWork = new Date(timeLimits.startLimit);
    const finishWork = new Date(timeLimits.finishLimit);
    // Медиана используется для обозначения половины, относительно которой
    // введенное время будет сравниваться с стартом или финишем
    const median = Math.floor((finishWork.getHours() - startWork.getHours()) / 2);

    return new Promise((resolve, reject) => {
        if (new Date(targetTime).getHours() < new Date(timeLimits.startLimit).getHours() + median) {
            // Сравниваем с стартом
            if (timeLimits.startLimit - targetTime <= 0) {
                resolve(targetTime);
            } else {
                reject(new Error('⛔ К сожалению, мы не успеем сделать букет к указанному вами времени! Пожалуйста, выберите другое время.'));
            }
        } else {
            // Сравниваем с финишем
            if (timeLimits.finishLimit - targetTime >= 0) {
                resolve(targetTime);
            } else {
                reject(new Error('⛔ В указанное вами время мы уже не работаем! Пожалуйста, выберите другое время.'));
            }
        }
    });
}

function checkTime(timeObj, workingHours, requiredOrderInfo) {
    // @timeObg - объект с свойствами hours(Number), minutes(Number)
    // (был получен при распознавании строки) (Object)
    // @timeLimits - объект с свойствами start(Number), finish(Number)
    // @requiredOrderInfo - объект с свойствами orderDate(Number), shipping([Boolean, String])
    const { hours, minutes } = timeObj;
    const { start, finish } = workingHours;
    const { shipping } = requiredOrderInfo;
    let { orderDate } = requiredOrderInfo;
    orderDate = resetTimeForOrderDate(orderDate);
    const usedTime = orderDate + (hours * 3600000) + (minutes * 60000);
    const startWork = new Date(orderDate);
    const finishWork = new Date(orderDate);
    // Estimatedtime хранит время необходимое на приготовление букета (по умолчанию 40 мин)
    let estimatedTime = 2400000;

    return new Promise((resolve, reject) => {
        // Создаем переменную, с которой будем сравнивать начало и конец работы вместе с прибавленным или вычитанным значением необходимого
        // для создания и доставки букета времени
        // Формат: ms
        let startLimit;
        let finishLimit;
        let timeLimits = {};
        // Была выбрана доставка
        if (shipping !== false) {
            // Требуемое время 90 мин
            estimatedTime = 5400000;
            // Если в качестве даты заказа был выбран сегодняшний день, тогда
            // устанавливаем текущие часы и минуты как начало работы,
            // чтоб пользователь не смог заказать букет на время, которое уже прошло
            if (isToday(orderDate) && new Date().getHours() > start) {
                startLimit = calculateTimeLimits({
                    limitType: 'start',
                    time: Date.parse(new Date().toString()),
                }, estimatedTime);
            } else {
                // В противном случае устанавливаем как начало работы 8 утра, а конец – 10 вечера
                startWork.setHours(8);
                startWork.setMinutes(0);
                startLimit = Date.parse(startWork.toString());
            }
            finishWork.setHours(22);
            finishWork.setMinutes(0);
            finishLimit = Date.parse(finishWork.toString());
            timeLimits = { startLimit, finishLimit };
            // Был выбран самовывоз
        } else {
            // При самовывозе обязательно должны быть установлены временные рамки
            if (isToday(orderDate) && new Date().getHours() > start) {
                // Если дата заказа – сегодня, тогда в качестве времени начала работы
                // установим текущий час, чтобы пользователь не смог заказать букет на время,
                // которое уже прошло
                startLimit = calculateTimeLimits({
                    limitType: 'start',
                    time: Date.parse(startWork.toString()),
                }, estimatedTime);
            } else {
                // Установим время начала работы, взяв часы работы из предоставленного расписания
                startWork.setHours(start);
                startWork.setMinutes(0);
                startLimit = calculateTimeLimits({
                    limitType: 'start',
                    time: Date.parse(startWork.toString()),
                }, estimatedTime);
            }
            finishWork.setHours(finish);
            finishWork.setMinutes(0);
            // Для финиша (с самовывозом) временные рамки установлены как - 10 минут
            // от конца работы, чтоб клиент успел прийти за букетом
            finishLimit = calculateTimeLimits({
                limitType: 'finish',
                time: Date.parse(finishWork.toString()),
            }, 600000);
            // Требуемое время 40 мин
        }
        timeLimits = { startLimit, finishLimit };
        checkIfGivenTimeIsEnough(usedTime, timeLimits)
            .then((time) => {
                resolve(time);
            }, (e) => {
                reject(e);
            });
    });
}

module.exports = { calculateTimeLimits, checkIfGivenTimeIsEnough, checkTime };