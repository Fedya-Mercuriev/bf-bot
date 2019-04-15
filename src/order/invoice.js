const config = require('../config');

module.exports = class Invoice {
    constructor(title, descr, img, price) {
        this.purchaseData = {
            provider_token: config.payment_token,
            start_parameter: 'time-machine-sku',
            title: title,
            description: descr,
            currency: 'RUB',
            photo_url: img,
            is_flexible: true,
            prices: [
                { label: title, amount: price },
                { label: 'Gift wrapping', amount: 110 }
            ],
            payload: {
                coupon: 'BLACK FRIDAY'
            }
        };
    }

    show() {
        // Вернем чек
    }
}