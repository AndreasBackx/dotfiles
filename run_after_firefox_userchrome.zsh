#!/usr/bin/env zsh

set -o errexit -o nounset -o pipefail

variables_file="$HOME/.config/.variables"
if [[ -f "$variables_file" ]]; then
  source "$variables_file"
fi

if [[ "${CHEZMOI_DATA_HEADLESS:-false}" == "true" ]]; then
  exit 0
fi

firefox_dir="$HOME/.mozilla/firefox"
profiles_ini="$firefox_dir/profiles.ini"
installs_ini="$firefox_dir/installs.ini"

if [[ ! -d "$firefox_dir" ]] || [[ ! -f "$profiles_ini" ]]; then
  exit 0
fi

get_install_default_profile() {
  local line

  [[ -f "$installs_ini" ]] || return 1

  while IFS= read -r line; do
    if [[ "$line" == Default=* ]]; then
      print -r -- "${line#Default=}"
      return 0
    fi
  done < "$installs_ini"

  return 1
}

get_profiles_default_profile() {
  local line path="" default="0"

  while IFS= read -r line || [[ -n "$line" ]]; do
    if [[ "$line" == \[*\] ]]; then
      if [[ "$default" == "1" ]] && [[ -n "$path" ]]; then
        print -r -- "$path"
        return 0
      fi
      path=""
      default="0"
      continue
    fi

    if [[ "$line" == Path=* ]]; then
      path="${line#Path=}"
      continue
    fi

    if [[ "$line" == Default=1 ]]; then
      default="1"
    fi
  done < "$profiles_ini"

  if [[ "$default" == "1" ]] && [[ -n "$path" ]]; then
    print -r -- "$path"
    return 0
  fi

  return 1
}

profile_rel_path="$(get_install_default_profile || true)"
if [[ -z "$profile_rel_path" ]]; then
  profile_rel_path="$(get_profiles_default_profile || true)"
fi

if [[ -z "$profile_rel_path" ]]; then
  >&2 print -r -- "Could not determine default Firefox profile."
  exit 0
fi

profile_dir="$firefox_dir/$profile_rel_path"
if [[ ! -d "$profile_dir" ]]; then
  >&2 print -r -- "Firefox profile directory does not exist: $profile_dir"
  exit 0
fi

chrome_dir="$profile_dir/chrome"
userchrome_file="$chrome_dir/userChrome.css"
userjs_file="$profile_dir/user.js"
tmp_userjs=""

cleanup() {
  if [[ -n "$tmp_userjs" ]] && [[ -f "$tmp_userjs" ]]; then
    rm -f "$tmp_userjs"
  fi
}

trap cleanup EXIT

if [[ ! -f "$userchrome_file" ]]; then
  mkdir -p "$chrome_dir"
  cat > "$userchrome_file" <<'EOF'
/* Hide tab close buttons */
.tabbrowser-tab .tab-close-button {
  display: none !important;
}

/* Hide Firefox-drawn window close button */
.titlebar-button.titlebar-close {
  display: none !important;
}
EOF
  print -r -- "Installed Firefox userChrome.css in $userchrome_file"
fi

tmp_userjs="$(mktemp)"

if [[ -f "$userjs_file" ]]; then
  while IFS= read -r line || [[ -n "$line" ]]; do
    if [[ "$line" == *'toolkit.legacyUserProfileCustomizations.stylesheets'* ]]; then
      continue
    fi
    print -r -- "$line" >> "$tmp_userjs"
  done < "$userjs_file"
fi

print -r -- 'user_pref("toolkit.legacyUserProfileCustomizations.stylesheets", true);' >> "$tmp_userjs"

if [[ ! -f "$userjs_file" ]] || ! cmp --silent "$tmp_userjs" "$userjs_file"; then
  mv "$tmp_userjs" "$userjs_file"
  tmp_userjs=""
  print -r -- "Updated Firefox user.js in $userjs_file"
else
  rm -f "$tmp_userjs"
  tmp_userjs=""
fi
