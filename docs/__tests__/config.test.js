/**
 * config.jsのテスト
 * 機能: 設定管理モジュールのテスト
 * 作成理由: 設定の保存・読み込み・検証機能が正しく動作することを確認するため
 */

// config.jsを読み込む
const fs = require('fs');
const path = require('path');
let configCode = fs.readFileSync(path.join(__dirname, '../js/config.js'), 'utf8');
// オブジェクトをグローバルスコープに追加
configCode += '\nif (typeof module !== "undefined" && module.exports) { global.Config = Config; }';
eval(configCode);

describe('Config', () => {
  beforeEach(() => {
    // 各テスト前にlocalStorageをクリア
    localStorage.clear();
  });

  describe('save', () => {
    test('設定を正しく保存できる', () => {
      const config = {
        deviceId: 'device001',
        passkey: 'testpasskey123',
        targetUrl: 'https://example.com/receive'
      };

      const result = Config.save(config);

      expect(result).toBe(true);
      const saved = JSON.parse(localStorage.getItem('qr-dakoku-config'));
      expect(saved).toEqual(config);
    });

    test('空の値を含む設定も保存できる', () => {
      const config = {
        deviceId: '',
        passkey: 'passkey',
        targetUrl: ''
      };

      const result = Config.save(config);

      expect(result).toBe(true);
      const saved = JSON.parse(localStorage.getItem('qr-dakoku-config'));
      expect(saved).toEqual({
        deviceId: '',
        passkey: 'passkey',
        targetUrl: ''
      });
    });

    test('不完全な設定オブジェクトでも保存できる', () => {
      const config = {
        deviceId: 'device001'
      };

      const result = Config.save(config);

      expect(result).toBe(true);
      const saved = JSON.parse(localStorage.getItem('qr-dakoku-config'));
      expect(saved).toEqual({
        deviceId: 'device001',
        passkey: '',
        targetUrl: ''
      });
    });
  });

  describe('load', () => {
    test('保存された設定を正しく読み込める', () => {
      const config = {
        deviceId: 'device001',
        passkey: 'testpasskey123',
        targetUrl: 'https://example.com/receive'
      };
      localStorage.setItem('qr-dakoku-config', JSON.stringify(config));

      const loaded = Config.load();

      expect(loaded).toEqual(config);
    });

    test('設定が保存されていない場合はデフォルト値を返す', () => {
      const loaded = Config.load();

      expect(loaded).toEqual({
        deviceId: '',
        passkey: '',
        targetUrl: ''
      });
    });

    test('不正なJSONが保存されている場合はデフォルト値を返す', () => {
      localStorage.setItem('qr-dakoku-config', 'invalid json');

      const loaded = Config.load();

      expect(loaded).toEqual({
        deviceId: '',
        passkey: '',
        targetUrl: ''
      });
    });
  });

  describe('isConfigured', () => {
    test('すべての設定が入力されている場合はtrueを返す', () => {
      const config = {
        deviceId: 'device001',
        passkey: 'testpasskey123',
        targetUrl: 'https://example.com/receive'
      };
      Config.save(config);

      const result = Config.isConfigured();

      expect(result).toBe(true);
    });

    test('deviceIdが空の場合はfalseを返す', () => {
      const config = {
        deviceId: '',
        passkey: 'testpasskey123',
        targetUrl: 'https://example.com/receive'
      };
      Config.save(config);

      const result = Config.isConfigured();

      expect(result).toBe(false);
    });

    test('passkeyが空の場合はfalseを返す', () => {
      const config = {
        deviceId: 'device001',
        passkey: '',
        targetUrl: 'https://example.com/receive'
      };
      Config.save(config);

      const result = Config.isConfigured();

      expect(result).toBe(false);
    });

    test('targetUrlが空の場合はfalseを返す', () => {
      const config = {
        deviceId: 'device001',
        passkey: 'testpasskey123',
        targetUrl: ''
      };
      Config.save(config);

      const result = Config.isConfigured();

      expect(result).toBe(false);
    });

    test('設定が保存されていない場合はfalseを返す', () => {
      const result = Config.isConfigured();

      expect(result).toBe(false);
    });
  });

  describe('reset', () => {
    test('設定を正しくリセットできる', () => {
      const config = {
        deviceId: 'device001',
        passkey: 'testpasskey123',
        targetUrl: 'https://example.com/receive'
      };
      Config.save(config);

      const result = Config.reset();

      expect(result).toBe(true);
      expect(localStorage.getItem('qr-dakoku-config')).toBeNull();
    });

    test('設定が保存されていない状態でもリセットできる', () => {
      const result = Config.reset();

      expect(result).toBe(true);
      expect(localStorage.getItem('qr-dakoku-config')).toBeNull();
    });
  });
});
