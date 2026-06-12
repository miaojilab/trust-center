# Trust Center

Trust Center 是一个基于 OAuth 的身份信任与 KYC 认证中心，支持多种认证方案、用户提交认证材料、管理员审核，以及面向外部系统的认证状态查询 API。

目标开源仓库：[github.com/miaojilab/trust-center](https://github.com/miaojilab/trust-center)

## 功能特性

- OAuth 登录与用户自动注册
- 多认证方案配置与字段管理
- 用户 KYC 表单提交与状态查询
- 管理员审核、审批、拒绝与仪表盘统计
- 外部 API 通过 API Key 查询认证状态与详情
- React + TypeScript 管理/用户前端
- MySQL + Sequelize 数据持久化

## 技术栈

### 后端

- Node.js + Express
- MySQL + Sequelize ORM
- JWT 认证
- API Key 外部访问控制

### 前端

- React 18 + TypeScript
- Material UI
- React Router
- Axios

## 项目结构

```text
controllers/       # 控制器
models/            # Sequelize 数据模型
routes/            # API 路由
middlewares/       # 认证与权限中间件
config/            # 数据库与 OAuth 配置
scripts/           # 迁移与性能测试脚本
client/            # React 前端项目
```

## 本地开发

### 环境要求

- Node.js 18+
- npm
- MySQL 8.x 或兼容版本

### 后端配置

```bash
npm install
copy .env.example .env
npm start
```

macOS / Linux:

```bash
npm install
cp .env.example .env
npm start
```

请根据实际环境修改 `.env` 中的数据库、JWT、OAuth 和 API Key 配置。

### 前端配置

```bash
cd client
npm install
copy .env.example .env
npm start
```

macOS / Linux:

```bash
cd client
npm install
cp .env.example .env
npm start
```

默认开发地址：

- 后端：http://localhost:3000
- 前端：http://localhost:3001

## 必填环境变量

后端 `.env`：

- `DB_HOST`
- `DB_PORT`
- `DB_NAME`
- `DB_USER`
- `DB_PASSWORD`
- `JWT_SECRET`
- `OAUTH_CLIENT_ID`
- `OAUTH_CLIENT_SECRET`
- `OAUTH_REDIRECT_URI`
- `API_KEYS`

前端 `client/.env`：

- `REACT_APP_OAUTH_CLIENT_ID`
- `REACT_APP_OAUTH_REDIRECT_URI`
- `REACT_APP_OAUTH_AUTHORIZATION_ENDPOINT`
- `REACT_APP_API_BASE_URL`

不要提交 `.env`、生产数据库密码、OAuth client secret、JWT secret 或 API keys。仓库只保留 `.env.example` 作为占位示例。

## API 概览

### 认证

- `POST /api/auth/callback`：OAuth 回调处理
- `GET /api/user`：获取当前用户信息

### KYC

- `GET /api/kyc/initial-data`：获取初始数据
- `GET /api/kyc/schemes`：获取认证方案列表
- `GET /api/kyc/schemes/:id`：获取认证方案详情
- `POST /api/kyc/submit`：提交认证信息
- `GET /api/kyc/status`：获取当前用户认证状态

### 管理员

- `GET /api/admin/kyc/pending`：获取待审核列表
- `POST /api/admin/kyc/review/:submissionId`：审核 KYC 提交
- `POST /api/admin/kyc/schemes`：创建认证方案

### 外部查询

- `GET /api/verification/status`：查询用户认证状态
- `GET /api/verification/details`：查询认证详情，建议通过 `x-api-key` 请求头传入 API Key

## 安全说明

- 所有敏感配置必须通过环境变量注入。
- 生产环境必须使用强随机 `JWT_SECRET` 和 `API_KEYS`。
- 不要在日志中输出 access token、API key、OAuth client secret 或数据库连接串。
- 如果该项目从私有仓库迁移而来，任何曾经进入 Git 历史的数据库密码、OAuth secret、JWT secret、API key 都应视为已泄露并立即轮换。

## License

本项目基于 [Apache License 2.0](./LICENSE) 开源。