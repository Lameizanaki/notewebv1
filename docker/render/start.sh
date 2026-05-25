#!/usr/bin/env sh
set -eu

if [ -n "${RENDER_EXTERNAL_URL:-}" ]; then
  export APP_URL="${APP_URL:-$RENDER_EXTERNAL_URL}"
elif [ -n "${RENDER_EXTERNAL_HOSTNAME:-}" ]; then
  export APP_URL="${APP_URL:-https://$RENDER_EXTERNAL_HOSTNAME}"
fi

php artisan storage:link || true
php artisan config:clear
php artisan route:clear
php artisan view:clear
php artisan migrate --force

exec php artisan serve --host=0.0.0.0 --port="${PORT:-10000}"
