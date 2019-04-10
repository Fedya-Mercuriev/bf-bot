'use strict';
const Telegraf = require('telegraf');
const { Markup, Extra } = Telegraf;
const Stage = require('telegraf/stage');
const Scene = require('telegraf/scenes/base');
const { leave } = Stage;
const order = require('../../../../core');
const ServiceOps = require('../../../service-ops');
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
        photo: 'AgADAgADyqkxG5XK8Es4DNwsvdiUVmnTUQ8ABAtRL9rXTiC9htEAAgI',
        name: 'Букет 1',
        description: 'Описание для букета 1',
        price: 1200,
    }, {
        photo: 'AgADAgADy6kxG5XK8EvOd89Rk4wcjsFdOQ8ABDtmmzOHO5JhUS4DAAEC',
        name: 'Букет 2',
        description: 'Описание для букета 2',
        price: 1300,
    }, {
        photo: 'AgADAgADzKkxG5XK8EuhCJKmKFR7QuHHUQ8ABTTcdWvMJbi-0gACAg',
        name: 'Букет 3',
        description: 'Описание для букета 3',
        price: 1400,
    }, {
        photo: 'AgADAgADc6oxGxqy-Uvs_FzWnxwf-vO-UQ8ABPsNuI4ZzZV408wAAgI',
        name: 'Букет 4',
        description: 'Описание для букета 4',
        price: 1400,
    }, {
        photo: 'AgADAgADc6oxGxqy-Uvs_FzWnxwf-vO-UQ8ABPsNuI4ZzZV408wAAgI',
        name: 'Букет 5',
        description: 'Описание для букета 5',
        price: 1400,
    }, {
        photo: 'AgADAgADc6oxGxqy-Uvs_FzWnxwf-vO-UQ8ABPsNuI4ZzZV408wAAgI',
        name: 'Букет 6',
        description: 'Описание для букета 6',
        price: 1400,
    }, {
        photo: 'AgADAgADc6oxGxqy-Uvs_FzWnxwf-vO-UQ8ABPsNuI4ZzZV408wAAgI',
        name: 'Букет 7',
        description: 'Описание для букета 7',
        price: 1400,
    }, {
        photo: 'AgADAgADc6oxGxqy-Uvs_FzWnxwf-vO-UQ8ABPsNuI4ZzZV408wAAgI',
        name: 'Букет 8',
        description: 'Описание для букета 8',
        price: 1400,
    }, {
        photo: 'AgADAgADc6oxGxqy-Uvs_FzWnxwf-vO-UQ8ABPsNuI4ZzZV408wAAgI',
        name: 'Букет 9',
        description: 'Описание для букета 9',
        price: 1400,
    }, {
        photo: 'AgADAgADc6oxGxqy-Uvs_FzWnxwf-vO-UQ8ABPsNuI4ZzZV408wAAgI',
        name: 'Букет 10',
        description: 'Описание для букета 10',
        price: 1400,
    }, {
        photo: 'AgADAgADc6oxGxqy-Uvs_FzWnxwf-vO-UQ8ABPsNuI4ZzZV408wAAgI',
        name: 'Букет 11',
        description: 'Описание для букета 11',
        price: 1400,
    }, {
        photo: 'AgADAgADc6oxGxqy-Uvs_FzWnxwf-vO-UQ8ABPsNuI4ZzZV408wAAgI',
        name: 'Букет 12',
        description: 'Описание для букета 12',
        price: 1400,
    }, {
        photo: 'AgADAgADc6oxGxqy-Uvs_FzWnxwf-vO-UQ8ABPsNuI4ZzZV408wAAgI',
        name: 'Букет 13',
        description: 'Описание для букета 13',
        price: 1400,
    }, {
        photo: 'AgADAgADc6oxGxqy-Uvs_FzWnxwf-vO-UQ8ABPsNuI4ZzZV408wAAgI',
        name: 'Букет 14',
        description: 'Описание для букета 14',
        price: 1400,
    }
];
let bouquetsFunc;

class Bouquets {
    constructor(bouquets) {
        this.availableBouquets = bouquets;
        this._pageNum = 1;
        this._welcomeMsg = 'А теперь выберите из предложенных вариантов желаемый букет!';
        this._messagesToDelete = [];
        this._chosenType = null;
        this._bouquetsCatalogMessages = [];
    }

    static addCallbackDataToBouquets(bouquets) {
        let bouquetesArr = bouquets;

        bouquetesArr.forEach(bouquet => {
            bouquet.data = 'chooseBouquet';
        });
        return bouquetesArr;
    }

