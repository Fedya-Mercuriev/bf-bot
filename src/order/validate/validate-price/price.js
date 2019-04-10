const Telegraf = require('telegraf');
const { Markup, Extra } = Telegraf;
const session = require('telegraf/session');
const Stage = require('telegraf/stage');
const Scene = require('telegraf/scenes/base');
const { leave } = Stage;
const order = require('../../../../core');
const ServiceOps = require('../../../service-ops');

const pickPriceScene = new Scene('pickPrice');

class BouqPrice {
    constructor() {
        this.prices = {
            // категории хранят объекты, которые содержат цены и превью
            test: "test"
        };
        this.pickedBouquet = {};
    }

    createBouqCard(item) {
        // Получает текузий объект и собирает информацию в новый
    }

    requestPricePick(ctx) {
        ctx.reply("Исходя из выбранной вами категории, я собрал для вас доступные букеты.");
    }

    confirmDataOverride(ctx, bouqPrice) {
        ctx.reply(`Вы ранее выбрали букет с этой ценой:`).then(() => {
            // Отправить фотографию выбранного букета
        }).then(() => {
            ctx.reply("Выбрать новый букет или оставить этот?",
                Markup.inlineKeyboard([
                    [Markup.callbackButton("Выбрать новый", "overwriteData")],
                    [Markup.callbackButton("Оставить", "leaveData")]
                ]))
        })
    }

    setPickedBouquet(ctx, bouquet) {
        this.pickedBouquet = this.prices[bouquet];
    }
}

const bouquetPrice = new BouqPrice();

pickPriceScene.enter((ctx) => {
    let { bouquetPrice } = order.orderInfo;

    if (bouquetPrice !== undefined) {
        bouquetPrice.confirmDataRewrite(ctx, bouquetPrice);
    } else {
        bouquetPrice.requestPricePick(ctx);
    }
});

pickPriceScene.on('callback_query', (ctx) => {
    ctx.telegram.answerCbQuery(ctx.update['callback_query'].id, "");

    if (ctx.update['callback_query'].data === 'overwriteData') {
        ServiceOps.processInputData(ctx.update['callback_query'].data, ctx, bouquetPrice.requestBouqType.bind(bouquetPrice));

    } else if (ctx.update['callback_query'].data === 'leaveData') {
        ServiceOps.processInputData(ctx.update['callback_query'].data, ctx, order.displayInterface.bind(order), 'pickPriceScene');

    } else if (ctx.update['callback_query'].data !== 'продолжить') {
        // callback-data - значение свойства, в котором лежит нужный объект с букетом
        bouquetPrice.setPickedBouquet(ctx, ctx.update['callback_query'].data);

        // Обрабатывает клик по кнопке "Продолжить"
    } else {
        order.orderInfo = ['bouquetPrice', bouquetPrice.pickedBouquet];
        ctx.telegram.deleteMessage(ctx.update['callback_query'].message.chat.id, ctx.update['callback_query'].message['message_id']);
        order.displayInterface(ctx);
        ctx.scene.leave('pickPriceScene');
    }
});
module.exports = bouquetPrice;
module.exports = pickPriceScene;