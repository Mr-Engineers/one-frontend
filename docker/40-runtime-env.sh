#!/bin/sh
# Writes runtime config for the browser (/env.js) from container environment variables.
# Run by the nginx image entrypoint (/docker-entrypoint.d) before nginx starts.
# In ECS the variables come from SSM Parameter Store (Terraform: frontend_env_parameter_names).
set -eu

out=/usr/share/nginx/html/env.js

json_escape() {
  printf '%s' "$1" | sed -e 's/\\/\\\\/g' -e 's/"/\\"/g'
}

{
  printf 'window.__ENV__ = {'
  sep=''
  for name in VITE_API_BASE_URL VITE_SUPABASE_URL VITE_SUPABASE_PUBLISHABLE_KEY; do
    value=$(printenv "$name" || true)
    # Unset, empty or the Terraform placeholder: the app keeps its build-time value
    if [ -n "$value" ] && [ "$value" != "CHANGE_ME" ]; then
      printf '%s"%s":"%s"' "$sep" "$name" "$(json_escape "$value")"
      sep=','
    fi
  done
  printf '};\n'
} > "$out"

echo "$0: wrote $out"
