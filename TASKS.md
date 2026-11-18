# Implementation and verification

## 1.3.0 English and Simplified Chinese editions

- [x] Make English the default repository README and link to the Simplified Chinese guide.
- [x] Verify both editions with 269 automated tests each. Each course has 240 lessons and 1,106 assessment rules.
- [x] Run the full Chinese desktop regression, including recovery of answers and progress from 1.0.0.
- [x] Verify English installation, representative lessons, offline Fetch, restart recovery, and teacher import and export in desktop VS Code. The extended desktop automation encountered control and editor tab locator timeouts.
- [x] Publish both VSIX files to the same release and verify their SHA-256 digests against the local packages. [Web Trainer 1.3.0 release](https://github.com/q634875942/web-trainer-vscode-extension/releases/tag/v1.3.0)

## 1.2.0 Public GitHub release

- Added English and Chinese READMEs, a language switch, and source build and installation instructions.
- Configured the repository, issue tracker, and home page URLs. Published source, curriculum, and tests on `main`.
- Published `web-trainer-1.2.0.vsix`. Verified anonymous access, both READMEs, 1,536 package files, and the package's SHA-256 digest. The package included the repository metadata.
- `npm run package` passed, including type checking and the build. [GitHub repository](https://github.com/q634875942/web-trainer-vscode-extension)

### Curriculum expansion

- Added 130 Chinese lessons based on six reference curricula. The expansion added 25 HTML lessons, 39 CSS lessons, 61 JavaScript lessons, and five projects.
- Each new lesson included a prompt, example, starter code, reference solution, and a targeted incorrect implementation for testing. Updated the lesson catalog and curriculum mapping.
- `npm run typecheck` passed. `npm test` passed 269 tests covering 240 lessons and 1,106 assessment rules. Offline tests included pseudo-elements, DOM properties, media conditions, local Fetch, and ES modules.
- Desktop regression tests covered upgrades, cross-section navigation, 14 representative lessons, progress and storage recovery after restart, and teacher imports and exports. Responsive images, reduced motion, Fetch, and module lessons passed assessment in VS Code.
- Verified the 1,460 course files in the package. The original 110 lessons' 673 files matched the 1.1.1 package.

## 1.1.1 Practice interface

- Updated the Activity Bar label and made the course tree expand and select the current lesson when moving between sections.
- The center pane showed the task, expanded code example, reference solution, and preview. The right pane used the native editor.
- Built `web-trainer-1.1.1.vsix`. Type checking, 134 automated tests, and desktop regression tests passed. Desktop tests covered cross-section navigation, the three-column layout, representative lessons, upgrades, restart recovery, and teacher course operations.

## 1.1.0 Curriculum expansion to 110 lessons

- Added HTML foundations (20 lessons), CSS foundations (25), advanced CSS (15), JavaScript foundations (25), JavaScript in the browser (15), and projects (10).
- The suite checked computed styles, real layouts and focus changes, narrow and wide viewports, sticky positioning, and final animation states. JavaScript tests covered multiple inputs, value types, boundaries, browser events, forms, timers, and seeded storage. Project checks included repeated interactions, invalid input, responsive layout, and recovery of saved favorites.
- Offline Chromium tests passed for all six modules and 584 assessment rules. For every lesson, the reference solution passed and both the starter files and a targeted incorrect implementation failed. Another 62 lessons included tests of equivalent solutions.
- `npm test` passed 134 tests, and `npm run typecheck` passed. The 45 starter files from the original 15 lessons matched the originals by hash. Reference answers moved into `solution/` directories.
- On Windows with VS Code 1.146.0, upgrading from 1.0.0 preserved answers, progress, and the last lesson. Desktop tests covered direct access to projects, multi-file editing, interactions, grading, restart recovery, and teacher course export, import, and reimport.
- Updated the curriculum catalog, upstream license notes, and course guide. Verified lesson prompts, assessment rules, starter files, solutions, catalog, and licenses in `web-trainer-1.1.0.vsix`.

## 1.0.0 Initial release

- Reviewed upstream examples and licenses, then designed an offline extension with course import validation, export, sequential navigation, and per-course progress. [Design](SPEC.md)
- Implemented preview and assessment in offline Chromium. Tests covered HTML, CSS, JavaScript, error feedback, independent interaction checks, and CSS border grading at 125% display scale.
- Connected the course tree, native editor, live preview, and local progress. Verified unsaved edits in preview and restart recovery.
- Authored 15 Chinese lessons. The reference solution passed each lesson, and each starter failed its assessment.
- Built `web-trainer-1.0.0.vsix` and installed it in an isolated Windows VS Code profile. `npm run typecheck` and all 13 automated tests passed.
- `npm run test:vscode` passed all 15 lessons in VS Code 1.146.0 on Windows. Desktop tests covered unsaved HTML, CSS, and JavaScript in previews, syntax feedback, restart recovery, and teacher course import, export, and update. Reimport preserved submitted answers, and progress was independent by course ID. [Course format and teacher guide](README.md#author-a-course)
