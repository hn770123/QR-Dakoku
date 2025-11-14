/**
 * トークン生成モジュール
 * 機能: パスキーと端末情報を使用してセキュアなトークンを生成
 * 作成理由: QRコード用の認証トークンを生成するため
 */

const TokenGenerator = {
    /**
     * トークンを生成する
     * @param {string} deviceId - 端末ID
     * @param {string} passkey - パスキー
     * @param {string} actionType - アクション種別（check-in or check-out）
     * @returns {Object} トークン情報（token, timestamp）
     */
    generate(deviceId, passkey, actionType) {
        try {
            // タイムスタンプ（ミリ秒）
            const timestamp = Date.now();
            
            // データを結合
            const data = `${deviceId}|${actionType}|${timestamp}|${passkey}`;
            
            // SHA-256ハッシュを生成
            const hash = sha256(data);
            
            // トークン: ハッシュの先頭32文字を使用
            const token = hash.substring(0, 32);
            
            return {
                token: token,
                deviceId: deviceId,
                actionType: actionType,
                timestamp: timestamp
            };
        } catch (error) {
            console.error('トークン生成エラー:', error);
            throw new Error('トークンの生成に失敗しました');
        }
    },
    
    /**
     * トークン情報をクエリパラメータ形式にエンコード
     * @param {Object} tokenInfo - トークン情報
     * @returns {string} クエリパラメータ文字列
     */
    encodeToQueryParams(tokenInfo) {
        const params = new URLSearchParams({
            token: tokenInfo.token,
            deviceId: tokenInfo.deviceId,
            action: tokenInfo.actionType,
            timestamp: tokenInfo.timestamp
        });
        return params.toString();
    },
    
    /**
     * URLを生成
     * @param {string} baseUrl - ベースURL
     * @param {Object} tokenInfo - トークン情報
     * @returns {string} 完全なURL
     */
    generateUrl(baseUrl, tokenInfo) {
        const queryParams = this.encodeToQueryParams(tokenInfo);
        const separator = baseUrl.includes('?') ? '&' : '?';
        return `${baseUrl}${separator}${queryParams}`;
    },
    
    /**
     * トークンの有効期限を確認
     * @param {number} timestamp - トークン生成時のタイムスタンプ
     * @param {number} expiryMinutes - 有効期限（分）
     * @returns {boolean} 有効期限内ならtrue
     */
    isValid(timestamp, expiryMinutes = 5) {
        const now = Date.now();
        const expiryMs = expiryMinutes * 60 * 1000;
        return (now - timestamp) < expiryMs;
    },
    
    /**
     * トークンの残り時間を取得（秒）
     * @param {number} timestamp - トークン生成時のタイムスタンプ
     * @param {number} expiryMinutes - 有効期限（分）
     * @returns {number} 残り時間（秒）
     */
    getRemainingSeconds(timestamp, expiryMinutes = 5) {
        const now = Date.now();
        const expiryMs = expiryMinutes * 60 * 1000;
        const remainingMs = expiryMs - (now - timestamp);
        return Math.max(0, Math.floor(remainingMs / 1000));
    }
};
