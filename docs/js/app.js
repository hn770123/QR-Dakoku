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
            timerProgress: document.getElementById('timerProgress'),
            logContainer: document.getElementById('logContainer'),
            clearLogBtn: document.getElementById('clearLogBtn')
        };
        
        // 状態管理
        this.currentToken = null;
        this.timerInterval = null;
        this.logs = [];
        
        // イベントリスナーの設定
        this.initEventListeners();
        
        // 初期化時の設定確認
        this.checkConfiguration();
        
        // 初期ログ
        this.addLog('info', 'アプリケーションを初期化しました');
    }
    
    /**
     * イベントリスナーの初期化
     */
    initEventListeners() {
        this.elements.checkInBtn.addEventListener('click', () => this.handleAction('check-in'));
        this.elements.checkOutBtn.addEventListener('click', () => this.handleAction('check-out'));
        this.elements.closeQrBtn.addEventListener('click', () => this.closeQrCode());
        this.elements.qrCodeContainer.addEventListener('click', () => this.closeQrCode());
        this.elements.clearLogBtn.addEventListener('click', () => this.clearLogs());
    }
    
    /**
     * 設定の確認
     */
    checkConfiguration() {
        if (!Config.isConfigured()) {
            this.addLog('warning', '設定が完了していません');
            this.showError('設定が完了していません。設定ページで端末ID、パスキー、リンク先URLを設定してください。');
        } else {
            this.addLog('success', '設定が完了しています');
        }
    }
    
    /**
     * アクション処理（出勤/退勤）
     * @param {string} actionType - アクション種別
     */
    async handleAction(actionType) {
        const actionText = actionType === 'check-in' ? '出勤' : '退勤';
        this.addLog('info', `${actionText}ボタンがクリックされました`);
        
        try {
            // 設定の読み込み
            this.addLog('info', '設定を読み込んでいます...');
            const config = Config.load();
            
            if (!config.deviceId || !config.passkey || !config.targetUrl) {
                this.addLog('error', '設定が不完全です: 端末ID、パスキー、リンク先URLを確認してください');
                this.showError('設定が不完全です。設定ページで確認してください。');
                return;
            }
            
            this.addLog('success', `設定を読み込みました (端末ID: ${config.deviceId})`);
            
            // トークン生成
            this.addLog('info', 'トークンを生成しています...');
            const tokenInfo = TokenGenerator.generate(
                config.deviceId,
                config.passkey,
                actionType
            );
            this.addLog('success', `トークンを生成しました (タイムスタンプ: ${new Date(tokenInfo.timestamp).toLocaleString('ja-JP')})`);
            
            // URLの生成
            this.addLog('info', 'QRコード用URLを生成しています...');
            const qrUrl = TokenGenerator.generateUrl(config.targetUrl, tokenInfo);
            this.addLog('success', `URL生成完了: ${qrUrl.substring(0, 50)}...`);
            
            // QRコードを表示
            this.addLog('info', 'QRコードを描画しています...');
            await this.showQrCode(qrUrl, actionType, tokenInfo.timestamp);
            
            // トークン情報を保存
            this.currentToken = tokenInfo;
            
        } catch (error) {
            console.error('エラー:', error);
            this.addLog('error', `エラーが発生しました: ${error.message}`);
            this.addLog('error', `スタックトレース: ${error.stack}`);
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
        
        this.addLog('info', `アクション情報を設定しました: ${actionText} - ${timeStr}`);
        
        // QRコード生成
        try {
            this.addLog('info', 'QRCodeライブラリを呼び出しています...');
            await QRCode.toCanvas(url, {
                width: 280,
                margin: 2,
                color: {
                    dark: '#000000',
                    light: '#FFFFFF'
                }
            }).then(canvas => {
                this.addLog('success', 'QRコードcanvasを生成しました');
                this.elements.qrCodeContainer.appendChild(canvas);
                this.addLog('success', 'QRコードをDOMに追加しました');
            });
        } catch (error) {
            console.error('QRコード生成エラー:', error);
            this.addLog('error', `QRコード描画エラー: ${error.message}`);
            this.addLog('error', `エラー詳細: ${error.stack}`);
            this.showError('QRコードの描画に失敗しました。');
            return;
        }
        
        // QRエリアを表示
        this.elements.qrArea.classList.remove('hidden');
        this.addLog('success', 'QRコードの表示が完了しました');
        
        // タイマー開始
        this.addLog('info', 'タイマーを開始します (有効期限: 5分)');
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
        this.addLog('info', 'QRコードを閉じます');
        
        // タイマーを停止
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
            this.addLog('info', 'タイマーを停止しました');
        }
        
        // QRエリアを非表示
        this.elements.qrArea.classList.add('hidden');
        
        // ボタンエリアを表示
        this.elements.buttonArea.classList.remove('hidden');
        
        // トークン情報をクリア
        this.currentToken = null;
        
        this.addLog('success', 'QRコードを閉じました');
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
    
    /**
     * ログを追加
     * @param {string} level - ログレベル ('info', 'success', 'warning', 'error')
     * @param {string} message - ログメッセージ
     */
    addLog(level, message) {
        const timestamp = new Date().toLocaleTimeString('ja-JP');
        const logEntry = {
            timestamp,
            level,
            message
        };
        
        this.logs.push(logEntry);
        
        // コンソールにも出力
        const consoleMethod = level === 'error' ? 'error' : level === 'warning' ? 'warn' : 'log';
        console[consoleMethod](`[${timestamp}] ${message}`);
        
        // DOM更新
        this.renderLogs();
    }
    
    /**
     * ログをレンダリング
     */
    renderLogs() {
        if (!this.elements.logContainer) return;
        
        // プレースホルダーを削除
        const placeholder = this.elements.logContainer.querySelector('.log-placeholder');
        if (placeholder && this.logs.length > 0) {
            placeholder.remove();
        }
        
        // ログエントリーを生成
        const logHtml = this.logs.map(log => `
            <div class="log-entry ${log.level}">
                <span class="log-timestamp">[${log.timestamp}]</span>
                <span class="log-message">${log.message}</span>
            </div>
        `).join('');
        
        this.elements.logContainer.innerHTML = logHtml;
        
        // 最新のログまでスクロール
        this.elements.logContainer.scrollTop = this.elements.logContainer.scrollHeight;
    }
    
    /**
     * ログをクリア
     */
    clearLogs() {
        this.logs = [];
        this.elements.logContainer.innerHTML = '<p class="log-placeholder">ここに実行ログが表示されます</p>';
        this.addLog('info', 'ログをクリアしました');
    }
}

// アプリケーション初期化
document.addEventListener('DOMContentLoaded', () => {
    new QRDakokuApp();
});
