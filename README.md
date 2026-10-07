# Lumo v0.1

平板优先的每日事项管理与独立学习应用。

## 运行

需要 Node.js 20 或更高版本。

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

- `src/platform/`：本机学生、按日期管理的作业 / 待办、应用注册与 `student_app` 摘要。只调用 App 的 `getSummary`、`start` 和页面入口，不读取学习数据。
- `src/learning-apps/irregular-verbs/`：原 HTML 的 84 词库及易混淆选项、词卡、选择题、拼写、错题重练、会话、答题记录及掌握度。
- `src/storage.js`：浏览器本地存储读写。保存失败会显示错误，避免误报已保存。

v0.1 使用一个本机学生“小雨”，无需账户。`student` 为静态上下文、`learning_app` 为静态注册表；`daily_task` / `student_app` 与 App 自有的 `iv_mastery` / `iv_session` / `iv_attempt` 分键存入 localStorage，`iv_word` 为静态词库。数据只保存在当前浏览器，不跨设备同步；清除网站数据会删除记录。没有服务端数据库或多用户认证。

练习优先抽取掌握度低的 10 个词；错题重练只抽取最近一次答错的词。答对掌握度 +25，答错 -35，范围 0–100，达到 75 计为已掌握。词卡浏览不提升掌握度。答案提交后立即持久化，未完成会话可恢复；结果为实际练习统计，无 AI 生成。

保留 `过去式探险.html` 作为原始参考。原生模块实现，无新增框架、构建工具或后端基础设施；没有实现 v0.1 排除的语音、AI、积分商城等功能。

## 作业拍照导入

在今日事项中点击「拍照导入」，拍照或选择 JPG / PNG / WebP 图片（最大 20 MB）。照片在浏览器内用 Tesseract.js 6.0.1 识别，不上传服务器，也不保存照片。OCR 引擎和中英文模型全部从本项目加载，无需云服务密钥。

识别后对照图片核对文本，每行一项，可修改、删除或补充，移除无关标题和日期。确认后批量保存为 `HOMEWORK`，日期默认是当前查看的日期，也可修改。同一学生、同一天的相同标题会跳过；校验或保存失败时不会部分导入。取消或关闭会终止识别，不会添加事项。

模型适合清晰的中英文印刷文字；手写、模糊、倾斜照片的准确率有限，导入前需要核对。移动端拍照使用系统文件选择器的后置摄像头提示，桌面浏览器通常会打开文件选择器；尚未在真实 iPad / 小米 Pad 上验证。HEIC 需先转换为 JPG。

`src/platform/tasks/ocr.js` 负责图像读取和识别；`photo-import.js` 负责预览与核对；批量导入复用事项数据校验和存储。Learning App 没有引入 OCR 依赖。
