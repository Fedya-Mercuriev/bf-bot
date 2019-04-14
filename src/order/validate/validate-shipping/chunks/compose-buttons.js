/* eslint-disable indent */
const Telegraf = require('telegraf');
const { Markup, Extra } = Telegraf;
const request = require('request-promise');
const { mapsApiToken } = require('./../../../../config');
const { citiesList, excludeCities } = require('./../../../../../core');

async function sendRequestToMaps(ctx, msg) {
    const { msgType } = msg;
    const { json } = this.requestOptions;
    let { uri } = this.requestOptions;
    return new Promise((resolve, reject) => {
        // Распознаем тип данных (текст или локация)
        if (msgType === 'location') {
            // Будем распознавать адреес по координатам
            const { latitude, longitude } = msg;
            uri += `&sco=latlong&geocode=${latitude},${longitude}&kind=house&results=4`;
        } else {
            // Будем распознавать адрес по ключевым словам
            const messageData = ctx.update.message.text.split(' ');
            if (messageData.length < 2) {
                return;
            }
            const [street, house] = messageData;
            uri += `&geocode=россия+${this.shippingCity},+${street}+${house}`;
        }
        uri = encodeURI(uri);
        const options = { uri, json };
        request(options)
            .then((response) => {
                resolve(response);
            })
            .catch((err) => {
                reject(new Error('⛔️ Упс! Что-то пошло не так. Попробуйте еще раз.'));
            });
    });
}

function composeButtons(response) {
    const buttons = [];
    response.forEach((item, index, arr) => {
        // Узнаем с какой точность был найден объект по введенному адресу
        // (если точность минимальная – не засчитываем этот результат)
        const { GeoObject: { metaDataProperty: { GeocoderMetaData: { precision } } } } = item;
        // Возьмем информацию о результате (город, улица, дом и пр.)
        const { GeoObject: { metaDataProperty: { GeocoderMetaData: { Address: { Components } } } } } = item;
        // Эта переменная хранит текст для кнопки (название улицы и номер дома)
        let btnText = '';
        if (precision === 'other') {
            arr.splice(index, 1);
            // Если среди найденных результатов есть закрытые города внутри области,
            // в которой функционирует магазин, они также исключаются
        } else if (excludeCities.indexOf(Components[4].name) === -1) {
            try {
                arr.splice(index, 1);
            } catch (e) {
                console.log(e.message);
            }
            // Иначе возьмем название улицы и номер дома и добави его в заготовку для кнопки
        } else if (!Components.find((componentItem) => {
                return componentItem.kind === 'locality';
            })) {
            arr.splice(index, 1);
        } else {
            // Добавим название улицы и нмер дома к заготовке кнопки
            Components.forEach((component) => {
                if (component.kind === 'street') {
                    btnText += component.name;
                }
                if (component.kind === 'house') {
                    btnText += component.name;
                }
            });
        }
        buttons.push([Markup.callbackButton(btnText, `_setShippingInfo:${btnText}`)]);
    });
};

module.exports = composeButtons;