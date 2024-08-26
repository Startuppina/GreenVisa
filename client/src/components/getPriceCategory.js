function getPriceCategory(category) {
    if (category === "Certificazione hotel") {
        return `350,00 € - 1180,00 €`;
    } else if (category === "Certificazione spa e resort") {
        return `350,00 € - 1000,00 €`;
    } else if (category === "Certificazione trasporti") {
        return `350,00 € - 1000,00 €`;
    } else if (category === "Certificazione industria") {
        return `350,00 € - 1000,00 €`;
    } else if (category === "Certificazione store e retail") {
        return `350,00 € - 1000,00 €`;
    } else {
        return `350,00 € - 1015,00 €`;
    }
}

export default getPriceCategory;