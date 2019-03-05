const Telegraf = require('telegraf');

const { Markup, Extra } = Telegraf;
// const session = require('telegraf/session');
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
    name: 'Свадебный',
    description: 'Описание для букета 1',
    price: 1200,
  }, {
    photo: 'AgADAgADy6kxG5XK8EvOd89Rk4wcjsFdOQ8ABDtmmzOHO5JhUS4DAAEC',
    name: 'Свадебный',
    description: 'Описание для букета 2',
    price: 1300,
  }, {
    photo: 'AgADAgADzKkxG5XK8EuhCJKmKFR7QuHHUQ8ABTTcdWvMJbi-0gACAg',
    name: 'Свадебный',
    description: 'Описание для букета 3',
    price: 1400,
  }, {
        photo: 'AgADAgADc6oxGxqy-Uvs_FzWnxwf-vO-UQ8ABPsNuI4ZzZV408wAAgI',
        name: 'Свадебный',
        description: 'Описание для букета 4',
        price: 1400,
    }, {
        photo: 'AgADAgADc6oxGxqy-Uvs_FzWnxwf-vO-UQ8ABPsNuI4ZzZV408wAAgI',
        name: 'Свадебный',
        description: 'Описание для букета 5',
        price: 1400,
    }, {
        photo: 'AgADAgADc6oxGxqy-Uvs_FzWnxwf-vO-UQ8ABPsNuI4ZzZV408wAAgI',
        name: 'Свадебный',
        description: 'Описание для букета 6',
        price: 1400,
    }, {
        photo: 'AgADAgADc6oxGxqy-Uvs_FzWnxwf-vO-UQ8ABPsNuI4ZzZV408wAAgI',
        name: 'Свадебный',
        description: 'Описание для букета 7',
        price: 1400,
    }, {
        photo: 'AgADAgADc6oxGxqy-Uvs_FzWnxwf-vO-UQ8ABPsNuI4ZzZV408wAAgI',
        name: 'Свадебный',
        description: 'Описание для букета 8',
        price: 1400,
    }, {
        photo: 'AgADAgADc6oxGxqy-Uvs_FzWnxwf-vO-UQ8ABPsNuI4ZzZV408wAAgI',
        name: 'Свадебный',
        description: 'Описание для букета 9',
        price: 1400,
    }, {
        photo: 'AgADAgADc6oxGxqy-Uvs_FzWnxwf-vO-UQ8ABPsNuI4ZzZV408wAAgI',
        name: 'Свадебный',
        description: 'Описание для букета 10',
        price: 1400,
    }, {
        photo: 'AgADAgADc6oxGxqy-Uvs_FzWnxwf-vO-UQ8ABPsNuI4ZzZV408wAAgI',
        name: 'Свадебный',
        description: 'Описание для букета 11',
        price: 1400,
    },{
        photo: 'AgADAgADc6oxGxqy-Uvs_FzWnxwf-vO-UQ8ABPsNuI4ZzZV408wAAgI',
        name: 'Свадебный',
        description: 'Описание для букета 12',
        price: 1400,
    },{
        photo: 'AgADAgADc6oxGxqy-Uvs_FzWnxwf-vO-UQ8ABPsNuI4ZzZV408wAAgI',
        name: 'Свадебный',
        description: 'Описание для букета 13',
        price: 1400,
    },{
        photo: 'AgADAgADc6oxGxqy-Uvs_FzWnxwf-vO-UQ8ABPsNuI4ZzZV408wAAgI',
        name: 'Свадебный',
        description: 'Описание для букета 14',
        price: 1400,
    }
];
const welcomeMsg = 'А теперь выберите из предложенных вариантов желаемый букет!';
let chosenType = null;
const prepareBouquetsForDisplay = goThroughBouquets(availableBouquets);
let messagesToDelete = [],
    pageNum = 1;

// Добавлет свойство "data" на которое будет реагировать callback-кнопка
function addCallbackDataToBouquets() {
    availableBouquets.forEach(bouquet => {
        bouquet.data = 'chooseBouquet';
    });
}

// Выдает пачку объектов (5шт) за раз
function* goThroughBouquets(arr) {
  let sourceArray = arr.slice(),
      result = [];
// @return (Array) массив содержит в себе объекты с информацией о букетах
    while(sourceArray.length !== 0) {
        if (sourceArray.length >= 5) {
            result = sourceArray.splice(0, 5);
            yield result;
        } else {
            return sourceArray;
        }
    }
}

