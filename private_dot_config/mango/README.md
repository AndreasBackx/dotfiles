# MangoWC

This directory is a first-pass MangoWC + DankMaterialShell configuration managed by chezmoi.

## Entry Point

- `config.conf.tmpl` renders `~/.config/mango/config.conf`.
- It sources the DMS-generated fragments first, then the local Mango files.
- Local files intentionally win over DMS for monitor rules, rubecula colors, tags, keybindings, and window rules.
- `~/.local/share/wayland-sessions/mango-uwsm.desktop` provides the preferred `Mango (uwsm-managed)` login entry.
- `~/.config/uwsm/env` sources `~/.zprofile`, so UWSM-managed Mango inherits the same PATH and environment as your login shell.
- `exec.conf.tmpl` runs `uwsm finalize ...` once Mango is ready, with `dbus-update-activation-environment --systemd --all` as a legacy fallback.
- `~/.bin/mango-shell` and `~/.local/share/wayland-sessions/mango.desktop` are fallback/manual launch paths, not the preferred login path.
- If `Mango (uwsm-managed)` does not appear in your login manager, install or symlink `~/.local/share/wayland-sessions/mango-uwsm.desktop` into `/usr/share/wayland-sessions/`.

## Theme

- Mango colors are rendered from `.chezmoidata.toml` under `[themes.rubecula]`.
- `appearance.conf.tmpl` converts `#RRGGBB` values to Mango's `0xRRGGBBAA` format.
- `DMS_DISABLE_MATUGEN=1` is set in `env.conf.tmpl` so DMS does not immediately drift away from the rubecula baseline.
- If you later want wallpaper-derived Material colors, remove that env var and let DMS/matugen own the shell palette.

## Multi-Monitor Model

- Monitor data comes from the same `.chezmoidata.toml` model as Hyprland and niri.
- `monitors.conf.tmpl` reads `.monitors.selected` and `.monitors.default_profile`.
- `ACTIVE_PROFILE` can override the default profile at render time, matching the existing Hypr/niri pattern.
- Active roles are rendered in this order: `left`, `center`, `right`, `laptop`, `tv`.
- Coordinates are normalized so the top-left active output starts at `0x0`; this avoids Mango's documented XWayland problems with negative coordinates.
- Mango monitor matching is rendered from existing `shikane_search` values as `make`, `model`, and `serial` where available.
- If a monitor does not match, compare `wlr-randr` output with the rendered rule and update `.chezmoidata.toml` rather than hard-coding connector names here.
- Per-monitor wallpaper paths are rendered as comments in `monitors.conf` for reference.
- DMS owns wallpaper management in this Mango setup until Mango connector names are verified with `wlr-randr`.

## Tags

Mango uses global tags, not monitor-bound Hypr workspaces. The initial model is semantic:

- `1`: main
- `2`: web
- `3`: code
- `4`: chat
- `5`: media
- `6`: misc
- `7`: game
- `8`: scratch
- `9`: focus

Use `SUPER+1..9` to view a tag and `SUPER+SHIFT+1..9` to move the focused window to a tag. Use `SUPER+CTRL+1..9` to add or remove tags from the current view.

All tags default to Mango's `dwindle` layout. This is the closest match to sway/i3-style recursive split-tree tiling. Mango layout state is per monitor/tag, so layout shortcuts call `mango-layout` to apply the requested layout across every active monitor and then restore focus.

## Shortcuts

- `SUPER+Return`: terminal
- `SUPER+Space`: DMS spotlight
- `SUPER+V`: DMS clipboard
- `SUPER+M`: DMS process list
- `SUPER+Comma`: DMS settings
- `SUPER+N`: DMS notifications
- `SUPER+Y`: DMS wallpaper browser
- `SUPER+Shift+/`: DMS Mango keybind cheat sheet
- `SUPER+Shift+S`: region screenshot to clipboard
- `SUPER+Ctrl+Shift+S`: all-outputs screenshot to clipboard
- `SUPER+Q`: close window
- `SUPER+Shift+Q`: force close window
- `SUPER+F`: toggle floating
- `SUPER+Shift+F`: toggle fullscreen
- `SUPER+P`: pin/global window
- `SUPER+Shift+P`: overlay window
- `SUPER+H/J/K/L`: focus left/down/up/right
- `SUPER+Ctrl+H/J/K/L`: swap left/down/up/right
- `SUPER+Alt+H/J/K/L`: focus monitor left/down/up/right
- `SUPER+Alt+Shift+H/J/K/L`: move window to monitor left/down/up/right
- `SUPER+Left/Right`: previous/next occupied tag
- `SUPER+Shift+Left/Right`: move window to previous/next tag
- `SUPER+Tab`: Mango overview
- `SUPER+1..9`: view semantic tag
- `SUPER+Shift+1..9`: move window to semantic tag
- `SUPER+Ctrl+1..9`: toggle tag in current view
- `SUPER+S/T/D/W`: switch all active monitor tags to scroller/dwindle/dwindle/monocle layout
- `SUPER+Shift+T`: switch all active monitor tags to Mango's master-stack tile layout
- `SUPER+R`: cycle layout
- `SUPER+Grave`: terminal scratchpad
- `SUPER+E`: file scratchpad
- `SUPER+Alt+L`: DMS lock
- `SUPER+Shift+E`: DMS power menu
- `SUPER+Shift+M`: logout via `wayland-logout`

`wayland-logout` uses `uwsm stop` in UWSM-managed sessions, `loginctl terminate-session "$XDG_SESSION_ID"` in display-manager sessions, and Mango's native `quit` dispatcher only as a final fallback.

## DMS Integration

- DMS is expected to run through the user systemd service, bound to `mango-session.target`.
- Mango starts `mango-session.target` from `exec.conf.tmpl` after UWSM finalization or fallback environment export.
- `run_after_mango.zsh.tmpl` reloads user systemd and tries to add `dms.service` as a wanted unit for that target.
- If the DMS unit is not installed yet, that step is skipped and can be rerun after installing DMS with `chezmoi apply`.

## Validation

After applying the config, validate with:

```sh
mango -c ~/.config/mango/config.conf -p
dms keybinds show mangowc
dms doctor
```

## Notes

- This is intentionally not a direct Hyprland port.
- DMS replaces AGS, rofi launcher, mako notifications, power menu, brightness/audio scripts, and most shell UI.
- App routing is tag-based and deliberately simpler than the old monitor-bound workspace routing.
