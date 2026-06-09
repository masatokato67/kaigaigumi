# PC向け横スクロール矢印ボタン追加

## 概要
ホーム画面の試合結果ウィジェット（「最新の試合結果」「注目の試合結果」）に、PC表示時に左右矢印ボタンを表示し、クリックで横スクロールできるようにする。

## 実装方針

### 1. `ScrollableRow` クライアントコンポーネントを新規作成
- `src/components/top/ScrollableRow.tsx` に作成
- `"use client"` コンポーネント
- children を受け取り、横スクロールコンテナ + 左右矢印ボタンを提供

### 2. 矢印ボタンの仕様
- **PC（md以上）でのみ表示** — `hidden md:flex` で制御
- コンテナの左右端に半透明の矢印ボタンを配置
- クリックでカード1枚分（約260px）スムーズスクロール
- スクロール位置に応じて左端では左矢印を非表示、右端では右矢印を非表示

### 3. `page.tsx` の変更
- 2つの試合結果セクションの `<div className="flex gap-4 overflow-x-auto scrollbar-hide pb-4">` を `<ScrollableRow>` に置き換え
- page.tsx 自体はサーバーコンポーネントのまま維持

### 対象ファイル
- **新規**: `src/components/top/ScrollableRow.tsx`
- **変更**: `src/app/page.tsx`
