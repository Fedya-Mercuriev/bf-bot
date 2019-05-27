/* eslint-disable indent */
const Telegraf = require('telegraf');
const { Markup } = Telegraf;
const Extra = require('telegraf/extra');

class Contacts {
    constructor() {
        this.contactInfo = {
            num: process.env.PHONE_NUMBER,
            firstName: process.env.CONTACT_NAME,
            lastName: process.env.CONTACT_SURNAME,
        };

        this.workingHours = {
            weekdays: {
                start: 10,
                finish: 20,
            },
            weekends: {
                start: 11,
                finish: 19,
            },
        };

        this.venue = {
            coordinates: [56.4766215, 84.9634409],
            address: 'Фрунзе проспект, 46',
        };

        this.instagramUrl = 'https://www.instagram.com/bf_tomsk';
    }

    _isWeekend() {
        let today = new Date();
        if (today.getDay() === 6 || today.getDay() === 0) {
            return true;
        }
        return false
    }

    showPhoneNumber(ctx) {
        return ctx.telegram.sendContact(ctx.chat.id, this.contactInfo.num,
            this.contactInfo.firstName, this.contactInfo.lastName, false);
    }

    displayContactInfo(ctx) {
        let workingHours;

        // Проверим выходной ли сейчас и сформируем строку с часами работы
        if (this._isWeekend()) {
            let { start, end } = this.workingHours.weekends;
            workingHours = `Сегодня мы работаем с ${start}:00 до ${end}:00`;
        } else {
            workingHours = 'Сегодня мы работаем с 10:00 до 20:00';
        }

        ctx.telegram.sendMessage(ctx.chat.id, 'Звоните').then(() => {
            return ctx.telegram.sendContact(ctx.chat.id, this.contactInfo.num,
                    this.contactInfo.firstName, this.contactInfo.lastName, false)
                .then(() => ctx.reply(workingHours, Extra.notifications(false)))
                .then(() => {
                    return ctx.reply('Показать адрес магазина?',
                        Markup.inlineKeyboard([
                            Markup.callbackButton('Показать адрес', 'showAddress'),
                        ]).extra(),
                    );
                });
        });
    }

    showAddress(ctx) {
        let [lat, lon] = this.venue.coordinates;

        ctx.telegram.answerCbQuery(ctx.update.callback_query.id, 'Загружаю карту');
        ctx.telegram.deleteMessage(ctx.update.callback_query.message.chat.id, ctx.update.callback_query.message.message_id);
        ctx.telegram.sendVenue(ctx.chat.id, lat, lon, 'Приходите в гости', this.venue.address, false)
            .then(() => {
                return ctx.reply('А еще у нас есть Instagram',
                    Markup.inlineKeyboard([
                        Markup.urlButton('Подписаться', this.instagramUrl),
                    ]).extra());
            });
    }

    static get workingHours() {
        return this.workingHours;
    }
}

module.exports = new Contacts();