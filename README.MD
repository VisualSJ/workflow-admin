# 工作流程管理

这是一个简单的工作流管理程序，它只负责管理多个细碎的流程，并提供一些常用的 utils。

大家可以根据需要，增加不同的任务，并根据设置定制一些运行方式。

## 标记配置文件

```typescript
workflow.config({
    entry: '.editor.js',
});
```

## 添加管理目录

```typescript
workflow.addWorkspace('/Downloads/a');
workflow.addWorkspace('/Downloads/b');
```

## 注册 / 执行某个流程

```typescript
workflow.register('typescript', {
    // 显示的任务名称
    title: 'Typescript',
    // 运行时间显示的长度
    timeLength: 8,
    // 状态空的长度
    stateLength: 7,
    // 同时允许并发处理的数量
    parallel: 2,
    // 单前任务运行前，执行的回调
    pre() {
        this.time = Date.now();
    },
    // 当前任务运行完毕后，执行的回调
    post() {
        console.log(`总耗时: ${Date.now() - this.time}ms`);
    },
    // 当前任务，在每个工作区执行的实际逻辑
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

// 执行
workflow.execute('js').then((results) => {
    console.log(results.length)
    console.log(results);
});
```

## 开发

编译：
```bash
tsc
```

测试：
```bash
npm run test
```
