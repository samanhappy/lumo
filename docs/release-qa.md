# 发布体验验收

2026-10-08：完成本次学生端、家长端、学习助手与图片导入的功能和界面优化。所有实测使用隔离数据；未向公网发布。

## 验收矩阵

| 范围 | 实际验证与结果 |
| --- | --- |
| 登录与角色 | 学生/家长登录、错误密码、退出；家长查看关联学习概况、添加和删除事项；直接访问答题页返回今日。生产 HTTP 验证未登录接口、家长写学习记录、跨来源请求和私有文件均拒绝。 |
| 今日事项 | 新增、编辑、类型切换、完成/取消、刷新保留、前后日期和回到今天、删除二次确认。并发冲突保留输入并恢复按钮；保存中锁定输入和操作。日期跨年及无效日期有自动测试。 |
| 词卡 | 翻转、前后切换、全 84 张完成；结果仅显示学习词数，不显示误导的答对 0 题。 |
| 闯关 | 浏览器完成 10 题，正误反馈、下一题、刷新恢复；结果 3/10、30% 与实际一致。 |
| 拼写与错题 | 浏览器完成 10 题，首尾空格/大小写归一化，结果 1/10、10%；错题入口、继续上次与替换未完成会话验证。词库、错题筛选和学生隔离有自动测试。 |
| 学习助手 | DeepSeek flash 实际流式回答、多轮承接、停止、离页清空，以及查询虚构作业完成状态通过。服务未配置可恢复；未收到回答时移除空白消息。五回合最终回答可完成，第六回合被阻止。 |
| 图片导入 | 真实模型识别仓库图片，最终结果为数学练习册 P32-33、语文试卷订正、英语课文背诵 Unit 2；科目不重复。手动修订后导入 3 项；重复测试新增 1 项、跳过 2 项。损坏/不支持图片有明确错误；识别中取消不新增事项。 |
| 界面与操作 | 精简首页重复鼓励文案和学习页大装饰，独立消息布局；手机底部导航、平板侧边导航。检查 320px/390px 手机及 1024px 平板，今日、学习、答题、结果、助手和登录流程。增强文字对比度、弹窗限高、输入焦点、主导航当前页语义与完成操作后的焦点恢复。 |
| 生产运行 | 独立 Compose 项目 lumo-release-qa 构建成功，app 与 PostgreSQL 健康、应用非 root；登录/保存/刷新及容器重启后数据保留。所有页面直达 HTTP 200。镜像中的 ai.js 和 styles.css 校验和与当前工作区一致。 |

## 最终自动验证

24 项全部通过，0 失败、0 跳过。包含 PostgreSQL 持久化、版本冲突、事务回滚和 SQLite 迁移，以及部署脚本的成功与失败退出流程。真实 PostgreSQL 使用 localhost:55439 的隔离验收容器；数据库测试创建独立 schema，不影响用户数据库。

`git diff --check` 和修改过的 JavaScript 语法检查通过。部署脚本测试使用隔离模拟环境；生产镜像由真实 Docker 构建与运行验证。

## 主要证据

截图位于本机 /tmp：
- lumo-today-before.png / lumo-today-after.png：今日页前后。
- lumo-chat-before.png / lumo-chat-after.png：助手布局前后。
- lumo-learning-before.png / lumo-learning-after.png：学习页前后。
- lumo-cards-result-before.png / lumo-cards-result-after.png：词卡结果前后。
- lumo-chat-plain-output.png、lumo-real-chat-history.png、lumo-real-homework-query.png：真实对话与查询。
- lumo-real-photo-review.png、lumo-real-photo-import.png：真实识别和导入。
- lumo-mobile-today-after.png、lumo-mobile-spelling-final.png、lumo-mobile-result-final.png、lumo-mobile-login-final.png、lumo-mobile-chat-final.png：手机布局。
- lumo-tablet-today-final.png、lumo-tablet-learning-final.png：平板布局。
- lumo-production-smoke.png、lumo-save-conflict-preserved.png：生产功能和冲突恢复。

## 发布方式与范围

重启本地服务使后端修改生效。模型配置运行方式、生产账号、HTTPS Cookie 和备份方法见 README。对外部署使用自有正式账号与模型密钥，当前验收账号及数据库只用于测试。

本次完成代码与本机发布验收，未操作公网部署。实测平台为 Codex 浏览器和本机 Docker；尚未在实体 iPad / 小米 Pad 的相机与系统文件选择器上实测，移动端相机入口使用浏览器标准 capture 提示。模型识别仍保留人工核对环节；会话仍按当前产品设计在离页后清空，服务重启需重新登录。

验收预览保留在 http://localhost:5178/today，仅本机可访问，使用隔离测试账号与数据库。其 Compose 项目名为 lumo-release-qa，停止预览可执行 `docker compose -p lumo-release-qa --env-file /tmp/lumo-release-qa.env -f compose.yaml -f /tmp/lumo-release-qa-compose.yaml down`，不加 `-v` 会保留测试数据。
