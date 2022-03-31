'use strict';

exports.js = async function() {
    await new Promise((resolve) => {
        setTimeout(resolve, 2000);
    });
    throw '123';
    return [
        '../'
    ];
}