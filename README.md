
# Dotfiles

This repository contains most if not all of the changes made to my machines that run Arch Linux, Fedora, Ubuntu, or CentOS, but primarily Arch Linux as it's what I use on my personal computers. The desktop environment setup is Hyprland.

## Example `~/.config/chezmoi/chezmoi.toml`

```toml
[data]
[data.monitors]
selected = "home"

[edit]
    command = "code"
    args = ["--wait"]

[git]
    autoCommit = true
    autoPush = true
```

## Unstaged File Templates

`.config/.local-variables`
```zsh
#!/usr/bin/env zsh

# Optionally name the location of your shell environment.
export ENV_LOCATION=""

# If you want to disable the monitors cli.
# export DISABLE_MONITORS="yes"

# Borg backup settings.
export BORG_REPO=""
export BORG_BASE_DIR=""
```

`.config/.secrets`
```zsh
# borg backup
export BORG_PASSPHRASE=""

# spotifatius
export RSPOTIFY_CLIENT_ID=""
export RSPOTIFY_CLIENT_SECRET=""

# spotifycl
export SPOTIPY_CLIENT_ID=""
export SPOTIPY_CLIENT_SECRET=""
export SPOTIPY_REDIRECT_URI="http://localhost"

# GitHub
export GITHUB_TOKEN=""
```

## Installation

```zsh
touch ~/.config/.secrets
touch ~/.config/.local-variables

# Homebrew
git clone https://github.com/Homebrew/brew ~/.homebrew
brew update

# fzf
## Arch Linux
paru -S fzf
## Fedora
sudo dnf install fzf
## Debian
sudo apt-get install fzf
## MacOS
brew install fzf

# ddcutil i2c
sudo groupadd --system i2c
sudo usermod $(whoami) -aG i2c
sudo cp /usr/share/ddcutil/data/45-ddcutil-i2c.rules /etc/udev/rules.d

# Or change the permissions
# For current boot
sudo chmod a+rw /dev/i2c-*
# Or after quick logout
sudo chgrp i2c /dev/i2c-*

# oh-my-tmux
git clone git@github.com:gpakosz/.tmux.git
ln -s -f .tmux/.tmux.conf

# delta
## Arch Linux
paru -S git-delta
## Fedora
sudo dnf install git-delta
## MacOS
brew install git-delta
## Other: https://github.com/dandavison/delta#installation

# bat
## Arch linux
paru -S bat
## Fedora
sudo dnf install rust-bat
## Debian
sudo apt-get install rust-bat
## MacOS
brew install bat
## Other: https://github.com/sharkdp/bat#installation

# lsd
## Arch linux
paru -S lsd
## Fedora
sudo dnf install lsd
## MacOS
brew install lsd
## Other: https://github.com/Peltoche/lsd#installation

# duf
## Arch Linux
paru -S duf
## MacOS
brew install duf
## Other: https://github.com/muesli/duf#installation

# ripgrep
## Arch Linux
paru -S ripgrep
## Fedora
sudo dnf install ripgrep
## Debian
sudo apt-get install ripgrep
## MacOS
brew install ripgrep
## Other: https://github.com/BurntSushi/ripgrep#installation

# choose
## Arch Linux
paru -S choose-rust-git
## Fedora
sudo dnf copr enable atim/choose
sudo dnf install choose
## MacOS
brew install choose-rust
## Other: https://github.com/theryangeary/choose#compilation-and-installation


# hyperfine
## Arch Linux
paru -S hyperfine
## Fedora
sudo dnf install hyperfine
## MacOS
brew install hyperfine
## Other: https://github.com/sharkdp/hyperfine#installation
```

### gammastep

Make sure gammastep, gammastep-gtk, and geoclue are installed. Then add the following to `/etc/geoclue/geoclue.conf`:

```ini
[gammastep]
allowed=true
system=false
users=
```
