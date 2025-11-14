/**
 * 設定ページ管理
 * 機能: 設定フォームの入力処理と保存
 * 作成理由: ユーザーが端末ID、パスキー、URLを設定できるようにするため
 */

class SettingsPage {
    constructor() {
        // DOM要素
        this.elements = {
            form: document.getElementById('settingsForm'),
            deviceIdInput: document.getElementById('deviceId'),
            passkeyInput: document.getElementById('passkey'),
            targetUrlInput: document.getElementById('targetUrl'),
            togglePasskeyBtn: document.getElementById('togglePasskey'),
            resetBtn: document.getElementById('resetBtn'),
            saveMessage: document.getElementById('saveMessage')
        };
        
        // イベントリスナーの設定
        this.initEventListeners();
        
        // 既存の設定を読み込み
        this.loadSettings();
    }
    
    /**
     * イベントリスナーの初期化
     */
    initEventListeners() {
        // フォーム送信
        this.elements.form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveSettings();
        });
        
        // パスキー表示切替
        this.elements.togglePasskeyBtn.addEventListener('click', () => {
            this.togglePasswordVisibility();
        });
        
        // リセットボタン
        this.elements.resetBtn.addEventListener('click', () => {
            this.resetSettings();
        });
    }
    
    /**
     * 既存の設定を読み込む
     */
    loadSettings() {
        const config = Config.load();
        
        this.elements.deviceIdInput.value = config.deviceId || '';
        this.elements.passkeyInput.value = config.passkey || '';
        this.elements.targetUrlInput.value = config.targetUrl || '';
    }
    
    /**
     * 設定を保存
     */
    saveSettings() {
        // バリデーション
        if (!this.validateForm()) {
            return;
        }
        
        // 設定オブジェクトの作成
        const config = {
            deviceId: this.elements.deviceIdInput.value.trim(),
            passkey: this.elements.passkeyInput.value,
            targetUrl: this.elements.targetUrlInput.value.trim()
        };
        
        // 保存
        const success = Config.save(config);
        
        if (success) {
            this.showMessage('設定を保存しました', 'success');
            // 2秒後にメインページへ戻る
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 2000);
        } else {
            this.showMessage('設定の保存に失敗しました', 'error');
        }
    }
    
    /**
     * フォームのバリデーション
     * @returns {boolean} バリデーション結果
     */
    validateForm() {
        // 端末IDのチェック
        const deviceId = this.elements.deviceIdInput.value.trim();
        if (!deviceId) {
            this.showMessage('端末IDを入力してください', 'error');
            this.elements.deviceIdInput.focus();
            return false;
        }
        
        // パスキーのチェック
        const passkey = this.elements.passkeyInput.value;
        if (!passkey || passkey.length < 8) {
            this.showMessage('パスキーは8文字以上入力してください', 'error');
            this.elements.passkeyInput.focus();
            return false;
        }
        
        // URLのチェック
        const targetUrl = this.elements.targetUrlInput.value.trim();
        if (!targetUrl) {
            this.showMessage('リンク先URLを入力してください', 'error');
            this.elements.targetUrlInput.focus();
            return false;
        }
        
        // URL形式のチェック
        try {
            new URL(targetUrl);
        } catch (e) {
            this.showMessage('正しいURL形式で入力してください', 'error');
            this.elements.targetUrlInput.focus();
            return false;
        }
        
        return true;
    }
    
    /**
     * パスワード表示切替
     */
    togglePasswordVisibility() {
        const input = this.elements.passkeyInput;
        const btn = this.elements.togglePasskeyBtn;
        
        if (input.type === 'password') {
            input.type = 'text';
            btn.textContent = '🙈';
            btn.setAttribute('aria-label', 'パスキーを非表示');
        } else {
            input.type = 'password';
            btn.textContent = '👁️';
            btn.setAttribute('aria-label', 'パスキーを表示');
        }
    }
    
    /**
     * 設定のリセット
     */
    resetSettings() {
        if (confirm('設定をリセットしますか？この操作は取り消せません。')) {
            const success = Config.reset();
            
            if (success) {
                this.elements.form.reset();
                this.showMessage('設定をリセットしました', 'success');
            } else {
                this.showMessage('設定のリセットに失敗しました', 'error');
            }
        }
    }
    
    /**
     * メッセージ表示
     * @param {string} message - 表示するメッセージ
     * @param {string} type - メッセージタイプ（success or error）
     */
    showMessage(message, type) {
        this.elements.saveMessage.textContent = message;
        this.elements.saveMessage.className = `save-message ${type}`;
        this.elements.saveMessage.classList.remove('hidden');
        
        // 5秒後に非表示
        setTimeout(() => {
            this.elements.saveMessage.classList.add('hidden');
        }, 5000);
    }
}

// ページ初期化
document.addEventListener('DOMContentLoaded', () => {
    new SettingsPage();
});
