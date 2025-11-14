/**
 * QRコード出退勤システム - 受付サーバー
 * 機能: QRコードからのアクセスを受け付け、ログを記録
 * 作成理由: 出退勤記録を受け付けてログに保存するため
 */

const express = require('express');
const cookieParser = require('cookie-parser');
const path = require('path');
const utils = require('./utils');

const app = express();
const PORT = process.env.PORT || 3000;

// ミドルウェア設定
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());

// 静的ファイルの提供（受付ページ用）
app.use(express.static(path.join(__dirname, 'public')));

/**
 * 受付ページへのアクセス（GET）
 * クエリパラメータ: token, deviceId, action, timestamp
 */
app.get('/receive', (req, res) => {
    try {
        const { token, deviceId, action, timestamp } = req.query;
        
        // クッキーからユーザー名を取得
        const username = req.cookies.username;
        
        // パラメータチェック
        if (!token || !deviceId || !action || !timestamp) {
            return res.status(400).send(generateHtml(
                'エラー',
                '<p class="error">無効なQRコードです。必要なパラメータが不足しています。</p>',
                null
            ));
        }
        
        // タイムスタンプの数値変換
        const tokenTimestamp = parseInt(timestamp, 10);
        if (isNaN(tokenTimestamp)) {
            return res.status(400).send(generateHtml(
                'エラー',
                '<p class="error">無効なタイムスタンプです。</p>',
                null
            ));
        }
        
        // 有効期限チェック
        if (!utils.isTokenValid(tokenTimestamp, 5)) {
            return res.status(400).send(generateHtml(
                'エラー',
                '<p class="error">QRコードの有効期限が切れています。</p>',
                null
            ));
        }
        
        // 端末のパスキーを取得
        const passkey = utils.getPasskeyForDevice(deviceId);
        if (!passkey) {
            // パスキーが見つからない場合
            const logData = {
                username: username || 'unknown',
                deviceId: deviceId,
                action: action,
                tokenTimestamp: new Date(tokenTimestamp).toISOString(),
                requestTimestamp: new Date().toISOString()
            };
            utils.appendLog('invalid', logData);
            
            return res.status(400).send(generateHtml(
                'エラー',
                '<p class="error">端末が登録されていません。</p>',
                null
            ));
        }
        
        // トークン検証
        const isValid = utils.verifyToken(token, deviceId, action, tokenTimestamp, passkey);
        
        // ユーザー名が未登録の場合
        if (!username) {
            // 登録フォームを表示（トークン情報を保持）
            return res.send(generateRegistrationForm(token, deviceId, action, tokenTimestamp, isValid));
        }
        
        // ログデータの作成
        const logData = {
            username: username,
            deviceId: deviceId,
            action: action,
            tokenTimestamp: new Date(tokenTimestamp).toISOString(),
            requestTimestamp: new Date().toISOString()
        };
        
        // ログ保存
        const logType = isValid ? 'valid' : 'invalid';
        utils.appendLog(logType, logData);
        
        // 結果画面を表示
        const actionText = action === 'check-in' ? '出勤' : '退勤';
        const message = isValid 
            ? `${username}さん、${actionText}を受け付けました。`
            : `${username}さん、${actionText}を受け付けましたが、トークンが無効です。`;
        
        const messageClass = isValid ? 'success' : 'warning';
        
        res.send(generateHtml(
            '受付完了',
            `<p class="${messageClass}">${message}</p>`,
            username
        ));
        
    } catch (error) {
        console.error('受付エラー:', error);
        res.status(500).send(generateHtml(
            'エラー',
            '<p class="error">サーバーエラーが発生しました。</p>',
            null
        ));
    }
});

/**
 * ユーザー名登録（POST）
 */
app.post('/register', (req, res) => {
    try {
        const { username, token, deviceId, action, timestamp } = req.body;
        
        if (!username || username.trim() === '') {
            return res.status(400).send(generateHtml(
                'エラー',
                '<p class="error">ユーザー名を入力してください。</p>',
                null
            ));
        }
        
        // クッキーにユーザー名を保存（1年間有効）
        res.cookie('username', username.trim(), { 
            maxAge: 365 * 24 * 60 * 60 * 1000,
            httpOnly: true 
        });
        
        // タイムスタンプの変換
        const tokenTimestamp = parseInt(timestamp, 10);
        
        // 有効期限チェック
        if (!utils.isTokenValid(tokenTimestamp, 5)) {
            return res.status(400).send(generateHtml(
                'エラー',
                '<p class="error">QRコードの有効期限が切れています。再度QRコードを読み取ってください。</p>',
                username.trim()
            ));
        }
        
        // 端末のパスキーを取得
        const passkey = utils.getPasskeyForDevice(deviceId);
        if (!passkey) {
            const logData = {
                username: username.trim(),
                deviceId: deviceId,
                action: action,
                tokenTimestamp: new Date(tokenTimestamp).toISOString(),
                requestTimestamp: new Date().toISOString()
            };
            utils.appendLog('invalid', logData);
            
            return res.status(400).send(generateHtml(
                'エラー',
                '<p class="error">端末が登録されていません。</p>',
                username.trim()
            ));
        }
        
        // トークン検証
        const isValid = utils.verifyToken(token, deviceId, action, tokenTimestamp, passkey);
        
        // ログ保存
        const logData = {
            username: username.trim(),
            deviceId: deviceId,
            action: action,
            tokenTimestamp: new Date(tokenTimestamp).toISOString(),
            requestTimestamp: new Date().toISOString()
        };
        
        const logType = isValid ? 'valid' : 'invalid';
        utils.appendLog(logType, logData);
        
        // 結果画面を表示
        const actionText = action === 'check-in' ? '出勤' : '退勤';
        const message = isValid 
            ? `${username.trim()}さん、ユーザー登録と${actionText}を受け付けました。`
            : `${username.trim()}さん、ユーザー登録しましたが、トークンが無効です。`;
        
        const messageClass = isValid ? 'success' : 'warning';
        
        res.send(generateHtml(
            '登録完了',
            `<p class="${messageClass}">${message}</p>`,
            username.trim()
        ));
        
    } catch (error) {
        console.error('登録エラー:', error);
        res.status(500).send(generateHtml(
            'エラー',
            '<p class="error">サーバーエラーが発生しました。</p>',
            null
        ));
    }
});

