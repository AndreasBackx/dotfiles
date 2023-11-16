#!/usr/bin/env sh

set -o errexit -o nounset

from="$HOME/.config/monitors.xml"
to="/var/lib/gdm/.config/monitors.xml"

[ ! -f "$from" ] && exit 0
[ ! -f "$to" ] && exit 0

cmp --silent $from $to || (
    echo "$from changed, copying to $to..."
    sudo cp $from $to
)

