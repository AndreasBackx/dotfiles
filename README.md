
# Dotfiles

This repository contains most if not all of the changes made to my machines that run Arch Linux, Fedora, Ubuntu, or CentOS, but primarily Arch Linux as it's what I use on my personal computers. It should support both sway and i3.

## Unstaged File Templates

`.config/.local-variables`
```zsh
#!/usr/bin/env zsh

# Optionally name the location of your shell environment.
export ENV_LOCATION=""

# You can use variables from ~/.config/.variables.
export MONITOR_LEFT="$MONITOR_HOME_LEFT"
export MONITOR_CENTER="$MONITOR_HOME_CENTER"
export MONITOR_RIGHT="$MONITOR_HOME_RIGHT"
# export MONITOR_TV="$MONITOR_HOME_TV"
# export MONITOR_LAPTOP=""

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
echo ".cfg" >> .gitignore
git clone --bare git@github.com:AndreasBackx/dotfiles.git $HOME/.cfg
alias config='/usr/bin/git --git-dir=$HOME/.cfg/ --work-tree=$HOME'
mkdir -p .config-backup
config checkout 2>&1 | egrep "\s+\." | awk {'print $1'} | xargs -I{} mv {} .config-backup/{}
config checkout
config config --local status.showUntrackedFiles no

touch ~/.config/.secrets
touch ~/.config/.local-variables

source ~/.zprofile
source ~/.zshenv
source ~/.zshrc

# oh-my-zsh
sh -c "$(curl -fsSL https://raw.githubusercontent.com/ohmyzsh/ohmyzsh/master/tools/install.sh)" "" --keep-zshrc

# spaceship-prompt
git clone git@github.com:denysdovhan/spaceship-prompt.git "$ZSH_CUSTOM/themes/spaceship-prompt" --depth=1
ln -s "$ZSH_CUSTOM/themes/spaceship-prompt/spaceship.zsh-theme" "$ZSH_CUSTOM/themes/spaceship.zsh-theme"

# zsh-autosuggestions
git clone git@github.com:zsh-users/zsh-autosuggestions.git ${ZSH_CUSTOM:-~/.oh-my-zsh/custom}/plugins/zsh-autosuggestions
chmod 755 ~/.oh-my-zsh/custom/plugins/zsh-autosuggestions -R

# zsh-syntax-highlighting
git clone git@github.com:zsh-users/zsh-syntax-highlighting.git ${ZSH_CUSTOM:-~/.oh-my-zsh/custom}/plugins/zsh-syntax-highlighting
chmod 755 ~/.oh-my-zsh/custom/plugins/zsh-syntax-highlighting -R

# zsh-completions
git clone git@github.com:zsh-users/zsh-completions ${ZSH_CUSTOM:-${ZSH:-~/.oh-my-zsh}/custom}/plugins/zsh-completions

# autoupdate
git clone git@github.com:TamCore/autoupdate-oh-my-zsh-plugins.git ${ZSH_CUSTOM:-${ZSH:-~/.oh-my-zsh}/custom}/plugins/autoupdate

# fzf
## Arch Linux
paru -S fzf
## Fedora
sudo dnf install fzf
## Debian
sudo apt-get install fzf
## MacOS
brew install fzf

# pyenv
git clone git@github.com:pyenv/pyenv.git $PYENV_ROOT
cd $PYENV_ROOT && src/configure && make -C src
git clone git@github.com:pyenv/pyenv-virtualenv.git $(pyenv root)/plugins/pyenv-virtualenv
git clone git@github.com:pyenv/pyenv-update.git $(pyenv root)/plugins/pyenv-update

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
