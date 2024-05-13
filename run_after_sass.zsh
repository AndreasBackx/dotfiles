#!/usr/bin/env zsh

set -o errexit -o nounset

sass ~/.config/waybar/style.{scss,css} || sassc ~/.config/waybar/style.{scss,css}
