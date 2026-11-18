# Lane Cooldown Trainer

Scout enemy lane cooldowns and drill the most common matchups. Plain HTML/CSS/JS, no build step.

- **Open it:** double-click `index.html`, or run `powershell -File serve.ps1` and visit http://localhost:8080/
- **Tests:** open `tests.html` (title shows `ALL PASS n`)
- **Edit the curated data each patch:**
  - `data-meta.js`: most-common-first pools per role and rank bracket
  - `data-champions.js`: max order, Key Punish Spells and tips per champion (ids are Data Dragon ids, e.g. `MonkeyKing` = Wukong)
- **Publish (GitHub Pages):** upload all files in this folder (flat, no subfolders) to a repo and enable Pages.
