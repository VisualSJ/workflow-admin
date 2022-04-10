'use strict';

const workflow = require('../../dist');
const { join } = require('path');
const { readJSONSync, existsSync, removeSync } = require('fs-extra');
const { expect } = require('chai');

const TEMP_DIR = join(__dirname, '../.temp');
const TEMP_JSON = join(__dirname, '../.temp/.cache.json');

describe('流程管理测试', () => {
    let totalTime = 0;
    before(() => {
        if (existsSync(TEMP_JSON)) {
            removeSync(TEMP_JSON);
        }

        workflow.config({
            entry: '.config.js',
        });

        workflow.config({
            params: {
                test: 1,
            },
            cache: TEMP_JSON,
        });

        workflow.register('param', {
            title: '测试传递参数',
            parallel: 2,
            pre() {
                this.time = Date.now();
            },
            post() {
                totalTime = Date.now() - this.time;
            },
            async execute(config) {
                return config;
            },
        });

        workflow.register('cache', {
            title: '测试数据缓存',
            parallel: 2,
            pre() {
                this.time = Date.now();
            },
            post() {
                totalTime = Date.now() - this.time;
            },
            async execute(config) {
                if (this.getCache('test')) {
                    return 'error';
                }
                this.setCache('test', true);
                return 'success';
            },
        });

        workflow.addWorkspace(join(__dirname, './workspace-a'));
        workflow.addWorkspace(join(__dirname, './workspace-b'));
    });

    after(() => {
        if (existsSync(TEMP_DIR)) {
            removeSync(TEMP_DIR);
        }
        workflow.clear();
    });

    it('传递参数', async () => {
        const results = await workflow.execute('param');
        expect(results[0].state).equal('success');
    });

    it('设置缓存', async () => {
        const results = await workflow.execute('cache');
        expect(results[0].state).equal('success');
        expect(results[1].state).equal('error');
    });

    it('缓存文件内容', async () => {
        await new Promise((resolve) => {
            setTimeout(resolve, 1500);
        });
        const json = readJSONSync(TEMP_JSON);
        expect(!!json).is.true;
        expect(!!json.cache).is.true;
        expect(json.cache.test).is.true;
    });

});