#!/usr/bin/env zsh

set -o errexit -o nounset
setopt BRACE_CCL

sass ~/.config/waybar/style.{scss,css} || sassc ~/.config/waybar/style.{scss,css}
