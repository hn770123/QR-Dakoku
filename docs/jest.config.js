/**
 * Jest設定ファイル
 * 機能: テスト環境の設定
 * 作成理由: フロントエンドJavaScriptのテストを実行するため
 */

module.exports = {
  // テスト環境としてjsdomを使用（ブラウザ環境のシミュレーション）
  testEnvironment: 'jsdom',
  
  // テストファイルのパターン
  testMatch: [
    '**/__tests__/**/*.test.js',
    '**/?(*.)+(spec|test).js'
  ],
  
  // カバレッジ対象のファイル
  collectCoverageFrom: [
    'js/**/*.js',
    '!js/sw-register.js', // Service Worker登録は除外
    '!js/settings.js'     // 設定ページは別途テスト可能
  ],
  
  // モジュールのパス設定
  moduleDirectories: ['node_modules'],
  
  // セットアップファイル
  setupFilesAfterEnv: ['<rootDir>/__tests__/setup.js'],
  
  // グローバル変数の設定
  globals: {
    'localStorage': {}
  }
};
