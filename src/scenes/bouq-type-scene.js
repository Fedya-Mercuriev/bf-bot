/* eslint-disable indent */
const Telegraf = require('telegraf');
const Stage = require('telegraf/stage');
const Scene = require('telegraf/scenes/base');
// const { leave } = Stage;
const order = require('./../order/order');
const bouquets = require('./../order/validate/validate-bouq-type/type');

const bouqtypeValidation = new Scene('bouqtypeValidation');

// В availableBouquetes будет записываться массив с полученными через GET запрос объектами букетов
const availableBouquets = [
    /*
      Структура:
      photo: (String) ссылка на фотографию
      name: (String) название букета
      description: (String) описание букета
      price: (Number) стоимость букета
      callbackData: (String) data для callback-кнопки
      */
    {
        photo: 'AgADAgADQ6sxG2TbsUk4aPQNVKk-nrV4Xw8ABJq6AaV7kYYoIMwDAAEC',
        name: 'Букет 1',
        description: 'Описание для букета 1',
        price: 1200,
    }, {
        photo: 'AgADAgADQ6sxG2TbsUk4aPQNVKk-nrV4Xw8ABJq6AaV7kYYoIMwDAAEC',
        name: 'Букет 2',
        description: 'Описание для букета 2',
        price: 1300,
    }, {
        photo: 'AgADAgADQ6sxG2TbsUk4aPQNVKk-nrV4Xw8ABJq6AaV7kYYoIMwDAAEC',
        name: 'Букет 3',
        description: 'Описание для букета 3',
        price: 1400,
    }, {
        photo: 'AgADAgADQ6sxG2TbsUk4aPQNVKk-nrV4Xw8ABJq6AaV7kYYoIMwDAAEC',
        name: 'Букет 4',
        description: 'Описание для букета 4',
        price: 1400,
    }, {
        photo: 'AgADAgADQ6sxG2TbsUk4aPQNVKk-nrV4Xw8ABJq6AaV7kYYoIMwDAAEC',
        name: 'Букет 5',
        description: 'Описание для букета 5',
        price: 1400,
    }, {
        photo: 'AgADAgADQ6sxG2TbsUk4aPQNVKk-nrV4Xw8ABJq6AaV7kYYoIMwDAAEC',
        name: 'Букет 6',
        description: 'Описание для букета 6',
        price: 1400,
    }, {
        photo: 'AgADAgADQ6sxG2TbsUk4aPQNVKk-nrV4Xw8ABJq6AaV7kYYoIMwDAAEC',
        name: 'Букет 7',
        description: 'Описание для букета 7',
        price: 1400,
    }, {
        photo: 'AgADAgADQ6sxG2TbsUk4aPQNVKk-nrV4Xw8ABJq6AaV7kYYoIMwDAAEC',
        name: 'Букет 8',
        description: 'Описание для букета 8',
        price: 1400,
    }, {
        photo: 'AgADAgADQ6sxG2TbsUk4aPQNVKk-nrV4Xw8ABJq6AaV7kYYoIMwDAAEC',
        name: 'Букет 9',
        description: 'Описание для букета 9',
        price: 1400,
    }, {
        photo: 'AgADAgADQ6sxG2TbsUk4aPQNVKk-nrV4Xw8ABJq6AaV7kYYoIMwDAAEC',
        name: 'Букет 10',
        description: 'Описание для букета 10',
        price: 1400,
    }, {
        photo: 'AgADAgADQ6sxG2TbsUk4aPQNVKk-nrV4Xw8ABJq6AaV7kYYoIMwDAAEC',
        name: 'Букет 11',
        description: 'Описание для букета 11',
        price: 1400,
    }, {
        photo: 'AgADAgADQ6sxG2TbsUk4aPQNVKk-nrV4Xw8ABJq6AaV7kYYoIMwDAAEC',
        name: 'Букет 12',
        description: 'Описание для букета 12',
        price: 1400,
    }, {
        photo: 'AgADAgADQ6sxG2TbsUk4aPQNVKk-nrV4Xw8ABJq6AaV7kYYoIMwDAAEC',
        name: 'Букет 13',
        description: 'Описание для букета 13',
        price: 1400,
    }, {
        photo: 'AgADAgADQ6sxG2TbsUk4aPQNVKk-nrV4Xw8ABJq6AaV7kYYoIMwDAAEC',
        name: 'Букет 14',
        description: 'Описание для букета 14',
        price: 1400,
    },
];

// Начало блока с обработкой действий пользователя над ботом
bouqtypeValidation.enter((ctx) => {
    ctx.telegram.answerCbQuery(ctx.update.callback_query.id, '⏳ Загружаю все необходимые компоненты');
    const { bouquet: chosenBouquet } = order.orderInfo;
    // Этот блок выполнится если база букетов не была загружена
    if (!bouquets.availableBouquets) {
        const processedBouquets = bouquets.addCallbackDataToBouquets(availableBouquets);
        bouquets.availableBouquets = processedBouquets;
    }
    if (chosenBouquet !== undefined) {
        bouquets.confirmBouquetOverride(ctx, chosenBouquet);
    } else {
        bouquets.askToChooseBouquet(ctx);
    }
});

bouqtypeValidation.leave((ctx) => {
    bouquets.cleanScene(ctx);
});

bouqtypeValidation.on('callback_query', (ctx) => {
    try {
        bouquets.invokeFunction(ctx.update.callback_query.data, ctx);
    } catch (error) {
        ctx.telegram.answerCbQuery(ctx.update.callback_query.id, '⛔ Cейчас эта кнопка не доступна!');
    }
});

bouqtypeValidation.on('message', async(ctx) => {
    if (ctx.updateSubTypes[0] === 'text') {
        if (ctx.update.message.text.match(/меню заказа/gi)) {
            bouquets.returnToMenu(ctx, order.displayInterface.bind(order), 'bouqtypeValidation');
        } else if (ctx.update.message.text.match(/связаться с магазином/gi)) {
            bouquets.displayPhoneNumber(ctx);
        } else if (ctx.update.message.text.match(/отменить заказ/gi)) {
            order.confirmCancelOrder(ctx);
        } else {
            const message = await ctx.reply('⛔ Извините, в данном разделе я не воспринимаю текст.\nВыберите нужный вам тип букета, кликнув по одной из кнопок "Выбрать"');
            bouquets.messages = {
                messageType: 'other',
                messageObj: message,
            };
        }
    } else {
        console.log(ctx);
    }
});

module.exports = bouqtypeValidation;