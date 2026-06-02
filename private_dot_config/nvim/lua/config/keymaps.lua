-- Keymaps are automatically loaded on the VeryLazy event
-- Default keymaps that are always set: https://github.com/LazyVim/LazyVim/blob/main/lua/lazyvim/config/keymaps.lua
-- Add any additional keymaps here

vim.keymap.set("n", "<X1Mouse>", "<C-o>", { noremap = true, silent = true, desc = "Jump back (mouse)" })
vim.keymap.set("n", "<X2Mouse>", "<C-i>", { noremap = true, silent = true, desc = "Jump forward (mouse)" })

