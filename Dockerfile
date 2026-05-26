FROM composer:2 AS vendor

WORKDIR /app

COPY composer.json composer.lock ./

RUN composer install \
    --no-dev \
    --no-interaction \
    --prefer-dist \
    --optimize-autoloader \
    --no-scripts

COPY . .

RUN composer dump-autoload --optimize --no-dev


FROM node:24-bookworm-slim AS frontend

WORKDIR /app

COPY package.json package-lock.json ./

RUN npm install --no-audit --no-fund

COPY resources ./resources
COPY public ./public
COPY vite.config.js tailwind.config.js postcss.config.js jsconfig.json ./

RUN npm run build


FROM php:8.3-cli-bookworm

WORKDIR /var/www/html

RUN apt-get update && apt-get install -y \
    ghostscript \
    libpq-dev \
    libzip-dev \
    tesseract-ocr \
    tesseract-ocr-eng \
    unzip \
    zip \
    && docker-php-ext-install bcmath pdo_pgsql pgsql zip \
    && rm -rf /var/lib/apt/lists/*

COPY . .
COPY --from=vendor /app/vendor ./vendor
COPY --from=frontend /app/public/build ./public/build

RUN mkdir -p bootstrap/cache storage/app/public storage/framework/cache storage/framework/sessions storage/framework/views storage/logs \
    && chown -R www-data:www-data bootstrap/cache storage \
    && chmod -R ug+rwx bootstrap/cache storage

COPY docker/render/start.sh /usr/local/bin/render-start

RUN chmod +x /usr/local/bin/render-start

ENV APP_ENV=production \
    APP_DEBUG=false \
    LOG_CHANNEL=stderr \
    OCR_GHOSTSCRIPT_PATH=gs \
    OCR_TESSERACT_PATH=tesseract \
    PORT=10000

EXPOSE 10000

CMD ["/usr/local/bin/render-start"]
