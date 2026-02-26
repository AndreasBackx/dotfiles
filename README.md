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

These are expected by scripts and config for Hyprland/Waybar setups:

- `minos`
- `waybar`
- `wireplumber` (`wpctl`)
- `kitty`
- `rofi` / `rofi-wayland`
- `sass` or `sassc`

## Validation and troubleshooting

```zsh
# Dry run without applying.
chezmoi apply --dry-run --verbose

# Check your system dependencies.
dot-doctor
```

Common issues:

- Missing wrappers: run `chezmoi apply` again after installing required desktop tools.
- Missing secrets: check `~/.config/.secrets` and your secrets provider setup.
- Headless mode: desktop checks are skipped and 1Password-backed secrets are not loaded.

## ddcutil access (if needed)

```zsh
sudo groupadd --system i2c
sudo usermod $(whoami) -aG i2c
sudo cp /usr/share/ddcutil/data/45-ddcutil-i2c.rules /etc/udev/rules.d

# Temporary permissions for current boot:
sudo chmod a+rw /dev/i2c-*
```
