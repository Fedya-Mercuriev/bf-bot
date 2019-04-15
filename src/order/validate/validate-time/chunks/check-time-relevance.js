function checkTimeRelevance(timeObj) {
    const { hours, minutes } = timeObj;
    return new Promise((resolve, reject) => {
        if ((hours > 23 || hours < 0) || (minutes > 59 || minutes < 0)) {
            reject(new Error('⛔ Пожалуйста, введите корректное время!'));
        } else {
            resolve(timeObj);
        }
    });
}

module.exports = checkTimeRelevance;