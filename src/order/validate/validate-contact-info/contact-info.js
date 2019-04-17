/* eslint-disable class-methods-use-this */
/* eslint-disable no-underscore-dangle */
/* eslint-disable indent */
const Telegraf = require('telegraf');
const { Markup, Extra } = Telegraf;
const Base = require('./../../base-class');
// const order = require('./../../order');

class ContactInfo extends Base {
    constructor() {
        super();
        this.phoneNumber = undefined;
        this.messagesStorage = {
            intro: [],
            confirmation: [],
            other: [],
        };
        this.saveDataKeys = {
            keyToAssignData: 'contactInfo',
            keyToAccessData: 'phoneNumber',
            notificationMsg: 'Сохраняю введенный номер телефона',
            sceneName: 'contactInfoValidation',
        };
        this.leaveDataInfo = 'contactInfoValidation';
        this.overwriteDataInfo = 'requestContactInfo';
    }

    async requestContactInfo(ctx) {
        const message = await ctx.reply('Пожалуйста, введите номер телефона в формате "8**********".\nВы также можете просто нажать кнопку "Отправить номер телефона" и я все сделаю сам 🙃',
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
            .extra());
        this.messages = {
            messageType: 'intro',
            messageObj: message,
        };
    }

    identifyDataType(ctx, updateSubType) {
        const data = ctx.update.message[updateSubType];
        if (this.messages.confirmation.length) {
            this.removeMessagesOfSpecificType(ctx, 'confirmation');
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
            const message = await ctx.reply('⛔️ Пожалуйста, введите номер телефона в формате "8**********" или нажмите на кнопку "Отправить номер телефона"');
            this.messages = {
                messageType: 'other',
                messageObj: message,
            };
        }
    }

    async _setTempPhoneNumber(ctx, data) {
        const result = `+7${data.slice(-10)}`;
        this.phoneNumber = result;
        const message = await ctx.replyWithHTML(`Вы ввели этот номер телефона: <b>${this.phoneNumber}</b>`);
        this._requestContinue(ctx, 'введите другой номер телефона', 'saveDataKeys');
        this.messages = {
            messageType: 'confirmation',
            messageObj: message,
        };
    }

    async confirmInfoOverwrite(ctx, contactInfo) {
        let message = await ctx.replyWithHTML(`⚠️ Вы ранее вводили этот номер телефона: <b>${contactInfo}</b>`);
        this.messages = {
            messageType: 'confirmation',
            messageObj: message,
        };
        message = await ctx.reply('Перезаписать его или оставить?',
            Markup.inlineKeyboard([
                [Markup.callbackButton('Перезаписать', '_overwriteData:requestContactInfo')],
                [Markup.callbackButton('Оставить', '_leaveData:contactInfoValidation')],
            ]).extra({
                disable_notification: true,
            }));
        this.messages = {
            messageType: 'confirmation',
            messageObj: message,
        };
    }
}

const validateContactInfo = new ContactInfo();

module.exports = validateContactInfo;