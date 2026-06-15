# Hyprland

This folder is the rendered Hyprland session configuration plus the data that drives monitor-specific behavior.

## Entry Point

- `hyprland.conf.tmpl` is the main include file.
- It pulls in environment, styling, monitor layout, input, window rules, workspace rules, layout settings, startup commands, and keybindings.
- On Nvidia hosts it also includes `nvidia.conf`.

## Monitor And Workspace Model

- Monitor metadata comes from `.chezmoidata.toml`.
- `monitors.conf.tmpl` renders monitor layout from the selected location and profile.
- `workspace-routing.json.tmpl` renders the workspace-to-monitor mapping that helper scripts consume.
- Workspace ranges are split by role:
  left `1-12`
  center `101-112`
  right `201-212`
  laptop `301-312`

## Profile Switching

- `monitor-profiles selection` uses `shikanectl switch <profile>` and applies profile-specific audio defaults when configured.
- `hypr-profile-refresh` waits for the expected monitors, re-renders `windows.conf` and `workspaces.conf`, and then runs `hypr-workspace-remap`.
- `hypr-workspace-remap` moves windows from associated workspaces onto the currently visible target workspace for the active profile.

## Session Startup

`exec.conf.tmpl` is the main startup behavior. It currently starts:

- AGS
- `waycorner`
- `hypridle`
- `pypr`
- `shikane`
- `gnome-keyring-daemon`
- tray and desktop applications

In UWSM sessions it runs `uwsm finalize` so the compositor marks itself ready and exports the Wayland session environment into systemd.

## Logging

Hyprland logs are written in two places:

- file log: `~/.local/state/hyprland/hyprland.log`
- user journal: `journalctl --user -u wayland-wm@hyprland.desktop.service`

Crash reports, when present, are stored under `~/.cache/hyprland/`.

`hyprland-logs` prints the file log path, recent journal lines, crash report paths, and the logrotate config path.

## Related Files Outside This Folder

- `~/.config/systemd/user/wayland-wm@hyprland.desktop.service.d/logging.conf`: appends Hyprland stdout and stderr into `hyprland.log`.
- `~/.config/systemd/user/logrotate-hyprland.*`: rotates that file daily.
- `run_after_hyprland.zsh.tmpl`: creates the log directory and enables the logrotate timer.
