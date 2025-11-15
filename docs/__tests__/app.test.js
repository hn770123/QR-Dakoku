/**
 * app.jsのテスト
 * 機能: メインアプリケーションのテスト
 * 作成理由: QRコード生成、エラーハンドリング、UI操作が正しく動作することを確認するため
 */

// 依存モジュールを読み込む
const fs = require('fs');
const path = require('path');

// config.jsを読み込む
let configCode = fs.readFileSync(path.join(__dirname, '../js/config.js'), 'utf8');
configCode += '\nif (typeof module !== "undefined" && module.exports) { global.Config = Config; }';
eval(configCode);

// token.jsを読み込む
let tokenCode = fs.readFileSync(path.join(__dirname, '../js/token.js'), 'utf8');
tokenCode += '\nif (typeof module !== "undefined" && module.exports) { global.TokenGenerator = TokenGenerator; }';
eval(tokenCode);

// app.jsを読み込む（DOMContentLoadedイベントリスナー部分を除く）
let appCode = fs.readFileSync(path.join(__dirname, '../js/app.js'), 'utf8');
// DOMContentLoadedイベントリスナーを削除
appCode = appCode.replace(/document\.addEventListener\('DOMContentLoaded'[\s\S]*?\}\);/g, '');
// クラスをグローバルスコープに追加
appCode += '\nif (typeof module !== "undefined" && module.exports) { global.QRDakokuApp = QRDakokuApp; }';
eval(appCode);

