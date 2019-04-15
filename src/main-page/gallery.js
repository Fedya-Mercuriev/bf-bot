module.exports = class Gallery {
    constructor() {
        this.photos = [
            {
                'media': 'https://pp.userapi.com/c631920/v631920791/1b3ab/u5uhgBHTXTM.jpg',
                'caption': 'Экстравагантный, для смелых\n' + 'В составе букета: Альстромерия, роза, рускус, салал',
                'type': 'photo'
            },{
                'media': 'https://pp.userapi.com/c631920/v631920791/1b3a1/xyMMIlCkLaY.jpg',
                'caption': 'Стильный и интересный букет \n' + 'В составе букета: Роза “кабарет”, седум, альстремерия желтая и красная, салал, рускус',
                'type': 'photo'
            },{
                'media': 'https://pp.userapi.com/c625521/v625521791/450dc/gx5T6IXewTY.jpg',
                'caption': 'В составе букета: Хризантема одиночная "Шамрок", хризантема кустовая, альстремерия оранжевая, сантини, рускус',
                'type': 'photo'
            }
        ];
    }

    addPhotos(photoObj) {
        this.photos.push(photoObj);
    }

    show(ctx) {
        ctx.replyWithMediaGroup(this.photos);
    }
};