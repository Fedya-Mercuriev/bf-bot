const dotenv = require('dotenv');
dotenv.config();
const Telegraf = require('telegraf');
const Markup = require('telegraf/markup');

const invoice = {
    provider_token: process.env.PAYMENT_TOKEN,
    start_parameter: 'time-machine-sku',
    title: 'Working Time Machine',
    description: 'Want to visit your great-great-great-grandparents? Make a fortune at the races? Shake hands with Hammurabi and take a stroll in the Hanging Gardens? Order our Working Time Machine today!',
    currency: 'rub',
    photo_url: 'https://fyf.tac-cdn.net/images/products/large/TEV55-6_R.jpg?auto=webp&quality=60',
    is_flexible: false,
    need_shipping_address: false,
    photo_width: 320,
    photo_height: 320,
    prices: [
        { label: 'Букет', amount: 14000 },
        { label: 'Доставка', amount: 3000 }
    ],
    payload: {
        coupon: 'BLACK FRIDAY'
    }
}

const shippingOptions = [{
        id: 'unicorn',
        title: 'Unicorn express',
        prices: [{ label: 'Unicorn', amount: 140000 }]
    },
    {
        id: 'slowpoke',
        title: 'Slowpoke mail',
        prices: [{ label: 'Slowpoke', amount: 30000 }]
    }
]

const replyOptions = Markup.inlineKeyboard([
    Markup.payButton('💸 Buy'),
    Markup.urlButton('❤️', 'http://telegraf.js.org')
]).extra()

const bot = new Telegraf(process.env.BOT_TOKEN);
bot.start(({ replyWithInvoice }) => replyWithInvoice(invoice))
bot.command('buy', ({ replyWithInvoice }) => replyWithInvoice(invoice, replyOptions))
bot.on('shipping_query', ({ answerShippingQuery }) => answerShippingQuery(true, shippingOptions))
bot.on('pre_checkout_query', ({ answerPreCheckoutQuery }) => answerPreCheckoutQuery(true))
bot.on('successful_payment', () => console.log('Woohoo'))
bot.startPolling();