# ------------------------------------------------------------------------------
# Configuration
# ------------------------------------------------------------------------------

SPACESHIP_VCS_ASYNC="${SPACESHIP_VCS_ASYNC=true}"
SPACESHIP_VCS_SHOW="${SPACESHIP_VCS_SHOW=true}"
SPACESHIP_VCS_PREFIX="${SPACESHIP_VCS_PREFIX=""}"
SPACESHIP_VCS_SUFFIX="${SPACESHIP_VCS_SUFFIX=" "}"
SPACESHIP_VCS_SYMBOL="${SPACESHIP_VCS_SYMBOL=" "}"
SPACESHIP_VCS_COLOR="${SPACESHIP_VCS_COLOR="magenta"}"

# ------------------------------------------------------------------------------
# Section
# ------------------------------------------------------------------------------

spaceship_vcs() {
    [[ $SPACESHIP_VCS_SHOW == false ]] && return

    if command -v jj >/dev/null 2>&1 && command jj --ignore-working-copy root >/dev/null 2>&1; then
        if ! command -v jj-starship >/dev/null 2>&1; then
            return
        fi

        local vcs_info
        vcs_info=$(command jj-starship prompt --no-symbol 2>/dev/null)
        [[ -n "$vcs_info" ]] || return

        vcs_info="${vcs_info//\%/%%}"

        if command -v perl >/dev/null 2>&1; then
            vcs_info=$(printf '%s' "$vcs_info" | command perl -pe 's/\e\[[0-9;]*m/%{$&%}/g')
        fi

        vcs_info="%{%b%}${vcs_info}"

        spaceship::section::v4 --color "$SPACESHIP_VCS_COLOR" --prefix "$SPACESHIP_VCS_PREFIX" --suffix "$SPACESHIP_VCS_SUFFIX" --symbol "$SPACESHIP_VCS_SYMBOL" "$vcs_info"
        return
    fi

    if ! typeset -f spaceship_git >/dev/null 2>&1; then
        [[ -n "$SPACESHIP_ROOT" ]] && source "$SPACESHIP_ROOT/sections/git.zsh"
    fi

    typeset -f spaceship_git >/dev/null 2>&1 || return
    spaceship_git
}
