#!/usr/bin/env zsh

function is_wayland() {
    if [[ "$XDG_SESSION_TYPE" == "wayland" ]]; then
        return 0 # success
    else
        return 1 # failure
    fi
}

function current_compositor() {
    if [[ -n "${HYPRLAND_INSTANCE_SIGNATURE:-}" ]]; then
        echo "hyprland"
        return 0
    fi

    if [[ -n "${NIRI_SOCKET:-}" ]]; then
        echo "niri"
        return 0
    fi

    case "${XDG_CURRENT_DESKTOP:-}${XDG_SESSION_DESKTOP:+:${XDG_SESSION_DESKTOP}}" in
    *Hyprland* | *hyprland*)
        echo "hyprland"
        return 0
        ;;
    *niri* | *Niri*)
        echo "niri"
        return 0
        ;;
    esac

    if command -v hyprctl >/dev/null 2>&1 && hyprctl -j version >/dev/null 2>&1; then
        echo "hyprland"
        return 0
    fi

    if command -v niri >/dev/null 2>&1 && niri msg --json outputs >/dev/null 2>&1; then
        echo "niri"
        return 0
    fi

    echo "unknown"
}

function is_hyprland() {
    [[ "$(current_compositor)" == "hyprland" ]]
}

function is_niri() {
    [[ "$(current_compositor)" == "niri" ]]
}

function json-output() {
    text="${1-}"
    tooltip="${2-}"
    class="${3-}"
    extra="${4-}"

    json-escape() {
        local value="${1-}"
        value=${value//\\/\\\\}
        value=${value//\"/\\\"}
        value=${value//$'\n'/\\n}
        value=${value//$'\r'/\\r}
        value=${value//$'\t'/\\t}
        print -r -- "$value"
    }

    local escaped_text
    local escaped_tooltip
    escaped_text=$(json-escape "$text")
    escaped_tooltip=$(json-escape "$tooltip")

    if [[ -z "$tooltip" ]]; then
        echo "{\"text\": \"$escaped_text\"}"
    elif [[ -z "$class" ]]; then
        echo "{\"text\": \"$escaped_text\", \"tooltip\": \"$escaped_tooltip\"}"
    elif [[ -z "$extra" ]]; then
        echo "{\"text\": \"$escaped_text\", \"tooltip\": \"$escaped_tooltip\", \"class\": \"$class\"}"
    else
        echo "{\"text\": \"$escaped_text\", \"tooltip\": \"$escaped_tooltip\", \"class\": \"$class\"$extra}"
    fi
}

function json-output-percentage() {
    percentage="${4-}"
    json-output $1 $2 $3 ", \"percentage\": $percentage"
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
        if is_hyprland; then
            outputs=$(hyprctl monitors -j)
        elif is_niri; then
            outputs=$(niri msg --json outputs)
        else
            outputs=$(swaymsg -t get_outputs)
        fi
    fi

    if is_niri; then
        echo "$outputs" | jq -r ".[] | . + {description: ([.make, .model, (.serial // \"\")] | map(select(length > 0)) | join(\" \"))} | select(.description == \"$description\") | .name"
        return
    fi

    echo "$outputs" | jq -r ".[] | . + {description: \"\(.make) \(.model) \(.serial)\"} | select(.description == \"$description\") | .name"
}

function is_fedora() {
    if grep 'Fedora' /etc/os-release >/dev/null; then
        return 0 # success
    else
        return 1 # failure
    fi
}

# If interactive, print to stderr. If not, send to libnotify.
function notify() {
    message=$1
    urgency=${2:-normal}
    expire_time=${3:-5000}
    if [ -t 0 ]; then
        echo >&2 "$message"
    else
        notify-send -u "$urgency" "$message" --expire-time "$expire_time"
    fi
}
