return {
  "folke/persistence.nvim",
  init = function()
    vim.api.nvim_create_autocmd("VimEnter", {
      group = vim.api.nvim_create_augroup("persistence_auto_restore", { clear = true }),
      nested = true,
      callback = function()
        if vim.fn.argc() == 0 then
          require("persistence").load()
        end
      end,
    })
  end,
}
