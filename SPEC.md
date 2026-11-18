# Web Trainer design

## Learning workflow

Students open Web Trainer from the VS Code Activity Bar and select any lesson in the built-in course. The course tree lists lessons by module and selects the current lesson. The center panel shows the lesson goal, explanation, tasks, code example, hint, reference solution, and live preview. It opens the code example by default. Students edit their work in the native VS Code editor on the right.

Checking an answer displays the result of each rule. Passing a lesson saves the submitted code and progress. The course manifest controls lesson order, section counts, and total progress.

## Language editions

The English and Simplified Chinese editions each include all 240 lessons, with localized extension commands, interface text, assessment feedback, and course files. The source course directories are `courses/web-foundations/` for English and `courses/web-foundations-zh-cn/` for Simplified Chinese. Both use the same course format and lesson IDs.

`npm run build` selects English by default. Pass `zh-cn` to build the Chinese edition. The build sets the language for the extension host, Webview, and assessment runner. Shared interface and feedback strings use `src/language.ts`. `npm run package` builds both editions and produces two VSIX files for the same GitHub release. Each package includes its matching course directory.

Both VSIX files use the extension ID `webclassroom.web-trainer`. Installing a different edition replaces the active extension. The English course uses the ID `web-foundations-en`. The Chinese course retains the original `web-foundations` ID for compatibility with earlier versions. The separate course IDs keep answers, progress, and resume state independent.

## Upstream projects

| Project | Design influence | License |
| --- | --- | --- |
| [CodeSwing](https://github.com/lostintangent/codeswing/tree/96060049ee9795cc6dc92fb60274072d22ed815e) | Uses a native editor and Webview side by side. Web Trainer reuses the `onDidChangeTextDocument` listener pattern and debounce library. | [MIT](https://github.com/lostintangent/codeswing/blob/96060049ee9795cc6dc92fb60274072d22ed815e/LICENSE.txt) |
| [CSS Diner example](https://github.com/lostintangent/css-diner/tree/c05221c273bf026441e28cfab069be423de3021c) | Inspired the per-lesson directory structure and feedback based on the page DOM. | The reviewed commit declares no license. Web Trainer ships original lessons and assets. |
| [CodeRoad](https://github.com/coderoad/coderoad-vscode/tree/13cd6cc9755dc115f0e9c2fecb1e2cd7322c785d) | Inspired the separation of completion criteria, tests, and course content. | [AGPL-3.0](https://github.com/coderoad/coderoad-vscode/blob/13cd6cc9755dc115f0e9c2fecb1e2cd7322c785d/LICENSE.md). Web Trainer uses its own implementation. |

## Preview and assessment

Web Trainer uses TypeScript, the VS Code Tree View and Webview APIs, and Chromium's DOM and CSSOM. The preview reads unsaved editor buffers and uses parse5 to assemble the HTML. Acorn checks JavaScript syntax and instruments common loops with an execution limit. Student code runs in an iframe with an opaque origin and a restrictive content security policy. The assessment runner starts a fresh page for each declarative DOM, style, or interaction rule.

CSS border widths and outlines can round to device pixels at different display scales. The runner calibrates expected values on the same page and sets the iframe width before loading the assessment document. Rules can check responsive layouts or image source selection at different viewport widths, inspect computed values on pseudo-elements, or sample the styles of a matching `@media` rule under a specified condition. [CSS border-width specification](https://www.w3.org/TR/css-backgrounds-3/#border-width)

Function rules resolve classic-script top-level bindings through validated identifiers. They can pass different argument sets, await promises, and compare JSON structure and value types. Interaction rules use DOM events and bounded waits, then inspect runtime DOM state. The sandbox supplies an isolated `localStorage` implementation. Preview storage persists locally per lesson, and each assessment can start with its own seed values.

Module exercises use the same `script.js` as classic-script exercises. The preview maps static `./script.js` imports to a shared local module URL. Fetch can load embedded Data URLs in the sandbox. [Curriculum mapping](courses/web-foundations/SOURCES.md)

## Files and state

- Each course contains a `course.json` manifest for sections, lesson order, and navigation. The `levels/<lesson-id>/` directories hold the lesson text in `lesson.json`, checks in `tests.json`, and code in `starter/` and `solution/`.
- `src/course.ts` validates and loads course packages. Importing a course takes a local snapshot. Teachers can edit the source directory and import it again. Export reconstructs the course directory.
- `src/preview.ts` assembles the preview document. `src/runner.ts` executes checks and reports errors inside the sandbox. `src/ui.ts` updates the lesson panel and interactive preview.
- `src/extension.ts` registers commands and calls `TreeView.reveal` to select the current lesson. `src/session.ts` manages the editor, live updates, submissions, and progress. Document versions help discard stale preview and assessment results.
- The extension stores practice files under the VS Code user data directory by course ID and lesson ID. It writes starter code when creating the practice files. Teachers can enable free navigation. The default is sequential unlocking.
