'use strict';

// --------------------
// 任务的缓存信息管理器
// --------------------

import { existsSync, outputJSONSync, readJSONSync } from 'fs-extra';

interface Cache {
    [task: string]: {
        [name: string]: any;
    }
}

let cacheFile: string = '';
let cache: Cache = {};

const DELAY_TIME = 1000;
let delayTimer: NodeJS.Timeout | null  = null;

export function setCacheFile(file: string) {
    cacheFile = file;
    if (existsSync(file)) {
        cache = readJSONSync(file);
    }
}

let cacheDir: string = '';
export function setCacheDir(dir: string) {
    cacheDir = dir;
}

export function getCacheDir() {
    return cacheDir;
}

export function set(task: string, name: string, value: any) {
    cache[task] = cache[task] || {};
    cache[task][name] = value;

    if (delayTimer) {
        delayTimer.refresh();
    } else {
        delayTimer = setTimeout(() => {
            delayTimer = null;
            cacheFile && outputJSONSync(cacheFile, cache, {
                spaces: 2,
            });
        }, DELAY_TIME);
    }
}

export function get(task: string, name: string) {
    if (!cache[task]) {
        return void 0;
    }
    return cache[task][name];
}
