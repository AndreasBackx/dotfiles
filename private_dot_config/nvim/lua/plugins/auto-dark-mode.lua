return {
  "f-person/auto-dark-mode.nvim",
  -- Seemingly requires DBUS and not available everywhere.
  enabled = vim.env.XDG_CURRENT_DESKTOP ~= nil,
  opts = {},
}
