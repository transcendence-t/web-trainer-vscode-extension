# 网页闯关设计

## 教学流程

学生在 VS Code 活动栏打开「WEB闯关练习」，可直接进入内置课程中的任一关。左侧课程树按 HTML、CSS 基础、CSS 进阶、JavaScript 基础、JavaScript 网页交互、综合项目排列，并自动定位当前关卡。中间面板显示学习目标、讲解、任务、代码示例、提示、参考答案与网页预览。每次切关时默认展开代码示例。右侧使用 VS Code 原生编辑器。点击「检查答案」后显示逐项结果，通过时保存已提交的代码和进度。进度按课程 ID、关卡 ID 保存在当前 VS Code 用户配置中。新增题按学习顺序插入，对应章节关数和整门课程进度从课程清单计算。

## 上游研究与技术选型

| 项目 | 架构与取舍 | 许可证 |
| --- | --- | --- |
| [CodeSwing](https://github.com/lostintangent/codeswing/tree/96060049ee9795cc6dc92fb60274072d22ed815e) | VS Code 原生编辑器与 Webview 分栏，使用 `onDidChangeTextDocument` 和 `debounce` 更新预览。复用这段监听模式和同一个 debounce 库。课程判题、预览沙箱和界面按本项目需求实现。 | [MIT](https://github.com/lostintangent/codeswing/blob/96060049ee9795cc6dc92fb60274072d22ed815e/LICENSE.txt) |
| [CSS Diner 示例](https://github.com/lostintangent/css-diner/tree/c05221c273bf026441e28cfab069be423de3021c) | 每步目录含说明和配置，用页面 DOM 反馈选择结果。示例依赖 jQuery 和线上字体。借鉴独立题目目录与 DOM 反馈，编写原创中文内容。 | 所查提交未声明许可证，未分发其源码、图片或题目。 |
| [CodeRoad](https://github.com/coderoad/coderoad-vscode/tree/13cd6cc9755dc115f0e9c2fecb1e2cd7322c785d) | React Webview 与扩展主机交换消息，Git 驱动步骤，命令行执行测试。借鉴过关条件、测试和内容分离。 | [AGPL-3.0](https://github.com/coderoad/coderoad-vscode/blob/13cd6cc9755dc115f0e9c2fecb1e2cd7322c785d/LICENSE.md)，未分发其代码。 |

采用 TypeScript、VS Code 的 Tree View 和 Webview、Chromium 原生 DOM/CSSOM。预览读取未保存的编辑缓冲区，HTML 由 parse5 解析组装，JavaScript 由 Acorn 检查语法并给常见循环加入中断保护。学生代码在受 CSP 限制、无同源权限的 iframe 中执行。判题使用新的页面运行声明式 DOM、样式、交互断言。课程和前端资源打包到 VSIX，由 VS Code 内置扩展主机运行。

CSS 边框宽度和轮廓长度会随系统显示缩放按设备像素取整。判题在同一页面校准预期值，并在加载判题文档前确定 iframe 的宽度。响应式检查可以在多个视口下验证排版和图片选源。样式规则也可读取伪元素的计算值，或单独切换指定的 `@media` 条件再取样。 [CSS 边框宽度规范](https://www.w3.org/TR/css-backgrounds-3/#border-width)

函数检查对同一 JS 函数送入多组参数，可等待 Promise 并按 JSON 结构和值类型比较结果。函数查找用受限标识符访问经典脚本的顶层绑定。交互检查使用独立页面、合成 DOM 事件与有界等待，可以读取交互后的 DOM 属性。页面无同源权限，教学用 `localStorage` 方法由沙箱提供。预览数据按关卡保存到本机，判题可用预置值启动独立实例。

模块练习复用已有的 `script.js`。预览编译器把 HTML 中的静态 `./script.js` 导入映射为同一个本地模块 URL。沙箱只允许 Fetch 访问内嵌的 Data URL。HTML 表单、CSS 布局和浏览器 API 的新增练习见 [教材对照](courses/web-foundations/SOURCES.md)。

## 文件与状态

- `courses/<课程 ID>/course.json` 管理章节、关卡顺序和导航策略。`levels/<关卡 ID>/lesson.json`、`tests.json`、`starter/` 和 `solution/` 分别存放题面、判题规则、起始代码和参考答案。
- `src/course.ts` 读写课程包和检查格式。导入后保留一个本地快照，教师可以修改原始课程并再次导入。导出会还原课程目录结构。
- `src/preview.ts` 组装预览文档。`src/runner.ts` 在沙箱中上报错误并执行检查。`src/ui.ts` 更新课程面板和可交互预览。
- `src/extension.ts` 注册命令和课程树。通过 `TreeView.reveal` 展开并选中当前关卡。`src/session.ts` 管理原生编辑器、实时更新、当前提交及进度。迟到的预览和判题结果通过文档版本丢弃。
- 练习文件在 VS Code 用户数据目录下按课程和关卡存放，可从插件打开文件夹。起始代码仅在首次创建时写入。教师课程可设置自由选关，原格式默认按顺序解锁，进度按课程分别保存。
