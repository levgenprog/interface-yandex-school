module.exports = async function ({ minPrice, maxPrice, catalog }) {
    const activeChildren = await getActiveProducts(catalog);

    let r = activeChildren.map(async (ch) => {
        let name = await classFunctionPromise(ch, ch.getName);
        let price = await classFunctionPromise(ch, ch.getPrice);
        if (price >= minPrice && price <= maxPrice) {
            return { name: name, price: price };
        }
        return;
    })

    const result = (await Promise.all(r)).filter(Boolean);
    result.sort((a, b) => a.price - b.price || a.name.localeCompare(b.name));
    console.log(result);
    return result;
}

async function classFunctionPromise(catalog, asyncFunction) {
    return new Promise((resolve, reject) => {
        asyncFunction((error, result) => {
            if (error) {
                return classFunctionPromise(catalog, asyncFunction)
                    .then(resolve)
                    .catch(reject)
            } else {
                resolve(result);
            }
        });
    });
}

async function getActiveProducts(category) {
    const productsQueue = [];
    const isActive = await classFunctionPromise(category, category.checkIsActive);
    if (!isActive) return [];
    if (category instanceof Product) {
        productsQueue.push(category);
    } else {
        const children = await classFunctionPromise(category, category.getChildren);
        const activeChildren = await Promise.all(children.map(getActiveProducts));
        const products = activeChildren.reduce((acc, child) => acc.concat(child), []);
        productsQueue.push(...products);
    }

    return productsQueue;
}