# Neovim

This is a small LazyVim-based config rather than a large custom Neovim setup.

## Structure

- `init.lua`: bootstraps the config.
- `lua/config/`: local options, lazy.nvim setup, keymaps, and autocmds.
- `lua/plugins/`: plugin overrides and additions.

## What Is Custom Here

- lazy.nvim is cloned through SSH and uses GitHub SSH URLs by default
- local plugin overrides live in `lua/plugins/`
- this repo currently keeps the Neovim layer fairly light instead of deeply forking LazyVim defaults

## When To Look Here

- if Neovim bootstrap fails, check `lua/config/lazy.lua`
- if a plugin behaves differently than stock LazyVim, check `lua/plugins/`
- if I forgot whether a keymap is custom or inherited, start with `lua/config/keymaps.lua`
