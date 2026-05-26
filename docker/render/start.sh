#!/usr/bin/env sh
set -eu

if [ -n "${RENDER_EXTERNAL_HOSTNAME:-}" ]; then
  export APP_URL="https://$RENDER_EXTERNAL_HOSTNAME"
elif [ -n "${RENDER_EXTERNAL_URL:-}" ]; then
  export APP_URL="$(printf '%s' "$RENDER_EXTERNAL_URL" | sed 's#^http://#https://#')"
fi

if ! php -r '
$key = getenv("APP_KEY") ?: "";
if ($key === "") {
    exit(1);
}

if (str_starts_with($key, "base64:")) {
    $decoded = base64_decode(substr($key, 7), true);
    exit($decoded !== false && strlen($decoded) === 32 ? 0 : 1);
}

exit(in_array(strlen($key), [16, 32], true) ? 0 : 1);
'; then
  export APP_KEY="$(php -r 'echo "base64:" . base64_encode(random_bytes(32));')"
fi

php artisan storage:link || true
php artisan config:clear
php artisan route:clear
php artisan view:clear
php artisan migrate --force

exec php artisan serve --host=0.0.0.0 --port="${PORT:-10000}"
