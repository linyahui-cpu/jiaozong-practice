# 教综练习室

面向江西、广东教师招聘教育综合知识备考的个人网页刷题工具。手机和电脑浏览器可用，无需注册、无需 API Key。

## 开始使用

### Windows 电脑

1. 解压整个项目，保留 `src`、`data`、`advanced` 等文件夹。
2. 双击 **启动练习室.cmd**，保持服务窗口运行。
3. 浏览器访问 **http://127.0.0.1:8765**。

安装了 Node.js 时使用 Node 服务；没有 Node.js 时自动调用 Windows PowerShell 服务。请使用这个固定地址，浏览器按地址分别保存数据。不要直接双击 `index.html`。

也可手动运行：

```powershell
node serve.mjs
```

### 手机使用

方法一：把整个项目部署到 HTTPS 静态网站，手机和电脑打开相同网址即可。可以使用 GitHub Pages、Cloudflare Pages 或其他静态托管服务。本次交付尚未发布到公网。

方法二：电脑装有 Node.js 时，在项目目录运行：

```powershell
node serve.mjs --lan
```

将手机与电脑连接同一 Wi-Fi，打开终端列出的局域网地址。若系统提示网络访问权限，请按需要允许专用网络访问。电脑需保持运行。默认启动器只允许本机访问。

**同一网址不等于数据自动同步**：记录仍保存在当前设备的当前浏览器中。跨设备迁移用“导出完整备份”与“恢复备份”。

## 已实现

- 江西、广东、通用地区入口；城市、年份、学段、模块、题库筛选。
- 顺序 / 随机练习，可选题量；刷新后可继续未完成的答题。
- 单选、多选、判断题；多选须完整匹配答案集合。
- 原答案与解析、来源场次和原题编号查看。
- 错题自动归档、收藏、已掌握标记和练习历史。
- 限时模拟考试，可按来源试卷组卷；交卷后统一显示答案，超时自动交卷。
- JSON、TXT / 粘贴文本导入；可编辑预览后再确认。
- 缺答案、单选答案数量异常、选项答案错位提示；异常题不自动计分。
- 题库单独导出，完整数据备份恢复；重复导入同名同地区题库保留记录。
- 附带 Shiroha Quiz Web 原版的高级文档导入能力。

## 题库内容

默认已内置 **深圳教综历年整理 3727 道**，打开即选中，无需手动导入；另外保留 8 道原创示例。首次更新会自动补入题库，保留已有练习记录。深圳题目来自下方 GitHub 项目，为网友整理／OCR，未经逐题审核；845 道存在选项或答案结构异常，保留查看并标记待核对，不自动计分。江西题库尚需补充。

已找到的资料入口：

