return {
  -- "Rubecula/nvim",
  name = "rubecula",
  dir = "~/dev/rubecula-nvim",
  dev = true,
  priority = 1000,
  config = function()
    vim.cmd.colorscheme("rubecula")
  end,
}
