source ~/.bin/hg_commit.zsh

## OH MY ZSH ##
plugins=(
  zsh-autosuggestions
  zsh-syntax-highlighting
  fzf
  poetry
)

ZSH_THEME="spaceship"

export ZSH_AUTOSUGGEST_HIGHLIGHT_STYLE="fg=0"
export LS_COLORS="di=34:ln=35:so=32:pi=33:ex=31:bd=34;46:cd=34;43:su=30;41:sg=30;46:tw=30;42:ow=30;43"

## SPACESHIP PROMPT ##
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

# if type "ldcli" &> /dev/null; then
#   plugins+=(logdevice)
#   SPACESHIP_RPROMPT_ORDER+=(logdevice)
#   eval $(ldcli :session init)
# fi

if [[ -z "$TMUX" ]]; then
  # Only show host if not running in tmux.
  SPACESHIP_RPROMPT_ORDER+=(host)
fi

SPACESHIP_RPROMPT_ORDER+=(
  time          # Time stamps section
)

source $HOME/.oh-my-zsh/oh-my-zsh.sh
