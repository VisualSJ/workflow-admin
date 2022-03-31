'use strict';

import { statSync, readdirSync, Stats } from 'fs';
import { join } from 'path';
import { spawn, SpawnOptionsWithoutStdio } from 'child_process';

export class Task {
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
    async spawn(cmd: string, args: readonly string[], opts: SpawnOptionsWithoutStdio | undefined) {
        return new Promise((resolve, reject) => {
            opts = opts || {};
            // @ts-ignore
            opts.stdio = opts.stdio || [1, 2, 3];
            const child = spawn(cmd, args, opts);
            child.on('error', reject);
            child.on('exit', resolve);
        });
    }
}