#!/usr/bin/env sh

set -o errexit -o nounset

zsh_custom="$HOME"/.oh-my-zsh/custom

echo "Execute $0..."

[ -L "${zsh_custom}"/themes/spaceship.zsh-theme ] ||
  ln -s "${zsh_custom}"/themes/spaceship-prompt/spaceship.zsh-theme "${zsh_custom}"/themes/spaceship.zsh-theme

[ -L ~/.tmux.conf ] ||
  ln -s ~/.tmux/.tmux.conf ~/.tmux.conf

