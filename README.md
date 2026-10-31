# DIY 机器人工房 · 个人网站

一个纯静态的个人网站，面向机器人设计、制作与编程内容。无框架、无构建步骤，直接部署到 GitHub Pages。

线上地址：<http://diyjqrgf.bbroot.com/>

## 页面

| 文件 | 说明 |
| --- | --- |
| `index.html` | 首页：品牌、能力、自媒体矩阵、精选作品、资料、联系 |
| `works.html` | 作品集：项目档案 + 在研清单 + 项目详情弹窗 |
| `about.html` | 关于：工房介绍、做事方式、在做的事 |
| `404.html` | 自定义 404 页面 |

## 目录

```text
assets/
  css/style.css          全站样式（设计变量都在文件顶部）
  js/main.js             主题切换、导航、滚动动画、弹窗、复制邮箱
  js/works.js            作品数据 + 作品集渲染 + 项目详情
  img/                   优化后的图片、图标、OG 封面
  img/works/             作品图与结构示意图
tools/make-assets.py     从原始图片生成站内图片（可选）
index_files/             旧版素材（新版页面已不再引用）
works_files/             旧版作品图
```

## 本地预览

在项目目录运行任意静态服务器：

```bash
python -m http.server 8000
# 打开 http://localhost:8000/
```

不要直接双击 `index.html`，`file://` 下部分浏览器行为与线上不一致。

## 添加一个作品

编辑 `assets/js/works.js` 顶部的 `projects` 数组，复制一个对象并修改：

- `id`：唯一标识，会作为锚点（如 `pingpong`）
- `title` / `summary` / `description`：标题与介绍
- `tags`：标签
- `cover`：列表封面图
- `gallery`：详情页图片数组
- `specs`：`[名称, 内容]` 参数表
- `links`：详情页按钮
- `note`：图片说明或补充

图片放到 `assets/img/works/`，建议 WebP，宽度 1200px 左右。

## 修改配色

全部颜色在 `assets/css/style.css` 顶部的 `:root` 与 `[data-theme="light"]` 中：

- `--accent`：主强调色（默认信号橙）
- `--cyan`：辅助冷色
- `--bg` / `--panel` / `--text`：背景与文字

## 部署

仓库已配置 GitHub Pages（`.github/workflows/jekyll-gh-pages.yml`），推送到 `main` 后自动构建。`CNAME` 指向 `diyjqrgf.bbroot.com`。

> 注意：`login.html`、`register.html`、`server.js`、`users.json`、`posts.json` 是旧版本地论坛/登录代码，GitHub Pages 纯静态托管无法运行它们，新版页面也没有引用。确认不需要后可以删除。
>
> 页脚 ICP 与公安备案仍是占位符（`xxxxxxxxxx` / `xxxxxxxx`），上线前记得替换成真实备案号。
>
> 自定义域名目前 HTTPS 证书不匹配（`https://diyjqrgf.bbroot.com` 会报证书错误），所以 canonical / OG / sitemap 暂用 `http://`。在 GitHub Pages 里开启 HTTPS（或换用支持证书的域名）后，把这些地址统一替换成 `https://`。
