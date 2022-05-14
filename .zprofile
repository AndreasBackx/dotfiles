## SOURCING ##

source ~/.config/.variables
source ~/.config/.secrets

## ENV VARS ##

skip_global_compinit=1
export ZSH=$HOME/.oh-my-zsh
# Enable extra zsh completions: https://github.com/zsh-users/zsh-completions
fpath+=${ZSH_CUSTOM:-${ZSH:-~/.oh-my-zsh}/custom}/plugins/zsh-completions/src

export LC_ALL=en_GB.UTF-8
export LANG=en_GB.UTF-8
export PROMPT_EOL_MARK=""

# XDG
export XDG_DATA_HOME="$HOME/.local/share"
export XDG_CONFIG_HOME="$HOME/.config"
export XDG_STATE_HOME="$HOME/.local/state"
export XDG_CACHE_HOME="$HOME/.cache"

export CARGO_HOME="$XDG_DATA_HOME"/cargo
export DOCKER_CONFIG="$XDG_CONFIG_HOME"/docker
export GNUPGHOME="$XDG_DATA_HOME"/gnupg
export GRADLE_USER_HOME="$XDG_DATA_HOME"/gradle
export GTK2_RC_FILES="$XDG_CONFIG_HOME"/gtk-2.0/gtkrc
export NPM_CONFIG_USERCONFIG=$XDG_CONFIG_HOME/npm/npmrc
export NVM_DIR="$XDG_DATA_HOME"/nvm
export _JAVA_OPTIONS=-Djava.util.prefs.userRoot="$XDG_CONFIG_HOME"/java
export PARALLEL_HOME="$XDG_CONFIG_HOME"/parallel
export RUSTUP_HOME="$XDG_DATA_HOME"/rustup
export TEXMFVAR=$XDG_CACHE_HOME/texlive/texmf-var
export WINEPREFIX="$XDG_DATA_HOME"/wine

# $ENV_LOCATION should be set in .variables.
if [[ "$ENV_LOCATION" != "devserver" ]]; then
  export PYENV_ROOT=$XDG_DATA_HOME/pyenv
  PATH="$PYENV_ROOT/bin:$PATH"
  eval "$(pyenv init --path)"
  eval "$(pyenv virtualenv-init -)"
fi


alias irssi=irssi --config="$XDG_CONFIG_HOME"/irssi/config --home="$XDG_DATA_HOME"/irssi
alias svn="svn --config-dir $XDG_CONFIG_HOME/subversion"
alias wget=wget --hsts-file="$XDG_DATA_HOME/wget-hsts"

# Sway to use legacy mode for gamma changing for redshift
export WLR_DRM_NO_ATOMIC=1

export VISUAL=vim
export EDITOR="$VISUAL"

export BROWSER="/usr/bin/firefox"

# Otherwise IntelliJ won't run on Sway.
# https://youtrack.jetbrains.com/issue/IDEA-153134
export _JAVA_AWT_WM_NONREPARENTING=1

# Firefox new touchpad input support.
export MOZ_USE_XINPUT2=1

if [[ -n "$SSH_CONNECTION" ]]; then
  # Use GPG curses based pin entry via SSH.
  export GPG_TTY=$(tty)
fi

## PATH ##

# Do not add duplicates to PATH
typeset -U PATH

export GOPATH=$HOME/dev/go
unset GOROOT
PATH=$GOPATH/bin:$PATH

# PREPEND
PATH=$HOME/.cargo/bin:$PATH
PATH=/usr/local/sbin:$PATH
PATH=/usr/local/bin:$PATH
PATH=$HOME/.bin:$PATH
PATH=$HOME/.local/bin:$PATH

# APPEND
PATH=$PATH:~/.npm-global/bin
PATH=$PATH:~/.local/bin
PATH=$PATH:~/.poetry/bin
PATH=$PATH:/var/lib/flatpak/exports/bin

## Linux / MacOS ##
machine=`uname -s`
if [[ $machine == "Linux" ]]; then
  # Linux specific commands.

  # Make Electron use gio for trash.
  # Used for VS Code.
  export ELECTRON_TRASH="gio"

  # https://wiki.archlinux.org/title/Firefox#Applications_on_Wayland_can_not_launch_Firefox
  export MOZ_DBUS_REMOTE=1
elif [[ $machine == "Darwin" ]]; then
  # MacOS specific commands.

  # Use GNU utils.
  PATH="/usr/local/opt/coreutils/libexec/gnubin:$PATH"

  export GLASSFISH_HOME=/usr/local/opt/glassfish/libexec

  # Ignore iTunes play button
  # launchctl unload -w /System/Library/LaunchAgents/com.apple.rcd.plist &> /dev/null

  # Use GNU man.
  MANPATH="/usr/local/opt/coreutils/libexec/gnuman:$MANPATH"

  alias flushdns="sudo dscacheutil -flushcache;sudo killall -HUP mDNSResponder"
fi

## EXEC ###
if [ -z "$DISPLAY" ] && [ -n "$XDG_VTNR" ] && [ "$XDG_VTNR" -eq 1 ]; then
  exec sway > /var/log/sway.log 2>&1
elif [[ -n "$PS1" ]] && [[ -z "$TMUX" ]] && [[ -n "$SSH_CONNECTION" ]]; then
  if [[ $TERM == "xterm-kitty" ]]; then
    tmux attach-session -t ssh_tmux || tmux new-session -s ssh_tmux
  else
    tmux -CC attach-session -t ssh_tmux || tmux -CC new-session -s ssh_tmux
  fi
fi

## ZSH ##
# Do not warn if glob has no matches.
setopt no_nomatch

[ -f ~/.fzf.zsh ] && source ~/.fzf.zsh
[ -f /usr/share/nvm/init-nvm.sh ] && source /usr/share/nvm/init-nvm.sh
