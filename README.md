# Lumo v0.1

平板优先的每日事项管理与独立学习应用。

## 运行

需要 Node.js 22.19 或更高版本（使用内置 SQLite，无需安装数据库服务）。

```sh
npm install
npm run dev
# http://localhost:5173
npm test
```

`PORT=3000 npm run dev` 可切换端口。以下页面支持直接打开、刷新和浏览器前进 / 后退：

- `/login`
- `/today`
- `/chat`
- `/apps/irregular-verbs`
- `/apps/irregular-verbs/study`
- `/apps/irregular-verbs/result`

## 边界与数据

- `src/platform/`：登录学生上下文、按日期管理的作业 / 待办、应用注册与 `student_app` 摘要。只调用 App 的 `getSummary`、`start` 和页面入口，不读取学习数据。
- `src/learning-apps/irregular-verbs/`：原 HTML 的 84 词库及易混淆选项、词卡、选择题、拼写、错题重练、会话、答题记录及掌握度。
- `src/storage.js`：服务端 SQLite / PostgreSQL 存储与浏览器内存快照。保存失败会显示错误，避免误报已保存。

用户由预配置账号提供学生上下文，`learning_app` 为静态注册表；事项、平台 App 关系与 App 自有学习状态使用学生独立的数据库键保存。默认 SQLite 路径为 `data/lumo.sqlite`，可用 `LUMO_DB_PATH` 指定。已有本机数据迁入 `local-student`，原记录保留。保存成功后才更新页面，失败保留原状态；并发修改通过 revision 检查避免覆盖。同一学生与其关联家长共享数据，刷新查看最新记录。SQLite 备份时停止服务并复制整个 `data/` 目录。

练习优先抽取掌握度低的 10 个词；错题重练只抽取最近一次答错的词。答对掌握度 +25，答错 -35，范围 0–100，达到 75 计为已掌握。词卡浏览不提升掌握度。答案提交后立即持久化，未完成会话可恢复；结果为实际练习统计，无 AI 生成。

保留 `过去式探险.html` 作为原始参考。原生模块实现，无新增框架或构建工具，PostgreSQL 通过 pg 驱动接入；已增加 AI 学习助手和图片识别；语音和积分商城尚未实现。

## 作业拍照导入

在今日事项中点击「拍照导入」，拍照或选择 JPG / PNG / WebP 图片（最大 20 MB）。浏览器将图片最长边缩至 2400 像素并转换为 JPEG（处理后最大 3 MB），通过已登录的后端接口交给 pi 视觉模型提取作业。选择图片前会提示上传和模型处理方式。本应用不将图片写入数据库或文件；模型服务的数据保留策略由对应供应商决定。需要配置视觉模型和 API 密钥。

识别后对照图片核对文本，每行一项，可修改、删除或补充，移除无关标题和日期。确认后批量保存为 `HOMEWORK`，日期默认是当前查看的日期，也可修改。同一学生、同一天的相同标题会跳过；校验或保存失败时不会部分导入。取消或关闭会终止识别，不会添加事项。

模型按科目提取作业，过滤表格标题、日期、水印和勾号，不会根据勾号自动标记完成。无法确认的文字用【待核对】标记，并展示疑点；手写内容和页码仍需人工核对。移动端拍照使用系统文件选择器的后置摄像头提示，桌面浏览器通常会打开文件选择器；尚未在真实 iPad / 小米 Pad 上验证。HEIC 需先转换为 JPG。

`src/platform/tasks/ocr.js` 负责图像读取和识别；`photo-import.js` 负责预览与核对；批量导入复用事项数据校验和存储。Learning App 不依赖图片模型。

## PostgreSQL 与 Docker Compose

本地开发不配置数据库连接时继续使用 SQLite。配置 `DATABASE_URL`（例如 `postgresql://lumo:password@localhost:5432/lumo`），或者 PostgreSQL 标准环境变量 `PGHOST` / `PGPORT` / `PGDATABASE` / `PGUSER` / `PGPASSWORD` 后，应用使用 PostgreSQL，并在启动时自动建表。连接失败会退出，不会悄悄回退到 SQLite。事务迁移和版本冲突保护对两种数据库一致，Learning App 的数据仍由各 App 自己维护。

