/**
 * メインアプリケーション
 * 機能: QRコード表示ページのメインロジック
 * 作成理由: ユーザーインタラクションとQRコード生成を管理するため
 */

class QRDakokuApp {
    constructor() {
        // DOM要素
        this.elements = {
            buttonArea: document.getElementById('buttonArea'),
            qrArea: document.getElementById('qrArea'),
            errorArea: document.getElementById('errorArea'),
            errorMessage: document.getElementById('errorMessage'),
            checkInBtn: document.getElementById('checkInBtn'),
            checkOutBtn: document.getElementById('checkOutBtn'),
            qrInfo: document.getElementById('qrInfo'),
            actionType: document.getElementById('actionType'),
            actionTime: document.getElementById('actionTime'),
            qrCodeContainer: document.getElementById('qrCodeContainer'),
            closeQrBtn: document.getElementById('closeQrBtn'),
            timer: document.getElementById('timer'),
            timerProgress: document.getElementById('timerProgress')
        };
        
        // 状態管理
        this.currentToken = null;
        this.timerInterval = null;
        
        // イベントリスナーの設定
        this.initEventListeners();
        
        // 初期化時の設定確認
        this.checkConfiguration();
    }
    
    /**
     * イベントリスナーの初期化
     */
    initEventListeners() {
        this.elements.checkInBtn.addEventListener('click', () => this.handleAction('check-in'));
        this.elements.checkOutBtn.addEventListener('click', () => this.handleAction('check-out'));
        this.elements.closeQrBtn.addEventListener('click', () => this.closeQrCode());
        this.elements.qrCodeContainer.addEventListener('click', () => this.closeQrCode());
    }
    
    /**
     * 設定の確認
     */
    checkConfiguration() {
        if (!Config.isConfigured()) {
            this.showError('設定が完了していません。設定ページで端末ID、パスキー、リンク先URLを設定してください。');
        }
    }
    
    /**
     * アクション処理（出勤/退勤）
     * @param {string} actionType - アクション種別
     */
    async handleAction(actionType) {
        try {
            // 設定の読み込み
            const config = Config.load();
            
            if (!config.deviceId || !config.passkey || !config.targetUrl) {
                this.showError('設定が不完全です。設定ページで確認してください。');
                return;
            }
            
            // トークン生成
            const tokenInfo = TokenGenerator.generate(
                config.deviceId,
                config.passkey,
                actionType
            );
            
            // URLの生成
            const qrUrl = TokenGenerator.generateUrl(config.targetUrl, tokenInfo);
            
            // QRコードを表示
            this.showQrCode(qrUrl, actionType, tokenInfo.timestamp);
            
            // トークン情報を保存
            this.currentToken = tokenInfo;
            
        } catch (error) {
            console.error('エラー:', error);
            this.showError('QRコードの生成に失敗しました。' + error.message);
        }
    }
    
    /**
     * QRコードを表示
     * @param {string} url - QRコードに埋め込むURL
     * @param {string} actionType - アクション種別
     * @param {number} timestamp - タイムスタンプ
     */
    async showQrCode(url, actionType, timestamp) {
        // エラー表示をクリア
        this.hideError();
        
        // ボタンエリアを非表示
        this.elements.buttonArea.classList.add('hidden');
        
        // QRコードコンテナをクリア
        this.elements.qrCodeContainer.innerHTML = '';
        
        // アクション情報の表示
        const actionText = actionType === 'check-in' ? '出勤' : '退勤';
        const now = new Date();
        const timeStr = now.toLocaleTimeString('ja-JP');
        
        this.elements.actionType.textContent = actionText;
        this.elements.actionTime.textContent = timeStr;
        
        // 情報エリアのクラス設定
        this.elements.qrInfo.className = `qr-info ${actionType}`;
        
        // QRコード生成
        try {
            await QRCode.toCanvas(url, {
                width: 280,
                margin: 2,
                color: {
                    dark: '#000000',
                    light: '#FFFFFF'
                }
            }).then(canvas => {
                this.elements.qrCodeContainer.appendChild(canvas);
            });
        } catch (error) {
            console.error('QRコード生成エラー:', error);
            this.showError('QRコードの描画に失敗しました。');
            return;
        }
        
        // QRエリアを表示
        this.elements.qrArea.classList.remove('hidden');
        
        // タイマー開始
        this.startTimer(timestamp);
    }
    
    /**
     * タイマー開始
     * @param {number} timestamp - 開始タイムスタンプ
     */
    startTimer(timestamp) {
        // 既存のタイマーをクリア
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
        }
        
        const updateTimer = () => {
            const remaining = TokenGenerator.getRemainingSeconds(timestamp, 5);
            
            if (remaining <= 0) {
                // 期限切れ
                this.closeQrCode();
                this.showError('QRコードの有効期限が切れました。');
                return;
            }
            
            // 残り時間を表示
            const minutes = Math.floor(remaining / 60);
            const seconds = remaining % 60;
            this.elements.timer.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
            
            // プログレスバー更新
            this.elements.timerProgress.value = remaining;
        };
        
        // 初回更新
        updateTimer();
        
        // 1秒ごとに更新
        this.timerInterval = setInterval(updateTimer, 1000);
    }
    
    /**
     * QRコードを閉じる
     */
    closeQrCode() {
        // タイマーを停止
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
        
        // QRエリアを非表示
        this.elements.qrArea.classList.add('hidden');
        
        // ボタンエリアを表示
        this.elements.buttonArea.classList.remove('hidden');
        
        // トークン情報をクリア
        this.currentToken = null;
    }
    
    /**
     * エラーを表示
     * @param {string} message - エラーメッセージ
     */
    showError(message) {
        this.elements.errorMessage.textContent = message;
        this.elements.errorArea.classList.remove('hidden');
    }
    
    /**
     * エラー表示を非表示
     */
    hideError() {
        this.elements.errorArea.classList.add('hidden');
    }
}

// アプリケーション初期化
document.addEventListener('DOMContentLoaded', () => {
    new QRDakokuApp();
});
