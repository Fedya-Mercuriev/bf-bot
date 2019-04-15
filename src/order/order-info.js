class OrderInfo {
    constructor() {
        this.info = {
            contactInfo: undefined,
            orderDate: undefined,
            orderTime: undefined,
            // orderDateInNumbers: undefined,
            bouquetType: undefined,
            shipping: undefined,
            bouquetPrice: undefined
        };
    }

    get getOrderInfo() {
        return this.info;
    }

    set setOrderInfo(settings) {
        let [prop, val] = settings;
        this.info[prop] = val;
    }
}

module.exports = new OrderInfo();