使用 Docker Desktop 或已运行 Docker Engine 的 Linux 服务器：

```sh
cp .env.example .env
# 编辑 .env，将 POSTGRES_PASSWORD 改为自己的随机密码
# 如果本机 5173 已被占用，可设置 APP_PORT=5174
# 平板通过局域网访问时，设置 APP_HOST=0.0.0.0

docker compose up -d --build
docker compose ps
# http://localhost:5173/today（或使用配置的 APP_PORT）
docker compose logs -f app
```

Compose 等待 PostgreSQL 健康后再启动应用。应用以非 root 用户运行，`/api/health` 会检查数据库连接；数据库端口仅在 Compose 内部可访问。数据保存在 `postgres_data` 命名卷，普通 `docker compose down` 和重新构建不会删除数据；`docker compose down -v` 会删除数据库卷。

如已有 SQLite 数据，先停止原来的本地应用，然后将源数据迁入 Compose 的 PostgreSQL：

```sh
docker compose run --rm -v "$PWD/data:/migration:ro" app npm run migrate:postgres -- /migration/lumo.sqlite
```

迁移以事务批量插入，目标已有键不会覆盖，可重复运行。SQLite 源文件会保留，读取时复制到临时目录以支持只读挂载；该命令不会同步两个数据库，请在切换后使用 PostgreSQL 部署。若不使用 Docker，也可设置 `DATABASE_URL` 后运行 `npm run migrate:postgres -- /path/to/lumo.sqlite`。

备份与恢复 PostgreSQL（恢复前停止应用写入，并使用空目标数据库）：

```sh
docker compose exec -T postgres pg_dump -U lumo -d lumo -Fc > lumo-postgres.dump
# 停止应用，恢复后重新启动
# docker compose stop app
# docker compose exec -T postgres pg_restore -U lumo -d lumo --clean --if-exists < lumo-postgres.dump
# docker compose start app
```

需要调整数据库密码时，已有数据卷内的用户密码不会因修改 `.env` 自动更新；先在数据库中修改用户密码，再更新 `.env` 并重新创建服务。应用支持预配置学生和家长账号，见下文。

### 一键部署

在本地项目目录执行（SSH 别名也可用）：

```sh
npm run deploy
```

自定义配置示例：

```sh
DEPLOY_SSH_PORT=2222 \
DEPLOY_SSH_KEY="$HOME/.ssh/id_ed25519" \
DEPLOY_DIR=/opt/lumo \
npm run deploy -- deploy@你的服务器IP
```

运行 `bash scripts/deploy.sh --help` 查看全部参数。可以通过 `DEPLOY_HOST` 提供默认主机。

脚本通过 SSH 进入服务器项目目录（默认 `/opt/lumo`），执行 `git pull --ff-only`，然后在该目录构建镜像并启动应用。本地无需 Docker，也不上传源码或镜像；本地修改须先提交并推送到服务器当前分支的上游。默认镜像标签为 `docker.io/samanhappy/lumo:latest`，默认架构为 `linux/amd64`。

服务器须提前克隆仓库并配置上游分支、准备 `.env`，且 `postgres:17-bookworm` 镜像须已存在。`compose.yaml` 随 Git 更新，`.env` 保留在服务器。分支分叉或拉取失败时停止部署，不自动重置代码。服务器 `.env` 中的 `APP_IMAGE` 应与本次部署标签一致，保证之后手动执行 Compose 仍使用服务器构建的镜像。服务器须能访问 Git 远端、下载基础镜像和 npm 依赖。Compose 须支持 `up --wait`，脚本只重建 `app`，等待最多 180 秒；失败会返回非零退出码，不自动回滚。

默认部署到 `root@43.130.3.115`，通过 `sshpass -f` 自动读取 `~/sshpass/openclaw`，本地需安装 `sshpass`。可用 `DEPLOY_SSH_PASSWORD_FILE` 指定其他密码文件，设为空则使用普通 SSH 认证。显式指定其他主机或 `DEPLOY_SSH_KEY` 时默认不使用该密码文件。root 用户直接运行 Docker；其他用户默认使用 `sudo -n`。SSH 端口与私钥应用于 SSH，不关闭主机密钥校验。

PostgreSQL 集成测试只运行在独立测试数据库中：