async function displayBouquets(ctx) {
  let bouquets = prepareBouquetsForDisplay.next();
  // Если длинна исходного массива была больше 5, тогда в конце блока сообщений
  // спрашиваем загрузить ли еще букетов
  if (!bouquets.done) {
    for (const bouquet of bouquets.value) {
        // Формат caption: название, описание, стоимость
        let photoCaption = `<b>${bouquet.name}</b>\n${bouquet.description}\n💰<i>Стоимость:</i>${bouquet.price}`;
        try {
            messagesToDelete.push(
                await ctx.telegram.sendPhoto(ctx.chat.id, bouquet.photo, {
                    caption: photoCaption,
                    parse_mode: 'HTML',
                    reply_markup: Markup.inlineKeyboard([
                        Markup.callbackButton('Выбрать', bouquet.data)
                    ])
                })
        );
        } catch(error) {
            // Это сообщение выводится в случае какой-либо ошибки, возникшей в процессе загрузки букетов на экран
            messagesToDelete.push(
                ctx.reply('🚫Упс! Что-то пошло не так. Нажмите кнопку ниже, чтобы загрузить букеты снова',
                Markup.inlineKeyboard([
                    Markup.callbackButton('Загрузить букеты заново', 'reloadBouquets')
                ]).extra())
        );
        }
    };
    // Добавляем отправленные сообщения в массив. В конце работы все сообщения в нем будут удалены с экрана
    messagesToDelete.push(
      await ctx.reply('Загрузить еще букеты?', Markup.inlineKeyboard([
          Markup.callbackButton('Да, загрузить', 'loadMoreBouquetes')
          ]
      ).extra())
    );
    // Приращаем значение номера страницы
    pageNum++;

    // Иначе выдаем букеты и не прикрепляем сообщение с кнопкой в конце
  } else {
    for (const bouquet of bouquets.value) {
      // Формат caption: название, описание, стоимость
      let cardCaption = `<b>${bouquet.name}</b>\n${bouquet.description}\n<i>Стоимость:</i>${bouquet.price}`;
      messagesToDelete.push(
          await ctx.telegram.sendPhoto(ctx.chat.id, bouquet.photo, {
              caption: cardCaption,
              parse_mode: 'HTML',
              disable_notification: true,
              reply_markup: Markup.inlineKeyboard([
                  Markup.callbackButton('Выбрать этот букет', bouquet.data)
              ])
          })
              .catch(() => {
                messagesToDelete.push(
                    ctx.reply('🚫Упс! Что-то пошло не так. Нажмите кнопку ниже, чтобы загрузить букеты снова',
                      Markup.inlineKeyboard([
                          Markup.callbackButton('Загрузить букеты заново', 'reloadBouquets')
                      ]).extra()
                    )
                );
              })
      )
    }
  }

  // Запишем массив с сообщениями для удаления в свойство messages в объекте текущей сцены
  ctx.scene.state.messages = messagesToDelete;
}

function askToChooseBouquet(ctx) {
  ctx.reply(welcomeMsg).then(() => {
    displayBouquets(ctx);
  });
}

function confirmBouqTypeRewrite(ctx, bouqType) {
  let typeName = this.translateBouqTypeName(bouqType);
  ctx.replyWithHTML(`Вы ранее выбрали этот тип букета: <b>"${typeName}"</b>.\nХотите выбрать другой или оставить этот?`,
    Markup.inlineKeyboard([
      [Markup.callbackButton('Выбрать другой', 'overwriteData')],
      [Markup.callbackButton('Оставить', 'leaveData')],
    ]).extra());
}

function setChosenCategory(ctx, chosenCategory) {
  this.chosenType = chosenCategory;
  let typeName = this.translateBouqTypeName(this.chosenType);
  ctx.replyWithHTML(`Вы выбрали: <b>${typeName}</b>`).then(() => {
    ServiceOps.requestContinue(ctx, 'введите другой тип букета');
  });
}

async function cleanScene(ctx) {
    ctx.scene.messages.forEach(({ message_id: id }) => {
        try {
            ctx.deleteMessage(id);
        } catch(error) {
            console.log(error);
        }
    })
}

