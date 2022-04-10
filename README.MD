# 工作流程管理

每个项目都需要有自己的研发、打包工作流。这个工作流包含多个步骤，都需要输出一些信息和收集运行日志。

workflow-admin 小工具可以协助项目管理编译任务，并逐个工作区去运行这些流程，最终返回输出收集到的信息。

我们将仓库工作流分成了 "流程任务" 和 "工作区"。

流程任务就是一个最基础的编译或者操作任务，例如使用 tsc 编译，使用 lessc 编译，甚至是移动文件到指定位置。

工作区则是 mono repo 思路下诞生的产物，每一个仓库里可能有非常多的需要使用相同工作流程的模块，每个模块就是一个 "工作区"，当执行 tsc 编译的时候，会循环每一个工作区都执行一遍。


## 安装

```bash
npm install workflow-admin
```

## 开始使用

在开始流程的入口文件内初始化所有的 "流程任务"，例如 tsc 编译、lessc 编译等任务。

```typescript
workflow.register('tsc', {
    // 显示的任务名称
    title: 'Build Typescript',
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
    async execute(config) {
        // 调用 spawn 执行 tsc 任务
        // return 'error';
        return 'success';
    },
});
```

然后我们需要注册每一个工作区。

```typescript
workflow.addWorkspace('/Downloads/a');
workflow.addWorkspace('/Downloads/b');
```

设置工作区内的配置文件名字。

```typescript
workflow.config({
    entry: '.config.js',
});
```

这样工作流在每个工作区内，就会自动去寻找配置文件。

同时我们需要在工作区里放一个配置文件，可以这样注册配置文件名称。

配置文件里里暴露的名字是注册任务的时候的名字，例如下面 tsc 传出了一个数组，在执行 tsc 任务的时候，就会将数组传递给任务作为入参。

```javascript
exports.tsc = function(params) {
    return [];
};
```

最终我们准备好数据后，就可以执行某一个或者一些的任务。

```typescript
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
