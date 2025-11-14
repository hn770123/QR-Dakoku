/**
 * token.jsのテスト
 * 機能: トークン生成モジュールのテスト
 * 作成理由: トークン生成、URL生成、有効期限チェック機能が正しく動作することを確認するため
 */

// token.jsを読み込む
const fs = require('fs');
const path = require('path');
let tokenCode = fs.readFileSync(path.join(__dirname, '../js/token.js'), 'utf8');
// オブジェクトをグローバルスコープに追加
tokenCode += '\nif (typeof module !== "undefined" && module.exports) { global.TokenGenerator = TokenGenerator; }';
eval(tokenCode);

describe('TokenGenerator', () => {
  describe('generate', () => {
    test('正しい構造のトークン情報を生成する', () => {
      const deviceId = 'device001';
      const passkey = 'testpasskey123';
      const actionType = 'check-in';

      const result = TokenGenerator.generate(deviceId, passkey, actionType);

      expect(result).toHaveProperty('token');
      expect(result).toHaveProperty('deviceId');
      expect(result).toHaveProperty('actionType');
      expect(result).toHaveProperty('timestamp');
      expect(result.deviceId).toBe(deviceId);
      expect(result.actionType).toBe(actionType);
      expect(typeof result.token).toBe('string');
      expect(result.token.length).toBe(32);
      expect(typeof result.timestamp).toBe('number');
    });

    test('check-inアクションのトークンを生成できる', () => {
      const result = TokenGenerator.generate('device001', 'passkey', 'check-in');

      expect(result.actionType).toBe('check-in');
      expect(result.token).toBeTruthy();
    });

    test('check-outアクションのトークンを生成できる', () => {
      const result = TokenGenerator.generate('device001', 'passkey', 'check-out');

      expect(result.actionType).toBe('check-out');
      expect(result.token).toBeTruthy();
    });

    test('異なる入力に対して異なるトークンを生成する', () => {
      const token1 = TokenGenerator.generate('device001', 'passkey', 'check-in');
      const token2 = TokenGenerator.generate('device002', 'passkey', 'check-in');

      expect(token1.token).not.toBe(token2.token);
    });

    test('同じ入力でもタイムスタンプが異なれば異なるトークンを生成する', () => {
      const token1 = TokenGenerator.generate('device001', 'passkey', 'check-in');
      // 少し待機してタイムスタンプを変える
      jest.advanceTimersByTime(1);
      const token2 = TokenGenerator.generate('device001', 'passkey', 'check-in');

      expect(token1.timestamp).not.toBe(token2.timestamp);
    });
  });

  describe('encodeToQueryParams', () => {
    test('トークン情報を正しいクエリパラメータ文字列に変換する', () => {
      const tokenInfo = {
        token: 'abc123def456',
        deviceId: 'device001',
        actionType: 'check-in',
        timestamp: 1234567890000
      };

      const result = TokenGenerator.encodeToQueryParams(tokenInfo);

      expect(result).toContain('token=abc123def456');
      expect(result).toContain('deviceId=device001');
      expect(result).toContain('action=check-in');
      expect(result).toContain('timestamp=1234567890000');
    });

    test('URLセーフな文字列を生成する', () => {
      const tokenInfo = {
        token: 'test+token/with=special',
        deviceId: 'device001',
        actionType: 'check-in',
        timestamp: 1234567890000
      };

      const result = TokenGenerator.encodeToQueryParams(tokenInfo);

      // URLエンコードされているかを確認
      expect(result).not.toContain('+');
      expect(result).not.toContain('/');
      expect(result).toMatch(/^[\w\-\.~%&=]+$/);
    });
  });

  describe('generateUrl', () => {
    test('クエリパラメータなしのベースURLに正しくトークン情報を付加する', () => {
      const baseUrl = 'https://example.com/receive';
      const tokenInfo = {
        token: 'abc123',
        deviceId: 'device001',
        actionType: 'check-in',
        timestamp: 1234567890000
      };

      const result = TokenGenerator.generateUrl(baseUrl, tokenInfo);

      expect(result).toContain('https://example.com/receive?');
      expect(result).toContain('token=abc123');
      expect(result).toContain('deviceId=device001');
      expect(result).toContain('action=check-in');
      expect(result).toContain('timestamp=1234567890000');
    });

    test('既存のクエリパラメータがあるURLに正しく追加する', () => {
      const baseUrl = 'https://example.com/receive?existing=param';
      const tokenInfo = {
        token: 'abc123',
        deviceId: 'device001',
        actionType: 'check-in',
        timestamp: 1234567890000
      };

      const result = TokenGenerator.generateUrl(baseUrl, tokenInfo);

      expect(result).toContain('https://example.com/receive?existing=param&');
      expect(result).toContain('token=abc123');
    });
  });

  describe('isValid', () => {
    test('有効期限内のトークンに対してtrueを返す', () => {
      const timestamp = Date.now();

      const result = TokenGenerator.isValid(timestamp, 5);

      expect(result).toBe(true);
    });

    test('有効期限切れのトークンに対してfalseを返す', () => {
      // 6分前のタイムスタンプ（有効期限5分）
      const timestamp = Date.now() - (6 * 60 * 1000);

      const result = TokenGenerator.isValid(timestamp, 5);

      expect(result).toBe(false);
    });

    test('有効期限ちょうどのトークンに対してfalseを返す', () => {
      // 5分前のタイムスタンプ（有効期限5分）
      const timestamp = Date.now() - (5 * 60 * 1000);

      const result = TokenGenerator.isValid(timestamp, 5);

      expect(result).toBe(false);
    });

    test('カスタム有効期限で動作する', () => {
      // 8分前のタイムスタンプ
      const timestamp = Date.now() - (8 * 60 * 1000);

      // 10分の有効期限
      const result1 = TokenGenerator.isValid(timestamp, 10);
      expect(result1).toBe(true);

      // 7分の有効期限
      const result2 = TokenGenerator.isValid(timestamp, 7);
      expect(result2).toBe(false);
    });
  });

  describe('getRemainingSeconds', () => {
    test('残り時間を正しく計算する', () => {
      // 2分前のタイムスタンプ
      const timestamp = Date.now() - (2 * 60 * 1000);

      const result = TokenGenerator.getRemainingSeconds(timestamp, 5);

      // 3分（180秒）前後の残り時間があるはず
      expect(result).toBeGreaterThanOrEqual(179);
      expect(result).toBeLessThanOrEqual(181);
    });

    test('有効期限切れの場合は0を返す', () => {
      // 6分前のタイムスタンプ（有効期限5分）
      const timestamp = Date.now() - (6 * 60 * 1000);

      const result = TokenGenerator.getRemainingSeconds(timestamp, 5);

      expect(result).toBe(0);
    });

    test('まだ使用していないトークンの場合は最大時間を返す', () => {
      const timestamp = Date.now();

      const result = TokenGenerator.getRemainingSeconds(timestamp, 5);

      // 5分（300秒）前後の残り時間があるはず
      expect(result).toBeGreaterThanOrEqual(299);
      expect(result).toBeLessThanOrEqual(300);
    });

    test('カスタム有効期限で動作する', () => {
      const timestamp = Date.now();

      const result = TokenGenerator.getRemainingSeconds(timestamp, 10);

      // 10分（600秒）前後の残り時間があるはず
      expect(result).toBeGreaterThanOrEqual(599);
      expect(result).toBeLessThanOrEqual(600);
    });
  });
});
