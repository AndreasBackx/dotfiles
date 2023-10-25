# ------------------------------------------------------------------------------
# Configuration
# ------------------------------------------------------------------------------

SPACESHIP_TASTE_TESTER_ASYNC="${SPACESHIP_TASTE_TESTER_ASYNC=false}"
SPACESHIP_TASTE_TESTER_SHOW="${SPACESHIP_TASTE_TESTER_SHOW=true}"
SPACESHIP_TASTE_TESTER_PREFIX="${SPACESHIP_TASTE_TESTER_PREFIX="on "}"
SPACESHIP_TASTE_TESTER_SUFFIX="${SPACESHIP_TASTE_TESTER_SUFFIX=" "}"
SPACESHIP_TASTE_TESTER_SYMBOL="${SPACESHIP_TASTE_TESTER_SYMBOL="👅 "}"
SPACESHIP_TASTE_TESTER_COLOR="${SPACESHIP_TASTE_TESTER_COLOR="red"}"

# ------------------------------------------------------------------------------
# Section
# ------------------------------------------------------------------------------

TASTE_TESTING_FILE="/etc/chef/test_timestamp"

spaceship_taste_tester() {
    [[ $SPACESHIP_TASTE_TESTER_SHOW == true ]] || return

    # Not taste-testing.
    [ -e "$TASTE_TESTING_FILE" ] || return

    local current_time=$(date -u +%s)
    # Get the modified time of the file in seconds since the epoch
    local file_mod_time=$(date -u -r "$TASTE_TESTING_FILE" +%s)
    # Calculate the time difference in seconds
    local time_difference=$((file_mod_time - current_time))

    # Not in the future, so not taste-testing?
    [ "$time_difference" -gt "0" ] || return

    local hours=$(( time_difference / 3600 ))
    local minutes=$(( (time_difference % 3600) / 60 ))

    if [ "$hours" -eq "0" ]; then
        local content="${minutes}m"
    else
        local content="${hours}h ${minutes}m"
    fi
    spaceship::section::v4 --color "$SPACESHIP_TASTE_TESTER_COLOR" --prefix "$SPACESHIP_TASTE_TESTER_PREFIX" --suffix "$SPACESHIP_TASTE_TESTER_SUFFIX" --symbol "$SPACESHIP_TASTE_TESTER_SYMBOL" "$content"
}