/**
 * HTML生成（結果画面）
 */
function generateHtml(title, content, username) {
    const userInfo = username ? `<p class="user-info">登録ユーザー: ${username}</p>` : '';
    
    return `
<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title} - QRコード出退勤</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: 'Helvetica Neue', Arial, 'Hiragino Kaku Gothic ProN', sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
        }
        .container {
            background: white;
            border-radius: 20px;
            padding: 40px;
            max-width: 500px;
            width: 100%;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
            text-align: center;
        }
        h1 {
            color: #333;
            margin-bottom: 30px;
            font-size: 1.8rem;
        }
        p {
            font-size: 1.2rem;
            padding: 20px;
            border-radius: 10px;
            margin-bottom: 20px;
        }
        .success {
            background: #e8f5e9;
            color: #2e7d32;
            border-left: 4px solid #2e7d32;
        }
        .error {
            background: #ffebee;
            color: #c62828;
            border-left: 4px solid #c62828;
        }
        .warning {
            background: #fff3cd;
            color: #856404;
            border-left: 4px solid #856404;
        }
        .user-info {
            background: #f5f5f5;
            color: #666;
            font-size: 0.9rem;
            padding: 10px;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>${title}</h1>
        ${content}
        ${userInfo}
    </div>
</body>
</html>
    `;
}

/**
 * 登録フォーム生成
 */
function generateRegistrationForm(token, deviceId, action, timestamp, isValid) {
    const actionText = action === 'check-in' ? '出勤' : '退勤';
    const warningMessage = !isValid 
        ? '<p class="warning">⚠️ トークンが無効です。正しいQRコードか確認してください。</p>' 
        : '';
    
    return `
<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>ユーザー登録 - QRコード出退勤</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: 'Helvetica Neue', Arial, 'Hiragino Kaku Gothic ProN', sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
        }
        .container {
            background: white;
            border-radius: 20px;
            padding: 40px;
            max-width: 500px;
            width: 100%;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
        }
        h1 {
            color: #333;
            margin-bottom: 10px;
            text-align: center;
            font-size: 1.8rem;
        }
        .subtitle {
            text-align: center;
            color: #666;
            margin-bottom: 30px;
        }
        .form-group {
            margin-bottom: 20px;
        }
        label {
            display: block;
            margin-bottom: 8px;
            font-weight: bold;
            color: #333;
        }
        input[type="text"] {
            width: 100%;
            padding: 12px;
            font-size: 1rem;
            border: 2px solid #ddd;
            border-radius: 8px;
            transition: border-color 0.3s;
        }
        input[type="text"]:focus {
            outline: none;
            border-color: #667eea;
        }
        button {
            width: 100%;
            padding: 15px;
            font-size: 1.1rem;
            font-weight: bold;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            transition: transform 0.3s;
        }
        button:hover {
            transform: translateY(-2px);
        }
        .info {
            background: #e3f2fd;
            color: #1565c0;
            padding: 15px;
            border-radius: 8px;
            margin-bottom: 20px;
            border-left: 4px solid #1565c0;
        }
        .warning {
            background: #fff3cd;
            color: #856404;
            padding: 15px;
            border-radius: 8px;
            margin-bottom: 20px;
            border-left: 4px solid #856404;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>ユーザー登録</h1>
        <p class="subtitle">初めてご利用の方</p>
        
        <div class="info">
            <strong>アクション:</strong> ${actionText}
        </div>
        
        ${warningMessage}
        
        <form action="/register" method="POST">
            <input type="hidden" name="token" value="${token}">
            <input type="hidden" name="deviceId" value="${deviceId}">
            <input type="hidden" name="action" value="${action}">
            <input type="hidden" name="timestamp" value="${timestamp}">
            
            <div class="form-group">
                <label for="username">ユーザー名</label>
                <input type="text" id="username" name="username" required 
                       placeholder="お名前を入力してください" 
                       maxlength="50">
            </div>
            
            <button type="submit">登録して${actionText}する</button>
        </form>
    </div>
</body>
</html>
    `;
}

// サーバー起動
app.listen(PORT, () => {
    console.log(`QRコード出退勤サーバーが起動しました`);
    console.log(`http://localhost:${PORT}/receive`);
});
