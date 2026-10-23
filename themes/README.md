# Theme paths

The landing-page themes now open an interactive branching view. The short introductions belong to each theme path; opening a person preserves the chosen theme and subcategory, starts on the relevant area of life, and keeps the full character connection map available. Use **Back to themes** to return to the same selection.

## Connections from the supplied boards

| Theme | Subcategory | Connected people or destination |
| --- | --- | --- |
| Wealth Gap | Top 1% | Leo |
| Wealth Gap | Upper Middle to Middle Class | Catherine, Veronica |
| Wealth Gap | Lower Middle to Lower Class | Ken, Sophia |
| Rural / Suburb / City | Suburb | Leo |
| Rural / Suburb / City | Urban | Catherine, Ken |
| Rural / Suburb / City | Rural | Veronica, Sophia |
| Regional Matters | Resource management | Regional materials map node |
| Regional Matters | Regional & satellite uniqueness | Where you live map node |
| Climate Change | Direct connections | Ken, Veronica, Leo |
| Education | K–12 | Veronica |
| Education | Technical / Associate’s Degree | Ken, Sophia |
| Education | Higher Education | Leo, Catherine |

The income groups follow the board; no tax rates or dollar ranges have been invented. Regional Matters had no specific people assigned in the references, so its two branches lead to existing map nodes. Its label normalizes the board’s “regional satellite uniquities” note to “Regional & satellite uniqueness.”

## Edit content

Edit `themes` in **landing-config.js**. `groups` defines the branches, while `connections` defines the links at the end of each branch. A theme without `groups`, such as Climate Change, connects directly to people.

Person links use `person`, `facet` and `blurb`. The supported areas are `work`, `home`, `tech`, `health` and `third`. Regional links use `node`, `title` and `blurb`. IDs must match existing entries in `data.js`.

All introductions are editable prototype text. The climate and education details incorporate the readable notes on the boards. Shorter wealth and setting introductions provide context without adding salaries, addresses or new technologies.

Character portraits use the same `portrait` field in `data.js` as the rest of the app. Until portraits are supplied, theme cards show initials.

Run `python3 build-local.py` after editing. Theme behavior is in **themes.js** and layout is in **themes.css**. Everything is embedded in the built **index.html** and works offline. A theme URL such as `index.html#/themes/education/technical` opens that path after the arrival sequence.
