import { execAsync } from "ags/process"

function shellQuote(text: string) {
  return `'${text.replace(/'/g, `"'"'"`)}'`
}

export async function copyToClipboard(text: string) {
  await execAsync(["bash", "-lc", `printf %s ${shellQuote(text)} | wl-copy`])
}
