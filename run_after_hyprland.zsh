#!/usr/bin/env zsh

from=$(realpath ~/.config/hypr/hyprland-shell.desktop)
to="/usr/share/wayland-sessions/hyprland-shell.desktop"

cmp --silent $from $to || (
    echo "$from changed, copying to $to..."
    sudo cp $from $to
)
