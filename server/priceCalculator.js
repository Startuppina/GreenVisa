function getHotelPrice(option, price) {
    switch (option) {
        case "1-24":
            //increase price depending by case
            return price;
        case "25-49":
            price = 525;
            return price;
        case "50-99":
            price = 790;
            return price;
        case "100-499":
            price = 1180;
            return price;
        default:
            return price;
    }
}

function getTransportPrice(option, price) {
    switch (option) {
        case "1-20":
            //increase price depending by case
            return price;
        case "21-50":
            return price * 1.4;
        case "51-100":
            return price * 1.6;
        case "101-200":
            return price * 1.8;
        case "201+":
            return price * 2;
        default:
            return price;
    }
}

function getIndustryPrice(option, price) {
    switch (option) {
        case "1-10":
            //increase price depending by case
            return price;
        case "11-50":
            return price * 1.4;
        case "51-100":
            return price * 1.6;
        case "101+":
            return price * 1.8;
        default:
            return 0;
    }
}

function getSpaPrice(option, price) {
    switch (option) {
        case "1-20":
            //increase price depending by case
            return price;
        case "21-50":
            return price * 1.4;
        case "51-100":
            return price * 1.6;
        case "101-200":
            return price * 1.8;
        case "201+":
            return price * 2;
        default:
            return price;
    }
}

function getStorePrice(option, price) {
    switch (option) {
        case "1-10":
            //increase price depending by case
            return price;
        case "11-50":
            return price * 1.4;
        case "51-100":
            return price * 1.6;
        case "101+":
            return price * 1.8;
        default:
            return price;
    }
}

function getBarPrice(option, price) {
    switch (option) {
        case "1-49":
            //increase price depending by case
            return price;
        case "50-99":
            price = 450;
            return price;
        case "100-199":
            price = 675;
            return price;
        case "200-299":
            price = 1015;
            return price;
        default:
            return price;
    }
}


module.exports = {
    getHotelPrice,
    getSpaPrice,
    getTransportPrice,
    getIndustryPrice,
    getStorePrice,
    getBarPrice,
};