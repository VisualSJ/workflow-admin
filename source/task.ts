'use strict';

import { statSync, readdirSync, Stats } from 'fs';
import { join, dirname } from 'path';
import { spawn, SpawnOptionsWithoutStdio } from 'child_process';
import { set, get } from './cache';

export class Task {

    private name: string;
    path: string;
    file: string;

    constructor(name: string, file: string) {
        this.name = name;
        this.file = file;
        this.path = dirname(file);
    }

    /**
     * 传入一个文件地址，扫描这个文件地址里，所有的文件和文件夹
     * 并将扫描到的每个文件或文件夹，都传入 handle 里处理
     * @param fileOrDir 
     * @param handle 
     */
    async scanFile(fileOrDir: string, handle: (file: string, stat: Stats) => void) {
        const stat = statSync(fileOrDir);
        handle(fileOrDir, stat);
        if (stat.isDirectory()) {
            const names = readdirSync(fileOrDir);

            for (let name of names) {
                await this.scanFile(join(fileOrDir, name), handle);
            }
        }
    }

    /**
     * 打开一个子进程
     * @param cmd 
     * @param args 
     * @param opts 
     * @returns 
     */
    async spawn(cmd: string, args: readonly string[], opts: SpawnOptionsWithoutStdio | undefined, handle?: (chunk: Buffer) => void) {
        return new Promise((resolve, reject) => {
            opts = opts || {};
            // @ts-ignore
            opts.stdio = opts.stdio || 'pipe';
            const child = spawn(cmd, args, opts);
            if (!handle) {
                handle = (chunk) => {
                    this.print(chunk + '');
                };
            }
            child.stdout && child.stdout.on('data', handle);
            child.on('error', reject);
            child.on('exit', resolve);
        });
    }

    private _logs: string[] = [];

    /**
     * 输出日志，会积攒在一起，在任务运行完成后一起输出
     * @param str 
     */
    print(str: any) {
        if (str instanceof Error) {
            this._logs.push('    ' + str.message);
            if (str.stack) {
                str.stack?.split('\n').forEach((str) => {
                    this._logs.push('    ' + str);
                });
            }
        } else {
            this._logs.push('    ' + str);
        }
    }

    /**
     * 将所有的日志输出到控制台
     */
    printAll() {
        this._logs.forEach((item) => {
            console.log(item);
        });
    }

    /**
     * 设置一个缓存数据
     * @param key 
     * @param value 
     */
    setCache(key: string, value: string | number | boolean) {
        set(this.name, key, value);
    }

    /**
     * 读取一个缓存数据
     * @param key 
     * @returns 
     */
    getCache(key: string): string | number | boolean {
        return get(this.name, key);
    }
}