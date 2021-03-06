## SOURCING ##

source ~/.config/.variables
source ~/.config/.secrets

## ENV VARS ##

skip_global_compinit=1
export ZSH=$HOME/.oh-my-zsh
export LC_ALL=en_GB.UTF-8
export LANG=en_GB.UTF-8
export PROMPT_EOL_MARK=""

# Sway to use legacy mode for gamma changing for redshift
export WLR_DRM_NO_ATOMIC=1

export VISUAL=vim
export EDITOR="$VISUAL"

export BROWSER="/usr/bin/firefox"

# Otherwise IntelliJ won't run on Sway.
# https://youtrack.jetbrains.com/issue/IDEA-153134
export _JAVA_AWT_WM_NONREPARENTING=1

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
PATH=$PATH:~/.pyenv/bin
PATH=$PATH:~/.local/bin

# $ENV_LOCATION should be set in .variables.
if [[ "$ENV_LOCATION" != "devserver" ]]; then
  export PYENV_ROOT="$HOME/.pyenv"
  PATH="$PYENV_ROOT/bin:$PATH"
  eval "$(pyenv init --path)"
  eval "$(pyenv virtualenv-init -)"
fi

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