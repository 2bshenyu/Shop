# 简易在线商城（Shop-MVP）

这是为课程作业准备的简易在线商城 MVP（前后端分离）。后端使用 Node + Express + sql.js（WASM SQLite），前端使用 React + Vite。项目避免了需要本地 C/C++ 编译的原生模块（例如 sqlite3）以便在 Windows 环境下更容易运行。

目录概览

- backend/        # 后端服务（Express + sql.js）
- frontend/       # 前端（React + Vite）
- README.md       # 本说明

关键特性

- 用户注册/登录（JWT）
- 商品列表与详情
- 购物车（基于用户的持久化 cart）
- 下单事务（下单时检查库存并扣减）
- 简易商家接口（可新增商品）
- 使用 sql.js（WASM）避免本机 sqlite 编译问题

先决条件

- Node.js（建议 16+），npm
- Windows 用户：建议使用 PowerShell

快速启动（开发模式）

1) 启动后端

```powershell
cd "F:\文件\Shop\backend"
npm install        # 安装依赖（如已安装可跳过）
npm run init-db    # 初始化示例数据（生成 data/app.sqlite）
npm run dev        # 开发模式（nodemon），或 npm start
```

默认后端监听端口：3000。

2) 启动前端

```powershell
cd "F:\文件\Shop\frontend"
npm install
npm run dev
# 打开 http://localhost:5173
```

注意：`frontend/vite.config.js` 已配置将 `/api` 代理到后端（http://localhost:3000），开发时无需额外代理配置。

数据库重置（用于测试 / E2E）

为了让 E2E 与自动化测试在可控、干净的环境下运行，后端提供了一个仅在非生产环境可访问的管理接口：

- GET /_admin/reset

该接口会删除并重建数据库文件并插入示例商品。示例调用（PowerShell）：

```powershell
# 在后台服务运行时（NODE_ENV != 'production'），使用代理前缀 /api
Invoke-RestMethod -Uri http://localhost:5173/api/_admin/reset -Method GET
# 或直接访问后端： http://localhost:3000/_admin/reset
```

（接口只会在 `NODE_ENV !== 'production'` 时挂载，生产环境不会暴露此接口。）

运行 E2E 测试（Playwright）

1. 安装 Playwright 浏览器（只需一次）：

```powershell
cd "F:\文件\Shop\frontend"
npx playwright install --with-deps
```

2. 确保后端与前端都已启动（分别监听 3000 和 5173），然后运行：

```powershell
cd "F:\文件\Shop\frontend"
npx playwright test frontend/tests/e2e.spec.js --config=playwright.config.js
```

本仓库的 E2E 测试会在测试开始时调用 `GET /api/_admin/reset` 保证数据库处于已知状态，因此在本地运行前确保后端是以 `NODE_ENV` 非生产模式启动（默认就是）。

常用脚本（概览）

backend/package.json 中的脚本

- start: node src/server.js
- dev: nodemon src/server.js
- init-db: node src/scripts/init_db.js   (插入示例商品)
- test: jest --runInBand

frontend/package.json 中的脚本

- dev: vite
- build: vite build
- preview: vite preview
- test:e2e: playwright test --config=playwright.config.js

故障排查与 Tips（尤其是 Windows）

- Windows 的中文路径有时会导致工具或第三方依赖异常（尤其是用到本地文件路径的模块）。如果遇到莫名其妙的问题，建议把项目复制到 ASCII 路径（例如 `C:\projects\Shop-MVP`）再运行。
- 本项目通过 `sql.js`（WASM）避免本机 sqlite 原生扩展，因此不需要安装 Visual C++ Build Tools；如遇到与 sqlite3 或 bcrypt 原生模块相关的错误，请确认没有在本地误装了这些模块的原生版本。
- `/_admin/reset` 仅用于开发/测试；不要在生产环境启用或调用它。

开发建议与下一步

- 在 CI 中加入测试前清理步骤（调用 `/_admin/reset` 或在 CI 中删除 data/app.sqlite），可保证测试稳定性。
- 可以为后端添加一个 `npm run reset-db` 脚本（直接删除 data 文件并运行 init），如果你希望我添加我可以一并实现。
- 可以把 Playwright E2E 加入 GitHub Actions（我可以为你生成 workflow 文件）。

联系与说明

如果你需要我继续：
- 我可以把 `/_admin/reset` 的调用集成到 CI（生成 GitHub Actions workflow）。
- 我可以添加 `npm run reset-db` 脚本并在 README 中补充使用说明。
- 我可以生成一份用于课堂演示的“演示脚本 / 截图指南 / 提交文档”。

选择你要我继续执行的下一项，我会接着实现并验证。
