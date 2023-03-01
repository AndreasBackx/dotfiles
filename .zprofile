## SOURCING ##

source ~/.config/.variables
source ~/.config/.secrets

## ENV VARS ##

skip_global_compinit=1
export ZSH=$HOME/.oh-my-zsh
# Enable extra zsh completions: https://github.com/zsh-users/zsh-completions
fpath+="${ZSH_CUSTOM:-${ZSH:-~/.oh-my-zsh}/custom}/plugins/zsh-completions/src"

export LC_ALL=en_GB.UTF-8
export LANG=en_GB.UTF-8
export PROMPT_EOL_MARK=""

# autoupdate
export UPDATE_ZSH_DAYS=30

## Linux / MacOS ##
machine=`uname -s`
if [[ $machine == "Linux" ]]; then
  # Linux specific commands.

  # Make Electron use gio for trash.
  # Used for VS Code.
  export ELECTRON_TRASH="gio"

  # https://wiki.archlinux.org/title/Firefox#Applications_on_Wayland_can_not_launch_Firefox
  export MOZ_DBUS_REMOTE=1

  export XDG_DATA_HOME="$HOME/.local/share"
  export XDG_CONFIG_HOME="$HOME/.config"
  export XDG_STATE_HOME="$HOME/.local/state"
  export XDG_CACHE_HOME="$HOME/.cache"
elif [[ $machine == "Darwin" ]]; then
  # MacOS specific commands.

  # Use GNU utils.
  PATH="/usr/local/opt/coreutils/libexec/gnubin:$PATH"

  # Homebrew
  PATH="$HOME/.homebrew/bin:$HOME/.homebrew/sbin:$PATH"
  export FZF_BASE="$HOME/.homebrew/bin/..."

  export GLASSFISH_HOME=/usr/local/opt/glassfish/libexec

  # Ignore iTunes play button
  # launchctl unload -w /System/Library/LaunchAgents/com.apple.rcd.plist &> /dev/null

  # Use GNU man.
  MANPATH="/usr/local/opt/coreutils/libexec/gnuman:$MANPATH"

  alias flushdns="sudo dscacheutil -flushcache;sudo killall -HUP mDNSResponder"

  export XDG_DATA_HOME="$HOME/Library/Application Support"
  export XDG_CONFIG_HOME="$HOME/.config"
  export XDG_STATE_HOME="$HOME/Library/Application Support"
  export XDG_CACHE_HOME="$HOME/Library/Caches"
fi

# XDG
export CARGO_HOME="$XDG_DATA_HOME"/cargo
export DOCKER_CONFIG="$XDG_CONFIG_HOME"/docker
export GNUPGHOME="$XDG_DATA_HOME"/gnupg
export GRADLE_USER_HOME="$XDG_DATA_HOME"/gradle
export GTK2_RC_FILES="$XDG_CONFIG_HOME"/gtk-2.0/gtkrc
export NPM_CONFIG_USERCONFIG=$XDG_CONFIG_HOME/npm/npmrc/.npmrc
export NVM_DIR="$XDG_DATA_HOME"/nvm
export _JAVA_OPTIONS=-Djava.util.prefs.userRoot="$XDG_CONFIG_HOME"/java
export PARALLEL_HOME="$XDG_CONFIG_HOME"/parallel
export RUSTUP_HOME="$XDG_DATA_HOME"/rustup
export TEXMFVAR=$XDG_CACHE_HOME/texlive/texmf-var
export WINEPREFIX="$XDG_DATA_HOME"/wine
export LESSHISTFILE="$XDG_CACHE_HOME"/less/history

export PYENV_ROOT="$XDG_DATA_HOME/pyenv"
PATH="$PYENV_ROOT/bin:$PATH"
# $ENV_LOCATION should be set in .local-variables.
if [[ "$ENV_LOCATION" != "devserver" ]] && type "pyenv" > /dev/null; then
  eval "$(pyenv init -)"
  eval "$(pyenv virtualenv-init -)"
fi


alias irssi=irssi --config="$XDG_CONFIG_HOME"/irssi/config --home="$XDG_DATA_HOME"/irssi
alias svn="svn --config-dir $XDG_CONFIG_HOME/subversion"
alias wget=wget --hsts-file="$XDG_DATA_HOME/wget-hsts"

if type "exa" > /dev/null; then
  alias ls="exa"
fi

# wlroots
# Use legacy mode for gamma changing for redshift.
# export WLR_DRM_NO_ATOMIC=1
# Use the Vulkan renderer for no flickering on Nvidia.
#export WLR_RENDERER="vulkan"

export VISUAL=nvim
export EDITOR="$VISUAL"

export BROWSER="/usr/bin/firefox"

# Otherwise IntelliJ won't run on Sway.
# https://youtrack.jetbrains.com/issue/IDEA-153134
export _JAVA_AWT_WM_NONREPARENTING=1

# Firefox new touchpad input support.
export MOZ_USE_XINPUT2=1
# Firefox use Wayland instead of XWayland.
export MOZ_ENABLE_WAYLAND=1

# https://gitlab.freedesktop.org/xorg/xserver/-/issues/1317
export XWAYLAND_NO_GLAMOR=1

if [[ -n "$SSH_CONNECTION" ]]; then
  # Use GPG curses based pin entry via SSH.
  export GPG_TTY=$(tty)
fi

## PATH ##

# Do not add duplicates to PATH
typeset -U PATH

export GOPATH=$HOME/dev/go
unset GOROOT
PATH="$GOPATH/bin:$PATH"

# PREPEND
PATH="$CARGO_HOME/bin:$PATH"
PATH="/usr/local/sbin:$PATH"
PATH="/usr/local/bin:$PATH"
PATH="$HOME/.bin:$PATH"
PATH="$HOME/.local/bin:$PATH"

# APPEND
PATH="$PATH:$HOME/.npm-global/bin"
PATH="$PATH:$HOME/.local/bin"
PATH="$PATH:/var/lib/flatpak/exports/bin"
PATH="$PATH:$HOME/.opam/default/bin"

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
