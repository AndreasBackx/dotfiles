source ~/.config/.variables
source ~/.config/.secrets
source ~/.bin/hg_commit.zsh

export ZSH_AUTOSUGGEST_HIGHLIGHT_STYLE="fg=0"
plugins=(
  zsh-autosuggestions
  zsh-syntax-highlighting
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
if [[ $ENV_LOCATION != "devserver" ]]; then
  # Pyenv
  if which pyenv > /dev/null; then eval "$(pyenv init -)"; fi
  if which pyenv-virtualenv-init > /dev/null; then eval "$(pyenv virtualenv-init -)"; fi
  export PYENV_VIRTUALENV_DISABLE_PROMPT=1
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
