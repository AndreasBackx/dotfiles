# ------------------------------------------------------------------------------
# Configuration
# ------------------------------------------------------------------------------

SPACESHIP_HG_COMMIT_SHOW="${SPACESHIP_HG_COMMIT_SHOW=true}"
SPACESHIP_HG_COMMIT_PREFIX="${SPACESHIP_HG_COMMIT_PREFIX="on "}"
SPACESHIP_HG_COMMIT_SUFFIX="${SPACESHIP_HG_COMMIT_SUFFIX=" "}"
SPACESHIP_HG_COMMIT_SYMBOL="${SPACESHIP_HG_COMMIT_SYMBOL="☿ "}"
SPACESHIP_HG_COMMIT_COLOR="${SPACESHIP_HG_COMMIT_COLOR="magenta"}"

SPACESHIP_HG_STATUS_SHOW="${SPACESHIP_HG_STATUS_SHOW=true}"
SPACESHIP_HG_STATUS_PREFIX="${SPACESHIP_HG_STATUS_PREFIX=" ["}"
SPACESHIP_HG_STATUS_SUFFIX="${SPACESHIP_HG_STATUS_SUFFIX="]"}"
SPACESHIP_HG_STATUS_COLOR="${SPACESHIP_HG_STATUS_COLOR="red"}"
SPACESHIP_HG_STATUS_UNTRACKED="${SPACESHIP_HG_STATUS_UNTRACKED="?"}"
SPACESHIP_HG_STATUS_ADDED="${SPACESHIP_HG_STATUS_ADDED="+"}"
SPACESHIP_HG_STATUS_MODIFIED="${SPACESHIP_HG_STATUD_MODIFIED="!"}"
SPACESHIP_HG_STATUS_DELETED="${SPACESHIP_HG_STATUS_DELETED="✘"}"

# ------------------------------------------------------------------------------
# Section
# ------------------------------------------------------------------------------


commit_title() {
    local curr_hash="$(hg whereami)"
    if [ "$curr_hash" != "$__HG_CACHED_HASH" ]
    then
        local log_output=$(hg log -r . -T '{node} {desc|firstline}\n')
        if [ -n "$log_output" ]
        then
            __HG_CACHED_HASH="${log_output%% *}"
            __HG_CACHED_TITLE="${log_output#${__HG_CACHED_HASH} }"
        fi
    fi
    echo "$__HG_CACHED_TITLE"
}


spaceship_hg_commit() {
    [[ $SPACESHIP_HG_COMMIT_SHOW == false ]] && return

    spaceship::is_hg || return

    local 'hg_info'

    if ! hg_info=$(hg log -l1 | sed "4q;d" | cut -d' ' -f 2- | awk '{$1=$1};1' | awk -v len=60 '{ if (length($0) > len) print substr($0, 1, len-3) "..."; else print; }'); then
        # Failed, show no section.
        return
    fi

    if [[ -z $hg_info ]]; then
        return
    fi

    spaceship::section \
        "white" \
        "$SPACESHIP_HG_COMMIT_PREFIX"

    spaceship::section \
        "$SPACESHIP_HG_COMMIT_COLOR" \
            "${SPACESHIP_HG_COMMIT_SYMBOL}${hg_info}"

    local INDEX=$(hg status 2>/dev/null) hg_status=""

    # Indicators are suffixed instead of prefixed to each other to
    # provide uniform view across git and mercurial indicators
    if $(echo "$INDEX" | grep -E '^\? ' &> /dev/null); then
        hg_status="$SPACESHIP_HG_STATUS_UNTRACKED$hg_status"
    fi
    if $(echo "$INDEX" | grep -E '^A ' &> /dev/null); then
        hg_status="$SPACESHIP_HG_STATUS_ADDED$hg_status"
    fi
    if $(echo "$INDEX" | grep -E '^M ' &> /dev/null); then
        hg_status="$SPACESHIP_HG_STATUS_MODIFIED$hg_status"
    fi
    if $(echo "$INDEX" | grep -E '^(R|!)' &> /dev/null); then
        hg_status="$SPACESHIP_HG_STATUS_DELETED$hg_status"
    fi

    if [[ -n $hg_status ]]; then
        spaceship::section \
            "$SPACESHIP_HG_STATUS_COLOR" \
            "" \
            "$SPACESHIP_HG_STATUS_PREFIX"$hg_status"$SPACESHIP_HG_STATUS_SUFFIX" \
            " "
    else
        echo -n " "
    fi
}
