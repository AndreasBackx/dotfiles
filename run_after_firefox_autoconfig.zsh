#!/usr/bin/env zsh

set -o errexit -o nounset -o pipefail

variables_file="$HOME/.config/.variables"
if [[ -f "$variables_file" ]]; then
  source "$variables_file"
fi

if [[ "${CHEZMOI_DATA_HEADLESS:-false}" == "true" ]]; then
  exit 0
fi

source_dir="${XDG_DATA_HOME:-$HOME/.local/share}/firefox-autoconfig"
autoconfig_pref_source="$source_dir/autoconfig.js"
firefox_cfg_source="$source_dir/firefox.cfg"

if [[ ! -f "$autoconfig_pref_source" ]] || [[ ! -f "$firefox_cfg_source" ]]; then
  print -u2 -r -- "Firefox AutoConfig source files are missing in $source_dir."
  exit 0
fi

find_firefox_dir() {
  local dir

  for dir in /usr/lib64/firefox /usr/lib/firefox /opt/firefox; do
    if [[ -d "$dir" ]]; then
      print -r -- "$dir"
      return 0
    fi
  done

  if command -v firefox >/dev/null 2>&1; then
    local firefox_bin
    firefox_bin="$(readlink -f "$(command -v firefox)")"
    dir="${firefox_bin:h}"
    if [[ -d "$dir" ]]; then
      print -r -- "$dir"
      return 0
    fi
  fi

  return 1
}

install_if_changed() {
  local source_file="$1"
  local target_file="$2"
  local target_dir="${target_file:h}"

  if [[ -f "$target_file" ]] && cmp --silent "$source_file" "$target_file"; then
    print -r -- "Firefox AutoConfig already current: $target_file"
    return 0
  fi

  print -r -- "Installing Firefox AutoConfig: $target_file"
  if [[ ! -d "$target_dir" ]]; then
    sudo install -d -m 755 "$target_dir"
  fi
  sudo install -m 644 "$source_file" "$target_file"
}

firefox_dir="$(find_firefox_dir || true)"
if [[ -z "$firefox_dir" ]]; then
  print -u2 -r -- "Could not find Firefox installation directory."
  exit 0
fi

install_if_changed "$autoconfig_pref_source" "$firefox_dir/defaults/pref/autoconfig.js"
install_if_changed "$firefox_cfg_source" "$firefox_dir/firefox.cfg"