    invokeFunction(funcName) {
        this[funcName](arguments[1]);
    }

    _getCatalogPages() {
        return Math.ceil(this.availableBouquets.length / 5);
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

    displayCatalog(ctx) {
        this._displayCatalogPage(ctx).then((msgWereSent) => {
            if (msgWereSent) {
                this._displayPagination(ctx);
            }
        });
    }

    _clearCatalogPageContent(ctx) {
        this._bouquetsCatalogMessages.forEach(({ message_id: id }) => {
            try {
                ctx.deleteMessage(id);
            } catch (error) {
                console.log(error);
            }
        });
        this._bouquetsCatalogMessages.length = 0;
    }

    // Отображает список букетов
    async _displayCatalogPage(ctx) {
        // Данная функция отображает пачку букетов, внизу прикрепляет панель дя переключения страниц с пачками букетов
        let bouquetsPack = this._displayBouquetPack(this._pageNum);

        if (bouquetsPack) {
            for (const bouquet of bouquetsPack) {
                // Формат caption: название, описание, стоимость
                let photoCaption = `<b>${bouquet.name}</b>\n${bouquet.description}\n<i>Стоимость:</i> ${bouquet.price}₽`;

                this._bouquetsCatalogMessages.push(
                    await ctx.telegram.sendPhoto(ctx.chat.id, bouquet.photo, {
                        caption: photoCaption,
                        parse_mode: 'HTML',
                        disable_notification: true,
                        reply_markup: Markup.inlineKeyboard([
                            Markup.callbackButton('Выбрать', bouquet.data)
                        ])
                    }));
            }
            return true;
        }
        // Запишем массив с сообщениями для удаления в свойство messages в объекте текущей сцены
    }

    // Выводит сообещние с кнопками для перехода на другие страницы каталога
    async _displayPagination(ctx) {
        this._bouquetsCatalogMessages.push(
            await ctx.reply('Нажмите на одну из кнопок, чтобы переключить страницу',
                Markup.inlineKeyboard([
                    [Markup.callbackButton(`Страница: ${this._pageNum} из ${Math.ceil(this.availableBouquets.length / 5)}`, 'showPage')],
                    [
                        Markup.callbackButton('< Пред.', 'openPreviousPage'),
                        Markup.callbackButton('След. >', 'openNextPage')
                    ]
                ]).extra()
            )
        );
    }

    _cleanScene(ctx) {
        ctx.scene.messages = this._messagesToDelete.concat(this._bouquetsCatalogMessages);
        ctx.scene.messages.forEach(({ message_id: id }) => {
            try {
                ctx.deleteMessage(id);
            } catch (error) {
                console.log(error);
            }
        });
    }

    showPage(ctx) {
        ctx.telegram.answerCbQuery(ctx.update.callback_query.id, `Страница ${this._pageNum} из ${Math.ceil(this.availableBouquets.length / 5)}`);
    }

    askToChooseBouquet(ctx) {
        ctx.reply(this._welcomeMsg).then((result) => {
            this._messagesToDelete.push(result);
            this.displayCatalog(ctx);
        });
    }

    // Открывает предыдущую страницу каталога
    openPreviousPage(ctx) {
        if (this._pageNum !== 1) {
            ctx.telegram.answerCbQuery(ctx.update.callback_query.id, 'Загружаю страницу');
            this._pageNum--;
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
            this._pageNum++;
            this._clearCatalogPageContent(ctx);
            this.displayCatalog(ctx);
        } else {
            ctx.telegram.answerCbQuery(ctx.update.callback_query.id, 'Вы на последней странице');
        }
    }

    chooseBouquet(ctx) {
        ctx.telegram.answerCbQuery(ctx.update.callback_query.id, '');
        // Извлечем фото среднего размера (вторая сверху)
        let photoId = ctx.update['callback_query'].message.photo[1]['file_id'];
        /* Типы:
            @photoId = String
            @title = String
            @description = String
            @price = String
        */
        // Извлечем текст и нарежем его по строкам
        let [title, description, price] = ctx.update['callback_query'].message.caption.split('\n');
        // Извлечем число из строки с стоимостью букета
        price = price.replace(/^\D+/g, '');
        let caption = `Вы выбрали: \n<b>${title}</b>\n${description}\n<i>Стоимость:</i> ${price}`;

        ctx.telegram.sendPhoto(ctx.chat.id, photoId, {
            caption: caption,
            parse_mode: 'HTML',
            reply_markup: Markup.inlineKeyboard([
                [Markup.callbackButton('Сохранить и выйти', 'saveChosenBouquet')],
                [Markup.callbackButton('Выбрать другой', 'returnToCatalog')]
            ])
        });
    }

    saveChosenBouquet(ctx) {
        // В информацию о выбранном букете будут записаны:
        // * название
        // * фотография букета
        // * стоимость букета

        let [_msgTitle, title, _description, price] = ctx.update['callback_query'].message.caption.split('\n'),
            photoId = ctx.update['callback_query'].message.photo[1]['file_id'],
            bouquetInformation = {};

        ctx.telegram.answerCbQuery(ctx.update.callback_query.id, 'Сохраняю выбранный букет');
        ctx.deleteMessage(ctx.update['callback_query'].message['message_id']);

        bouquetInformation.title = title;
        bouquetInformation.photo = photoId;
        bouquetInformation.price = price.replace(/^\D+/g, '');

        // Эта функция передает полученные данные (2 аргумент) по конкретному ключу в свойсто,
        // хранящее информацию о заказе

        // Запишем в ифнормацию о заказе, в соответствующее свойство выбранный букет
        order.orderInfo = ['bouquet', bouquetInformation];
        ctx.scene.leave('bouqtypeValidation');
    }

    returnToCatalog(ctx) {
        ctx.telegram.answerCbQuery(ctx.update.callback_query.id, '');
        ctx.deleteMessage(ctx.update['callback_query'].message['message_id']);
    }

    confirmBouquetOverride(ctx, chosenBouquet) {
        const { title, photo, price } = chosenBouquet,
        cardCaption = `💐<b>${title}</b>\n💸Стоимость: ${price}`,
            warningMsg = '\n Выбрать другой букет или оставить этот?';

        // chosenBouquet хранит следующие свойства:
        // * title - название букета (String)
        // * photo - ссылку на фотографию букета (String)
        // * price - стоимость букета (Number)

        ctx.reply('Вы раньше выбирали этот букет:').then(message => {
            this._messagesToDelete.push(message);
            return ctx.telegram.sendPhoto(ctx.chat.id, photo, {
                caption: cardCaption + warningMsg,
                parse_mode: 'HTML',
                reply_markup: Markup.inlineKeyboard([
                    [Markup.callbackButton('Оставить этот букет', 'leaveChosenBouquet')],
                    [Markup.callbackButton('Выбрать другой', 'chooseDifferentBouquet')]
                ])
            }).then(message => {
                this._messagesToDelete.push(message);
            });
        });
    }

    leaveChosenBouquet(ctx) {
        ctx.telegram.answerCbQuery(ctx.update.callback_query.id, 'Выхожу в главное меню');
        ctx.scene.leave('bouqtypeValidation');
    }

    chooseDifferentBouquet(ctx) {
        ctx.telegram.answerCbQuery(ctx.update.callback_query.id, 'Загружаю каталог');
        this.displayCatalog(ctx);
    }
}

// Начало блока с обработкой действий пользователя над ботом
bouqtypeValidation.enter((ctx) => {
    let { bouquet: chosenBouquet } = order.orderInfo,
        bouquets = availableBouquets;

    bouquets = Bouquets.addCallbackDataToBouquets(bouquets);

    bouquetsFunc = new Bouquets(bouquets);

    if (chosenBouquet !== undefined) {
        bouquetsFunc.confirmBouquetOverride(ctx, chosenBouquet);
    } else {
        bouquetsFunc.askToChooseBouquet(ctx);
    }
});

bouqtypeValidation.leave((ctx) => {
    bouquetsFunc._cleanScene(ctx);
    order.displayInterface(ctx);
});

bouqtypeValidation.on('callback_query', (ctx) => {
    try {
        bouquetsFunc.invokeFunction(ctx.update['callback_query'].data, ctx);
    } catch (error) {
        ctx.telegram.answerCbQuery(ctx.update.callback_query.id, '⛔ Cейчас эта кнопка не доступна!');
    }
});

bouqtypeValidation.on('message', (ctx) => {
    if (ctx.update.message.text.match(/меню заказа/gi)) {
        ServiceOps.returnToMenu(ctx, order.displayInterface.bind(order), 'bouqtypeValidation');
    } else if (ctx.update.message.text.match(/связаться с магазином/gi)) {
        ServiceOps.displayPhoneNumber(ctx);
    } else if (ctx.update.message.text.match(/отменить заказ/gi)) {
        ctx.reply('Отменяю заказ!(нет)');
    } else {
        ctx.reply('Извините, в данном разделе я не воспринимаю текст.\nВыберите нужный вам тип букета, кликнув по одной из кнопок ниже');
    }
});

module.exports = bouqtypeValidation;