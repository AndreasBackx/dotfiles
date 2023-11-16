---
sticker: emoji//1f4c6
---
<%*
const weekAbsolute = tp.date.now("W");
const weekRelative = Math.ceil(moment().date() / 7) + 1;
const title = `Week ${weekRelative}`;
console.log(title);
-%>
---
aliases:
  - <% tp.date.now("MMMM YYYY") %> <% title %>
week: <% weekAbsolute %>
sticker: 📅
---
## Log

<% tp.file.cursor() %>
<%- tp.file.rename(title) -%>

## Meetings

```dataviewjs // INSERT ABOVE
const tp = app.plugins.plugins["templater-obsidian"].templater
            .current_functions_object;
console.log({week: tp.user.Week});
await tp.user.Week(dv, obsidian);
```
