'use strict';

const workflow = require('../dist');
const { join, dirname } = require('path');

workflow.config({
    entry: '.w.js',
});

workflow.addWorkspace(join(__dirname, './mock1'));
workflow.addWorkspace(join(__dirname, './mock2'));

workflow.register('js', {
    title: 'Typescript',
    timeLength: 8,
    stateLength: 7,
    parallel: 2,
    pre() {
        this.time = Date.now();
    },
    post() {
        console.log(`总耗时: ${Date.now() - this.time}ms`);
    },
    async execute(file) {
        const mod = require(file);
        await mod.js();
        return {
            state: 'success',
            level: 'success',
            info: dirname(file),
        };
    },
});

workflow.execute('js').then((results) => {
    console.log(`执行次数: ${results.length}`);

    if (results.some(result => result.info instanceof Error)) {
        console.log('执行失败');
    } else {
        console.log('执行成功');
    }
});
