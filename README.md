# Waitfans 用户端

Waitfans 用户端是基于 React 18、TypeScript 和 Vite 5 的独立前端仓库。它通过 HTTP API 访问 `waitfans-backend`，并通过独立的 IM WebSocket 服务收发实时消息。

## 1. 运行要求

- Node.js 20 或更高版本（本次验证使用 Node.js 24）
- npm 10 或更高版本（本次验证使用 npm 11）
- 已启动的 Waitfans 后端：
  - HTTP：`http://127.0.0.1:7070`
  - IM WebSocket：`ws://127.0.0.1:7071/im`

前端、管理端和后端分别是独立 Git 仓库。请在各自目录中安装依赖、提交变更和执行测试；前端接口契约发生变化时，必须同步更新并验证后端。

## 2. 安装依赖

在本仓库根目录执行：

```powershell
npm install
```

如果只希望严格使用锁文件中的版本，可执行：

```powershell
npm ci
```

## 3. 环境配置

本地开发推荐不创建 `.env.local`。此时所有 HTTP 请求使用 `/api` 相对路径，由 Vite 转发到 `http://localhost:7070`，可避免跨域问题。

如需让浏览器直接访问后端，可复制示例配置：

```powershell
Copy-Item .env.example .env.local
```

`.env.example` 的默认值为：

```dotenv
VITE_API_BASE_URL=http://localhost:7070
VITE_WS_IM_URL=ws://localhost:7071
```

说明：

- `VITE_API_BASE_URL` 不要追加 `/api`，后端接口本身从 `/user`、`/search` 等路径开始。
- `VITE_WS_IM_URL` 不要追加 `/im`，客户端连接时会自动补上该路径。
- `.env.local` 仅用于本机，不应提交到 Git。
- 修改环境文件后必须重启 Vite。

## 4. 启动开发服务器

先按后端仓库 README 启动依赖和后端，再执行：

```powershell
npm run dev
```

默认访问地址：

```text
http://127.0.0.1:8787/
```

如果需要显式限制监听地址和端口：

```powershell
.\node_modules\.bin\vite.cmd --host=127.0.0.1 --port=8787 --strictPort
```

快速检查 Vite 代理与后端是否连通：

```powershell
Invoke-RestMethod http://127.0.0.1:8787/api/category/getall
Invoke-RestMethod http://127.0.0.1:8787/api/search/hot/get
```

两次响应的 `code` 都应为 `200`。

## 5. 构建与自动化测试

每次提交前至少执行：

```powershell
npm run build
npm run test
npm run lint
```

命令说明：

- `npm run build`：执行 TypeScript 项目构建并生成 `dist/`。
- `npm run test`：运行 Vitest 单元测试。
- `npm run lint`：运行 Oxlint 静态检查。
- `npm run preview`：在构建完成后预览 `dist/`，默认不提供开发代理。

接口模型或后端返回结构变化时，应同时添加或更新 API 适配层测试。例如热搜接口后端返回对象数组，用户端展示前必须转换为关键词字符串数组。

## 6. 手工联调清单

建议使用无痕窗口或清空 `localStorage` 后测试：

1. 打开首页，确认分类、轮播图和推荐视频正常展示。
2. 确认搜索框占位词是可读文本，不应出现 `[object Object]`。
3. 点击分类或搜索关键词，确认能进入 `/search/video?keyword=...`。
4. 使用错误账号登录，确认显示“账号或密码不正确”，页面控制台没有未处理异常。
5. 使用有效普通用户账号登录，确认令牌保存在 `localStorage` 的 `teri_token` 中。
6. 登录后检查个人空间、账号设置、收藏、历史记录和投稿入口。
7. 打开消息页面，确认浏览器连接到 `ws://127.0.0.1:7071/im`，鉴权成功后再验证会话收发与撤回。
8. 验证视频详情、播放、评论、点赞、投币和收藏。
9. 验证视频分片上传前，确认后端 OSS 配置是真实可用的测试配置。

涉及注册、上传、评论等写操作时，请使用专用测试数据，不要在生产数据库执行。

## 7. 常见问题

### 页面能打开，但接口请求失败

确认后端 `7070` 端口可访问，并检查是否错误地将 `.env.local` 配置成旧端口。开发代理可用以下命令验证：

```powershell
Test-NetConnection 127.0.0.1 -Port 7070
```

### 消息页面无法连接

确认后端进程同时监听 `7070` 和 `7071`，并检查 WebSocket 实际地址是否以 `/im` 结尾：

```powershell
Test-NetConnection 127.0.0.1 -Port 7071
```

### 端口被占用

Vite 默认使用 `8787`。先停止占用该端口的旧开发服务器，再使用 `--strictPort` 启动，避免自动切换到其他端口造成联调地址混乱。

### 业务错误仍被当作成功

API 响应的 HTTP 状态可能是 `200`，但响应体 `code` 非 `200`。共享请求层会将这种响应转为 rejected Promise；页面提交逻辑必须保留错误处理，不能继续执行成功跳转或成功提示。

## 8. 已知问题

### 🔴 未解决

| # | 问题 | 位置 | 说明 |
|---|------|------|------|
| 1 | **登录后点击头像无反应** | `HeaderBar.tsx:165` | `<Dropdown trigger={['click']}>` 未能触发菜单弹出，可能是 Ant Design 与 Avatar 组件的兼容问题。临时方案：悬停头像可见菜单 |
| 2 | 管理员登录后 `fetchPersonalInfo` 返回 403 | `App.tsx` 初始化 | `/user/personal/info` 不在 `permitAll` 列表中，未登用户端时调用此接口会失败 |

### 🟡 占位数据

| # | 位置 | 说明 |
|---|------|------|
| 1 | `assets/json/carousel.json` | 8 个轮播 `target` 指向 `/video/demo-1` ~ `/video/demo-8`，数据库中不存在，点击后控制台报 500 |
| 2 | `assets/json/dm.json` | 26 条演示弹幕（用户 ID 恒为 1） |
| 3 | `pages/Home/IndexPage.tsx:11-45` | `fallbackSeeds` 含 16 条 `vid=demo-N` 占位视频 |
| 4 | `pages/Platform/PlatformPage.tsx:203-210` | 稿件管理、申诉管理、数据中心等 6 页面为占位 |
| 5 | `pages/Space/SpacePage.tsx:121-123` | 动态/粉丝/关注标签页为占位 |
| 6 | `components/Layout/HeaderChannel.tsx:14-17` | 22 个频道名硬编码 |

### 🟢 接口不匹配

| # | 问题 | 文件 |
|---|------|------|
| 1 | `User` 同时有 `avatar`/`avatar_url`、`sign`/`description` 双字段 | `types/user.ts` |
| 2 | `Comment` 字段与后端命名不一致 | `types/comment.ts` |
| 3 | `Danmu` 同时有 `timePoint`/`time` 双字段 | `types/danmu.ts` |
| 4 | 空 catch 块在 `LoginRegister.tsx:32,44` 和 `websocket.ts:31` | 应至少加 `console.error` |
