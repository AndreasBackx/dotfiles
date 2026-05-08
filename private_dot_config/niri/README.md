# Niri

This folder contains the generated Niri configuration and session entry point.

## Model

- Outputs are rendered from `.chezmoidata.toml` into `outputs.kdl`.
- Durable destinations use native Niri named workspaces in `workspaces.kdl`.
- Layout styling lives in `layout.kdl` and mirrors the zero-gap, borderless Hyprland setup.
- Input settings live in `input.kdl`.
- Per-output wallpapers are rendered from monitor data into `wallpapers.kdl`.
- Application routing uses `open-on-workspace` window rules in `window-rules.kdl`.
- Startup commands, environment overrides, and Xwayland integration live in `misc.kdl`.

## Session

- `niri-shell.desktop.tmpl` installs a Niri Wayland session entry.
- `~/.bin/niri-shell` starts `niri-session` when available and otherwise falls back to `niri --session`.
- The wrapper also imports key environment variables into systemd and D-Bus before launching Niri.

## Workspace Model

- Hyprland in this repo keeps its numbered role-based workspace ranges.
- Niri uses named workspaces only for the long-lived destinations: browser, mail, media, messages, chats, and work-comm.
- Everything else follows Niri's native dynamic per-monitor workspace stack.
