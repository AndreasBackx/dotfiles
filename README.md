
# Dotfiles

This repository contains most if not all of the changes made to my machines that run Arch Linux, Fedora, Ubuntu, or CentOS, but primarily Arch Linux as it's what I use on my personal computers. It should support both sway and i3.

## Unstaged File Templates

`.config/.variables`
```zsh
#!/usr/bin/env zsh

# Optionally ame the location of your shell environment.
export ENV_LOCATION=""

export MONITOR_LEFT=""
export MONITOR_CENTER""
export MONITOR_RIGHT=""
# Uncomment to indicate there is a laptop monitor.
# export MONITOR_LAPTOP="yes"

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
touch ~/.config/.variables
```

### oh-my-zsh

```zsh
sh -c "$(curl -fsSL https://raw.githubusercontent.com/ohmyzsh/ohmyzsh/master/tools/install.sh)" "" --keep-zshrc
```

### spaceship-prompt

```zsh
git clone https://github.com/denysdovhan/spaceship-prompt.git "$ZSH_CUSTOM/themes/spaceship-prompt" --depth=1
ln -s "$ZSH_CUSTOM/themes/spaceship-prompt/spaceship.zsh-theme" "$ZSH_CUSTOM/themes/spaceship.zsh-theme"
```


### zsh-autosuggestions

```zsh
git clone git@github.com:zsh-users/zsh-autosuggestions.git ${ZSH_CUSTOM:-~/.oh-my-zsh/custom}/plugins/zsh-autosuggestions
chmod 755 ~/.oh-my-zsh/custom/plugins/zsh-autosuggestions -R
```

### zsh-syntax-highlighting

```zsh
git clone git@github.com:zsh-users/zsh-syntax-highlighting.git ${ZSH_CUSTOM:-~/.oh-my-zsh/custom}/plugins/zsh-syntax-highlighting
chmod 755 ~/.oh-my-zsh/custom/plugins/zsh-syntax-highlighting -R
```

### fzf

**Arch User Repository (AUR)**

```zsh
yay -S fzf
```

**Fedora**

```zsh
sudo dnf install fzf
```

**Debian**

```zsh
sudo apt-get install fzf
```

### pyenv

```zsh
git clone git@github.com:pyenv/pyenv.git ~/.pyenv
cd ~/.pyenv && src/configure && make -C src
git clone git@github.com:pyenv/pyenv-virtualenv.git $(pyenv root)/plugins/pyenv-virtualenv
git clone https://github.com/pyenv/pyenv-update.git $(pyenv root)/plugins/pyenv-update
```
### ~/.npm-global

```
mkdir ~/.npm-global
npm config set prefix ~/.npm-global
```

### ddcutil i2c

From:

```
sudo groupadd --system i2c
sudo usermod $(whoami) -aG i2c
sudo cp /usr/share/ddcutil/data/45-ddcutil-i2c.rules /etc/udev/rules.d

# Or change the permissions
# For current boot
sudo chmod a+rw /dev/i2c-*
# Or after quick logout
sudo chgrp i2c /dev/i2c-*
```

### oh-my-tmux

```
git clone https://github.com/gpakosz/.tmux.git
ln -s -f .tmux/.tmux.conf
```
