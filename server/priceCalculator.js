function getHotelPrice(option, price) {
    switch (option) {
        case "1-24":
            //increase price depending by case
            return price;
        case "25-49":
            //price = 525;
            price = 0.5;
            return price;
        case "50-99":
            //price = 790;
            price = 0.5;
            return price;
        case "100-499":
            //price = 1180;
            price = 0.5;
            return price;
        default:
            return price;
    }
}

function getTransportPrice(option, price) {
    switch (option) {
        case "1-10":
            //increase price depending by case
            return price;
        case "11-50":
            //return price * 1.4;
            price = 0.5;
            return price;
        case "51-100":
            //return price * 1.6;
            price = 0.5;
            return price;
        case "101-200":
            //return price * 1.8;
            price = 0.5;
            return price;
        case "201+":
            //return price * 2;
            price = 0.5;
            return price;
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
            //return price * 1.4;
            price = 0.5;
            return price;
        case "51-100":
            //return price * 1.6;
            price = 0.5;
            return price;
        case "101+":
            //return price * 1.8;
            price = 0.5;
            return price;
        default:
            return price;
    }
}

function getSpaPrice(option, price) {
    switch (option) {
        case "1-20":
            //increase price depending by case
            return price;
        case "21-50":
            //return price * 1.4;
            price = 0.5;
            return price;
        case "51-100":
            //return price * 1.6;
            price = 0.5;
            return price;
        case "101-200":
            //return price * 1.8;
            price = 0.5;
            return price;
        case "201+":
            //return price * 2;
            price = 0.5;
            return price;
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
            //return price * 1.4;
            price = 0.5;
            return price;
        case "51-100":
            //return price * 1.6;
            price = 0.5;
            return price;
        case "101+":
            //return price * 1.8;
            price = 0.5;
            return price;
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
            //price = 450;
            price = 0.5;
            return price;
        case "100-199":
            //price = 675;
            price = 0.5;
            return price;
        case "200-299":
            //price = 1015;
            price = 0.5;
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