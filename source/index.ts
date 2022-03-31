'use strict';

import { join } from 'path';
import chalk from 'chalk';

import { Task } from './task';
import { parallel } from 'workflow-extra';

interface ConfigInterface {
    entry: string;
}

interface ExecuteResultInterface {
    state: 'skip' | 'warn' | 'error' | 'success';
    info: string;
}

interface RegisterOptionsInterface {
    title: string;
    pre?: Function;
    post?: Function;
    timeLength?: number;
    parallel? : number;
    execute: (file: string) => ExecuteResultInterface;
}

const options: {
    config: ConfigInterface;
    workspaces: string[];
    tasks: Record<string, RegisterOptionsInterface>
} = {
    config: {
        entry: '.workflow.js',
    },
    workspaces: [],
    tasks: {},
};

/**
 * 设置全局参数
 * @param opts 
 */
export function config(opts: ConfigInterface) {
    options.config.entry = opts.entry || options.config.entry;
}

/**
 * 添加一个工作区
 * @param dir 
 */
export function addWorkspace(dir: string) {
    options.workspaces.push(dir);
}

/**
 * 注册一个任务
 * @param name 
 * @param opts 
 */
export function register(name: string, opts: RegisterOptionsInterface) {
    options.tasks[name] = opts;
}

/**
 * 执行一个任务
 * @param name 
 * @returns 
 */
export async function execute(name: string) {
    const opts = options.tasks[name];
    if (!opts) {
        return;
    }
    const task = new Task();
    
    const title = ` ${opts.title} `.padStart(30 + opts.title.length / 2, '=').padEnd(60, '=')
    console.log(chalk.magenta(title));
    if (opts.pre) {
        opts.pre.call(task);
    }

    const results = await parallel(options.workspaces, async (dir: string) => {
        const file = join(dir, options.config.entry);

        const time = Date.now();
        let result: {
            state: string;
            info: string | Error;
        } = {
            state: 'skip',
            info: '',
        };
        try {
            result = await opts.execute.call(task, file);

            if (!['error', 'success', 'warn', 'skip'].includes(result.state)) {
                throw new Error(`Unknown state: ${result.state}`);
            }

            result.info = result.info || '';
        } catch(error) {
            result.state = 'error';
            result.info = new Error(`Execute failed! ${error + ''}`);
        }

        let message = String((Date.now() - time) + 'ms').padEnd(opts.timeLength || 10) + ' ';

        switch (result.state) {
            case 'error':
                message += chalk.red(result.state.padEnd(7) + ' ');
                break;
            case 'success':
                message += chalk.green(result.state.padEnd(7) + ' ');
                break;
            default:
                message += chalk.yellow(result.state.padEnd(7) + ' ');
        }
        message += result.info;
        console.log(message);

        return result;
    }, opts.parallel || 1);

    if (opts.post) {
        opts.post.call(task);
    }

    return results;
}
