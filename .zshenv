source ~/.config/.variables
source ~/.config/.secrets
source ~/.bin/hg_commit.zsh

export ZSH_AUTOSUGGEST_HIGHLIGHT_STYLE="fg=0"
plugins=(
  zsh-autosuggestions
  zsh-syntax-highlighting
  fzf
)

# Do not add duplicates to PATH
typeset -U PATH

machine=`uname -s`
if [[ $machine == "Linux" ]]; then
  # Linux specific commands.

  # Make Electron use gio for trash.
  # Used for VS Code.
  export ELECTRON_TRASH="gio"

  export BROWSER="/usr/bin/firefox"

  # https://wiki.archlinux.org/title/Firefox#Applications_on_Wayland_can_not_launch_Firefox
  export MOZ_DBUS_REMOTE=1
elif [[ $machine == "Darwin" ]]; then
  # MacOS specific commands.

  # Use GNU utils.
  PATH="/usr/local/opt/coreutils/libexec/gnubin:$PATH"

  export GLASSFISH_HOME=/usr/local/opt/glassfish/libexec
fi

# Go
export GOPATH=$HOME/dev/go
unset GOROOT
PATH=$GOPATH/bin:$PATH

# Rust
PATH=$HOME/.cargo/bin:$PATH

# More PATH
PATH=/usr/local/sbin:$PATH
PATH=/usr/local/bin:$PATH
PATH=$HOME/.bin:$PATH
PATH=$HOME/.local/bin:$PATH
PATH=$PATH:~/.npm-global/bin

# $ENV_LOCATION should be set in .variables.
if [[ "$ENV_LOCATION" != "devserver" ]]; then
  export PYENV_ROOT="$HOME/.pyenv"
  export PATH="$PYENV_ROOT/bin:$PATH"
  eval "$(pyenv init --path)"
fi

# Otherwise IntelliJ won't run on Sway.
# https://youtrack.jetbrains.com/issue/IDEA-153134
export _JAVA_AWT_WM_NONREPARENTING=1

ZSHENV_WORK="$HOME/.zshenv-work"

if [[ -f "$ZSHENV_WORK" ]]; then
    source "$ZSHENV_WORK"
fi

if [[ -n "$TMUX" ]]; then
  # Use GPG curses based pin entry in tmux.
  export GPG_TTY=$(tty)
fi
