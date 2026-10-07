# AI 学习助手 v0.1

## 1. 产品目标

第一版解决两个核心问题：

1. 管理每天的作业 / 待办事项
2. 提供可独立开发和演进的 Learning App

首个 Learning App：

> 英语 · 不规则过去式

平台本身不关心“不规则过去式”的具体学习逻辑。

---

# 2. 产品结构

```text
AI 学习助手
│
├── Today
│   ├── 今日作业
│   ├── 今日待办
│   └── 学习应用入口
│
└── Learning Apps
    │
    └── Irregular Verbs
        ├── 出题逻辑
        ├── 游戏玩法
        ├── 学习记录
        ├── 掌握度算法
        └── UI / 交互
```

核心原则：

> Platform 提供通用能力，Learning App 负责自己的学习逻辑。

---

# 3. 首页 `/today`

首页是每天打开应用后的入口。

```text
10 月 8 日 · 星期四

今日事项

□ 数学练习册 P32-33
✓ 语文试卷订正
□ 英语课文背诵

+ 添加事项


学习应用

┌──────────────────────┐
│ 不规则过去式          │
│                      │
│ 3 个单词需要继续练习  │
│                      │
│ 预计 8 分钟           │
│                      │
│ [继续学习]            │
└──────────────────────┘
```

---

# 4. 作业 / 待办

支持：

- 新增
- 编辑
- 删除
- 标记完成
- 取消完成
- 按日期查看

数据：

```text
daily_task

id
student_id
date
title
type
completed
completed_at
created_at
updated_at
```

类型第一版：

```text
HOMEWORK
TODO
```

不做：

- 复杂分类
- 优先级
- 提醒
- 周期任务
- 日历月视图

---

# 5. Learning App

Learning App 是独立的学习功能模块。

每个 App 自己负责：

```text
学习内容
出题策略
交互形式
业务规则
掌握度计算
学习进度
App 内 UI
```

平台不应该知道：

```text
buy → bought

应该如何出题
什么时候复习
掌握度如何计算
应该玩选择题还是拼写题
```

这些全部属于 `Irregular Verbs App`。

---

# 6. Platform 提供的底层能力

平台只提供所有 Learning App 都可能复用的能力。

## Student

```text
student

id
name
grade
```

## App Registry

记录有哪些 Learning App。

```text
learning_app

id
code
name
icon
version
enabled
```

例如：

```text
code: irregular-verbs
name: 不规则过去式
version: 1.0.0
```

## App User State

平台保存某个学生与 App 的关系。

```text
student_app

student_id
app_id

last_used_at
status

summary
```

`summary` 用于首页展示简要状态，例如：

```json
{
  "progressText": "3 个单词需要继续练习",
  "estimatedMinutes": 8
}
```

平台不理解 summary 内部业务含义。

---

# 7. Learning App 接口

平台和 Learning App 保持一个非常小的协议。

例如：

```ts
interface LearningApp {

  getSummary(studentId: string): AppSummary

  start(studentId: string): StudySession

}
```

其中：

```ts
interface AppSummary {
  title: string
  description?: string
  progressText?: string
  estimatedMinutes?: number
}
```

首页只需要：

```text
getSummary()
```

获得卡片展示内容。

用户点击：

```text
开始 / 继续
```

之后进入 App 自己的页面。

---

# 8. 路由

平台：

```text
/today
```

Learning App：

```text
/apps/irregular-verbs
```

以后自然扩展：

```text
/apps/irregular-verbs

/apps/math-fractions

/apps/english-spelling

/apps/chinese-poetry
```

每个 App 可以独立开发。

---

# 9. Irregular Verbs App

首个 Learning App：

```text
apps/irregular-verbs
```

它自己拥有：

```text
单词库
答题记录
Mastery
出题算法
游戏逻辑
学习 Session
```

例如自己的数据表：

```text
iv_word

iv_mastery

iv_session

iv_attempt
```

其中：

### iv_word

```text
id
base_form
past_form
```

### iv_mastery

```text
student_id
word_id

mastery_score
correct_count
incorrect_count

last_practiced_at
```

### iv_session

```text
id
student_id

started_at
ended_at

correct_count
total_count
```

### iv_attempt

```text
id
session_id
student_id
word_id

answer
correct
duration_ms

created_at
```

这些都属于 App 内部实现。

Platform 不直接依赖这些表。

---

# 10. App 内部逻辑

例如 Irregular Verbs App 可以自己决定：

```text
50% 掌握度最低

30% 最近答错

20% 已掌握内容复习
```

也可以以后改成：

```text
FSRS
间隔重复
AI 动态出题
不同小游戏
```

都不影响 Platform。

---

# 11. 独立演进

例如 v1：

```text
选择题
输入过去式
```

v2：

```text
单词配对
拼写挑战
```

v3：

```text
听音辨词
AI 动态小游戏
```

v4：

```text
句子中的过去式使用
```

整个演进过程只修改：

```text
Irregular Verbs App
```

不需要修改 Today 或平台核心。

---

# 12. 第一版页面

Platform：

```text
/today
```

Irregular Verbs App：

```text
/apps/irregular-verbs
/apps/irregular-verbs/study
/apps/irregular-verbs/result
```

第一版总共 4 个核心页面。

---

# 13. 技术结构

建议仍然使用一个 Next.js 项目，但代码按模块隔离。

```text
src/

├── platform/
│   ├── student/
│   ├── tasks/
│   └── apps/
│
└── learning-apps/
    │
    └── irregular-verbs/
        ├── components/
        ├── services/
        ├── repositories/
        ├── domain/
        └── pages/
```

第一版不需要真的拆：

```text
独立服务
独立仓库
微前端
npm package
```

先做到**代码和数据边界清晰**即可。

---

# 14. v0.1 数据

Platform：

```text
student
daily_task
learning_app
student_app
```

Irregular Verbs App：

```text
iv_word
iv_mastery
iv_session
iv_attempt
```

一共 8 张表。

---

# 15. v0.1 不做

暂时不做：

```text
AI Tutor

全局 Knowledge Graph

通用 Mastery Engine

通用 Exercise Engine

教材上传

手写

语音

自动生成 Learning App

插件市场

微前端

独立 App 部署
```

这些等真正出现第二、第三个 Learning App 后，再决定哪些能力值得抽到 Platform。

---

# 16. 最重要的架构原则

不要提前把“不规则过去式”抽象成：

```text
Knowledge Point
Exercise
Mastery Engine
Learning Event
```

然后试图设计一个万能教育平台。

v0.1 应该遵循：

```text
先做具体 App
      ↓
出现第二个 App
      ↓
发现真正重复的能力
      ↓
再下沉到 Platform
```

即：

> **先复用已经被证明需要复用的能力，而不是提前设计可复用能力。**

第一版平台只负责：

```text
今天要做什么
+
有哪些学习应用
+
怎么进入学习应用
```

学习本身由各个 Learning App 自己负责。

---

# 17. 后续追加：作业拍照识别导入

根据追加需求，今日事项支持拍照或选择图片，识别为可编辑的作业列表。用户核对后批量保存到所选日期，默认类型为 HOMEWORK；重复项跳过。取消、识别失败或保存失败均不自动添加事项。

OCR 属于 Platform 的事项导入能力，不进入 Learning App。第一版采用浏览器本地中英文识别，不上传或保存照片；手写内容仍需人工核对。此追加需求取代早先「不做 OCR」的限制，不扩大其他排除功能。
