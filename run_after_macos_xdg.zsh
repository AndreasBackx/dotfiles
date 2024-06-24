#!/usr/bin/env zsh
# So because GNU Make doesn't support spaces in filenames.
# We need to create a symlink to the actual location without a space as I don't
# want to move the files to a location without spaces.

mkdir -p "$HOME/.local" # Create the directory if it doesn't exist, ignore if it does.
if [ ! -d "$HOME/.local/share" ]; then
    set -x
    ln -s "$HOME/Library/Application Support" "$HOME/.local/share"
    set +x
fi
if [ ! -d "$HOME/.local/state" ]; then
    set -x
    ln -s "$HOME/Library/Application Support" "$HOME/.local/state"
    set +x
fi
