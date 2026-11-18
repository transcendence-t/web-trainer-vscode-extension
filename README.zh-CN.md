# 网页闯关 · Web Trainer

简体中文 | [English](README.md)

面向零基础高职学生的 VS Code 网页设计课程。内置六个模块、240 个中文关卡，可以自由选关。左侧是课程关卡，中间显示题目、代码示例、判题结果、参考答案和实时预览，右侧用 VS Code 原生编辑器编写代码。

## 安装与学习

使用桌面版 VS Code 1.96 或更新版本。中英文安装包都在同一条 [GitHub Release](https://github.com/q634875942/web-trainer-vscode-extension/releases/latest) 中。

| 版本 | 安装包 |
| --- | --- |
| 简体中文 | `web-trainer-1.3.0-zh-cn.vsix` |
| 英文 | `web-trainer-1.3.0-en.vsix` |

每个版本的界面、判题反馈和全部 240 关均使用对应语言。下载所需的 VSIX，在扩展视图的 `…` 菜单选择「从 VSIX 安装…」，选中该文件。安装后可离线使用，包括在没有打开文件夹的窗口中练习。

两个版本使用同一个扩展 ID，安装一个会替换另一个。中英文作答和进度分别保存，中文版会保留旧版的作答和进度。

1. 点击左侧活动栏的「WEB闯关练习」图标，展开想学的模块并直接进入任意一关。从命令面板运行「网页闯关：开始或继续学习」可打开第一关或回到最近关卡。
2. 在中间阅读题目和默认展开的「代码示例」。点 `index.html`、`style.css` 或 `script.js` 在右侧切换编辑文件。预览包括尚未保存的改动。
3. 点击「检查答案」。按未通过的项目修改，也可展开「查看提示」或「参考答案」。通过后插件保存代码和进度。
4. 点「下一关」按推荐顺序学习，左侧课程树会展开对应模块并选中新关卡。也可以直接在课程树选关。继续学习时会恢复进度和最近关卡。命令「网页闯关：查看当前练习文件夹」可定位本机文件。

课堂可以直接发放 VSIX。学生端只需 VS Code 桌面版，无需网络、Node.js、Git 或本地服务器。

## 内置课程

| 模块 | 关数 | 主要内容 |
| --- | ---: | --- |
| HTML 基础 | 45 | 文档与语义、标题层级、键盘跳转、响应式图片、音视频与字幕、表格、表单与原生校验 |
| CSS 基础 | 45 | 选择器与级联、继承、伪类与伪元素、排版与单位、背景、盒模型、表格与自定义属性 |
| CSS 进阶 | 34 | Flexbox、Grid、定位与层叠、图片裁剪、流式尺寸、容器查询、打印与减少动效 |
| JavaScript 基础 | 65 | 类型转换、字符串、控制流、函数与闭包、数组方法、对象、Set、Map、类、正则与异常 |
| JavaScript 网页交互 | 36 | DOM 与模板、事件传播、FormData、对话框焦点、本地存储、定时器、Promise、Fetch、模块和 Canvas |
| 综合项目 | 15 | 可访问报名表、响应式看板、搜索与排序、持久化主题、离线通知板等 |

查看逐关名称、六套参考资料、对应的新增练习和许可信息。[关卡目录](courses/web-foundations-zh-cn/CATALOG.md) · [参考资料和许可](courses/web-foundations-zh-cn/SOURCES.md)

## 教师制作课程

从命令面板运行「网页闯关：导出课程」，选一个目录。插件会把当前课程复制到以课程 ID 命名的子目录。也可以从源码复制，中文课程位于 `courses/web-foundations-zh-cn/`，英文课程位于 `courses/web-foundations/`。编辑完成后，将整套目录发给学生。学生运行「网页闯关：导入课程」，选择其中的 `course.json` 即可。

分发内置课程的副本或改编版本时，一并附上项目根目录的 `LICENSE.txt`。DOM 属性、伪元素和媒体条件检查需要 1.2.0 或更新版本。

```text
class-demo/
├── course.json
└── levels/
    └── hello/
        ├── lesson.json
        ├── tests.json
        ├── starter/
        │   ├── index.html
        │   ├── style.css
        │   └── script.js
        └── solution/
            └── index.html
```

`course.json` 指定课程和章节顺序。`navigation` 选 `free` 就允许自由选关。省略该字段或填写 `sequential`，则按顺序解锁。课程、章节和关卡 ID 以小写字母开头，可含小写字母、数字、连字符和下划线。关卡 ID 在同一课程内唯一。

```json
{
  "version": 1,
  "id": "class-demo",
  "title": "课堂练习",
  "navigation": "free",
  "sections": [{ "id": "html", "title": "HTML", "levels": ["hello"] }]
}
```

`lesson.json` 写中文题面。`focus` 是打开时优先显示的文件。`goal`、`example`、`hint` 可以省略。若提供 `example`，请填写语言、代码和引导语。`solution/` 仅放参考实现中需要展示的文件，可按课堂需要省略整个目录。

```json
{
  "title": "我的第一个标题",
  "focus": "index.html",
  "goal": "能用一级标题说明页面主题。",
  "summary": "用一级标题介绍自己的页面。",
  "example": {
    "language": "html",
    "code": "<h1>社团招募</h1>",
    "note": "观察标题文字写在哪里，再为自己的主页写一个标题。"
  },
  "tasks": ["在 body 里添加 h1，显示“我的主页”。"],
  "hint": "用 <h1> 和 </h1> 包住标题文字。"
}
```

`tests.json` 是检查数组。每项可以有 `hint`，所有检查通过才算通关。示例判断页面标题，也可以按顺序模拟交互。

```json
[
  {
    "label": "标题文字正确",
    "expect": { "type": "text", "selector": "h1", "value": "我的主页" }
  }
]
```

| `expect.type` | 参数 | 检查内容 |
| --- | --- | --- |
| `exists` | `selector` | 匹配到元素 |
| `count` | `selector`、`value` | 匹配元素的数量 |
| `text` | `selector`、`value` | 第一个匹配元素的文本，忽略首尾空白并合并连续空白 |
| `attribute` | `selector`、`name`、`value` | 第一个匹配元素的属性值 |
| `property` | `selector`、`name`、`value` | DOM 属性的运行时值，例如布尔值 `checked`、输入框的 `value` 或图片的 `naturalWidth` |
| `style` | `selector`、`property`、`value` | 浏览器计算值。可用 `pseudo` 选择 `::before` 等伪元素，或用 `media` 控制指定样式规则的媒体条件 |
| `layout` | `selector`、`relativeTo`、`relation` | 两个可见矩形的布局关系 |
| `function` | `name`、`args`、`value` | 顶层函数的 JSON 返回值。数组检查顺序，对象检查键和值 |
| `storage` | `key`、`value` | 读取本关的存储键。`null` 表示没有该键 |

每项检查都从新页面开始。默认视口为 480 × 360 CSS 像素，可用 `viewport` 指定 240 至 1600 的宽度。布局关系包括 `right-of`（在同一行的右侧）、`below`（在下方）、`same-row`（顶部对齐）、`inside`（完全包含）、`center-x`（水平中心对齐）和 `equal-width`（宽度相同）。

`style.media` 接收 `{ "query": "(prefers-reduced-motion: reduce)", "matches": true }`。判题在隔离页面中找到对应的 `@media` 并按指定状态采样计算样式。用两条检查分别设置 `matches`，即可覆盖媒体条件成立和不成立的样式。

可在 `actions` 内依次添加操作。`click` 和 `focus` 使用 `selector`，`input` 另外填写 `value`，适用于 `input`、`textarea` 和 `select`。选择下拉选项也会触发 `change`。`key` 额外指定键名，例如 `"Enter"`，触发 `keydown` 监听。`wait` 使用 `ms`（0 至 1500），适合定时器任务。`finish-motion` 使用 `selector` 直接采样该元素的有限动效终态。每项 `function` 规则提供一组 `args` 与一个 `value`，可添加多项规则覆盖边界输入。

教学预览提供隔离的 `localStorage`，支持 `getItem`、`setItem`、`removeItem`、`clear`、`key` 和 `length`。预览中的值随本关保存在本机，测试实例独立，可用检查项的 `storage` 对象提供读入时的样例数据。每关的课堂存储容量为 64 KiB。

起始目录保留三个文件，暂时用不到的文件可以留空。页面可用 `<link rel="stylesheet" href="style.css">` 和 `<script defer src="script.js"></script>` 引用另外两个文件。省略引用时插件会自动载入它们。ES 模块练习可用 `<script type="module" src="./script.js">` 加载脚本，也可从 `index.html` 内的模块脚本静态导入 `./script.js`。模块练习可以检查 DOM 结果，`function` 规则适用于经典脚本的顶层函数。

媒体素材与本地 Fetch 样例使用内嵌的 Data URL。预览和判题在离线沙箱中运行。请在脚本中使用 `addEventListener` 绑定交互。

重新导入相同 ID 会更新课程。已有练习代码和通过记录按关卡 ID 保留。希望把新题作为独立练习布置时，给它新的课程 ID，或在已有课程中使用新的关卡 ID。

## 从源码开发

开发机使用 Node.js 22 或更新版本。

```sh
git clone https://github.com/q634875942/web-trainer-vscode-extension.git
cd web-trainer-vscode-extension
npm ci
npm run build
```

- `npm run build` 默认构建英文版，`npm run build -- zh-cn` 构建中文版。`npm run typecheck` 检查类型。
- `npm test` 在断网 Chromium 中验证中英文课程的起始代码、参考答案、典型错误和选定的等价写法。可用 `WEB_TRAINER_CHROME` 指定浏览器路径。
- `npm run package` 生成中英文两个 VSIX。
- `npm run test:vscode -- zh-cn` 或 `npm run test:vscode -- en` 将对应版本安装到临时配置，验证桌面三栏布局、跨章节切关、典型关卡、重启和教师课程操作。可用 `WEB_TRAINER_VSCODE` 指定 VS Code 的可执行文件。

查看技术架构和历次发布记录。[技术设计](SPEC.md) · [实施与验证记录](TASKS.md)

## 许可证

项目原创代码与课程内容采用 MIT 许可证。依赖、复用代码和参考教材适用各自的许可证。[项目许可证](LICENSE.txt) · [第三方声明](THIRD_PARTY_NOTICES.txt) · [课程参考资料](courses/web-foundations-zh-cn/SOURCES.md)
