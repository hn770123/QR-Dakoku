/**
 * ユーティリティ関数
 * 機能: サーバーサイドの共通処理
 * 作成理由: トークン検証、ファイル操作などの共通処理をまとめるため
 */

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

/**
 * トークンを検証
 * @param {string} token - 検証するトークン
 * @param {string} deviceId - 端末ID
 * @param {string} actionType - アクション種別
 * @param {number} timestamp - タイムスタンプ
 * @param {string} passkey - パスキー
 * @returns {boolean} 検証結果
 */
function verifyToken(token, deviceId, actionType, timestamp, passkey) {
    try {
        // トークン生成ロジックを再現
        const data = `${deviceId}|${actionType}|${timestamp}|${passkey}`;
        const hash = crypto.createHash('sha256').update(data).digest('hex');
        const expectedToken = hash.substring(0, 32);
        
        // トークンが一致するか確認
        return token === expectedToken;
    } catch (error) {
        console.error('トークン検証エラー:', error);
        return false;
    }
}

/**
 * トークンの有効期限を確認
 * @param {number} timestamp - タイムスタンプ
 * @param {number} expiryMinutes - 有効期限（分）
 * @returns {boolean} 有効期限内ならtrue
 */
function isTokenValid(timestamp, expiryMinutes = 5) {
    const now = Date.now();
    const expiryMs = expiryMinutes * 60 * 1000;
    return (now - timestamp) < expiryMs;
}

/**
 * 年月フォーマットを取得（YYYY-MM形式）
 * @param {Date} date - 日付オブジェクト
 * @returns {string} YYYY-MM形式の文字列
 */
function getYearMonth(date = new Date()) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
}

/**
 * ログファイルのパスを取得
 * @param {string} logType - ログタイプ（valid or invalid）
 * @param {Date} date - 日付
 * @returns {string} ログファイルのパス
 */
function getLogFilePath(logType, date = new Date()) {
    const yearMonth = getYearMonth(date);
    const logsDir = path.join(__dirname, 'logs');
    
    // ディレクトリが存在しない場合は作成
    if (!fs.existsSync(logsDir)) {
        fs.mkdirSync(logsDir, { recursive: true });
    }
    
    return path.join(logsDir, `${logType}_${yearMonth}.log`);
}

/**
 * ログを追加
 * @param {string} logType - ログタイプ（valid or invalid）
 * @param {Object} logData - ログデータ
 */
function appendLog(logType, logData) {
    try {
        const logFilePath = getLogFilePath(logType);
        const timestamp = new Date().toISOString();
        
        // ログエントリを作成（JSON形式）
        const logEntry = {
            timestamp: timestamp,
            username: logData.username,
            deviceId: logData.deviceId,
            action: logData.action,
            tokenTimestamp: logData.tokenTimestamp,
            requestTimestamp: logData.requestTimestamp,
            isValid: logType === 'valid'
        };
        
        // ファイルに追記
        fs.appendFileSync(logFilePath, JSON.stringify(logEntry) + '\n');
        
        console.log(`ログ保存: ${logType} - ${logData.username} - ${logData.action}`);
        return true;
    } catch (error) {
        console.error('ログ保存エラー:', error);
        return false;
    }
}

/**
 * 設定ファイルを読み込み
 * @returns {Object} 設定オブジェクト
 */
function loadConfig() {
    try {
        const configPath = path.join(__dirname, 'config', 'devices.json');
        
        if (!fs.existsSync(configPath)) {
            // 設定ファイルが存在しない場合はデフォルトを返す
            console.warn('設定ファイルが見つかりません:', configPath);
            return {};
        }
        
        const configData = fs.readFileSync(configPath, 'utf8');
        return JSON.parse(configData);
    } catch (error) {
        console.error('設定読み込みエラー:', error);
        return {};
    }
}

/**
 * 端末のパスキーを取得
 * @param {string} deviceId - 端末ID
 * @returns {string|null} パスキー、見つからない場合はnull
 */
function getPasskeyForDevice(deviceId) {
    const config = loadConfig();
    return config[deviceId] || null;
}

module.exports = {
    verifyToken,
    isTokenValid,
    getYearMonth,
    getLogFilePath,
    appendLog,
    loadConfig,
    getPasskeyForDevice
};
