
# Dotfiles

This repository contains most if not all of the changes made to my machines that run Arch Linux, Fedora, Ubuntu, or CentOS, but primarily Fedora as it's what I use on my personal computers. It should support both Hyprland primarily, though past versions used Sway and i3.

## Installation

```zsh
# Packages
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
    # duf \
    ripgrep \
    choose \
    hyperfine

## MacOS
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
    # git-delta \
    rust-bat \
    # eza \
    # duf \
    ripgrep \
    choose-rust-git
    # hyperfine

## Other
# https://github.com/dandavison/delta#installation
# https://github.com/sharkdp/bat#installation
# https://github.com/eza-community/eza
# https://github.com/muesli/duf#installation
# https://github.com/BurntSushi/ripgrep#installation
# https://github.com/theryangeary/choose#compilation-and-installation
# https://github.com/sharkdp/hyperfine#installation

# ddcutil i2c
sudo groupadd --system i2c
sudo usermod $(whoami) -aG i2c
sudo cp /usr/share/ddcutil/data/45-ddcutil-i2c.rules /etc/udev/rules.d

# Or change the permissions
# For current boot
sudo chmod a+rw /dev/i2c-*
# Or after quick logout
sudo chgrp i2c /dev/i2c-*
```
