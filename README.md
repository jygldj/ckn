# 三省轩主文集

古典诗词与散文杂记的个人文集站点，纯静态前端 + Cloudflare Pages 部署，支持离线阅读（PWA）、全文搜索与划词查字典。线上地址：`https://sxxz.pages.dev`。

---

## 一、目录结构与文件功能

### 目录结构

```
三省轩主文集 (ckn)/
├── index.html          入口 / 封面页（扉页）
├── index1.html         阅读主页
├── jianjie.html        简介页
├── search.html         全文搜索页
├── build.html          更新工具（浏览器端重新生成文章索引）
├── dict.html           划词释义独立查询 / 演示页
│
├── articles.js         文章索引数据（由构建工具自动生成，勿手改）
├── site-config.js      站点全局配置（SITE_BASE 站点域名）
├── render.js           正文渲染器 DXRender + 主题 DXTheme（夜间模式 / 字号 / 分享）
├── reader.js           阅读主页逻辑（分卷导航、文章切换、搜索、SW 注册）
├── dict.js             划词查字典前端（选中文字 → 请求接口弹释义）
│
├── style.css           主样式（赭石系配色）
├── cover.css           封面样式（被 sw.js 预缓存）
├── sw.js               Service Worker（离线缓存，PWA）
│
├── articles/           191 篇 .md 文章源文件
│   ├── 001-初夏记事.md
│   └── … （002 ~ 191）
├── images/
│   └── ckn.jpg         作者肖像
│
├── functions/
│   └── api/
│       └── dict.js     划词释义后端（Cloudflare Pages Function + KV）
│
├── push-now.bat        推送辅助脚本（⚠️ 当前仍指向 wx 仓库路径，ckn 使用需先改路径）
└── 更新网站.bat        一键用 Edge 打开更新工具（build.html）
```

### 页面文件

| 文件 | 功能 |
|------|------|
| `index.html` | 入口封面页。展示作者肖像、"进入文集"按钮、友情链接与访问量；注册 Service Worker。点击进入跳转 `index1.html`。 |
| `index1.html` | 阅读主页。加载 `articles.js` 渲染文章列表与正文，提供分卷导航、主题切换、侧边栏、搜索框等，由 `reader.js` 驱动。 |
| `jianjie.html` | 简介页。介绍作者"三省轩主"并显示肖像。 |
| `search.html` | 全文搜索页。基于 `articles.js` 检索标题与正文，复用 `render.js` 渲染结果。 |
| `build.html` | 更新工具。在浏览器中扫描 `articles/` 目录、调用 `build-core.js` 重新生成 `articles.js`，供新增 / 修改文章后刷新数据。 |
| `dict.html` | 划词释义的独立查询与演示页。 |

### 脚本与配置

| 文件 | 功能 |
|------|------|
| `articles.js` | 由构建工具生成的结构化文章索引（标题、分类、日期、正文等），供阅读页与搜索页读取。 |
| `site-config.js` | 站点全局配置，定义 `SITE_BASE`（站点域名），被 `dict.js` 等引用。 |
| `render.js` | `DXRender` 将 Markdown 纯文本渲染为 HTML（段落、诗词、标题、粗体、插图）；`DXTheme` 提供夜间模式、字号调节、分享，记忆于 localStorage，全站生效。 |
| `reader.js` | 阅读主页核心逻辑：分卷（每卷 50 篇）、文章切换、动态生成卷导航按钮、搜索过滤、Service Worker 注册等。 |
| `dict.js` | 划词查字典前端：在文章 / 搜索页选中 1~4 字词语，向 Pages Function 查询拼音与释义并弹出解释框，兼容桌面与移动端。 |
| `style.css` | 全站主样式，采用赭石 / 宣纸黄的古典配色。 |
| `cover.css` | 封面相关样式，被 `sw.js` 列入预缓存清单。 |
| `sw.js` | Service Worker。HTML / 文章数据走网络优先 + 超时回退，静态资源走缓存优先 + 后台更新；首次打开即可离线。 |

### 数据与资源

| 路径 | 功能 |
|------|------|
| `articles/` | 191 篇 Markdown 文章源文件（编号 001~191），新增或修改文章后需用 `build.html` 重新生成索引。 |
| `images/ckn.jpg` | 作者肖像，被 `index.html` 与 `jianjie.html` 引用。 |
| `functions/api/dict.js` | 划词释义后端。Cloudflare Pages Function，从 KV 命名空间 `DICT_KV` 读取拼音与释义，按单字 / 成语 / 词语（首字分桶）查询，边缘缓存一天。 |

### 部署辅助脚本

| 文件 | 功能 |
|------|------|
| `更新网站.bat` | 一键用 Edge 打开 `build.html` 更新工具，生成索引后照常用 GitHub Desktop 提交。 |
| `push-now.bat` | 一键推送脚本。**注意：当前脚本内仍写死 `F:\github-dx\wx` 与 wx 仓库地址，是复制自姊妹站的遗留，ckn 使用前需改为本仓库路径与 `jygldj/ckn` 地址。** |

---

## 二、日常维护要点

- **新增 / 修改文章**：在 `articles/` 放入或编辑 `.md` 文件 → 双击 `更新网站.bat` 打开更新工具 → 点"开始更新"生成 `articles.js` → 用 GitHub Desktop 提交推送，Cloudflare 自动部署。
- **文章格式**：首行 `# 标题`；其后 `> 分类｜日期`（`｜` 或 `|` 均可）；其余为正文，支持 `##`/`###` 标题、`**粗体**`、`![图](路径)` 等标记。
- **划词释义**：后端依赖 Cloudflare Pages 项目绑定的 KV 命名空间 `DICT_KV`，绑定后需重新部署一次生效。
- **离线缓存**：改动后若线上未刷新，可在 Cloudflare 控制台清除缓存或重新部署。

> 姊妹站：[道玄文集](https://dxwj.pages.dev/) ｜ [增删卜易](https://dxzsby.pages.dev/index.html)
