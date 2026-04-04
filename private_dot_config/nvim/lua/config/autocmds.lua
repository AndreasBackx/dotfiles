-- Autocmds are automatically loaded on the VeryLazy event
-- Default autocmds that are always set: https://github.com/LazyVim/LazyVim/blob/main/lua/lazyvim/config/autocmds.lua
-- Add any additional autocmds here

-- Save all buffers when losing focus
vim.api.nvim_create_autocmd("FocusLost", {
  pattern = "*",
  command = "silent! wall",
})
