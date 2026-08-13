local M = {}

function M.exec(keys, command, options)
    hl.bind(keys, hl.dsp.exec_cmd(command), options)
end

function M.workspace(keys, workspace)
    hl.bind(keys, hl.dsp.focus({ workspace = tostring(workspace) }))
end

function M.move_silent(keys, workspace)
    hl.bind(keys, hl.dsp.window.move({ workspace = tostring(workspace), follow = false }))
end

return M
