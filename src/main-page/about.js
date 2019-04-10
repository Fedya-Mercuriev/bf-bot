module.exports = class About {

    constructor() {
        this.info = "Блаблабла, хуё-маё";
    }

    displayInfo(ctx) {
        ctx.replyWithSticker('CAADAgADgwADIIEVAAHe1ptG1BvPVAI');
        ctx.reply(this.info);
    }
};