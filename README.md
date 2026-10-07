# Lumo v0.1

平板优先的每日事项管理与独立学习应用。

## 运行

需要 Node.js 22.13 或更高版本（使用内置 SQLite，无需安装数据库服务）。

```sh
npm install
npm run dev
# http://localhost:5173
npm test
```

`PORT=3000 npm run dev` 可切换端口。四个页面支持直接打开、刷新和浏览器前进 / 后退：

- `/today`
- `/apps/irregular-verbs`
- `/apps/irregular-verbs/study`
- `/apps/irregular-verbs/result`

## 边界与数据

- `src/platform/`：登录学生上下文、按日期管理的作业 / 待办、应用注册与 `student_app` 摘要。只调用 App 的 `getSummary`、`start` 和页面入口，不读取学习数据。
- `src/learning-apps/irregular-verbs/`：原 HTML 的 84 词库及易混淆选项、词卡、选择题、拼写、错题重练、会话、答题记录及掌握度。
- `src/storage.js`：服务端 SQLite / PostgreSQL 存储与浏览器内存快照。保存失败会显示错误，避免误报已保存。

用户由预配置账号提供学生上下文，`learning_app` 为静态注册表；事项、平台 App 关系与 App 自有学习状态使用学生独立的数据库键保存。默认 SQLite 路径为 `data/lumo.sqlite`，可用 `LUMO_DB_PATH` 指定。已有本机数据迁入 `local-student`，原记录保留。保存成功后才更新页面，失败保留原状态；并发修改通过 revision 检查避免覆盖。同一学生与其关联家长共享数据，刷新查看最新记录。SQLite 备份时停止服务并复制整个 `data/` 目录。

练习优先抽取掌握度低的 10 个词；错题重练只抽取最近一次答错的词。答对掌握度 +25，答错 -35，范围 0–100，达到 75 计为已掌握。词卡浏览不提升掌握度。答案提交后立即持久化，未完成会话可恢复；结果为实际练习统计，无 AI 生成。

保留 `过去式探险.html` 作为原始参考。原生模块实现，无新增框架或构建工具，PostgreSQL 通过 pg 驱动接入；没有实现 v0.1 排除的语音、AI、积分商城等功能。

## 作业拍照导入

在今日事项中点击「拍照导入」，拍照或选择 JPG / PNG / WebP 图片（最大 20 MB）。照片在浏览器内用 Tesseract.js 6.0.1 识别，不上传服务器，也不保存照片。OCR 引擎和中英文模型全部从本项目加载，无需云服务密钥。

识别后对照图片核对文本，每行一项，可修改、删除或补充，移除无关标题和日期。确认后批量保存为 `HOMEWORK`，日期默认是当前查看的日期，也可修改。同一学生、同一天的相同标题会跳过；校验或保存失败时不会部分导入。取消或关闭会终止识别，不会添加事项。

模型适合清晰的中英文印刷文字；手写、模糊、倾斜照片的准确率有限，导入前需要核对。移动端拍照使用系统文件选择器的后置摄像头提示，桌面浏览器通常会打开文件选择器；尚未在真实 iPad / 小米 Pad 上验证。HEIC 需先转换为 JPG。

`src/platform/tasks/ocr.js` 负责图像读取和识别；`photo-import.js` 负责预览与核对；批量导入复用事项数据校验和存储。Learning App 没有引入 OCR 依赖。

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
