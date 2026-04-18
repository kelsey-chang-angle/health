# 饮食参考应用（前后端）

这个项目包含：
- 前端：`Vite + React`
- 后端：`Express`（档案数据接口）

## 本地启动

```bash
npm install
npm run dev
```

`npm run dev` 会同时启动：
- 前端：`http://127.0.0.1:5173`（端口可能自动调整）
- 后端：`http://127.0.0.1:3001`

## 可用脚本

- `npm run dev`：同时启动前后端
- `npm run dev:client`：仅启动前端
- `npm run dev:server`：仅启动后端
- `npm run build`：构建前端
- `npm run lint`：检查代码规范

## 档案接口

- `GET /api/health`
- `GET /api/profile/:clientId`
- `PUT /api/profile/:clientId`
- `DELETE /api/profile/:clientId`
- `GET /api/admin/export`（需 `x-admin-token`）
- `GET /api/admin/stats`（需 `x-admin-token`）

后端数据保存在：`server/data/profiles.json`（本地文件）。

## MVP 部署（Render）

仓库已提供 `render.yaml`，可直接使用 Blueprint 部署：

1. 将项目推送到 GitHub
2. 在 Render 选择 **Blueprint** 并连接仓库
3. 设置环境变量：
   - `ALLOWED_ORIGIN`：你的线上域名（如 `https://xxx.onrender.com`）
   - `ADMIN_TOKEN`：管理员导出数据用的密钥
4. 部署完成后访问：
   - `/api/health` 查看服务状态
   - 首页 URL 直接打开应用（前后端同域）

### 数据存储策略（当前 MVP）

- 使用 Render 持久盘目录 `/var/data/profiles.json`
- 适合 100 人以内 MVP 试运行
- 建议定期使用 `GET /api/admin/export` 导出备份
