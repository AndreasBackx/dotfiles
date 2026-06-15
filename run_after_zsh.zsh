#!/usr/bin/env sh

set -o errexit -o nounset

echo "Execute $0..."

[ -L ~/.tmux.conf ] ||
  ln -s ~/.tmux/.tmux.conf ~/.tmux.conf
