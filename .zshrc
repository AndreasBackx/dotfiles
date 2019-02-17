source ~/.profile
source ~/.secrets

# Zsh
skip_global_compinit=1
export ZSH=$HOME/.oh-my-zsh
export LC_ALL=en_GB.UTF-8
export LANG=en_GB.UTF-8
export PROMPT_EOL_MARK=""
ZSH_THEME="andreas"
export LS_COLORS="di=34:ln=35:so=32:pi=33:ex=31:bd=34;46:cd=34;43:su=30;41:sg=30;46:tw=30;42:ow=30;43"
export VISUAL=vim
export EDITOR="$VISUAL"
source $ZSH/oh-my-zsh.sh
export BROWSER="/usr/bin/chromium"

# OS-specific
machine=`uname -s`
if [[ $machine == "Linux" ]]; then
  # Linux specific commands.

  # Make Electron use gio for trash.
  # Used for VS Code.
  # export ELECTRON_TRASH="/usr/bin/gio"

elif [[ $machine == "Darwin" ]]; then
  # MacOS specific commands.

  # Ignore iTunes play button
  # launchctl unload -w /System/Library/LaunchAgents/com.apple.rcd.plist &> /dev/null

  export STUDIO_JDK="/Applications/IntelliJ IDEA.app/Contents/jre/jdk"

  # Use GNU man.
  MANPATH="/usr/local/opt/coreutils/libexec/gnuman:$MANPATH"

  alias flushdns="sudo dscacheutil -flushcache;sudo killall -HUP mDNSResponder"

  alias imgur-screenshot="imgur-screenshot.sh"
fi

# Ruby
eval "$(rbenv init -)"

# SSH forwarding
# eval $(ssh-agent -s)

# Groovy
export GROOVY_HOME="/usr/local/opt/groovy/libexec"

# Rbenv
if which rbenv > /dev/null; then eval "$(rbenv init - --no-rehash)"; fi

# Pyenv
if which pyenv > /dev/null; then eval "$(pyenv init - --no-rehash)"; fi
if which pyenv-virtualenv-init > /dev/null; then eval "$(pyenv virtualenv-init - --no-rehash)"; fi
export PYENV_VIRTUALENV_DISABLE_PROMPT=1

alias workon="pyenv activate"
alias deactivate="pyenv deactivate"
alias mkvirtualenv="pyenv virtualenv"

# Other aliases
alias config='git --git-dir=$HOME/.cfg/ --work-tree=$HOME'
alias startServer="browser-sync start --files='*.html, *.css, css/*.css, js/*.js, img/*' --server --no-ghost-mode --no-notify --no-open"
alias sudo="sudo -E"
