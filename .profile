
machine=`uname -s`
if [[ $machine == "Darwin" ]]; then
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
PATH=$ANDROID_HOME/platform-tools:$PATH
PATH=$ANDROID_HOME/tools:$PATH

# Ruby
PATH=$HOME/.gem/ruby/2.4.0/bin:$PATH

# More PATH
PATH=/usr/local/sbin:$PATH
PATH=/usr/local/bin:$PATH
PATH=~/.npm-global/bin:$PATH
PATH=/home/andreas/.yarn/bin:$PATH
PATH=$HOME/.bin:$PATH
PATH=$HOME/.pyenv/shims:$PATH
PATH=$PATH:./node_modules/.bin
export PATH
