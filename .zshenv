## SOURCING ##
# Sourcing again so they can be dynamically changed without logging out/in again.

source ~/.config/.variables
source ~/.config/.local-variables
source ~/.config/.secrets

## ALIASES ##
alias config='git --git-dir=$HOME/.cfg/ --work-tree=$HOME'
alias sudo="sudo -E"

ZSHENV_WORK="$HOME/.zshenv-work"

if [[ -f "$ZSHENV_WORK" ]]; then
    source "$ZSHENV_WORK"
fi
