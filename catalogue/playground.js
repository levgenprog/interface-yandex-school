'use strict';

((global) => {
    const addTimeout = (fn) => {
        return () => {
            setTimeout(() => {
                fn();
            }, 100 * Math.random());
        };
    };

    const addRandomError = (fn, result) => {
        return () => {
            const isError = Math.random() <= 0.2;

            if (isError) {
                fn(new Error('Something went wrong'), null);
            } else {
                fn(null, result);
            }
        }
    }

    const getModifiedCallback = (fn, result) => {
        return addTimeout(addRandomError(fn, result));
    }

    class Entity {
        constructor(name, isActive) {
            this.getName = (callback) => {
                getModifiedCallback(callback, name)();
            };

            this.checkIsActive = (callback) => {
                getModifiedCallback(callback, isActive)();
            };
        }
    }

    class Category extends Entity {
        constructor(name, status, children) {
            super(name, status);

            this.getChildren = (callback) => {
                getModifiedCallback(callback, children)();
            };
        }
    }

    class Product extends Entity {
        constructor(name, status, price) {
            super(name, status);

            this.getPrice = (callback) => {
                getModifiedCallback(callback, price)();
            };
        }
    }

    global.Product = Product;
    global.Category = Category;
})(typeof window === 'undefined' ? global : window);

// решение задачи
async function solution({ minPrice, maxPrice, catalog }) {

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

module.exports = solution;

// проверка решения
const input = {
    minPrice: 300,
    maxPrice: 1500,
    catalog: new Category("Catalog", true, [
        new Category("Electronics", true, [
            new Category("Smartphones", true, [
                new Product("Smartphone 1", true, 1000),
                new Product("Smartphone 2", true, 900),
                new Product("Smartphone 3", false, 900),
                new Product("Smartphone 4", true, 900),
                new Product("Smartphone 5", true, 900)
            ]),
            new Category("Laptops", true, [
                new Product("Laptop 1", false, 1200),
                new Product("Laptop 2", true, 900),
                new Product("Laptop 3", true, 1500),
                new Product("Laptop 4", true, 1600)
            ]),
        ]),
        new Category("Books", true, [
            new Category("Fiction", false, [
                new Product("Fiction book 1", true, 350),
                new Product("Fiction book 2", false, 400)
            ]),
            new Category("Non-Fiction", true, [
                new Product("Non-Fiction book 1", true, 250),
                new Product("Non-Fiction book 2", true, 300),
                new Product("Non-Fiction book 3", true, 400)
            ]),
        ]),
    ])
}

const answer = [
    { name: "Non-Fiction book 2", price: 300 },
    { name: "Non-Fiction book 3", price: 400 },
    { name: "Laptop 2", price: 900 },
    { name: "Smartphone 2", price: 900 },
    { name: "Smartphone 4", price: 900 },
    { name: "Smartphone 5", price: 900 },
    { name: "Smartphone 1", price: 1000 },
    { name: "Laptop 3", price: 1500 }
];

solution(input).then(result => {
    const isAnswerCorrect = JSON.stringify(answer) === JSON.stringify(result);

    if (isAnswerCorrect) {
        console.log('OK');
    } else {
        console.log('WRONG');
    }
});