function internationalizeDate(date) {
    let months = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'],
        usedDate = new Date(date);
    return `${usedDate.getDate()} ${months[usedDate.getMonth()]} ${usedDate.getFullYear()} года`;
}

module.exports = internationalizeDate;