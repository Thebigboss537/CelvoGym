# KONDIX — Deploy Checklist

Run these steps **once** before the first production deploy. Order matters.

## 1. CelvoGuard: Register the app

```bash
psql -h localhost -U celvoguard -d celvoguard -f setup/01-register-app.sql
```

## 2. Database: Create gym schema

```bash
psql -h localhost -U celvo_user -d celvo -f setup/02-create-gym-schema.sql
```

EF Core migrations run automatically on app startup.

## 3. MinIO: Create video bucket

```bash
bash setup/03-minio-bucket.sh
```

## 4. CelvoGuard CORS

Add to celvoguard-api environment in `docker-compose.prod.yml`:

```yaml
Cors__AllowedOrigins__3: https://kondix.celvo.dev
```

Then restart: `docker compose -f docker-compose.prod.yml restart celvoguard-api`

## 5. docker-compose.prod.yml

Add these services:

```yaml
  kondix-api:
    image: ghcr.io/thebigboss537/kondix-api:${KONDIX_API_TAG:-latest}
    restart: unless-stopped
    environment:
      ASPNETCORE_ENVIRONMENT: Production
      ASPNETCORE_URLS: http://+:8080
      ASPNETCORE_FORWARDEDHEADERS_ENABLED: "true"
      ConnectionStrings__DefaultConnection: "Host=postgres;Database=celvo;Username=celvo_user;Password=${DB_PASSWORD}"
      ConnectionStrings__Redis: "redis:6379,password=${REDIS_PASSWORD}"
      CelvoGuard__SigningKey: ${JWT_SIGNING_KEY}
      CelvoGuard__Issuer: guard.celvo.dev
    expose:
      - "8080"
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    healthcheck:
      test: ["CMD-SHELL", "wget --quiet --tries=1 --spider http://localhost:8080/api/v1/health || exit 1"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 30s
    deploy:
      resources:
        limits:
          memory: 256M
    networks:
      - celvo-net

  kondix-web:
    image: ghcr.io/thebigboss537/kondix-web:${KONDIX_WEB_TAG:-latest}
    restart: unless-stopped
    expose:
      - "80"
    deploy:
      resources:
        limits:
          memory: 64M
    networks:
      - celvo-net
```

## 6. Caddyfile

Add this block:

```caddyfile
kondix.celvo.dev {
    handle /api/* {
        reverse_proxy kondix-api:8080
    }

    handle {
        reverse_proxy kondix-web:80
    }

    header {
        Strict-Transport-Security "max-age=31536000; includeSubDomains; preload"
        X-Content-Type-Options "nosniff"
        X-Frame-Options "DENY"
        Referrer-Policy "strict-origin-when-cross-origin"
        -Server
    }
}
```

## 7. .env

Add to `/opt/celvo/.env`:

```
KONDIX_API_TAG=latest
KONDIX_WEB_TAG=latest
```

## 8. Caddy depends_on

Add `kondix-api` to the caddy service `depends_on` list.

## 9. Deploy

```bash
cd /opt/celvo
docker compose -f docker-compose.prod.yml pull kondix-api kondix-web
docker compose -f docker-compose.prod.yml up -d kondix-api kondix-web
```

## 10. Verify

```bash
curl -sf https://kondix.celvo.dev/api/v1/health
# Expected: {"status":"healthy","timestamp":"..."}
```