describe('QRDakokuApp', () => {
  let app;
  let mockHtml;

  beforeEach(() => {
    // localStorageをクリア
    localStorage.clear();

    // HTMLのモックを作成
    document.body.innerHTML = `
      <div id="buttonArea" class="button-area">
        <button id="checkInBtn">出勤</button>
        <button id="checkOutBtn">退勤</button>
      </div>
      <div id="qrArea" class="qr-area hidden">
        <div id="qrInfo" class="qr-info">
          <span id="actionType"></span>
          <span id="actionTime"></span>
        </div>
        <div id="qrCodeContainer"></div>
        <div class="timer-container">
          <span id="timer">5:00</span>
          <progress id="timerProgress" max="300" value="300"></progress>
        </div>
        <button id="closeQrBtn">閉じる</button>
      </div>
      <div id="errorArea" class="error-area hidden">
        <p id="errorMessage"></p>
      </div>
      <div id="logArea" class="log-area">
        <h3 class="log-title">実行ログ</h3>
        <div id="logContainer" class="log-container">
          <p class="log-placeholder">ここに実行ログが表示されます</p>
        </div>
        <button id="clearLogBtn" class="clear-log-btn">ログをクリア</button>
      </div>
    `;

    // QRCodeのモックをリセット
    global.QRCode.toCanvas.mockClear();
    global.QRCode.toCanvas.mockImplementation(() => {
      return Promise.resolve(document.createElement('canvas'));
    });

    // アプリケーションインスタンスを作成
    app = new QRDakokuApp();
  });

  afterEach(() => {
    // タイマーをクリア
    if (app && app.timerInterval) {
      clearInterval(app.timerInterval);
    }
  });

  describe('初期化', () => {
    test('DOM要素が正しく取得される', () => {
      expect(app.elements.buttonArea).toBeTruthy();
      expect(app.elements.qrArea).toBeTruthy();
      expect(app.elements.errorArea).toBeTruthy();
      expect(app.elements.checkInBtn).toBeTruthy();
      expect(app.elements.checkOutBtn).toBeTruthy();
    });

    test('設定が未完了の場合、エラーメッセージが表示される', () => {
      const errorArea = document.getElementById('errorArea');
      const errorMessage = document.getElementById('errorMessage');

      expect(errorArea.classList.contains('hidden')).toBe(false);
      expect(errorMessage.textContent).toContain('設定が完了していません');
    });

    test('設定が完了している場合、エラーメッセージは表示されない', () => {
      // localStorageをクリア（beforeEachの後に実行）
      localStorage.clear();
      
      // 設定を保存
      Config.save({
        deviceId: 'device001',
        passkey: 'testpasskey123',
        targetUrl: 'https://example.com/receive'
      });

      // HTMLを再作成
      document.body.innerHTML = `
        <div id="buttonArea" class="button-area">
          <button id="checkInBtn">出勤</button>
          <button id="checkOutBtn">退勤</button>
        </div>
        <div id="qrArea" class="qr-area hidden">
          <div id="qrInfo" class="qr-info">
            <span id="actionType"></span>
            <span id="actionTime"></span>
          </div>
          <div id="qrCodeContainer"></div>
          <div class="timer-container">
            <span id="timer">5:00</span>
            <progress id="timerProgress" max="300" value="300"></progress>
          </div>
          <button id="closeQrBtn">閉じる</button>
        </div>
        <div id="errorArea" class="error-area hidden">
          <p id="errorMessage"></p>
        </div>
        <div id="logArea" class="log-area">
          <h3 class="log-title">実行ログ</h3>
          <div id="logContainer" class="log-container">
            <p class="log-placeholder">ここに実行ログが表示されます</p>
          </div>
          <button id="clearLogBtn" class="clear-log-btn">ログをクリア</button>
        </div>
      `;

      // 新しいアプリインスタンスを作成
      const newApp = new QRDakokuApp();
      const errorArea = document.getElementById('errorArea');

      expect(errorArea.classList.contains('hidden')).toBe(true);
    });
  });

  describe('handleAction - QRコード生成', () => {
    beforeEach(() => {
      // 設定を保存
      Config.save({
        deviceId: 'device001',
        passkey: 'testpasskey123',
        targetUrl: 'https://example.com/receive'
      });
    });

    test('check-inボタンクリック時にQRコードが生成される', async () => {
      await app.handleAction('check-in');

      expect(global.QRCode.toCanvas).toHaveBeenCalledTimes(1);
      expect(global.QRCode.toCanvas).toHaveBeenCalledWith(
        expect.stringContaining('https://example.com/receive'),
        expect.objectContaining({
          width: 280,
          margin: 2
        })
      );
    });

    test('check-outボタンクリック時にQRコードが生成される', async () => {
      await app.handleAction('check-out');

      expect(global.QRCode.toCanvas).toHaveBeenCalledTimes(1);
      expect(global.QRCode.toCanvas).toHaveBeenCalledWith(
        expect.stringContaining('https://example.com/receive'),
        expect.objectContaining({
          width: 280,
          margin: 2
        })
      );
    });

    test('生成されるURLにトークン情報が含まれる', async () => {
      await app.handleAction('check-in');

      const callArgs = global.QRCode.toCanvas.mock.calls[0][0];
      expect(callArgs).toContain('token=');
      expect(callArgs).toContain('deviceId=device001');
      expect(callArgs).toContain('action=check-in');
      expect(callArgs).toContain('timestamp=');
    });

    test('check-inとcheck-outで異なるアクションが設定される', async () => {
      await app.handleAction('check-in');
      const checkInUrl = global.QRCode.toCanvas.mock.calls[0][0];

      global.QRCode.toCanvas.mockClear();

      await app.handleAction('check-out');
      const checkOutUrl = global.QRCode.toCanvas.mock.calls[0][0];

      expect(checkInUrl).toContain('action=check-in');
      expect(checkOutUrl).toContain('action=check-out');
    });

    test('設定が不完全な場合はエラーが表示される', async () => {
      Config.save({
        deviceId: 'device001',
        passkey: '',
        targetUrl: 'https://example.com/receive'
      });

      await app.handleAction('check-in');

      const errorArea = document.getElementById('errorArea');
      const errorMessage = document.getElementById('errorMessage');

      expect(errorArea.classList.contains('hidden')).toBe(false);
      expect(errorMessage.textContent).toContain('設定が不完全です');
      expect(global.QRCode.toCanvas).not.toHaveBeenCalled();
    });
  });

  describe('showQrCode - UI表示', () => {
    beforeEach(() => {
      Config.save({
        deviceId: 'device001',
        passkey: 'testpasskey123',
        targetUrl: 'https://example.com/receive'
      });
    });

    test('QRコード表示時にボタンエリアが非表示になる', async () => {
      await app.handleAction('check-in');
      // QRCode.toCanvasの.then()が完了するのを待つ
      await new Promise(resolve => setTimeout(resolve, 10));

      const buttonArea = document.getElementById('buttonArea');
      const qrArea = document.getElementById('qrArea');

      expect(buttonArea.classList.contains('hidden')).toBe(true);
      expect(qrArea.classList.contains('hidden')).toBe(false);
    });

    test('check-in時に適切なアクション情報が表示される', async () => {
      await app.handleAction('check-in');

      const actionType = document.getElementById('actionType');
      const actionTime = document.getElementById('actionTime');

      expect(actionType.textContent).toBe('出勤');
      expect(actionTime.textContent).toMatch(/\d{1,2}:\d{2}:\d{2}/);
    });

    test('check-out時に適切なアクション情報が表示される', async () => {
      await app.handleAction('check-out');

      const actionType = document.getElementById('actionType');

      expect(actionType.textContent).toBe('退勤');
    });

    test('QRコードのcanvas要素がコンテナに追加される', async () => {
      await app.handleAction('check-in');

      const qrCodeContainer = document.getElementById('qrCodeContainer');
      const canvas = qrCodeContainer.querySelector('canvas');

      expect(canvas).toBeTruthy();
      expect(canvas.tagName).toBe('CANVAS');
    });

    test('エラー表示がクリアされる', async () => {
      // 事前にエラーを表示
      app.showError('テストエラー');

      await app.handleAction('check-in');

      const errorArea = document.getElementById('errorArea');

      expect(errorArea.classList.contains('hidden')).toBe(true);
    });
  });

  describe('エラーハンドリング', () => {
    test('QRコード生成失敗時に「QRコードの描画に失敗しました。」エラーが表示される', async () => {
      Config.save({
        deviceId: 'device001',
        passkey: 'testpasskey123',
        targetUrl: 'https://example.com/receive'
      });

      // QRCode.toCanvasがエラーを投げるようにモック
      global.QRCode.toCanvas.mockRejectedValue(new Error('QR generation failed'));

      await app.handleAction('check-in');
      // エラーハンドリングが完了するのを待つ
      await new Promise(resolve => setTimeout(resolve, 10));

      const errorArea = document.getElementById('errorArea');
      const errorMessage = document.getElementById('errorMessage');

      expect(errorArea.classList.contains('hidden')).toBe(false);
      expect(errorMessage.textContent).toBe('QRコードの描画に失敗しました。');
    });

    test('QRコード生成失敗時にQRエリアが表示されない', async () => {
      Config.save({
        deviceId: 'device001',
        passkey: 'testpasskey123',
        targetUrl: 'https://example.com/receive'
      });

      global.QRCode.toCanvas.mockRejectedValue(new Error('QR generation failed'));

      await app.handleAction('check-in');

      const qrArea = document.getElementById('qrArea');

      expect(qrArea.classList.contains('hidden')).toBe(true);
    });

    test('トークン生成失敗時にエラーが表示される', async () => {
      Config.save({
        deviceId: 'device001',
        passkey: 'testpasskey123',
        targetUrl: 'https://example.com/receive'
      });

      // sha256をエラーを投げる関数に置き換え
      const originalSha256 = global.sha256;
      global.sha256 = () => {
        throw new Error('Hash generation failed');
      };

      await app.handleAction('check-in');

      const errorArea = document.getElementById('errorArea');
      const errorMessage = document.getElementById('errorMessage');

      expect(errorArea.classList.contains('hidden')).toBe(false);
      expect(errorMessage.textContent).toContain('QRコードの生成に失敗しました');

      // 元に戻す
      global.sha256 = originalSha256;
    });
  });

  describe('closeQrCode', () => {
    beforeEach(() => {
      Config.save({
        deviceId: 'device001',
        passkey: 'testpasskey123',
        targetUrl: 'https://example.com/receive'
      });
    });

    test('QRコードを閉じるとボタンエリアが再表示される', async () => {
      await app.handleAction('check-in');
      app.closeQrCode();

      const buttonArea = document.getElementById('buttonArea');
      const qrArea = document.getElementById('qrArea');

      expect(buttonArea.classList.contains('hidden')).toBe(false);
      expect(qrArea.classList.contains('hidden')).toBe(true);
    });

    test('閉じるボタンをクリックするとQRコードが閉じる', async () => {
      await app.handleAction('check-in');

      const closeBtn = document.getElementById('closeQrBtn');
      closeBtn.click();

      const buttonArea = document.getElementById('buttonArea');
      const qrArea = document.getElementById('qrArea');

      expect(buttonArea.classList.contains('hidden')).toBe(false);
      expect(qrArea.classList.contains('hidden')).toBe(true);
    });

    test('QRコードコンテナをクリックするとQRコードが閉じる', async () => {
      await app.handleAction('check-in');

      const qrCodeContainer = document.getElementById('qrCodeContainer');
      qrCodeContainer.click();

      const buttonArea = document.getElementById('buttonArea');
      const qrArea = document.getElementById('qrArea');

      expect(buttonArea.classList.contains('hidden')).toBe(false);
      expect(qrArea.classList.contains('hidden')).toBe(true);
    });

    test('タイマーが停止される', async () => {
      await app.handleAction('check-in');
      // QRコード表示とタイマー開始が完了するのを待つ
      await new Promise(resolve => setTimeout(resolve, 10));

      expect(app.timerInterval).not.toBeNull();

      app.closeQrCode();

      expect(app.timerInterval).toBeNull();
    });
  });

  describe('showError / hideError', () => {
    test('showErrorでエラーメッセージが表示される', () => {
      const testMessage = 'テストエラーメッセージ';

      app.showError(testMessage);

      const errorArea = document.getElementById('errorArea');
      const errorMessage = document.getElementById('errorMessage');

      expect(errorArea.classList.contains('hidden')).toBe(false);
      expect(errorMessage.textContent).toBe(testMessage);
    });

    test('hideErrorでエラーメッセージが非表示になる', () => {
      app.showError('エラー');

      app.hideError();

      const errorArea = document.getElementById('errorArea');

      expect(errorArea.classList.contains('hidden')).toBe(true);
    });
  });

  describe('errorAreaの表示切り替え', () => {
    test('エラー表示エリアが初期状態で存在する', () => {
      const errorArea = document.getElementById('errorArea');

      expect(errorArea).toBeTruthy();
    });

    test('エラーが発生するとerrorAreaが表示される', async () => {
      Config.save({
        deviceId: '',
        passkey: 'testpasskey123',
        targetUrl: 'https://example.com/receive'
      });

      await app.handleAction('check-in');

      const errorArea = document.getElementById('errorArea');

      expect(errorArea.classList.contains('hidden')).toBe(false);
    });

    test('QRコード表示成功時はerrorAreaが非表示になる', async () => {
      Config.save({
        deviceId: 'device001',
        passkey: 'testpasskey123',
        targetUrl: 'https://example.com/receive'
      });

      // 事前にエラーを表示
      app.showError('テストエラー');

      await app.handleAction('check-in');

      const errorArea = document.getElementById('errorArea');

      expect(errorArea.classList.contains('hidden')).toBe(true);
    });
  });

  describe('ログ機能', () => {
    test('ログエリアが初期状態で存在する', () => {
      const logArea = document.getElementById('logArea');
      const logContainer = document.getElementById('logContainer');
      const clearLogBtn = document.getElementById('clearLogBtn');

      expect(logArea).toBeTruthy();
      expect(logContainer).toBeTruthy();
      expect(clearLogBtn).toBeTruthy();
    });

    test('addLogでログが追加される', () => {
      app.addLog('info', 'テストログメッセージ');

      expect(app.logs.length).toBeGreaterThan(0);
      const lastLog = app.logs[app.logs.length - 1];
      expect(lastLog.level).toBe('info');
      expect(lastLog.message).toBe('テストログメッセージ');
    });

    test('ログがDOMに表示される', () => {
      app.addLog('success', 'テスト成功ログ');

      const logContainer = document.getElementById('logContainer');
      const logEntries = logContainer.querySelectorAll('.log-entry');

      expect(logEntries.length).toBeGreaterThan(0);
    });

    test('異なるログレベルが正しく表示される', () => {
      app.clearLogs();
      
      app.addLog('info', 'インフォログ');
      app.addLog('success', '成功ログ');
      app.addLog('warning', '警告ログ');
      app.addLog('error', 'エラーログ');

      const logContainer = document.getElementById('logContainer');
      const infoLog = logContainer.querySelector('.log-entry.info');
      const successLog = logContainer.querySelector('.log-entry.success');
      const warningLog = logContainer.querySelector('.log-entry.warning');
      const errorLog = logContainer.querySelector('.log-entry.error');

      expect(infoLog).toBeTruthy();
      expect(successLog).toBeTruthy();
      expect(warningLog).toBeTruthy();
      expect(errorLog).toBeTruthy();
    });

    test('clearLogsでログがクリアされる', () => {
      app.addLog('info', 'クリア前のログ');
      
      const initialLogCount = app.logs.length;
      expect(initialLogCount).toBeGreaterThan(0);

      app.clearLogs();

      // clearLogsは新しいログ「ログをクリアしました」を追加するので、1つのログがある
      expect(app.logs.length).toBe(1);
      expect(app.logs[0].message).toBe('ログをクリアしました');
    });

    test('出勤ボタンクリック時にログが出力される', async () => {
      Config.save({
        deviceId: 'device001',
        passkey: 'testpasskey123',
        targetUrl: 'https://example.com/receive'
      });

      const initialLogCount = app.logs.length;

      await app.handleAction('check-in');

      // ログが追加されているか確認
      expect(app.logs.length).toBeGreaterThan(initialLogCount);
      
      // 出勤ボタンがクリックされたログが存在するか確認
      const hasCheckInLog = app.logs.some(log => 
        log.message.includes('出勤ボタンがクリックされました')
      );
      expect(hasCheckInLog).toBe(true);
    });

    test('退勤ボタンクリック時にログが出力される', async () => {
      Config.save({
        deviceId: 'device001',
        passkey: 'testpasskey123',
        targetUrl: 'https://example.com/receive'
      });

      app.clearLogs();

      await app.handleAction('check-out');

      // 退勤ボタンがクリックされたログが存在するか確認
      const hasCheckOutLog = app.logs.some(log => 
        log.message.includes('退勤ボタンがクリックされました')
      );
      expect(hasCheckOutLog).toBe(true);
    });

    test('QRコード生成エラー時に詳細ログが出力される', async () => {
      Config.save({
        deviceId: 'device001',
        passkey: 'testpasskey123',
        targetUrl: 'https://example.com/receive'
      });

      global.QRCode.toCanvas.mockRejectedValue(new Error('QR generation failed'));

      app.clearLogs();

      await app.handleAction('check-in');
      await new Promise(resolve => setTimeout(resolve, 10));

      // エラーログが存在するか確認
      const hasErrorLog = app.logs.some(log => 
        log.level === 'error' && log.message.includes('QRコード描画エラー')
      );
      expect(hasErrorLog).toBe(true);
    });

    test('設定が不完全な場合にログが出力される', async () => {
      Config.save({
        deviceId: '',
        passkey: 'testpasskey123',
        targetUrl: 'https://example.com/receive'
      });

      app.clearLogs();

      await app.handleAction('check-in');

      // エラーログが存在するか確認
      const hasErrorLog = app.logs.some(log => 
        log.level === 'error' && log.message.includes('設定が不完全です')
      );
      expect(hasErrorLog).toBe(true);
    });

    test('clearLogBtnをクリックするとログがクリアされる', () => {
      app.addLog('info', 'クリアテスト');

      const clearLogBtn = document.getElementById('clearLogBtn');
      clearLogBtn.click();

      // clearLogsが呼ばれて「ログをクリアしました」ログが追加される
      expect(app.logs.length).toBe(1);
      expect(app.logs[0].message).toBe('ログをクリアしました');
    });
  });
});
