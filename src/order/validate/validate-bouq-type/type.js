/* eslint-disable class-methods-use-this */
/* eslint-disable no-restricted-syntax */
/* eslint-disable no-await-in-loop */
/* eslint-disable no-underscore-dangle */
/* eslint-disable indent */
const Telegraf = require('telegraf');
const { Markup, Extra } = Telegraf;
const Base = require('./../../base-class');

class Bouquets extends Base {
    constructor() {
        super();
        this._availableBouquets = null;
        this._pageNum = 1;
        this._welcomeMsg = 'А теперь выберите из предложенных вариантов желаемый букет!';
        // Это свойство хранит в себе все отправленные ботом сообщения,
        // разделенные на категории;
        // При выходу из сцены, эти сообщения будут удалены
        this.messagesStorage = {
            intro: [],
            confirmation: [],
            bouquetCatalog: [],
            other: [],
        };
        this.chosenBouquet = null;
        this._bouquetsCatalogMessages = [];
        this.saveDataKeys = {
            keyToAssignData: 'bouquet',
            keyToAccessData: 'chosenBouquet',
            notificationMsg: 'Сохраняю выбранный букет',
            sceneName: 'bouqtypeValidation',
            messagesStorage: 'messagesStorage',
        };
        this.leaveDataInfo = 'bouqtypeValidation';
        this.overwriteDataInfo = 'askToChooseBouquet';
    }

    get availableBouquets() {
        return this._availableBouquets;
    }

    set availableBouquets(bouquets) {
        this._availableBouquets = bouquets;
    }

    addCallbackDataToBouquets(bouquets) {
        const bouquetesArr = bouquets;

        bouquetesArr.forEach((bouquet, index) => {
            bouquet.data = `chooseBouquet:${index}`;
        });
        return bouquetesArr;
    }

    async askToChooseBouquet(ctx) {
        const message = await ctx.reply(this._welcomeMsg,
            Markup.keyboard([
                ['📜 Меню заказа'],
                ['📞 Связаться с магазином'],
                ['⛔ Отменить заказ'],
            ])
            .oneTime()
            .resize()
            .extra());
        this.messages = {
            messageType: 'intro',
            messageObj: message,
        };
        this.displayCatalog(ctx);
    }

    async displayCatalog(ctx) {
        const msgWereSent = await this._displayCatalogPage(ctx);
        if (msgWereSent) {
            this._displayPagination(ctx);
        } else {
            const message = await ctx.reply('⛔️ Что-то пошло не так. Пожалуйста, вернитесь в меню заказа и попробуйте еще раз!');
            this.messages = {
                messageType: 'other',
                messageObj: message,
            };
        }
    }

    // Отображает список букетов
    async _displayCatalogPage(ctx) {
        // Данная функция отображает пачку букетов, внизу прикрепляет панель дя переключения страниц с пачками букетов
        const bouquetsPack = this._returnBouquetPack(this._pageNum);
        if (bouquetsPack) {
            for (const bouquet of bouquetsPack) {
                // Формат caption: название, описание, стоимость
                const photoCaption = `<b>${bouquet.name}</b>\n${bouquet.description}\n<i>Стоимость:</i> ${bouquet.price}₽`;
                const message = await ctx.telegram.sendPhoto(ctx.chat.id, bouquet.photo, {
                    caption: photoCaption,
                    parse_mode: 'HTML',
                    disable_notification: true,
                    reply_markup: Markup.inlineKeyboard([
                        Markup.callbackButton('Выбрать', bouquet.data),
                    ]),
                });
                this.messages = {
                    messageType: 'bouquetCatalog',
                    messageObj: message,
                };
            }
            return true;
        }
    }

    // Выдает пачку объектов (5шт) за раз
    _returnBouquetPack(pageNum) {
        // pageNum передается в виде числа, воспринимаемого человеком,
        // которая затем обрабатывается для получения верного свойства массива
        if (pageNum - 1 < 0) {
            return false;
        } else if (pageNum - 1 === this.availableBouquets) {
            return false;
        } else {
            return this.availableBouquets.slice((pageNum - 1) * 5, (pageNum - 1) * 5 + 5);
        }
    }

    // Выводит сообщение с кнопками для перехода на другие страницы каталога
    async _displayPagination(ctx) {
        const message = await ctx.reply('Нажмите на одну из кнопок, чтобы переключить страницу',
            Markup.inlineKeyboard([
                [Markup.callbackButton(`Страница: ${this._pageNum} из ${Math.ceil(this.availableBouquets.length / 5)}`, 'showPage')],
                [
                    Markup.callbackButton('< Пред.', 'openPreviousPage'),
                    Markup.callbackButton('След. >', 'openNextPage'),
                ],
            ]).extra(),
        );
        this.messages = {
            messageType: 'bouquetCatalog',
            messageObj: message,
        };
    }

