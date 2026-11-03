# 馬鈴吉碳烤｜純 HTML 菜單網站

這個版本只使用 HTML、CSS、JavaScript，適合直接用 VS Code 編輯，並部署到 GitHub Pages。不需要 Node.js、React、Next.js 或 Vercel。

## 專案檔案
- `index.html`：網頁結構
- `style.css`：版面與樣式
- `app.js`：菜單排序、編輯、Supabase 串接
- `config.js`：Supabase 連線設定
- `assets/logo.jpg`：你提供的固定 LOGO
- `supabase/schema.sql`：資料庫建表與權限政策

## A. 設定 Supabase（保留雲端資料庫）
1. 到 https://supabase.com 建立 Project。
2. 打開 SQL Editor，執行 `supabase/schema.sql`。
3. 到 Authentication > Users，手動新增管理員帳號。
4. 關閉公開註冊（Disable signups）。
5. 到 Project Settings > API，複製 Project URL 與 anon/public key。
6. 編輯 `config.js`，填入：

```js
window.SUPABASE_CONFIG = {
  url: "https://你的專案.supabase.co",
  anonKey: "你的anon-public-key"
};
```

**只能使用 anon/public key，絕對不要使用 service_role key。** anon key 放在前端是預期用法，資料安全由 RLS policies 控制。

## B. 在本機預覽
最簡單方式：VS Code 安裝 Live Server 擴充功能，右鍵 `index.html` > Open with Live Server。
也可以直接用瀏覽器開啟 `index.html`；若瀏覽器限制本機資源，請使用 Live Server。

## C. 設定地址
店名、LOGO、地址依需求固定不在網頁管理介面修改。第一次請到 Supabase > Table Editor > `store_settings`，編輯 id=1 那一列的 `address` 欄位，輸入店面地址。

## D. 上傳到 GitHub
1. 到 https://github.com/new 建立新 Repository。
2. Repository 設為 Public（GitHub Free 的 Pages 公開網站通常需要 Public repository）。
3. 不要勾選 Add a README（本專案已有 README）。
4. 在 VS Code 開啟專案資料夾，Terminal > New Terminal，輸入：

```bash
git init
git add .
git commit -m "Create Malingshi menu website"
git branch -M main
git remote add origin https://github.com/你的GitHub帳號/你的Repository名稱.git
git push -u origin main
```

如果 GitHub 要求登入，依照 VS Code / 瀏覽器提示完成授權。

## E. 開啟 GitHub Pages
1. 進入 GitHub Repository。
2. Settings > Pages。
3. Build and deployment 選 `Deploy from a branch`。
4. Branch 選 `main`，資料夾選 `/ (root)`，按 Save。
5. 等待部署完成，Pages 頁面會顯示網站網址，通常是：
   `https://你的GitHub帳號.github.io/你的Repository名稱/`

之後修改 HTML/CSS/JS，在 VS Code 執行：

```bash
git add .
git commit -m "Update menu website"
git push
```

GitHub Pages 就會自動更新。

## 功能說明
- 招牌比例 7:2.6，底色 RGB(254,244,232)。
- LOGO 與店名固定；地址由 Supabase Table Editor 設定。
- 營業時間、點餐說明、公休日及 LINE QR 圖片網址可在管理員登入後修改。
- 八類排序：牛&豬肉類、羊肉&鴨肉類、雞肉類、海鮮類、蔬菜類、碳烤伴餐類、炸物類、飲品類。
- 同類別依價格低到高。
- 排序後由左至右每欄 20 項，最多顯示 60 項。
- 公開訪客可讀菜單；登入管理員才能新增、修改、刪除及儲存店面資訊。
- LINE QR 欄位需填入可公開讀取的圖片網址。

## 注意
GitHub Pages 是靜態託管，不會替你保管私密金鑰。Supabase anon/public key 可放前端，但必須保留上述 RLS。不要把 service_role key 放入任何前端檔案或提交到 GitHub。