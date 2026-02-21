return {
  "akinsho/bufferline.nvim",
  opts = {
    options = {
      -- name_formatter = function(buf)
      --   local path = buf.path
      --   if path then
      --     -- Show last 2 parent directories + filename
      --     local relative = vim.fn.fnamemodify(path, ":~:.")
      --     local parts = {}
      --     for part in relative:gmatch("[^/]+") do
      --       table.insert(parts, part)
      --     end
      --     local count = #parts
      --     if count > 3 then
      --       return parts[count - 2] .. "/" .. parts[count - 1] .. "/" .. parts[count]
      --     elseif count > 2 then
      --       return parts[count - 1] .. "/" .. parts[count]
      --     end
      --   end
      --   return buf.name
      -- end,
    },
  },
}
