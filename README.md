
# Dotfiles

This repository contains most if not all of the changes made to my machines that run Arch Linux, Fedora, Ubuntu, or CentOS, but primarily Arch Linux as it's what I use on my personal computers. It should support both sway and i3.

## Unstaged File Templates

`.config/.variables`
```
export MONITOR_LEFT=""
export MONITOR_CENTER""
export MONITOR_RIGHT=""

# If you want to disable the monitors cli.
# export DISABLE_MONITORS="yes"

# Borg backup settings.
export BORG_REPO=""
export BORG_BASE_DIR=""
```

`.config/.secrets`
```
# borg backup
export BORG_PASSPHRASE=""

# spotifycl
export SPOTIPY_CLIENT_ID=""
export SPOTIPY_CLIENT_SECRET=""
export SPOTIPY_REDIRECT_URI="http://localhost"
```

## Installation

```
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

```
sh -c "$(wget https://raw.github.com/ohmyzsh/ohmyzsh/master/tools/install.sh -O -)"
```

### spaceship-prompt

```
git clone https://github.com/denysdovhan/spaceship-prompt.git "$ZSH_CUSTOM/themes/spaceship-prompt" --depth=1
ln -s "$ZSH_CUSTOM/themes/spaceship-prompt/spaceship.zsh-theme" "$ZSH_CUSTOM/themes/spaceship.zsh-theme"
```


### zsh-autosuggestions

```
git clone git@github.com:zsh-users/zsh-autosuggestions.git ${ZSH_CUSTOM:-~/.oh-my-zsh/custom}/plugins/zsh-autosuggestions
chmod 755 ~/.oh-my-zsh/custom/plugins/zsh-autosuggestions -R
```

### zsh-syntax-highlighting

```
git clone git@github.com:zsh-users/zsh-syntax-highlighting.git ${ZSH_CUSTOM:-~/.oh-my-zsh/custom}/plugins/zsh-syntax-highlighting
chmod 755 ~/.oh-my-zsh/custom/plugins/zsh-syntax-highlighting -R
```
