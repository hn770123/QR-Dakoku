/**
 * 設定管理モジュール
 * 機能: ローカルストレージへの設定の保存・読み込み
 * 作成理由: アプリケーション設定を永続化するため
 */

const Config = {
    // ストレージキー
    STORAGE_KEY: 'qr-dakoku-config',
    
    /**
     * 設定の初期値
     */
    defaults: {
        deviceId: '',
        passkey: '',
        targetUrl: ''
    },
    
    /**
     * 設定を保存する
     * @param {Object} config - 保存する設定オブジェクト
     * @returns {boolean} 保存成功時true
     */
    save(config) {
        try {
            const configToSave = {
                deviceId: config.deviceId || '',
                passkey: config.passkey || '',
                targetUrl: config.targetUrl || ''
            };
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(configToSave));
            return true;
        } catch (error) {
            console.error('設定の保存に失敗しました:', error);
            return false;
        }
    },
    
    /**
     * 設定を読み込む
     * @returns {Object} 設定オブジェクト
     */
    load() {
        try {
            const saved = localStorage.getItem(this.STORAGE_KEY);
            if (saved) {
                return JSON.parse(saved);
            }
        } catch (error) {
            console.error('設定の読み込みに失敗しました:', error);
        }
        return { ...this.defaults };
    },
    
    /**
     * 設定が完了しているか確認
     * @returns {boolean} 設定完了時true
     */
    isConfigured() {
        const config = this.load();
        return !!(config.deviceId && config.passkey && config.targetUrl);
    },
    
    /**
     * 設定をリセット
     */
    reset() {
        try {
            localStorage.removeItem(this.STORAGE_KEY);
            return true;
        } catch (error) {
            console.error('設定のリセットに失敗しました:', error);
            return false;
        }
    }
};
