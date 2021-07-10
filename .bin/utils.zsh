#!/usr/bin/env zsh

function is_wayland() {
    if [[ "$XDG_SESSION_TYPE" == "wayland" ]]; then
        return 0  # success
    else
        return 1  # failure
    fi
}

function waybar-json() {
    text=$1
    tooltip=$2
    class=$3
    extra=$4

    if [[ -z "$tooltip" ]]; then
        echo "{\"text\": \"$text\"}"
    elif [[ -z "$suffix" ]]; then
        echo "{\"text\": \"$text\", \"tooltip\": \"$tooltip\"}"
    elif [[ -z "$extra" ]]; then
        echo "{\"text\": \"$text\", \"tooltip\": \"$tooltip\", \"class\": \"$class\"}"
    else
        echo "{\"text\": \"$text\", \"tooltip\": \"$tooltip\", \"class\": \"$class\"$extra}"
    fi
}

function waybar-json-percentage() {
    percentage=$4
    waybar-json $1 $2 $3 ", \"percentage\": $percentage"
}

function polybar-output() {
    prefix=$1
    color=$2
    suffix=$3

    if [[ -z "$color" ]]; then
        echo "$prefix"
    elif [[ -z "$suffix" ]]; then
        echo "%{F$color}$prefix{F-}"
    else
        echo "%{F$color}$prefix{F-} $suffix"
    fi
}

function get-output-name() {
    description=$1
    outputs=$2

    if [[ -z "$description" ]]; then
        echo "Usage: get-output-name description [swaymsg -t get_outputs]"
    fi

    if ! is_wayland; then
        echo "X11 is not supported by this function."
        return 1
    fi

    if [[ -z "$outputs" ]]; then
        outputs=`swaymsg -t get_outputs`
    fi

    echo "$outputs" | jq -r ".[] | . + {description: \"\(.make) \(.model) \(.serial)\"} | select(.description == \"$description\") | .name"
}

function is_fedora() {
    if grep '^NAME=Fedora' /etc/os-release > /dev/null; then
        return 0  # success
    else
        return 1  # failure
    fi
}
