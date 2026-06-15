# Dotfiles

Personal dotfiles managed with Chezmoi. This repo is mainly for my own machines, so the docs focus on what the files do and what I tend to forget.

## Quickstart

```zsh
# 1. Install chezmoi and git.
# https://www.chezmoi.io/install/

# 2. Initialize and apply.
chezmoi init https://github.com/AndreasBackx/dotfiles.git
chezmoi apply

# 3. Check the expected tooling.
dot-doctor
```

`chezmoi apply` prompts for a few host-specific choices and uses them to render templates.

## Configuration Model

- `.chezmoi.toml.tmpl` prompts for `environment`, `gpu`, `headless`, monitor location, default monitor profile, optional Borg backup settings, and whether `evremap` should be enabled on this machine.
- `.chezmoidata.toml` is the main source of truth for monitor metadata, workspace ranges, profile labels, lock and screen timeouts, and theme values.
- `private_dot_config/dot_variables.tmpl` renders `~/.config/.variables` so shell scripts can read the selected chezmoi data.
- `private_dot_config/dot_secrets.tmpl` renders `~/.config/.secrets` from 1Password on non-headless machines.
- `private_dot_config/systemd/system/backup.*` are source templates for the root Borg backup units; `backup init` installs their active copies into `/etc/systemd/system`.
- `run_after_evremap.zsh.tmpl` installs or removes the root `evremap` service based on `evremap.enabled`.
- `dot_zprofile.tmpl` and `dot_zshenv` source those generated files on shell startup.

## Repo Layout

- `dot_bin/`: user-facing scripts and helpers. See [`dot_bin/README.md`](dot_bin/README.md).
- `private_dot_config/hypr/`: Hyprland config, monitor templates, workspace routing, session helpers. See [`private_dot_config/hypr/README.md`](private_dot_config/hypr/README.md).
- `private_dot_config/niri/`: Niri config and session wrapper using native named workspaces on top of the shared monitor/profile data.
- `private_dot_config/ags/`: AGS bar implementation. See [`private_dot_config/ags/README.md`](private_dot_config/ags/README.md).
- `private_dot_config/nvim/`: LazyVim-based Neovim config. See [`private_dot_config/nvim/README.md`](private_dot_config/nvim/README.md).
- `run_after_*.zsh*`: post-apply hooks that set up generated state after `chezmoi apply`.

## Post-Apply Hooks

These run automatically after apply:

- `run_after_wayland_wrappers.zsh.tmpl`: creates `~/.bin/wrappers` for desktop apps that should be forced onto Wayland.
- `run_after_hyprland.zsh.tmpl`: creates the Hyprland log directory, reloads user systemd units, and enables Hyprland log rotation.
- `run_after_firefox_userchrome.zsh`: installs a default Firefox `userChrome.css` into the active profile when one is missing and enables Firefox stylesheet loading in `user.js`.
- `run_after_hypr_workspace_remap.zsh.tmpl`: remaps windows when apply happens inside a live Hyprland session.
- `run_after_gnome_monitors.zsh.tmpl`: copies `~/.config/monitors.xml` into GDM so the login screen uses the same layout.
- `run_after_zsh.zsh`: creates symlinks for Spaceship and tmux.
- `run_after_macos_xdg.zsh`: makes macOS XDG-compatible symlinks under `~/.local`.

## Core Commands

- `dot-doctor`: check required base and desktop tools.
- `bar-reload`: restart the AGS bar and write logs to `~/.local/state/bar-reload.log`.
- `hyprland-logs`: show the Hyprland file log, recent UWSM journal entries, crash reports, and logrotate config path.
- `niri-logs`: show the recent Niri session journal and session environment hints.
- `monitor-profiles selection`: switch monitor profiles through `shikanectl` and update default audio devices for that profile.
- `hypr-profile-refresh`: re-render profile-sensitive Hyprland config and remap windows.
- `wayland-profile-refresh`: runtime compositor-aware profile refresh entrypoint used by `shikane`.
- `power-options selection`: rofi power menu.
- `updates check` or `updates update`: package update helper.
- `backup init`, `backup status`, or `backup start`: Borg backup helper.

## Desktop Packages

These are the tools the current Wayland desktop setup expects:

- `minos`
- `ags`
- `astal-gtk4-devel`
- `wireplumber` (`wpctl`)
- `kitty`
- `rofi` or `rofi-wayland`
- `hyprland`
- `niri`
- `uwsm`
- `xwayland-satellite`
- `shikane`

Current Fedora or Terra limitation:

- only the base `Astal` Gtk4 package is assumed to be packaged here
- feature typelibs such as `AstalTray`, `AstalWp`, `AstalNetwork`, `AstalBluetooth`, `AstalBattery`, `AstalMpris`, and `AstalHyprland` may still be unavailable, so the AGS bar still uses shell helpers for several domains

## Validation And Troubleshooting

```zsh
# Dry run without changing anything.
chezmoi apply --dry-run --verbose

# Check expected tools.
dot-doctor

# Restart the AGS bar after edits.
bar-reload
```

Common things to check:

- Missing wrappers: run `chezmoi apply` again after installing required desktop tools.
- Missing secrets: check `~/.config/.secrets` and your 1Password CLI setup.
- Backups: `chezmoi apply` renders backup settings, but `backup init` is the explicit activation step that installs the root-owned files, generates the root SSH key, enables the timer, and initializes the remote repo when needed.
- Evremap: `evremap.enabled` defaults to `false`; `chezmoi apply` installs the root-owned service only when enabled and removes it when disabled.
- Headless mode: desktop checks are skipped and secrets are not loaded.
- AGS reloads: logs go to `~/.local/state/bar-reload.log`.
- Hyprland and UWSM logs:
  file log `~/.local/state/hyprland/hyprland.log`
  session journal `journalctl --user -u wayland-wm@hyprland.desktop.service`
  crash reports `~/.cache/hyprland/hyprlandCrashReport*.txt`
  helper `hyprland-logs`
- Niri logs:
  session journal `journalctl --user -u niri.service`
  helper `niri-logs`

## Nested Docs

- [`dot_bin/README.md`](dot_bin/README.md)
- [`private_dot_config/ags/README.md`](private_dot_config/ags/README.md)
- [`private_dot_config/hypr/README.md`](private_dot_config/hypr/README.md)
- [`private_dot_config/niri/README.md`](private_dot_config/niri/README.md)
- [`private_dot_config/nvim/README.md`](private_dot_config/nvim/README.md)

## ddcutil Access

```zsh
sudo groupadd --system i2c
sudo usermod $(whoami) -aG i2c
sudo cp /usr/share/ddcutil/data/45-ddcutil-i2c.rules /etc/udev/rules.d

# Temporary permissions for current boot:
sudo chmod a+rw /dev/i2c-*
```
