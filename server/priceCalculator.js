function getHotelPrice(option, price) {
    switch (option) {
        case "1-50":
            //increase price depending by case
            return price;
        case "51-100":
            return price * 1.4;
        case "101-150":
            return price * 1.6;
        case "151-200":
            return price * 1.8;
        default:
            return 0;
    }
}

function getTransportPrice(option, price) {
    switch (option) {
        case "1-50":
            //increase price depending by case
            return price;
        case "51-100":
            return price * 1.4;
        case "101-150":
            return price * 1.6;
        case "151-200":
            return price * 1.8;
        default:
            return 0;
    }
}

function getIndustryPrice(option, price) {
    switch (option) {
        case "1-50":
            //increase price depending by case
            return price;
        case "51-100":
            return price * 1.4;
        case "101-150":
            return price * 1.6;
        case "151-200":
            return price * 1.8;
        default:
            return 0;
    }
}

function getSpaPrice(option, price) {
    switch (option) {
        case "1-50":
            //increase price depending by case
            return price;
        case "51-100":
            return price * 1.4;
        case "101-150":
            return price * 1.6;
        case "151-200":
            return price * 1.8;
        default:
            return 0;
    }
}

function getStorePrice(option, price) {
    switch (option) {
        case "1-50":
            //increase price depending by case
            return price;
        case "51-100":
            return price * 1.4;
        case "101-150":
            return price * 1.6;
        case "151-200":
            return price * 1.8;
        default:
            return 0;
    }
}

function getBarPrice(option, price) {
    switch (option) {
        case "1-50":
            //increase price depending by case
            return price;
        case "51-100":
            return price * 1.4;
        case "101-150":
            return price * 1.6;
        case "151-200":
            return price * 1.8;
        default:
            return 0;
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