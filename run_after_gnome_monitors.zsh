#!/usr/bin/env sh

set -o errexit -o nounset

from=$(realpath ~/.config/monitors.xml)
to="/var/lib/gdm/.config/monitors.xml"

cmp --silent $from $to || (
    echo "$from changed, copying to $to..."
    sudo cp $from $to
)

