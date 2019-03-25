class Base {
    constructor() {
        this._userMessages = [];
    }

    static get userMessages() {
        return this._userMessages;
    }

    static set userMessages(message) {
        if (message === 'delete') {
            this._userMessages.length = 0;
        } else {
            const { message_id: id } = message;
            this._userMessages.push(id);
        }
    }
}

module.exports = Base;