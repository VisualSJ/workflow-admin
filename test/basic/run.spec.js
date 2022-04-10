'use strict';

const workflow = require('../../dist');
const { join } = require('path');
const { expect } = require('chai');

describe('流程管理测试', () => {
    let totalTime = 0;
    before(() => {
        workflow.config({
            entry: '.config.js',
        });

        workflow.register('tsc', {
            title: 'Build Typescript',
            parallel: 2,
            pre() {
                this.time = Date.now();
            },
            post() {
                totalTime = Date.now() - this.time;
            },
            async execute(config) {
                if (typeof config !== 'string') {
                    // 将没有 tsc 的延迟到最后完成，测试队列顺序是否正常
                    await new Promise((resolve) => {
                        setTimeout(resolve, 400);
                    });
                    return 'skip';
                }
                await new Promise((resolve) => {
                    setTimeout(resolve, 200);
                });
                return config;
            },
        });

        workflow.addWorkspace(join(__dirname, './workspace-a'));
        workflow.addWorkspace(join(__dirname, './workspace-b'));
        workflow.addWorkspace(join(__dirname, './workspace-c'));
        workflow.addWorkspace(join(__dirname, './workspace-d'));
        workflow.addWorkspace(join(__dirname, './workspace-e'));
        workflow.addWorkspace(join(__dirname, './workspace-f'));
    });

    after(() => {
        workflow.clear();
    });

    let results;
    it('执行流程', async () => {
        results = await workflow.execute('tsc');
        // console.log(results);
    });

    it('并行队列', async () => {
        // a-b 直接跳过，c 占用 400ms，d-e 占用 200ms
        // 并行两个队列，总耗时应该是 400ms+
        expect(totalTime).above(400).below(420);
    });

    it('没有配置文件，不执行 execute', () => {
        expect(results[0].state).equal('null');
    });

    it('配置文件没有内容，跳出 execute，不执行流程', () => {
        expect(results[1].state).equal('null');
    });

    it('配置文件有内容，在 execute 里 skip 跳过', () => {
        expect(results[2].state).equal('skip');
    });

    it('配置文件有内容，在 execute 里编译成功', () => {
        expect(results[3].state).equal('success');
    });

    it('配置文件有内容，在 execute 里编译失败', () => {
        expect(results[4].state).equal('error');
    });

    it('配置文件有内容，但在 execute 里出现异常', () => {
        expect(results[5].state).equal('error');
    });
});