- [深圳教师招聘刷题系统](https://github.com/dsplk/teacher-quiz-app)
- [深圳 JSON 题库文件](https://github.com/dsplk/teacher-quiz-app/blob/main/data/questions.json)
- [Shiroha Quiz 上游](https://github.com/reiqr/shiroha-quiz)

深圳题库是网友整理、OCR 提取内容，有错字和水印残留，需要人工核对。题库内容的准确性与授权范围由原来源说明确定。

### 深圳题库导入

1. 在 GitHub 文件页选择下载原始 JSON，保存到设备。
2. 练习室 → 导入备份；名称建议“深圳教综历年整理”，省份“广东”，城市“深圳”。
3. 上传 JSON → 识别并预览。
4. 检查数量、判断题、答案与原题是否匹配，可在预览 JSON 中修正。
5. 确认导入，返回首页选择该题库。

兼容 `{ "questions": [...] }`、题目数组，以及 `text`、`question`、`exam`、`section`、`number`、`major_category`、`options`、`answer`、`explanation`、`analysis`。年份和学段优先取自题目或 `exam`。判断题明确转换原卷约定的 A=正确、B=错误；导入其他来源前请核对其约定。

### 标准 JSON

```json
{
  "name": "我的教综题库",
  "questions": [
    {
      "id": "original-unique-id-1",
      "type": "single",
      "question": "这是格式示例，非真题。",
      "options": {"A": "选项甲", "B": "选项乙"},
      "answer": ["B"],
      "explanation": "保留原资料解析。",
      "province": "广东",
      "city": "深圳",
      "year": "2025",
      "grade": "小学",
      "module": "教育学",
      "source": {"label": "资料来源", "exam": "2025年某考试", "number": 1}
    }
  ]
}
```

`type` 可为 `single`、`multiple`、`boolean`。多选答案使用 `"AC"` 或 `["A","C"]`；判断使用 `"正确"` / `"错误"`。简答、填空仅展示参考内容，需要自评，不自动计分。缺答案用 `[]`，不得猜测补全。

同一题库内请保持题目 ID 唯一和稳定。未提供 ID 时，按题干、场次、原题号生成。修改题干或题号后再次导入可能生成新 ID。

TXT 格式见 **题库导入模板.txt**。复杂材料题、分卷重复编号、答案集中在文末的资料，请先在高级工具整理。

## Word、Excel、PDF 高级导入

“导入备份” → **打开高级导入工具**，进入随附 Shiroha Quiz 原版。

| 格式 | 路径与范围 |
| --- | --- |
| JSON / TXT | 可直接在练习室导入，已测试 |
| DOCX / XLSX / CSV | 用高级工具的原有解析、预览、编辑、确认流程；已验证简单 DOCX 导入与上游 XLSX 模板预览，复杂资料仍需核对 |
| 有文字层 PDF | 高级工具调用 PDF.js，已附带仓库内依赖；复杂排版可能错位 |
| 扫描 PDF / 图片 | 需 OCR 与人工核对；不承诺可直接转换成可靠题库 |

在高级工具保存题库后，回到练习室填写地区信息，点击 **从高级工具读取题库**，核对预览并确认。两页必须使用相同协议、主机和端口。此操作只复制题库，不迁移原版工具的错题、收藏或历史。

高级工具的 AI、WebDAV 等上游功能按原版提供，本次没有配置或验证外部服务。练习室的基础功能不使用这些服务。

## 保存与备份

数据存于浏览器 localStorage，存储键为 `jiaozong-practice-state`。高级工具使用自己的存储键，两套数据独立。

- 导入大量题目后，先导出完整备份。
- 换设备、换浏览器、清缓存前备份。
- 恢复备份会替换当前练习室的数据，操作前请备份现有内容。
- 浏览器存储有容量限制；出现空间不足提示时，应先备份、删减或拆分题库。
- 当前默认每题等权，模拟结果是正确比例；不是各地官方考试的加权分值。

## 开发与测试

纯静态网页，无打包步骤。Node.js 18+（推荐 22+）。

```powershell
node --test test/*.test.mjs
node --check src/app.mjs
node serve.mjs
```

浏览器集成测试需要 Playwright，设置其模块路径后运行：

```powershell
$env:PLAYWRIGHT_MODULE = 'file:///绝对路径/node_modules/playwright/index.mjs'
node test/browser-smoke.mjs
```

源文件职责：`quiz-core.mjs` 负责解析与判题，`storage.mjs` 管数据与备份，`session.mjs` 管练习考试，`app.mjs` 管界面。测试与应用代码一同交付。

## 上游与许可

`advanced/` 为 [reiqr/shiroha-quiz](https://github.com/reiqr/shiroha-quiz) 的 Web 原版文件，快照 **45f0672**，下载日期 2026-10-27，保留原版版权与 GPL-3.0 许可证，README 在 `advanced/UPSTREAM-README.md`。根目录 `serve.ps1` 基于该项目静态服务脚本改端口和提示文字。

新增练习室前台是独立实现；本交付整体按 GPL-3.0 提供，完整源码已经包含。第三方库和题库内容分别遵循各自许可。未复制 `dsplk/teacher-quiz-app` 的应用代码。
