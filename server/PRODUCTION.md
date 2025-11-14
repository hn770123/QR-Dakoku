# 本番環境向けセキュリティ強化

本番環境でサーバーを運用する際の推奨設定です。

## レート制限の追加

DDoS攻撃や不正アクセスを防ぐため、レート制限を追加することを推奨します。

### インストール

```bash
npm install express-rate-limit
```

### server.jsへの追加

`server.js`の先頭に以下を追加：

```javascript
const rateLimit = require('express-rate-limit');

// レート制限の設定
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15分
    max: 100, // 最大100リクエスト
    message: 'リクエストが多すぎます。しばらく待ってから再試行してください。'
});

// 全てのルートに適用
app.use(limiter);

// または特定のルートのみに適用
app.use('/receive', limiter);
app.use('/register', limiter);
```

## HTTPS証明書の設定

HTTPSを使用する場合の例（Let's Encryptを使用）：

```javascript
const https = require('https');
const fs = require('fs');

const options = {
    key: fs.readFileSync('/path/to/privkey.pem'),
    cert: fs.readFileSync('/path/to/fullchain.pem')
};

https.createServer(options, app).listen(443, () => {
    console.log('HTTPS server running on port 443');
});
```

## 環境変数の設定

本番環境では以下の環境変数を設定：

```bash
export NODE_ENV=production
export PORT=3000
```

または`.env`ファイルを使用（dotenvパッケージが必要）：

```
NODE_ENV=production
PORT=3000
```

## リバースプロキシの使用

Nginxなどのリバースプロキシを使用することを推奨：

```nginx
server {
    listen 80;
    server_name your-domain.com;
    
    # HTTPSへリダイレクト
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;
    
    ssl_certificate /path/to/fullchain.pem;
    ssl_certificate_key /path/to/privkey.pem;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## ログの定期的なローテーション

ログファイルが肥大化しないよう、logrotateなどを使用：

```
/path/to/QR-Dakoku/server/logs/*.log {
    daily
    rotate 90
    compress
    delaycompress
    notifempty
    create 0640 www-data www-data
    sharedscripts
}
```

## ファイアウォール設定

必要なポートのみ開放：

```bash
# UFWの場合
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw enable
```

## 監視とアラート

- サーバーの稼働状況を監視
- ディスク容量の監視（ログファイルの肥大化）
- 異常なアクセスパターンの検出

## バックアップ

定期的にログファイルと設定ファイルをバックアップ：

```bash
# cronジョブの例（毎日深夜2時）
0 2 * * * tar -czf /backup/qr-dakoku-$(date +\%Y\%m\%d).tar.gz /path/to/QR-Dakoku/server/logs /path/to/QR-Dakoku/server/config
```

## systemdサービスとしての登録

サーバーを自動起動するための設定例：

```ini
[Unit]
Description=QR Dakoku Server
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/path/to/QR-Dakoku/server
Environment=NODE_ENV=production
Environment=PORT=3000
ExecStart=/usr/bin/node server.js
Restart=on-failure

[Install]
WantedBy=multi-user.target
```

有効化：

```bash
sudo systemctl enable qr-dakoku
sudo systemctl start qr-dakoku
sudo systemctl status qr-dakoku
```
