source ~/.secrets

# Do not add duplicates to PATH
typeset -U PATH

machine=`uname -s`
if [[ $machine == "Linux" ]]; then
  # Linux specific commands.

  # Make Electron use gio for trash.
  # Used for VS Code.
  export ELECTRON_TRASH="gio"

  export BROWSER="/usr/bin/chromium"
elif [[ $machine == "Darwin" ]]; then
  # MacOS specific commands.

  # Use GNU utils.
  PATH="/usr/local/opt/coreutils/libexec/gnubin:$PATH"

  export GLASSFISH_HOME=/usr/local/opt/glassfish/libexec
fi

# Ruby
export PATH="$HOME/.rbenv/bin:$PATH"

# Go
export GOPATH=$HOME/Development/Go
unset GOROOT
PATH=$GOPATH/bin:$PATH


# Android
export ANDROID_HOME=$HOME/Development/Android/SDK
PATH=$PATH:$ANDROID_HOME/platform-tools
PATH=$PATH:$ANDROID_HOME/tools

# More PATH
PATH=/usr/local/sbin:$PATH
PATH=/usr/local/bin:$PATH
PATH=$HOME/.bin:$PATH
PATH=$PATH:/home/andreas/.yarn/bin
PATH=$PATH:./node_modules/.bin

#if which rbenv > /dev/null; then eval "$(rbenv init - zsh --no-rehash)"; fi

# Pyenv
if which pyenv > /dev/null; then eval "$(pyenv init - zsh --no-rehash)"; fi
if which pyenv-virtualenv-init > /dev/null; then eval "$(pyenv virtualenv-init -)"; fi
export PYENV_VIRTUALENV_DISABLE_PROMPT=1
