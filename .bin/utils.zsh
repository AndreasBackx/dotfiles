#!/usr/bin/env zsh

function waybar-json() {
    text=$1
    tooltip=$2
    class=$3
    extra=$4

    echo "{\"text\": \"$text\", \"tooltip\": \"$tooltip\", \"class\": \"$class\"$4}"
}

function waybar-json-percentage() {
    percentage=$4
    waybar-json $1 $2 $3 ", \"percentage\": $percentage"
}

function is_wayland() {
    if [[ "$XDG_SESSION_TYPE" == "wayland" ]]; then
        return 0  # success
    else
        return 1  # failure
    fi
}
