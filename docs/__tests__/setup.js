/**
 * Jestテストのセットアップファイル
 * 機能: テスト実行前の共通設定
 * 作成理由: localStorageのモック化とグローバル変数の設定を行うため
 */

// localStorageのモック
const localStorageMock = {
  store: {},
  getItem(key) {
    return this.store[key] || null;
  },
  setItem(key, value) {
    this.store[key] = value.toString();
  },
  removeItem(key) {
    delete this.store[key];
  },
  clear() {
    this.store = {};
  }
};

global.localStorage = localStorageMock;

// sha256のモック（js-sha256ライブラリの代替）
global.sha256 = (data) => {
  // テスト用の簡易的なハッシュ関数
  // 実際のSHA-256ではないが、テスト目的には十分
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    const char = data.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  // よりユニークなハッシュを生成するため、文字列全体の特性を含める
  let sum = 0;
  for (let i = 0; i < data.length; i++) {
    sum += data.charCodeAt(i) * (i + 1);
  }
  const part1 = (Math.abs(hash) * data.length + sum).toString(16).padEnd(32, '0');
  const part2 = (sum * 7 + data.length).toString(16).padEnd(32, '0');
  // 64文字のハッシュを生成（先頭32文字と後半32文字）
  return (part1 + part2).substring(0, 64);
};

// QRCodeライブラリのモック
global.QRCode = {
  toCanvas: jest.fn((url, options) => {
    const canvas = document.createElement('canvas');
    // Promiseでcanvasを返す
    return Promise.resolve(canvas);
  })
};

// コンソールエラーのモック（不要なエラーログを抑制）
global.console = {
  ...console,
  error: jest.fn(),
  warn: jest.fn(),
};