// Начало блока с обработкой действий пользователя над ботом
bouqtypeValidation.enter((ctx) => {
  let { bouquetType } = order.getOrderInfo;
    addCallbackDataToBouquets();

  if (bouquetType !== undefined) {
    confirmBouqTypeRewrite(ctx, bouquetType);
  } else {
    askToChooseBouquet(ctx);
  }
});

bouqtypeValidation.leave((ctx) => {
    cleanScene(ctx);
});

// bouqtypeValidation.on('callback_query', (ctx) => {
//   if (ctx.update.callback_query.data === 'overwriteData') {
//     ctx.telegram.answerCbQuery(ctx.update.callback_query.id, '');
//     ServiceOps.processInputData(ctx.update.callback_query.data, ctx, validateType.requestBouqType.bind(validateType));
//   } else if (ctx.update.callback_query.data === 'leaveData') {
//     ctx.telegram.answerCbQuery(ctx.update.callback_query.id, '');
//     ServiceOps.processInputData(ctx.update.callback_query.data, ctx, order.displayInterface.bind(order), 'bouqtypeValidation');
//   } else if (ctx.update.callback_query.data !== 'продолжить') {
//     ctx.telegram.answerCbQuery(ctx.update.callback_query.id, '');
//     console.log(ctx.update.callback_query);
//     validateType.setChosenCategory(ctx, ctx.update.callback_query.data);
//
//     // Обрабатывает клик по кнопке "Продолжить"
//   } else {
//     ctx.telegram.answerCbQuery(ctx.update.callback_query.id, '');
//     order.setOrderInfo = ['bouquetType', validateType.chosenType];
//     ctx.telegram.deleteMessage(ctx.update.callback_query.message.chat.id, ctx.update.callback_query.message.message_id);
//     order.displayInterface(ctx);
//     ctx.scene.leave('bouqtypeValidation');
//   }
// });

// Начало блока обработки кликов по конкретным callback-кнопкам
bouqtypeValidation.action('reloadBouquets', () => {
  // Стираем сообщения и загружаем все заново
});

bouqtypeValidation.action('chooseBouquet', (ctx) => {
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
    price = price.replace( /^\D+/g, '');
    let caption = `Вы выбрали: \n<b>${title}</b>\n${description}\n${price}руб.`;

    ctx.telegram.sendPhoto(ctx.chat.id, photoId, {
        caption: caption,
        parse_mode: 'HTML',
        reply_markup: Markup.inlineKeyboard([
            [
                Markup.callbackButton('Сохранить и выйти', 'saveChosenBouquet')
            ],[
                Markup.callbackButton('Выбрать другой', 'chooseDifferentBouquet')
            ]
        ])
    })
});

bouqtypeValidation.action('loadMoreBouquetes', (ctx) => {
    ctx.telegram.answerCbQuery(ctx.update.callback_query.id, 'Загружаю еще букеты');
    messagesToDelete.push(ctx.telegram.editMessageText(ctx.chat.id, ctx.update['callback_query'].message['message_id'], null, `Страница: ${pageNum}`))
    displayBouquets(ctx);
});

bouqtypeValidation.action('saveChosenBouquet', (ctx) => {
    // Сохраняем выбранный букет и выходим из текущей сцены
});

bouqtypeValidation.action('chooseDifferentBouquet', (ctx) => {
    //Удаляем сообщение с выбранным букетом
});
// Конец блока обработки кликов по конкретным callback-кнопкам

bouqtypeValidation.on('message', (ctx) => {
  if (ctx.update.message.text.match(/меню заказа/gi)) {
    ServiceOps.returnToMenu(ctx, order.displayInterface.bind(order), 'bouqtypeValidation');
  } else if (ctx.update.message.text.match(/связаться с магазином/gi)) {
    ServiceOps.displayPhoneNumber(ctx);
  } else if (ctx.update.message.text.match(/отменить заказ/gi)) {
    ctx.reply('Отменяю заказ!(нет)');
  } else {
    ctx.reply('Извините, в данном разделе я не воспринимаю текст.\nВыберите нужный вам тип букета, кликнув по одной из кнопок ниже'
    );
  }
});
// Конец блока с обработкой действий пользователя над ботом

module.exports = bouqtypeValidation;
