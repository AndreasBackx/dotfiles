# Scripts

`dot_bin/` contains the commands I actually run directly plus a few helpers that the desktop uses behind the scenes.

## Commands I Run Directly

- `dot-doctor`: checks whether the machine has the base and desktop tools these dotfiles expect.
- `bar-reload`: restarts the AGS bar and writes logs to `~/.local/state/bar-reload.log`.
- `hyprland-logs`: quick Hyprland and UWSM log summary.
- `niri-logs`: quick Niri session journal summary.
- `monitor-profiles selection`: switch shikane monitor profiles from a rofi menu and apply per-profile audio defaults.
- `hypr-profile-refresh`: re-render `windows.conf` and `workspaces.conf` for the active monitor profile, then remap windows.
- `wayland-profile-refresh`: refresh the active compositor's profile-sensitive Wayland config.
- `power-options selection`: opens the logout, suspend, reboot, and shutdown menu.
- `updates`: checks or runs package updates.
- `backup`: initializes, checks, and runs the Borg backup flow. Use `backup init` once per machine after server-side SSH access is ready.
- `lock`: locks the screen, pauses Spotify, mutes audio, and enables notification DND until unlock.

## Desktop Helper Scripts

These are called by AGS rather than directly by me most of the time:

- `bar-workspaces`: streams Hyprland monitor and workspace state.
- `bar-audio`: PipeWire status and default sink or source actions.
- `bar-network`: network status and quick networking actions.
- `bar-bluetooth`: Bluetooth status and connect or disconnect actions.
- `bar-brightness`: brightness text, tooltip, and quick adjustments.
- `bar-battery`: battery icon, state, and tooltip.
- `bar-spotify`: streams Spotify text, tooltip, and state.

## Session Launchers

- `hyprland-uwsm`: starts the Hyprland desktop through UWSM.
- `hyprland-shell`: legacy direct launcher that still appends to the Hyprland log file.
- `niri-shell`: starts Niri through `niri-session` when available, otherwise `niri --session`.

## Other Notes

- Most scripts assume `~/.config/.variables` exists and is sourced by the shell.
- Desktop-oriented scripts usually assume a Wayland session.
- A few older utilities are still here because other scripts depend on them, even if they are not part of the main daily workflow.
- `backup` is split into two phases: `chezmoi apply` renders the local source files and settings, then `backup init` installs the active root-owned runtime files, generates the root SSH key if needed, enables the timer, and initializes the remote repo only when missing.
