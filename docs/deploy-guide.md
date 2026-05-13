# Huong Dan Deploy OnlineMenuApp len VPS

## Thong Tin Server

- **VPS**: Ubuntu 22.04 Jammy, 2 vCPU, 4GB RAM, 40GB SSD
- **Domain**: nhatnuong.site
- **SSH**: `ssh -p 8686 root@161.248.4.184`
- **Thu muc project**: `/root/MenuOrderingOnline`

---

## Cac Buoc Da Thuc Hien

### Buoc 1: Chuan bi code (tren may local)

1. Them `output: 'standalone'` vao `client/next.config.ts`
2. Them domain `nhatnuong.site` vao `remotePatterns` trong `next.config.ts`
3. Tao `server/Dockerfile` — build ASP.NET Core backend
4. Tao `client/Dockerfile` — build Next.js frontend
5. Tao `docker-compose.yml` — dinh nghia 4 services: db, backend, frontend, nginx
6. Tao `nginx.conf` — reverse proxy, SSL, WebSocket cho SignalR
7. Tao `.env.example` — mau file bien moi truong
8. Cap nhat `.gitignore` — them `.env` de khong commit secrets
9. Cap nhat CORS trong `Program.cs` — doc AllowedOrigins tu config thay vi hardcode
10. Push code len GitHub

### Buoc 2: Mua VPS va Domain

1. Mua VPS (Ubuntu 22.04, 4GB RAM) — nhan IP + mat khau root + SSH port
2. Mua domain tai Tenten.vn
3. Tro DNS: tao 2 A Record
   - `@` → `161.248.4.184`
   - `www` → `161.248.4.184`

### Buoc 3: SSH vao VPS

```bash
ssh -p 8686 root@161.248.4.184
```

### Buoc 4: Cap nhat he thong

```bash
apt update && apt upgrade -y
```

### Buoc 5: Cai Docker

```bash
curl -fsSL https://get.docker.com | sh
```

### Buoc 6: Clone project

```bash
git clone <REPO_URL> /root/MenuOrderingOnline
cd /root/MenuOrderingOnline
```

### Buoc 7: Tao file .env

```bash
cp .env.example .env
nano .env
```

Dien cac gia tri:

```env
DOMAIN=nhatnuong.site
DB_PASSWORD=<mat_khau_manh>
JWT_SECRET=<chuoi_bi_mat_32_ky_tu>
VIETQR_CLIENT_ID=...
VIETQR_API_KEY=...
VIETQR_ACCOUNT_NO=...
VIETQR_ACCOUNT_NAME=...
VIETQR_ACQ_ID=970418
CASSO_WEBHOOK_KEY=...
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
```

Luu: Ctrl+O → Enter → Ctrl+X

### Buoc 8: Cai SSL (Let's Encrypt)

```bash
apt install certbot -y
certbot certonly --standalone -d nhatnuong.site
```

Copy SSL vao project:

```bash
mkdir -p /root/MenuOrderingOnline/certbot/conf
cp -rL /etc/letsencrypt/* /root/MenuOrderingOnline/certbot/conf/
```

### Buoc 9: Build va chay

```bash
cd /root/MenuOrderingOnline
docker compose up -d --build
```

Lan dau mat 5-15 phut de build.

---

## Cac Lenh Thuong Dung

| Lenh | Tac dung |
|---|---|
| `docker compose up -d` | Khoi dong |
| `docker compose down` | Dung |
| `docker compose restart` | Khoi dong lai |
| `docker compose logs -f` | Xem log (Ctrl+C de thoat) |
| `docker compose up -d --build` | Build lai + khoi dong (khi co code moi) |

---

## Cap Nhat Code Moi

```bash
cd /root/MenuOrderingOnline
git pull
docker compose up -d --build
```

---

## Gia Han SSL (moi 90 ngay)

```bash
docker compose down
certbot renew
cp -rL /etc/letsencrypt/* /root/MenuOrderingOnline/certbot/conf/
docker compose up -d
```

---

## Cau Hinh Casso Webhook

Vao app.casso.vn → Webhook → URL:

```
https://nhatnuong.site/api/payment/webhook
```

---

## Truy Cap

| Doi tuong | URL |
|---|---|
| Khach hang | `https://nhatnuong.site/tables/{n}?token=...` (quet QR) |
| Quan ly | `https://nhatnuong.site/manage` |
| Tai khoan mac dinh | `owner@gmail.com` / `123456` |
