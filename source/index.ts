'use strict';

import { join } from 'path';
import chalk from 'chalk';

import { Task } from './task';
import { setCacheFile } from './cache';
import { parallel } from 'workflow-extra';
import { existsSync } from 'fs';

interface ConfigInterface {
    // 工作区的配置文件
    entry: string;
    // 临时文件所在的路径
    // 当设置了临时文件后，在 task 里存储的数据可以缓存在文件系统
    cache?: string;
    // 传递给每一个配置生成函数的参数
    params?: any;
}

type TaskState = 'skip' | 'warn' | 'error' | 'success' | 'null';

type TaskInfo = {
    state: TaskState;
    workspace: string;
    duration: number;
}

interface RegisterOptionsInterface {
    title: string;
    pre?: Function;
    post?: Function;
    timeLength?: number;
    parallel? : number;
    execute: (file: string) => Promise<TaskState>;
}

const options: {
    config: ConfigInterface;
    workspaces: string[];
    tasks: Record<string, RegisterOptionsInterface>
} = {
    config: {
        entry: '.workflow.js',
        cache: undefined,
        params: {},
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
    options.config.params = opts.params || options.config.params;
    options.config.cache = opts.cache || options.config.cache;

    if (options.config.cache) {
        setCacheFile(options.config.cache);
    }
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

    const task = new Task(name);
    
    const title = ` ${opts.title} `.padStart(30 + opts.title.length / 2, '=').padEnd(60, '=')
    console.log(chalk.magenta(title));
    if (opts.pre) {
        opts.pre.call(task);
    }

    const results = await parallel(options.workspaces, async (dir: string) => {
        const file = join(dir, options.config.entry);

        const time = Date.now();
        const result: TaskInfo = {
            state: 'null',
            workspace: dir,
            duration: 0,
        };

        if (!existsSync(file)) {
            result.state = 'null';
            return result;
        }

        const subTask = new Task(name);
        try {
            const configMap = require(file);

            if (!configMap[name]) {
                result.state = 'null';
                return result;
            }

            const config = configMap[name](options.config.params);

            result.state = await opts.execute.call(subTask, config);

            if (!['error', 'success', 'warn', 'skip', 'null'].includes(result.state)) {
                throw new Error(`Unknown state: ${result.state}`);
            }
        } catch(error) {
            result.state = 'error';
            if (!(error instanceof Error)) {
                error = new Error(error + '');
            }
            subTask.print(error as Error);
        }
        result.duration = Date.now() - time;
        let message = String(result.duration + 'ms').padEnd(opts.timeLength || 10) + ' ';

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
        message += dir;

        if (result.state !== 'null') {
            console.log(message);
            subTask.printAll();
        }

        return result;
    }, opts.parallel || 1);

    if (opts.post) {
        opts.post.call(task);
    }

    return results;
}

/**
 * 清空注册的任务以及工作区
 */
export function clear() {
    options.workspaces = [];
    options.config =  {
        entry: '.workflow.js',
        cache: undefined,
        params: {},
    };
    options.tasks = {};
}
