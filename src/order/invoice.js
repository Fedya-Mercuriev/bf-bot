/* eslint-disable indent */
function generateInvoice(options) {
    const { bouquet: bouquetInfo, shipping } = options;
    const { name, description: bouquetDescription, photo, price } = bouquetInfo;
    const result = {
        provider_token: process.env.PAYMENT_TOKEN,
        start_parameter: 'bouquet-invoice',
        title: name,
        description: bouquetDescription,
        currency: 'RUB',
        photo_url: photo,
        is_flexible: false,
        photo_width: 320,
        photo_height: 320,
        prices: [
            { label: 'Букет', amount: price * 100 },
        ],
        payload: {
            coupon: 'BLACK FRIDAY',
        },
    };
    if (shipping !== false) {
        result.prices.push({
            label: 'Доставка',
            amount: (300 * 100),
        });
    }
    return result;
};

module.exports = generateInvoice;