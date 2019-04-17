/* eslint-disable class-methods-use-this */
/* eslint-disable indent */
/* eslint-disable no-underscore-dangle */
const Telegraf = require('telegraf');
const { Markup, Extra } = Telegraf;
const order = require('./../order/order');
const Contacts = require('../main-page/contacts');

class Base {
    // Здесь находятся все общие для всех сцен свойства и методы
    constructor() {
        this._botSentMessages = [];
        this._saveDataMsg = [];
        this._statusMessages = [];
    }

    // Сеттер получает объект с сообщением,
    // извлекает из него id и кладет в соответствующую категорию
    set messages(options) {
        const { messageType, messageObj } = options;
        if (messageObj !== 'clear') {
            const { message_id: id } = messageObj;
            this.messagesStorage[messageType].push(id);
            console.log(`Добавили сообщение в: ${messageType}`);
        } else {
            if (messageType === 'all') {
                const messagesStorage = Object.keys(this.messagesStorage);
                messagesStorage.forEach((messageStorage) => {
                    messagesStorage[messageStorage].length = 0;
                });
                console.log('Очистили хранилище для сообщений');
            }
            this.messagesStorage[messageType].length = 0;
            console.log(`Удалили сообщения из: ${messageType}`);
        }
    }

    invokeFunction(passedArgs, ctx) {
        if (passedArgs.indexOf(':') !== -1) {
            // В первой ячейке должно лежать имя функции, которая будет вызвана
            const args = passedArgs.split(':');
            const funcName = args.splice(0, 1);
            return this[funcName](ctx, ...args);
        }
        const funcName = passedArgs;
        return this[funcName](ctx);
    }

    removeMessagesOfSpecificType(ctx, propName) {
        this.messagesStorage[propName].forEach((id) => {
            try {
                ctx.deleteMessage(id);
            } catch (e) {
                console.log(e.message);
            }
        });
        this.messages = {
            messageType: propName,
            messageObj: 'clear',
        };
    }

    _saveAndExit(ctx, optionsArrName) {
        // @keyToAssignData – ключ, по которому в orderInfo будет записываться информация
        // @keyToAccessData – ключ, по которому можн получить данные для записи в orderInfo
        // @notificationMsg – сообщение, которое будет выводится в окне дял уведомлений
        // @sceneName – названий сцены, из которой будет выходить пользователь
        const {
            keyToAssignData,
            keyToAccessData,
            notificationMsg,
            sceneName,
        } = this[optionsArrName];
        ctx.telegram.answerCbQuery(ctx.update.callback_query.id, `⏳ ${notificationMsg}`);
        order.orderInfo = [keyToAssignData, this[keyToAccessData]];
        this.returnToMenu(ctx, sceneName);
    }

    _overwriteData(ctx, funcName) {
        // Функция выводящая сообщение, запрашивающее ввод даты
        // @funcName - название метода внутри текущего класса, который будет вызван
        this.cleanScene(ctx);
        ctx.telegram.answerCbQuery(ctx.update.callback_query.id, '⏳ Минуточку');
        this[funcName](ctx);
    }

    _leaveData(ctx) {
        // Функция выводящая меню заказа (нужна для реакции на соответствующую callback-кнопку)
        // @sceneName – название сцены, которую будет покидать пользователь
        ctx.telegram.answerCbQuery(ctx.update.callback_query.id, '⏳ Загружаю меню заказа');
        this.returnToMenu(ctx, this.leaveDataInfo);
    }

    cleanScene(ctx) {
        // if (this._confirmationMessages.length !== 0) {
        //     ctx.scene.msgToDelete = this.messagesToDelete.concat(this._confirmationMessages);
        // } else {
        //     ctx.scene.msgToDelete = this.messagesToDelete;
        // }
        const messagesBoxes = Object.keys(this.messagesStorage);
        ctx.scene.msgToDelete = [];
        // Склеим все массивы в один большой, по которому будем проходиться и удалять сообщения
        messagesBoxes.forEach((messageStorage) => {
            if (this.messagesStorage[messageStorage].length !== 0) {
                ctx.scene.msgToDelete = ctx.scene.msgToDelete.concat(this.messagesStorage[messageStorage]);
                // После добавления массива - очистим его
                this.messages = {
                    messageType: messageStorage,
                    messageObj: 'clear',
                };
            }
        });
        ctx.scene.msgToDelete.forEach((id) => {
            try {
                ctx.deleteMessage(id);
            } catch (error) {
                console.log(error);
            }
        });
    }

    async _requestContinue(ctx, additionalMsg, propNameToAccessParameters, customButtonsSet) {
        // customButtonsSet – массив с объектами/объект дополнительных кнопок (кнопка "Продолжить" остается)
        const buttonsArr = [
            Markup.callbackButton('Продолжить', `_saveAndExit:${propNameToAccessParameters}`),
        ];
        if (customButtonsSet) {
            // Если был передан набор дополнительных кнопок, перепишем первую кнопку там,
            // чтоб далее кнопки шли друг за другом
            buttonsArr[0] = [Markup.callbackButton('Продолжить', `_saveAndExit:${propNameToAccessParameters}`)];
            // Выполняется если был передан объект
            if (!customButtonsSet.length) {
                const { text, functionName } = customButtonsSet;
                buttonsArr.push([
                    Markup.callbackButton(text, `${functionName}`),
                ]);
                // Выполняется если был передан массив
            } else {
                customButtonsSet.forEach((button) => {
                    const { text, functionName } = button;
                    buttonsArr.push([
                        Markup.callbackButton(text, `${functionName}`),
                    ]);
                });
            }
        }
        this._confirmationMessages = await ctx.reply(`Нажмите на кнопку ниже, чтобы продолжить заказ букета или ${additionalMsg}`,
            Markup.inlineKeyboard(buttonsArr).extra({
                disable_notification: true,
            }));
    }

    returnToMenu(ctx, sceneName) {
        try {
            ctx.telegram.answerCbQuery(ctx.update.callback_query.id, '⏳ Загружаю меню заказа');
        } catch (e) {
            console.log(e.message);
        }
        this.cleanScene(ctx);
        ctx.scene.leave(sceneName);
        ctx.scene.enter('orderScene');
    }

    displayPhoneNumber(ctx) {
        return Contacts.showPhoneNumber(ctx);
    }

    async cancelOrder(ctx) {
        this.messagesToDelete = await ctx.reply('Отменяю заказ');
    }
}

module.exports = Base;