/* eslint-disable indent */
class OrderInfo {
    constructor() {
        this.info = {
            contactInfo: undefined,
            orderDate: undefined,
            orderTime: undefined,
            bouquet: undefined,
            shipping: undefined,
        };
    }

    get orderInfo() {
        return this.info;
    }

    set orderInfo(settings) {
        const [prop, val] = settings;
        this.info[prop] = val;
    }
}

const orderInfo = new OrderInfo();

module.exports = orderInfo;