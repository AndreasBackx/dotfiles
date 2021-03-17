
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
