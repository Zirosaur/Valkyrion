# Railway Deployment Guide - Discord Radio Bot
## Urutan Deployment yang Tepat

### PERSIAPAN SEBELUM DEPLOY

#### 1. Verifikasi File Konfigurasi
Pastikan file-file ini ada di repository:
- `railway.json` ✅ (deployment settings)
- `nixpacks.toml` ✅ (Node.js 20 + FFmpeg)
- `Procfile` ✅ (start command)
- `.env.example` ✅ (environment template)
- `RAILWAY_MASTER_GUIDE.md` ✅ (panduan ini)

#### 2. Push ke GitHub Repository
```bash
git add .
git commit -m "Ready for Railway deployment - complete setup"
git push origin main
```

### DEPLOYMENT STEP-BY-STEP

#### Step 1: Setup Railway Account
1. Buka https://railway.app
2. Sign up/Login dengan GitHub account
3. Verifikasi email jika diperlukan

#### Step 2: Create New Project
1. Klik "New Project" di Railway dashboard
2. Pilih "Deploy from GitHub repo"
3. Authorize Railway untuk access GitHub
4. Select repository Discord radio bot
5. Railway akan auto-detect sebagai Node.js project

#### Step 3: Add PostgreSQL Database (PENTING - LAKUKAN DULU)
1. Di Railway project dashboard, klik "Add Service"
2. Pilih "Database" → "PostgreSQL"
3. Database akan terprovisi otomatis
4. **DATABASE_URL** environment variable akan tersedia otomatis

#### Step 4: Configure Environment Variables
Di Railway dashboard, masuk ke tab "Variables" dan tambahkan:

**WAJIB DIISI:**
```
DISCORD_TOKEN=your_discord_bot_token_here
DISCORD_CLIENT_ID=your_discord_client_id_here
DISCORD_CLIENT_SECRET=your_discord_client_secret_here
SESSION_SECRET=random_secret_32_characters_here
NODE_ENV=production
```

**AUTO-PROVIDED (jangan diubah):**
```
DATABASE_URL (otomatis dari PostgreSQL service)
PORT (otomatis dari Railway)
```

#### Step 5: Deploy Application
1. Railway akan otomatis trigger deployment setelah environment variables di-set
2. Monitor progress di "Deployments" tab
3. Tunggu hingga status "Success"

#### Step 6: Get Railway Domain
1. Setelah deployment berhasil, dapatkan URL Railway
2. Format: `https://your-app-name.railway.app`
3. Test akses web dashboard

#### Step 7: Update Discord OAuth Settings
1. Masuk ke Discord Developer Portal
2. Pilih aplikasi Discord bot Anda
3. Masuk ke "OAuth2" → "General"
4. Update "Redirect URIs" dengan:
   ```
   https://your-app-name.railway.app/auth/discord/callback
   ```
5. Save changes

#### Step 8: Verify Deployment
Test semua komponen:
- [ ] Health endpoint: `https://your-app.railway.app/health`
- [ ] Web dashboard: `https://your-app.railway.app`
- [ ] Discord bot online di 5 servers
- [ ] Authentication login works
- [ ] Radio streaming functional

### PROSES BUILD OTOMATIS

Railway akan menjalankan urutan ini:
1. **Setup Environment**: Node.js 20 + FFmpeg + Python3
2. **Install Dependencies**: `npm ci`
3. **Database Migration**: `npm run db:push` (auto-create tables + insert 33 stations)
4. **Build Application**: `npm run build` (compile React + TypeScript)
5. **Start Services**: Discord bot + Express server + WebSocket

### HASIL DEPLOYMENT

#### Web Dashboard (https://your-app.railway.app)
- Homepage dengan real-time bot statistics
- Discord OAuth authentication system
- Interactive control panel untuk 5 servers
- Radio station browser (33 stations)
- User profile management
- Real-time server status monitoring

#### Discord Bot (5 Servers Aktif)
- VALKYRIE server
- Gamers Guild server  
- Valkyrie (ROO) server
- Valksistant server
- VALKYRIE ESPORTS server

**Bot Features:**
- Auto-setup radio channels di semua servers
- Slash commands: `/play`, `/stop`, `/volume`, `/setup`
- Interactive dropdown station selection
- Auto-resume streaming setelah restart
- Real-time now playing messages

#### PostgreSQL Database
**Tables yang ter-create:**
- `users` - User accounts dan Discord data
- `radio_stations` - 33 radio stations lengkap
- `discord_servers` - Server settings
- `bot_status` - Bot monitoring data
- `session` - User session storage
- `user_server_access` - Permission management

### MONITORING & MAINTENANCE

#### Health Monitoring
**Endpoint**: `https://your-app.railway.app/health`
- Status bot online/offline
- Server count (should be 5)
- Timestamp last check
- Compatible dengan UptimeRobot

#### Railway Dashboard Monitoring
- Real-time application logs
- Resource usage (CPU, Memory)
- Deployment history
- Environment variables management

#### UptimeRobot Setup (Opsional)
1. Daftar di https://uptimerobot.com
2. Add monitor: `https://your-app.railway.app/health`
3. Set interval: 5 minutes
4. Enable email alerts

### TROUBLESHOOTING COMMON ISSUES

#### Bot Tidak Online
**Penyebab**: DISCORD_TOKEN salah/tidak valid
**Solusi**: 
1. Check DISCORD_TOKEN di Railway variables
2. Regenerate token di Discord Developer Portal
3. Update environment variable

#### Dashboard Login Gagal
**Penyebab**: Discord OAuth callback URL salah
**Solusi**:
1. Verify callback URL di Discord Developer Portal
2. Pastikan format: `https://your-app.railway.app/auth/discord/callback`
3. No trailing slash

#### Database Connection Error
**Penyebab**: DATABASE_URL tidak tersedia
**Solusi**:
1. Ensure PostgreSQL service running
2. Check DATABASE_URL di environment variables
3. Restart deployment jika perlu

#### Audio Streaming Issues
**Penyebab**: FFmpeg dependencies atau network
**Solusi**:
1. FFmpeg included di nixpacks.toml
2. Check voice channel permissions
3. Verify stream URLs masih aktif

### ESTIMASI BIAYA

**Railway Pricing:**
- Starter Plan: $5/month (app hosting)
- PostgreSQL Add-on: $5/month (database)
- **Total**: ~$10/month

**Resource Usage:**
- RAM: 200-400MB normal operation
- CPU: Low usage, spikes saat audio processing
- Storage: ~100MB (app + database)

### POST-DEPLOYMENT CHECKLIST

#### Immediate Verification (5-10 menit)
- [ ] Railway deployment status "Success"
- [ ] Health endpoint returns 200 status
- [ ] Web dashboard loads properly
- [ ] Discord bot appears online
- [ ] All 5 servers have bot connected

#### Functional Testing (10-15 menit)
- [ ] Discord OAuth login works
- [ ] User authentication persistent
- [ ] Control panel shows all 5 servers
- [ ] Radio station selection functional
- [ ] Audio streaming works di semua servers
- [ ] Volume controls responsive
- [ ] Auto-resume after restart

#### Long-term Monitoring Setup
- [ ] UptimeRobot monitoring configured
- [ ] Railway logs monitoring setup
- [ ] Discord webhook notifications (opsional)
- [ ] Performance baseline established

### MAINTENANCE SCHEDULE

**Daily**: Monitor bot status via health endpoint
**Weekly**: Check Railway logs untuk errors
**Monthly**: Review resource usage dan costs
**As Needed**: Update radio station URLs jika broken

**DEPLOYMENT READY**: Semua komponen verified dan tested