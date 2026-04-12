# Dotfiles

This repository contains my dotfiles managed with Chezmoi. It is mainly used on Fedora and Arch Linux, with support for Ubuntu, CentOS, and macOS.

## Quickstart

```zsh
# 1) Install chezmoi and git first.
# https://www.chezmoi.io/install/

# 2) Initialize and apply.
chezmoi init https://github.com/AndreasBackx/dotfiles.git
chezmoi apply

# 3) Run the built-in dependency check.
dot-doctor
```

`chezmoi apply` will ask setup questions (environment, GPU, headless, monitor profile) and render templates accordingly.

## Core packages

```zsh
## Arch Linux
paru -S \
    fzf \
    git-delta \
    bat \
    eza \
    duf \
    ripgrep \
    choose-rust-git \
    hyperfine

## Fedora
sudo dnf copr enable atim/choose
sudo dnf install -y \
    fzf \
    git-delta \
    bat \
    eza \
    ripgrep \
    choose \
    hyperfine

## macOS
brew install -y \
    fzf \
    git-delta \
    bat \
    eza \
    duf \
    ripgrep \
    choose-rust \
    hyperfine

## Ubuntu
sudo apt-get install -y \
    fzf \
    rust-bat \
    ripgrep \
    choose-rust-git
```

## Desktop extras (Wayland)

These are expected by scripts and config for Hyprland/AGS setups:

- `minos`
- `ags`
- `astal-gtk4-devel`
- `wireplumber` (`wpctl`)
- `kitty`
- `rofi` / `rofi-wayland`

Current Fedora/Terra limitation:

- only the base `Astal` Gtk4 package is assumed to be packaged here
- feature typelibs such as `AstalTray`, `AstalWp`, `AstalNetwork`, `AstalBluetooth`, `AstalBattery`, `AstalMpris`, and `AstalHyprland` may still be unavailable, so the AGS bar currently falls back to existing helper scripts for those domains

## Validation and troubleshooting

```zsh
# Dry run without applying.
chezmoi apply --dry-run --verbose

# Check your system dependencies.
dot-doctor

# Reload the AGS bar after AGS config edits.
ags-reload
```

Common issues:

- Missing wrappers: run `chezmoi apply` again after installing required desktop tools.
- Missing secrets: check `~/.config/.secrets` and your secrets provider setup.
- Headless mode: desktop checks are skipped and 1Password-backed secrets are not loaded.
- AGS bar reloads: use `ags-reload`; logs go to `~/.local/state/ags-reload.log`.
- Hyprland/UWSM logs: file log at `~/.local/state/hyprland/hyprland.log`, session journal via `journalctl --user -u wayland-wm@hyprland.desktop.service`, crash reports at `~/.cache/hyprland/hyprlandCrashReport*.txt`, and the `hyprland-logs` helper shows all of them together.

## ddcutil access (if needed)

```zsh
sudo groupadd --system i2c
sudo usermod $(whoami) -aG i2c
sudo cp /usr/share/ddcutil/data/45-ddcutil-i2c.rules /etc/udev/rules.d

# Temporary permissions for current boot:
sudo chmod a+rw /dev/i2c-*
```
