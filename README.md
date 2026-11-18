# Web Trainer

English | [简体中文](README.zh-CN.md)

An offline VS Code extension for learning HTML, CSS, and JavaScript through hands-on exercises. Designed for beginners and classroom teaching, it includes **240 lessons across six modules**, with free navigation between lessons.

The course tree appears on the left. The center panel contains the task, code examples, assessment results, reference solutions, and a live preview. Students write code in VS Code's native editor on the right.

## Install and learn

Use desktop VS Code 1.96 or later. Both editions are available in the same [GitHub release](https://github.com/q634875942/web-trainer-vscode-extension/releases/latest).

| Edition | VSIX |
| --- | --- |
| English | `web-trainer-1.3.0-en.vsix` |
| Simplified Chinese | `web-trainer-1.3.0-zh-cn.vsix` |

Each edition includes the interface, grading feedback, and all 240 lessons in its language. Download the VSIX for your edition, then open the `…` menu in the Extensions view and choose **Install from VSIX…**. Lessons work offline, including in a window with no folder open.

Both editions use the same extension ID. Installing one replaces the other. Answers and progress are stored separately for each edition. The Chinese edition retains answers and progress from earlier versions.

1. Select **Web Trainer** in the Activity Bar. Expand a module and open any lesson. The command **Web Trainer: Start or Resume** starts the course or resumes the most recent lesson.
2. Read the task and the code example in the center panel. Select `index.html`, `style.css`, or `script.js` to switch files in the native editor. The preview includes unsaved edits.
3. Select **Check Answer** to check your work. Revise any failed items, or expand **Show Hint** or **Sample Solution** for help. Passing a lesson saves your code and progress.
4. Select **Next Lesson** to follow the recommended order. The course tree expands and selects the next lesson. You can also select lessons directly from the tree. The command **Web Trainer: Open Practice Folder** opens the local practice folder.

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

See the full lesson list, curriculum mapping, and upstream license notes. [Lesson catalog](courses/web-foundations/CATALOG.md) · [Curriculum sources and licenses](courses/web-foundations/SOURCES.md)

## Author a course

Run **Web Trainer: Export Course** from the Command Palette and choose a destination folder. The extension exports the current course to a subfolder named after its course ID. You can also copy the English course from `courses/web-foundations/` or the Chinese course from `courses/web-foundations-zh-cn/`.

Edit the exported files and distribute the complete course directory to students. Students run **Web Trainer: Import Course** and select its `course.json`.

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
| `npm run build` | Build the English edition |
| `npm run build -- zh-cn` | Build the Simplified Chinese edition |
| `npm run typecheck` | Check TypeScript types |
| `npm test` | Test both editions in offline Chromium, including starters, solutions, common mistakes, and selected alternatives |
| `npm run package` | Generate the English and Chinese VSIX files |
| `npm run test:vscode -- en` | Install the English VSIX into a temporary profile and exercise the desktop workflow |
| `npm run test:vscode -- zh-cn` | Exercise the same desktop workflow with the Chinese VSIX |

Set `WEB_TRAINER_CHROME` or `WEB_TRAINER_VSCODE` to the corresponding executable path if needed. Desktop tests cover the three-column layout, section navigation, representative lessons, restart recovery, and teacher course operations.

See the architecture and release history. [Design](SPEC.md) · [Implementation and verification](TASKS.md)

## License

Original project code and course content are available under the MIT license. Third-party software and curriculum references carry their respective upstream terms. [Project license](LICENSE.txt) · [Third-party notices](THIRD_PARTY_NOTICES.txt) · [Curriculum sources and licenses](courses/web-foundations/SOURCES.md)
