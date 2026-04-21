# ------------------------------------------------------------------------------
# Configuration
# ------------------------------------------------------------------------------

SPACESHIP_HG_BOOKMARK_ASYNC="${SPACESHIP_HG_BOOKMARK_ASYNC=true}"
SPACESHIP_HG_BOOKMARK_SHOW="${SPACESHIP_HG_BOOKMARK_SHOW=true}"
SPACESHIP_HG_BOOKMARK_PREFIX="${SPACESHIP_HG_BOOKMARK_PREFIX=""}"
SPACESHIP_HG_BOOKMARK_SUFFIX="${SPACESHIP_HG_BOOKMARK_SUFFIX=" "}"
SPACESHIP_HG_BOOKMARK_SYMBOL="${SPACESHIP_HG_BOOKMARK_SYMBOL=" "}"
SPACESHIP_HG_BOOKMARK_COLOR="${SPACESHIP_HG_BOOKMARK_COLOR="magenta"}"

# ------------------------------------------------------------------------------
# Section
# ------------------------------------------------------------------------------

spaceship_hg_bookmark() {
    [[ $SPACESHIP_HG_BOOKMARK_SHOW == false ]] && return

    spaceship::is_hg || return

    local curr_hash="$(hg whereami 2>/dev/null)"
    [[ -z "$curr_hash" ]] && return

    if [[ "$curr_hash" != "$__HG_BOOKMARK_CACHED_HASH" ]]; then
        local bookmark
        bookmark=$(hg log -r 'max(::. & public() & remotebookmark())' -T '{remotebookmarks}\n' 2>/dev/null)

        # Strip "remote/" prefix
        bookmark="${bookmark#remote/}"

        # Default to master if no remote bookmark found
        if [[ -z "$bookmark" ]]; then
            bookmark="master"
        fi

        __HG_BOOKMARK_CACHED_HASH="$curr_hash"
        __HG_BOOKMARK_CACHED_NAME="$bookmark"
    fi

    spaceship::section \
        --color "$SPACESHIP_HG_BOOKMARK_COLOR" \
        --suffix "$SPACESHIP_HG_BOOKMARK_SUFFIX" \
        "${SPACESHIP_HG_BOOKMARK_PREFIX}${SPACESHIP_HG_BOOKMARK_SYMBOL}${__HG_BOOKMARK_CACHED_NAME}"
}