```sh
TEST_DATABASE_URL=postgresql://user:password@localhost:5432/lumo_test npm test
```

测试会创建并删除独立 schema，不修改默认 `public` schema；未配置时跳过 PostgreSQL 集成测试，其余测试仍可本地运行。

### 预配置用户与角色

不支持注册。部署管理员通过 `LUMO_USERS` JSON 配置账号（见 `.env.example`），生产环境缺少配置将拒绝启动。每个账号需要唯一 `username`、至少 8 位 `password`、`name`、`role`（`student` 或 `parent`）及 `studentId`。家长与孩子使用相同的 `studentId`；多个家庭使用不同 ID。学生姓名取对应学生账号的 `name`。修改用户名不会改变学生数据归属。

学生端管理和完成作业、进行学习练习；家长端查看关联孩子的事项及学习概况、管理作业，不能提交学习记录。数据接口在服务端强制检查登录、角色和学生范围。原来的小雨作业及练习记录自动迁入 `local-student`，保留旧数据；已有浏览器数据仅由关联该 ID 的学生账号导入。

本地 `npm run dev` 无配置时提供 `student / student123` 和 `parent / parent123`，仅用于开发。自定义账号可使用 `LUMO_USERS='[...]' npm run dev`；普通启动不会自动读取 `.env`，Docker Compose 会读取。正式部署必须修改示例密码。密码使用 scrypt 校验，浏览器只持有 HttpOnly、SameSite=Strict 会话 cookie，会话 12 小时有效，退出立即失效；登录失败会限速。HTTPS 部署设置 `COOKIE_SECURE=true`。

会话保存在服务进程内，重启需要重新登录；当前 Compose 单个 app 实例适用。账号配置更新后重启 app 即生效：`docker compose up -d --force-recreate app`。无注册、找回密码或账户管理界面。

### pi 学习助手

学习助手入口为 `/chat`。后端使用固定版本的 `@earendil-works/pi-ai` 和 `@earendil-works/pi-agent-core`，支持多轮文本咨询、流式回答、停止生成，以及查询当前登录账号关联学生指定日期的作业。工具只读，无法修改作业。图片导入使用单独配置的 pi 视觉模型。

配置 `LUMO_AI_PROVIDER`（`deepseek` 或 `openai`）、`LUMO_AI_MODEL`（安装版本 pi 模型目录中的 ID）和对应的 `DEEPSEEK_API_KEY` / `OPENAI_API_KEY`。缺少配置时助手返回明确提示，其他功能正常使用。普通 `npm run dev` 不自动读取 `.env`；本地可用 `node --env-file=.env server.js`，Docker Compose 已传递这些配置。密钥仅由后端读取，勿提交真实密钥。

Node.js 最低版本为 22.19。可查看支持的模型 ID：

```sh
node --input-type=module -e "import {createModels} from '@earendil-works/pi-ai'; import {deepseekProvider} from '@earendil-works/pi-ai/providers/deepseek'; const m=createModels();m.setProvider(deepseekProvider());console.log(m.getModels().map(x=>x.id))"
```

对话和查询出的作业会发送到配置的模型服务。页面已提示数据处理方式。对话仅在当前页面内保留，不持久化；离开页面后清空。历史最多 20 条、32000 字，每次提问最多 4000 字；每次运行最多 5 个模型回合、60 秒，最多 8 个并发请求，每个账号最多一个请求。前端使用纯文本展示模型输出。当前未加入长期记忆、写入工具。

### 图片模型配置

设置 LUMO_VISION_PROVIDER=openai 和 LUMO_VISION_MODEL（pi 目录中支持 image 输入的模型 ID），以及 OPENAI_API_KEY。视觉模型与聊天模型独立配置；deepseek 也可选择，但必须支持 image 输入，否则拒绝调用。Docker Compose 已传递这些变量；普通开发启动可用 `node --env-file=.env server.js`。

图片接口为 POST /api/homework/recognize，要求登录、同源 JSON 请求并校验图片类型与文件签名。图片仅作为数据传给模型，没有业务写入工具；返回条目须符合批量导入限制。识别最长 60 秒，同账号一个请求、总计最多四个并发；取消会中止模型请求。识别失败保留预览并允许手动填写，不会悄悄回退到本地 OCR 或保存部分作业。
