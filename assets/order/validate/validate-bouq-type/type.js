const Telegraf = require('telegraf');
const { Markup, Extra } = Telegraf;
const session = require('telegraf/session');
const Stage = require('telegraf/stage');
const Scene = require('telegraf/scenes/base');
const { leave } = Stage;
const order = require('../../../../core');
const ServiceOps = require('../../../service-ops');

const bouqtypeValidation = new Scene('bouqtypeValidation');

class BouqType {
    constructor() {
        this.availableTypes = [
            // name - для текста на кнопке, data - по ней далее будет предлагаться цена
            {
                name: "свадебный",
                data: "wedding"
            }, {
                name: "для жены",
                data: "for wife"
            }
        ];
        this.welcomeMsg = `Пожалуйста, выберите желаемый тип букета из предложенных вариантов`;
        this.chosenType = undefined;
    }

    // addNewBouqType() {
    //
    // }

    makeAvailableTypes() {
        let result = [];
        for (let i = 0; i < this.availableTypes.length; i++) {
            result.push([Markup.callbackButton(this.availableTypes[i].name, this.availableTypes[i].data)])
        }
        return result;
        // return array
    }

    requestBouqType(ctx) {
        let bouqTypeButtons = this.makeAvailableTypes();
        ctx.reply(this.welcomeMsg, Markup.inlineKeyboard(bouqTypeButtons).extra());
    }

    confirmDataRewrite(ctx, bouqType) {
        let typeName= this.translateBouqTypeName(bouqType);
        ctx.replyWithHTML(`Вы ранее выбрали этот тип букета: <b>"${typeName}"</b>. \n Выберите новый или оставите этот?`,
        Markup.inlineKeyboard([
            [Markup.callbackButton('Выбрать новый', 'overwriteData')],
            [Markup.callbackButton('Оставить', 'leaveData')]
        ]).extra());
    }

    setChosenCategory(ctx, chosenCategory) {
        this.chosenType = chosenCategory;
        let typeName = this.translateBouqTypeName(this.chosenType);
        ctx.replyWithHTML(`Вы выбрали: <b>${typeName}</b>`).then(() => {
            ServiceOps.requestContinue(ctx, "введите другой тип букета");
        });
    }

    translateBouqTypeName(desiredType) {
        for (let prop of this.availableTypes) {
            for (let data in prop) {
                if (prop.data === desiredType) {
                    return prop.name;
                }
            }
        }
    }

}

const validateType = new BouqType();

bouqtypeValidation.enter((ctx) => {
    let { bouquetType } = order.getOrderInfo;
    if (bouquetType !== undefined) {
        validateType.confirmDataRewrite(ctx, bouquetType);
    } else {
        validateType.requestBouqType(ctx);
    }
});

bouqtypeValidation.on('callback_query', (ctx) => {
    if (ctx.update['callback_query'].data === 'overwriteData') {
        ctx.telegram.answerCbQuery(ctx.update['callback_query'].id, "");
        ServiceOps.processInputData(ctx.update['callback_query'].data, ctx, validateType.requestBouqType.bind(validateType));

    } else if (ctx.update['callback_query'].data === 'leaveData') {
        ctx.telegram.answerCbQuery(ctx.update['callback_query'].id, "");
        ServiceOps.processInputData(ctx.update['callback_query'].data, ctx, order.displayInterface.bind(order), 'bouqtypeValidation');

    } else if (ctx.update['callback_query'].data !== 'продолжить') {
        ctx.telegram.answerCbQuery(ctx.update['callback_query'].id, "");
        console.log(ctx.update['callback_query']);
        validateType.setChosenCategory(ctx, ctx.update['callback_query'].data);

    } else {
        ctx.telegram.answerCbQuery(ctx.update['callback_query'].id, "");
        order.setOrderInfo = ['bouquetType', validateType.chosenType];
        ctx.telegram.deleteMessage(ctx.update['callback_query'].message.chat.id, ctx.update['callback_query'].message['message_id']);
        order.displayInterface(ctx);
        ctx.scene.leave('bouqtypeValidation');
    }
});

module.exports = validateType;
module.exports = bouqtypeValidation;