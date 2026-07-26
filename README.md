# waitfans 用户端

teriteri 用户端的 React 迁移版本，按仓库根目录的 `MIGRATION_REACT.md` 实现。

## 技术栈

- React 18、TypeScript、Vite 5
- React Router 6、Redux Toolkit
- Ant Design 5、Axios
- Video.js、SparkMD5、原生 WebSocket
- Vitest、Testing Library、Oxlint

## 本地运行

```bash
npm install
copy .env.example .env.local
npm run dev
```

默认后端地址为 `http://localhost:8080`，即时消息服务为
`ws://localhost:7071`。也可不创建 `.env.local`，此时 HTTP 请求使用
`/api` 相对路径。

## 校验

```bash
npm run build
npm run test
npm run lint
```

已迁移首页、搜索、视频播放、弹幕、评论、个人空间、账号设置、创作中心、
分片上传、消息中心和登录注册等主流程。路由和后端接口契约保持与原 Vue
项目兼容。
