/* eslint-disable class-methods-use-this */
/* eslint-disable no-restricted-syntax */
/* eslint-disable no-await-in-loop */
/* eslint-disable no-underscore-dangle */
/* eslint-disable indent */
const Telegraf = require('telegraf');
const { Markup, Extra } = Telegraf;
const order = require('./../../order');
const Base = require('./../../base-class');

class Bouquets extends Base {
    constructor() {
        super();
        this._availableBouquets = null;
        this._pageNum = 1;
        this._welcomeMsg = 'А теперь выберите из предложенных вариантов желаемый букет!';
        this._messagesToDelete = [];
        this.chosenType = null;
        this._bouquetsCatalogMessages = [];
        this.saveDataKeysArr = {
            keyToAssignData: 'bouquet',
            keyToAccessData: 'chosenType',
            notificationMsg: 'Сохраняю выбранный букет',
            sceneName: 'bouqtypeValidation',
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

    get bouquetCatalogMessages() {
        return this._bouquetsCatalogMessages;
    }

    set bouquetCatalogMessages(message) {
        if (message !== 'clearArr') {
            this._bouquetsCatalogMessages.push(message);
        } else {
            this._bouquetsCatalogMessages.length = 0;
        }
    }

    addCallbackDataToBouquets(bouquets) {
        const bouquetesArr = bouquets;

        bouquetesArr.forEach((bouquet, index) => {
            bouquet.data = `chooseBouquet:${index}`;
        });
        return bouquetesArr;
    }

    askToChooseBouquet(ctx) {
        ctx.reply(this._welcomeMsg).then((result) => {
            this._messagesToDelete.push(result);
            this.displayCatalog(ctx);
        });
    }

    async displayCatalog(ctx) {
        const msgWereSent = await this._displayCatalogPage(ctx);
        if (msgWereSent) {
            this._displayPagination(ctx);
        } else {
            this.messagesToDelete = await ctx.reply('⛔️ Что-то пошло не так. Пожалуйста, вернитесь в меню заказа и попробуйте еще раз!');
        }
    }

    // Отображает список букетов
    async _displayCatalogPage(ctx) {
        // Данная функция отображает пачку букетов, внизу прикрепляет панель дя переключения страниц с пачками букетов
        const bouquetsPack = this._displayBouquetPack(this._pageNum);
        if (bouquetsPack) {
            for (const bouquet of bouquetsPack) {
                // Формат caption: название, описание, стоимость
                const photoCaption = `<b>${bouquet.name}</b>\n${bouquet.description}\n<i>Стоимость:</i> ${bouquet.price}₽`;
                this.bouquetCatalogMessages = await ctx.telegram.sendPhoto(ctx.chat.id, bouquet.photo, {
                    caption: photoCaption,
                    parse_mode: 'HTML',
                    disable_notification: true,
                    reply_markup: Markup.inlineKeyboard([
                        Markup.callbackButton('Выбрать', bouquet.data),
                    ]),
                });
            }
            return true;
        }
    }

    // Выдает пачку объектов (5шт) за раз
    _displayBouquetPack(pageNum) {
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
        this._bouquetsCatalogMessages.push(
            await ctx.reply('Нажмите на одну из кнопок, чтобы переключить страницу',
                Markup.inlineKeyboard([
                    [Markup.callbackButton(`Страница: ${this._pageNum} из ${Math.ceil(this.availableBouquets.length / 5)}`, 'showPage')],
                    [
                        Markup.callbackButton('< Пред.', 'openPreviousPage'),
                        Markup.callbackButton('След. >', 'openNextPage'),
                    ],
                ]).extra(),
            ),
        );
    }

    _getCatalogPages() {
        return Math.ceil(this.availableBouquets.length / 5);
    }

    _clearCatalogPageContent(ctx) {
        this.bouquetCatalogMessages.forEach(({ message_id: id }) => {
            try {
                ctx.deleteMessage(id);
            } catch (error) {
                console.log(error);
            }
        });
        this.bouquetCatalogMessages = 'clearArr';
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
        const { name, price } = chosenBouquetCard;
        const caption = `Вы выбрали: \n<b>${name}</b>\n<i>Стоимость:</i> ${price}`;

        this._confirmationMessages = await ctx.telegram.sendPhoto(ctx.chat.id, photoId, {
            caption,
            parse_mode: 'HTML',
            reply_markup: Markup.inlineKeyboard([
                [Markup.callbackButton('Сохранить и выйти', '_saveAndExit:bouqtypeValidation')],
                [Markup.callbackButton('Выбрать другой', 'returnToCatalog')],
            ]),
        });
    }

    _saveAndExit(ctx) {
        // В информацию о выбранном букете будут записаны:
        // * название
        // * фотография букета
        // * стоимость букета

        let [_msgTitle, title, _description, price] = ctx.update.callback_query.message.caption.split('\n'),
            photoId = ctx.update.callback_query.message.photo[1].file_id,
            bouquetInformation = {};

        ctx.telegram.answerCbQuery(ctx.update.callback_query.id, 'Сохраняю выбранный букет');
        ctx.deleteMessage(ctx.update.callback_query.message.message_id);

        bouquetInformation.title = title;
        bouquetInformation.photo = photoId;
        bouquetInformation.price = price.replace(/^\D+/g, '');

        // Запишем в ифнормацию о заказе, в соответствующее свойство выбранный букет
        order.orderInfo = ['bouquet', bouquetInformation];
        ctx.scene.leave('bouqtypeValidation');
    }

    returnToCatalog(ctx) {
        ctx.telegram.answerCbQuery(ctx.update.callback_query.id, '');
        ctx.deleteMessage(ctx.update.callback_query.message.message_id);
    }

    async confirmBouquetOverride(ctx, chosenBouquet) {
        const { title, photo, price } = chosenBouquet;
        const cardCaption = `💐<b>${title}</b>\n💸Стоимость: ${price}`;
        const confirmationMessage = '\n Выбрать другой букет или оставить этот?';
        // chosenBouquet хранит следующие свойства:
        // * title - название букета (String)
        // * photo - ссылку на фотографию букета (String)
        // * price - стоимость букета (Number)
        this.messagesToDelete = await ctx.reply('Вы раньше выбирали этот букет:');
        this.messagesToDelete = await ctx.telegram.sendPhoto(ctx.chat.id, photo, {
            caption: cardCaption + confirmationMessage,
            parse_mode: 'HTML',
            reply_markup: Markup.inlineKeyboard([
                [Markup.callbackButton('Оставить этот букет', '_leaveData:bouqtypeValidation')],
                [Markup.callbackButton('Выбрать другой', 'chooseDifferentBouquet')],
            ]),
        });
    }

    chooseDifferentBouquet(ctx) {
        ctx.telegram.answerCbQuery(ctx.update.callback_query.id, 'Загружаю каталог');
        this.displayCatalog(ctx);
    }
}

const bouquets = new Bouquets();

module.exports = bouquets;