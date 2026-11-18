# Web Trainer · 网页闯关

[中文](README.md) | English

An offline VS Code extension for learning HTML, CSS, and JavaScript through hands-on exercises. Designed for beginners and classroom teaching, it includes **240 Chinese-language lessons across six modules**, with free navigation between lessons.

The course tree appears on the left. The center panel contains the task, code examples, assessment results, reference solutions, and a live preview. Students write code in VS Code's native editor on the right. The extension interface and built-in lessons are in Chinese.

## Install and learn

Use desktop VS Code 1.96 or later. Download `web-trainer-1.2.0.vsix` from [GitHub Releases](https://github.com/q634875942/web-trainer-vscode-extension/releases/latest). In the Extensions view, open the `…` menu, choose **Install from VSIX…**, and select the downloaded file.

After installation, lessons work offline, including in a VS Code window with no folder open. Installing an updated version preserves existing answers and progress.

1. Select **WEB闯关练习** in the Activity Bar. Expand a module and open any lesson. The command **网页闯关：开始或继续学习** starts the course or resumes the most recent lesson.
2. Read the task and the code example in the center panel. Select `index.html`, `style.css`, or `script.js` to switch files in the native editor. The preview includes unsaved edits.
3. Select **检查答案** to check your work. Revise any failed items, or expand **查看提示** for a hint and **参考答案** for a reference solution. Passing a lesson saves your code and progress.
4. Select **下一关** to follow the recommended order. The course tree expands and selects the next lesson. You can also select lessons directly from the tree. The command **网页闯关：查看当前练习文件夹** opens the local practice folder.

Teachers can distribute the VSIX directly. Students only need desktop VS Code to study offline.

## Built-in curriculum

| Module | Lessons | Topics |
| --- | ---: | --- |
| HTML foundations | 45 | Document structure, semantics, heading hierarchy, skip links, responsive images, audio and video captions, tables, forms, and native validation |
| CSS foundations | 45 | Selectors, cascade, inheritance, pseudo-classes and pseudo-elements, typography, units, backgrounds, box model, tables, and custom properties |
| Advanced CSS | 34 | Flexbox, Grid, positioning, stacking, image cropping, fluid sizing, container queries, print styles, and reduced motion |
| JavaScript foundations | 65 | Type conversion, strings, control flow, functions, closures, array methods, objects, Set, Map, classes, regular expressions, and errors |
| JavaScript in the browser | 36 | DOM, templates, event propagation, FormData, dialog focus, storage, timers, Promise, Fetch, modules, and Canvas |
| Projects | 15 | Accessible registration forms, responsive dashboards, filtering and sorting, persistent themes, offline notice boards, and more |

The complete lesson list is in `courses/web-foundations/CATALOG.md`. The source references, curriculum mapping, and upstream license notes are in `courses/web-foundations/SOURCES.md`.

## Author a course

Run **网页闯关：导出课程** from the Command Palette and choose a destination folder. The extension exports the current course to a subfolder named after its course ID. You can also copy `courses/web-foundations/` from the source tree.

Edit the exported files and distribute the complete course directory to students. Students run **网页闯关：导入课程** and select its `course.json`.

Include the project's `LICENSE.txt` when redistributing copies or adaptations of the built-in course. DOM property, pseudo-element, and media-condition checks require version 1.2.0 or later.

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

### Course manifest

`course.json` defines the course, sections, and lesson order. Set `navigation` to `free` to allow direct access to every lesson. Omitting the field, or setting it to `sequential`, unlocks lessons in order.

Course, section, and lesson IDs start with a lowercase letter and may contain lowercase letters, digits, hyphens, and underscores. Lesson IDs must be unique within a course.

```json
{
  "version": 1,
  "id": "class-demo",
  "title": "Classroom practice",
  "navigation": "free",
  "sections": [{ "id": "html", "title": "HTML", "levels": ["hello"] }]
}
```

### Lesson content

`lesson.json` contains the lesson text. `focus` selects the file opened first. `goal`, `example`, and `hint` are optional. If you provide an example, include its language, code, and explanatory note. Add reference files to `solution/` as needed, or omit that directory.

```json
{
  "title": "My first heading",
  "focus": "index.html",
  "goal": "Use a top-level heading to describe the page topic.",
  "summary": "Give your personal page a clear heading.",
  "example": {
    "language": "html",
    "code": "<h1>Join our club</h1>",
    "note": "Observe the opening and closing tags, then write your own heading."
  },
  "tasks": ["Add an h1 inside body containing My homepage."],
  "hint": "Place the heading text between <h1> and </h1>."
}
```

### Assessment rules

`tests.json` contains an array of checks. Each check may provide a `hint`. All checks must pass to complete the lesson. Checks can inspect the initial page or run a sequence of interactions first.

```json
[
  {
    "label": "The page heading is correct",
    "expect": { "type": "text", "selector": "h1", "value": "My homepage" }
  }
]
```

| `expect.type` | Parameters | Checked result |
| --- | --- | --- |
| `exists` | `selector` | At least one matching element exists |
| `count` | `selector`, `value` | Number of matching elements |
| `text` | `selector`, `value` | First match's text, with leading and trailing whitespace removed and consecutive whitespace collapsed |
| `attribute` | `selector`, `name`, `value` | First match's HTML attribute value |
| `property` | `selector`, `name`, `value` | Runtime DOM property, such as `checked`, an input's `value`, or an image's `naturalWidth` |
| `style` | `selector`, `property`, `value` | Computed CSS value. Optional `pseudo` selects a pseudo-element, and `media` controls a matching media rule |
| `layout` | `selector`, `relativeTo`, `relation` | Layout relationship between two visible rectangles |
| `function` | `name`, `args`, `value` | A top-level function's return value. Arrays preserve order, and objects compare keys and values |
| `storage` | `key`, `value` | This lesson's storage entry. A `null` value means the key is absent |

Each check starts with a fresh page. The default viewport is 480 × 360 CSS pixels. Set `viewport` to a width from 240 to 1600 pixels to check responsive behavior.

Supported layout relations are `right-of`, `below`, `same-row` for top alignment, `inside` for full containment, `center-x` for horizontal centering, and `equal-width`.

`style.media` accepts an object such as `{ "query": "(prefers-reduced-motion: reduce)", "matches": true }`. In the isolated assessment page, the runner finds the matching `@media` rule and samples its styles with the condition enabled or disabled. Add checks for both `matches` values to cover both states.

Use `actions` to run interactions in order.

| Action | Parameters | Behavior |
| --- | --- | --- |
| `click` | `selector` | Click the matching element |
| `focus` | `selector` | Focus the matching element |
| `input` | `selector`, `value` | Update an input, textarea, or select and emit `input`. Select controls also emit `change` |
| `key` | `selector`, `key` | Emit a `keydown` event, for example with `key` set to `Enter` |
| `wait` | `ms` | Wait from 0 to 1500 milliseconds |
| `finish-motion` | `selector` | Finish the element's finite animations and transitions to sample their final state |

Each function check provides one set of `args` and a corresponding expected `value`. Add multiple checks for different inputs and boundaries. The runner can await asynchronous function results.

The preview provides isolated `localStorage` with `getItem`, `setItem`, `removeItem`, `clear`, `key`, and `length`. Preview values persist locally for that lesson. Assessment instances use independent storage, with optional seed values supplied through a check's `storage` object. Each lesson has a 64 KiB storage limit.

### Practice files and preview

Keep all three files in `starter/`, leaving unused files empty. Reference the stylesheet with `<link rel="stylesheet" href="style.css">` and the script with `<script defer src="script.js"></script>`. If these references are omitted, the extension loads the files automatically.

For ES module exercises, use `<script type="module" src="./script.js"></script>`, or statically import `./script.js` from an inline module in `index.html`. Module exercises can assess DOM results. Function rules resolve top-level bindings in classic scripts.

Media and local Fetch samples use embedded Data URLs. Both the preview and assessment run in an offline sandbox. Bind interactions with `addEventListener` in your scripts.

Reimporting a course with the same ID updates its content while preserving existing answers and completion records by lesson ID. To assign an exercise as a fresh task, use a new course ID or a new lesson ID.

## Develop from source

Use Node.js 22 or later.

```sh
git clone https://github.com/q634875942/web-trainer-vscode-extension.git
cd web-trainer-vscode-extension
npm ci
npm run build
```

| Command | Purpose |
| --- | --- |
| `npm run typecheck` | Check TypeScript types |
| `npm test` | Build and test every lesson in offline Chromium, including starter files, reference solutions, typical mistakes, and selected alternative solutions |
| `npm run package` | Generate a VSIX containing the extension, lessons, and reference solutions |
| `npm run test:vscode` | Install the VSIX into a temporary VS Code profile and exercise the desktop workflow |

Set `WEB_TRAINER_CHROME` to your Chrome or Chromium executable if needed. After `npm run build`, you can run a single module using its Chinese section name.

```sh
node --test --test-name-pattern="CSS 进阶" .test-dist/browser.test.cjs
```

Desktop tests cover the three-column layout, section navigation, representative lessons, restart recovery, and teacher course operations. Set `WEB_TRAINER_VSCODE` to the VS Code executable if needed. If `web-trainer-1.0.0.vsix` is present locally, the desktop test also checks upgrades from that version.

Build dependencies and generated development files are kept locally. Source files, tests, and course content are tracked in Git. Downloadable VSIX packages are available from Releases.

The architecture and implementation notes are in `SPEC.md`. Progress and verification records are in `TASKS.md`. These documents and the curriculum catalog are in Chinese.

## License

Original project code and course content are available under the MIT license. Third-party software and curriculum references carry their respective upstream terms. [Project license](LICENSE.txt) · [Third-party notices](THIRD_PARTY_NOTICES.txt) · [Curriculum sources and licenses](courses/web-foundations/SOURCES.md)
