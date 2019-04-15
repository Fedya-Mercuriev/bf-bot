/* eslint-disable no-underscore-dangle */
/* eslint-disable indent */
const Telegraf = require('telegraf');
const { Markup, Extra } = Telegraf;
const session = require('telegraf/session');
const Stage = require('telegraf/stage');
const Scene = require('telegraf/scenes/base');
const Base = require('./../../base-class');
const order = require('./../../order');
const { leave } = Stage;

const contactInfoValidation = new Scene('contactInfoValidation');

class ContactInfo extends Base {
    constructor() {
        super();
        this.phoneNumber = undefined;
        this.saveDataKeysArr = {
            keyToAssignData: 'contactInfo',
            keyToAccessData: 'phoneNumber',
            notificationMsg: 'Сохраняю введенный номер телефона',
            sceneName: 'contactInfoValidation',
        };
        this.leaveDataInfo = 'contactInfoValidation';
        this.overwriteDataInfo = 'requestContactInfo';
    }

    async requestContactInfo(ctx) {
        this._messagesToDelete = await ctx.reply('Пожалуйста, введите номер телефона в формате "8**********".\nВы также можете просто нажать кнопку "Отправить номер телефона" и я все сделаю сам 🙃',
            Markup.keyboard([
                [{
                    text: '📲 Отправить номер телефона',
                    request_contact: true,
                }],
                ['📱 Меню заказа'],
                ['📞 Связаться с магазином'],
                ['⛔ Отменить заказ️'],
            ])
            .oneTime()
            .resize()
            .extra(),
        );
    }

    identifyDataType(ctx, updateSubType) {
        const data = ctx.update.message[updateSubType];
        if (this._confirmationMessages.length) {
            this._removeConfirmationMessages(ctx);
        }
        if (data.phone_number) {
            // Вызовем окно с подтверждением
            this._setTempPhoneNumber(ctx, data.phone_number);
        } else {
            // Проверим правильность введенного номера телефона
            this.checkPhoneNumber(ctx, data);
        }
    }

    async checkPhoneNumber(ctx, givenPhoneNumber) {
        const validatedPhoneNumber = givenPhoneNumber.match(/^(\+7|8|7)\d{10}$/i);
        if (validatedPhoneNumber !== null) {
            this._setTempPhoneNumber(ctx, validatedPhoneNumber[0]);
        } else {
            this._messagesToDelete = await ctx.reply('⛔️ Пожалуйста, введите номер телефона в формате "8**********" или нажмите на кнопку "Отправить номер телефона"');
        }
    }

    async _setTempPhoneNumber(ctx, data) {
        const result = `+7${data.slice(-10)}`;
        this.phoneNumber = result;
        this._confirmationMessages = await ctx.replyWithHTML(`Вы ввели этот номер телефона: <b>${this.phoneNumber}</b>`);
        this._confirmationMessages = this._requestContinue(ctx, 'введите другой номер телефона', 'saveDataKeysArr');
    }

    async confirmInfoOverwrite(ctx, contactInfo) {
        this._messagesToDelete = await ctx.replyWithHTML(`⚠️ Вы ранее вводили этот номер телефона: <b>${contactInfo}</b>`);
        this._messagesToDelete = await ctx.reply('Перезаписать его или оставить?',
            Markup.inlineKeyboard([
                [Markup.callbackButton('Перезаписать', '_overwriteData:requestContactInfo')],
                [Markup.callbackButton('Оставить', '_leaveData:contactInfoValidation')],
            ]).extra({
                disable_notification: true,
            }));
    }
}

const validateContactInfo = new ContactInfo();

contactInfoValidation.enter((ctx) => {
    const { contactInfo } = order.orderInfo;
    if (contactInfo !== undefined) {
        validateContactInfo.confirmInfoOverwrite(ctx, contactInfo);
    } else {
        validateContactInfo.requestContactInfo(ctx);
    }
});

contactInfoValidation.on('message', async(ctx) => {
    if (ctx.updateSubTypes[0] === 'text') {
        if (ctx.update.message.text.match(/меню заказа/i)) {
            validateContactInfo.returnToMenu(ctx, order.displayInterface.bind(order), 'dateValidation');
        } else if (ctx.update.message.text.match(/связаться с магазином/i)) {
            validateContactInfo.displayPhoneNumber(ctx);
        } else if (ctx.update.message.text.match(/отменить заказ/i)) {
            validateContactInfo.cancelOrder(ctx);
        } else {
            validateContactInfo.identifyDataType(ctx, ctx.updateSubTypes[0]);
        }
    } else if (ctx.updateSubTypes[0] === 'contact') {
        validateContactInfo.identifyDataType(ctx, ctx.updateSubTypes[0]);
    } else {
        validateContactInfo._messagesToDelete = await ctx.reply('К сожалению, в данном разделе я воспринимаю только текст 😐');
    }
});

contactInfoValidation.on('callback_query', (ctx) => {
    try {
        validateContactInfo.invokeFunction(ctx.update.callback_query.data, ctx);
    } catch (error) {
        ctx.telegram.answerCbQuery(ctx.update.callback_query.id, '⛔ Cейчас эта кнопка не доступна!');
    }
});

module.exports = contactInfoValidation;