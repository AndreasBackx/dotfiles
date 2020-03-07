# Zsh
skip_global_compinit=1
export ZSH=$HOME/.oh-my-zsh
export LC_ALL=en_GB.UTF-8
export LANG=en_GB.UTF-8
export PROMPT_EOL_MARK=""
ZSH_THEME="spaceship"
SPACESHIP_TIME_SHOW="true"
SPACESHIP_TIME_FORMAT="[%T]"
SPACESHIP_PROMPT_ORDER=(
  # user          # Username section
  dir           # Current directory section
  # host          # Hostname section
  git           # Git section (git_branch + git_status)
  # hg            # Mercurial section (hg_branch  + hg_status)
  # package       # Package version
  # node          # Node.js section
  # ruby          # Ruby section
  # elixir        # Elixir section
  # xcode         # Xcode section
  # swift         # Swift section
  golang        # Go section
  # php           # PHP section
  # rust          # Rust section
  # haskell       # Haskell Stack section
  # julia         # Julia section
  docker        # Docker section
  # aws           # Amazon Web Services section
  # venv          # virtualenv section
  # conda         # conda virtualenv section
  # pyenv         # Pyenv section
  # dotnet        # .NET section
  # ember         # Ember.js section
  kubecontext   # Kubectl context section
  # terraform     # Terraform workspace section
  exec_time     # Execution time
  line_sep      # Line break
  # battery       # Battery level and status
  # vi_mode       # Vi-mode indicator
  jobs          # Background jobs indicator
  exit_code     # Exit code section
  char          # Prompt character
)
SPACESHIP_RPROMPT_ORDER=(
  time          # Time stamps section
)
export LS_COLORS="di=34:ln=35:so=32:pi=33:ex=31:bd=34;46:cd=34;43:su=30;41:sg=30;46:tw=30;42:ow=30;43"
export VISUAL=vim
export EDITOR="$VISUAL"
plugins=(dotenv)
source $ZSH/oh-my-zsh.sh

# OS-specific
machine=`uname -s`
if [[ $machine == "Linux" ]]; then
  # Linux specific commands.

  export BROWSER="/usr/bin/firefox"
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

# Groovy
export GROOVY_HOME="/usr/local/opt/groovy/libexec"

# Pyenv
alias workon="pyenv activate"
alias deactivate="pyenv deactivate"
alias mkvirtualenv="pyenv virtualenv"

# Other aliases
alias config='git --git-dir=$HOME/.cfg/ --work-tree=$HOME'
alias startServer="browser-sync start --files='*.html, *.css, css/*.css, js/*.js, img/*' --server --no-ghost-mode --no-notify --no-open"
alias sudo="sudo -E"