    _getCatalogPages() {
        return Math.ceil(this.availableBouquets.length / 5);
    }

    _clearCatalogPageContent(ctx) {
        this.removeMessagesOfSpecificType(ctx, 'bouquetCatalog');
        this.messages = {
            messageType: 'bouquetCatalog',
            messageObj: 'clear',
        };
    }

    showPage(ctx) {
        ctx.telegram.answerCbQuery(ctx.update.callback_query.id, `Страница ${this._pageNum} из ${Math.ceil(this.availableBouquets.length / 5)}`);
    }

    // Открывает предыдущую страницу каталога
    openPreviousPage(ctx) {
        if (this._pageNum !== 1) {
            ctx.telegram.answerCbQuery(ctx.update.callback_query.id, 'Загружаю страницу');
            this._pageNum -= 1;
            this._clearCatalogPageContent(ctx);
            this.displayCatalog(ctx);
        } else {
            ctx.telegram.answerCbQuery(ctx.update.callback_query.id, 'Вы на первой странице');
        }
    }

    // Открывает следующую страницу каталога
    openNextPage(ctx) {
        if (this._pageNum < this._getCatalogPages()) {
            ctx.telegram.answerCbQuery(ctx.update.callback_query.id, 'Загружаю страницу');
            this._pageNum += 1;
            this._clearCatalogPageContent(ctx);
            this.displayCatalog(ctx);
        } else {
            ctx.telegram.answerCbQuery(ctx.update.callback_query.id, 'Вы на последней странице');
        }
    }

    async chooseBouquet(ctx, bouquetNumber) {
        ctx.telegram.answerCbQuery(ctx.update.callback_query.id, '');
        // Извлечем фото среднего размера (вторая сверху)
        const photoId = ctx.update.callback_query.message.photo[1].file_id;
        /* Типы:
            @photoId = String
            @title = String
            @description = String
            @price = String
        */
        // Извлечем информацию о букете из соответствующей карточки
        const chosenBouquetCard = this.availableBouquets[bouquetNumber];
        const { photo, name, price } = chosenBouquetCard;
        const caption = `Вы выбрали: \n<b>${name}</b>\n<i>Стоимость:</i> ${price}`;
        this.chosenBouquet = { photo, name, price };
        const message = await ctx.telegram.sendPhoto(ctx.chat.id, photoId, {
            caption,
            parse_mode: 'HTML',
            reply_markup: Markup.inlineKeyboard([
                [Markup.callbackButton('Сохранить и выйти', '_saveAndExit:saveDataKeys')],
                [Markup.callbackButton('Выбрать другой', 'returnToCatalog')],
            ]),
        });
        this.messages = {
            messageType: 'confirmation',
            messageObj: message,
        };
    }

    returnToCatalog(ctx) {
        ctx.telegram.answerCbQuery(ctx.update.callback_query.id, '');
        ctx.deleteMessage(ctx.update.callback_query.message.message_id);
    }

    async confirmBouquetOverride(ctx, chosenBouquet) {
        const { name, photo, price } = chosenBouquet;
        const cardCaption = `💐<b>${name}</b>\n💸Стоимость: ${price}`;
        const confirmationMessage = '\n Выбрать другой букет или оставить этот?';
        // chosenBouquet хранит следующие свойства:
        // * title - название букета (String)
        // * photo - ссылку на фотографию букета (String)
        // * price - стоимость букета (Number)
        let message = await ctx.reply('Вы раньше выбирали этот букет:',
            Markup.keyboard([
                ['📜 Меню заказа'],
                ['📞 Связаться с магазином'],
                ['⛔ Отменить заказ'],
            ])
            .oneTime()
            .resize()
            .extra(),
        );
        this.messages = {
            messageType: 'other',
            messageObj: message,
        };
        message = await ctx.telegram.sendPhoto(ctx.chat.id, photo, {
            caption: cardCaption + confirmationMessage,
            parse_mode: 'HTML',
            reply_markup: Markup.inlineKeyboard([
                [Markup.callbackButton('Оставить этот букет', '_leaveData:bouqtypeValidation')],
                [Markup.callbackButton('Выбрать другой', 'chooseDifferentBouquet')],
            ]),
        });
        this.messages = {
            messageType: 'confirmation',
            messageObj: message,
        };
    }

    chooseDifferentBouquet(ctx) {
        ctx.telegram.answerCbQuery(ctx.update.callback_query.id, 'Загружаю каталог');
        this.cleanScene(ctx);
        this.displayCatalog(ctx);
    }
}

const bouquets = new Bouquets();

module.exports = bouquets;