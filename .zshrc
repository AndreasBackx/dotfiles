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
  dir           # Current directory section
  git           # Git section (git_branch + git_status)
  hg_commit
  golang        # Go section
  rust          # Rust section
  pyenv         # Pyenv section
  exec_time     # Execution time
  line_sep      # Line break
  jobs          # Background jobs indicator
  exit_code     # Exit code section
  char          # Prompt character
)
SPACESHIP_RPROMPT_ORDER=()

if type "ldcli" > /dev/null; then
  plugins+=(logdevice)
  SPACESHIP_RPROMPT_ORDER+=(logdevice)
  eval $(ldcli :session init)
fi

if [[ -z "$TMUX" ]]; then
  # Only show host if not running in tmux.
  SPACESHIP_RPROMPT_ORDER+=(host)
fi

SPACESHIP_RPROMPT_ORDER+=(
  time          # Time stamps section
)

# $ENV_LOCATION should be set in .variables.
if [[ "$ENV_LOCATION" != "devserver" ]]; then
  if which pyenv > /dev/null; then eval "$(pyenv init - --no-rehash zsh)"; fi
  if which pyenv-virtualenv-init > /dev/null; then eval "$(pyenv virtualenv-init -)"; fi
fi

export LS_COLORS="di=34:ln=35:so=32:pi=33:ex=31:bd=34;46:cd=34;43:su=30;41:sg=30;46:tw=30;42:ow=30;43"
export VISUAL=vim
export EDITOR="$VISUAL"
source $ZSH/oh-my-zsh.sh

if [[ $machine == "Linux" ]]; then
  # Linux specific commands.
elif [[ $machine == "Darwin" ]]; then
  # MacOS specific commands.

  # Ignore iTunes play button
  # launchctl unload -w /System/Library/LaunchAgents/com.apple.rcd.plist &> /dev/null

  # Use GNU man.
  MANPATH="/usr/local/opt/coreutils/libexec/gnuman:$MANPATH"

  alias flushdns="sudo dscacheutil -flushcache;sudo killall -HUP mDNSResponder"
fi

# Other aliases
alias config='git --git-dir=$HOME/.cfg/ --work-tree=$HOME'
alias sudo="sudo -E"

if [[ -n "$SSH_CONNECTION" ]]; then
  # Enable GPG pin entry using curses only via SSH.
  export GPG_TTY=$(tty)
fi


if [[ -n "$PS1" ]] && [[ -z "$TMUX" ]] && [[ -n "$SSH_CONNECTION" ]]; then
  if [[ $TERM == "xterm-kitty" ]]; then
    tmux attach-session -t ssh_tmux || tmux new-session -s ssh_tmux
  else
    tmux -CC attach-session -t ssh_tmux || tmux -CC new-session -s ssh_tmux
  fi
fi
