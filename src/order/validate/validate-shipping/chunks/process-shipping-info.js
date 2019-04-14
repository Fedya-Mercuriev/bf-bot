/* eslint-disable indent */
const request = require('request-promise');

function sendRequest(msg, options) {
    // В объект options входят:
    // shippingCity - город, в котором находится пользователь,
    // uri - url для запроса API
    const { msgType, msgText } = msg;
    const { json, shippingCity } = options;
    let { uri } = options;
    return new Promise((resolve, reject) => {
        // Для разных типов сообщений добавляем разные параметры
        if (msgType === 'location') {
            // Будем распознавать адрес по координатам
            const { latitude, longitude } = msgText;
            uri += `&sco=latlong&geocode=${latitude},${longitude}&kind=house&results=4`;
        } else {
            // Будем распознавать адрес по ключевым словам
            const messageData = msgText.split(',');
            if (messageData.length < 2) {
                reject(new Error('⛔️ Пожалуйста, введите адрес в формате "улица,дом"'));
            }
            const [street, house] = messageData;
            // Если вдруг есть пробелы – удалим их
            street.replace(' ', '');
            house.replace(' ', '');
            uri += `&geocode=Россия+${shippingCity},+${street}+${house}`;
        }
        uri = encodeURI(uri);
        const requestConfigs = { uri, json };
        request(requestConfigs)
            .then((response) => {
                resolve(response);
            })
            .catch(() => {
                reject(new Error('⛔️ Упс! Что-то пошло не так. Попробуйте еще раз.'));
            });
    });
}

function processResponse(response, shippingCity) {
    const addresses = [];
    const { response: { GeoObjectCollection: { featureMember: sourceAddresses } } } = response;
    return new Promise((resolve, reject) => {
        sourceAddresses.forEach((item, index, arr) => {
            // Узнаем с какой точность был найден объект по введенному адресу
            // (если точность минимальная – не засчитываем этот результат)
            const { GeoObject: { metaDataProperty: { GeocoderMetaData: { precision } } } } = item;
            // Возьмем информацию о результате (город, улица, дом и пр.)
            const { GeoObject: { metaDataProperty: { GeocoderMetaData: { Address: { Components } } } } } = item;
            const cityObj = Components.find(componentItem => (componentItem.kind === 'locality'));
            // Эта переменная хранит текст для кнопки (название улицы и номер дома)
            let result = '';
            // Если результат не содержит точного адреса – удаляем его из массива
            if (precision === 'other') {
                arr.splice(index, 1);
                return;
            }
            if (cityObj.name.toLowerCase() !== shippingCity.toLowerCase()) {
                arr.splice(index, 1);
                return;
            }
            // Добавим название улицы и номер дома к заготовке кнопки
            Components.forEach((component) => {
                if (component.kind === 'street') {
                    result += `${component.name} `;
                }
                if (component.kind === 'house') {
                    result += component.name;
                }
            });
            addresses.push(result);
        });
        if (addresses.length) {
            resolve(addresses);
        } else {
            reject(new Error('⛔️ ️️К сожалению, мне не удалось ничего найти по введенному вами адресу или мы не сможем доставить букет в ваш населенный пункт.\nПожалуйста, введите другой адрес'));
        }
    });
}

module.exports = { sendRequest, processResponse };