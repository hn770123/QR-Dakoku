# QRコード出退勤記録システム

QRコードを使用した出退勤記録システムです。オフラインでも動作するPWA（Progressive Web App）対応のフロントエンドと、ログ記録用のバックエンドサーバーで構成されています。

## 📋 機能概要

### QRコード表示ページ（フロントエンド）
- 出勤・退勤ボタンでQRコード生成
- パスキーを使用したセキュアなトークン生成
- QRコードの有効期限は5分間
- 出勤/退勤を色で識別（緑/ピンク）
- PWA対応でオフラインでも動作
- 設定ページへのリンク

### 設定ページ
- 端末ID、パスキー、リンク先URLの設定
- パスワードマスキング機能
- ローカルストレージへの設定保存
- PWA対応

### 受付ページ（バックエンド）
- 初回アクセス時のユーザー名登録
- クッキーによるユーザー識別
- トークン検証
- 正常/異常ログの分離保存
- 年月ごとのログファイル分割

## 🚀 セットアップ

### フロントエンド（GitHub Pages）

1. このリポジトリをGitHub Pagesで公開する設定を行います：
   - リポジトリの「Settings」→「Pages」
   - Source: 「Deploy from a branch」
   - Branch: `main`、フォルダ: `/docs`

2. GitHub Pagesが有効になったら、以下のURLでアクセスできます：
   ```
   https://<ユーザー名>.github.io/<リポジトリ名>/
   ```

3. 初回アクセス時に設定ページで以下を設定：
   - **端末ID**: この端末を識別するID（例: `device001`）
   - **パスキー**: 8文字以上の秘密鍵
   - **リンク先URL**: 受付サーバーのURL（例: `https://example.com/receive`）

### バックエンド（受付サーバー）

1. 必要なパッケージをインストール：
   ```bash
   cd server
   npm install
   ```

2. 端末とパスキーの設定ファイルを作成：
   ```bash
   cp config/devices.json.example config/devices.json
   ```

3. `config/devices.json`を編集して、端末IDとパスキーのペアを設定：
   ```json
   {
     "device001": "your-passkey-here",
     "device002": "another-passkey"
   }
   ```
   ⚠️ パスキーはフロントエンドの設定ページで設定したものと同じにしてください。

4. サーバーを起動：
   ```bash
   npm start
   ```
   デフォルトではポート3000で起動します。

5. 環境変数でポートを変更する場合：
   ```bash
   PORT=8080 npm start
   ```

## 📱 使い方

### 1. 初期設定
1. GitHub Pagesで公開されたページにアクセス
2. 「⚙️ 設定」ボタンをクリック
3. 端末ID、パスキー、リンク先URLを入力して保存

### 2. QRコード生成
1. メインページで「出勤」または「退勤」ボタンをクリック
2. QRコードが表示されます（5分間有効）
3. QRコードをタップするか「閉じる」ボタンで画面を閉じる

### 3. QRコード読み取り
1. スマートフォンでQRコードを読み取る
2. 初回：ユーザー名を入力して登録
3. 2回目以降：自動的に記録完了画面が表示

## 📂 ディレクトリ構造

```
QR-Dakoku/
├── docs/                      # フロントエンド（GitHub Pages）
│   ├── index.html            # QRコード表示ページ
│   ├── settings.html         # 設定ページ
│   ├── manifest.json         # PWAマニフェスト
│   ├── sw.js                 # Service Worker
│   ├── css/
│   │   └── style.css        # スタイルシート
│   ├── js/
│   │   ├── app.js           # メインアプリケーション
│   │   ├── config.js        # 設定管理
│   │   ├── token.js         # トークン生成
│   │   ├── settings.js      # 設定ページ処理
│   │   └── sw-register.js   # Service Worker登録
│   └── images/
│       ├── icon-192.png     # PWAアイコン
│       └── icon-512.png     # PWAアイコン
│
└── server/                   # バックエンド（受付サーバー）
    ├── server.js            # メインサーバー
    ├── utils.js             # ユーティリティ関数
    ├── package.json         # npm設定
    ├── config/
    │   └── devices.json     # 端末設定（要作成）
    └── logs/                # ログファイル（自動生成）
        ├── valid_YYYY-MM.log    # 正常ログ
        └── invalid_YYYY-MM.log  # 異常ログ
```

## 🔒 セキュリティについて

- **トークン**: SHA-256ハッシュを使用して生成
- **有効期限**: QRコードは5分間のみ有効
- **検証**: サーバー側でトークンの正当性を検証
- **ログ分離**: 正常なアクセスと異常なアクセスを別々に記録

⚠️ **注意**: 端末IDとパスキーの組み合わせが漏洩しても、直接的な情報漏洩のリスクはありませんが、不正なQRコードが生成される可能性があります。パスキーは定期的に変更することをお勧めします。

## 📊 ログファイル形式

ログはJSON形式で1行ごとに記録されます：

```json
{
  "timestamp": "2024-01-15T12:34:56.789Z",
  "username": "山田太郎",
  "deviceId": "device001",
  "action": "check-in",
  "tokenTimestamp": "2024-01-15T12:34:00.000Z",
  "requestTimestamp": "2024-01-15T12:34:56.789Z",
  "isValid": true
}
```

## 🛠️ 技術スタック

### フロントエンド
- HTML5
- CSS3（レスポンシブデザイン）
- Vanilla JavaScript
- QRCode.js（QRコード生成）
- js-sha256（SHA-256ハッシュ）
- Service Worker（PWA）

### バックエンド
- Node.js
- Express.js
- cookie-parser

## 📝 ライセンス

MIT License

## 🤝 貢献

バグ報告や機能リクエストは、GitHubのIssuesでお願いします。

## 📞 サポート

質問や問題がある場合は、GitHubのIssuesで報告してください。
