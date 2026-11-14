# 部署说明

## GitHub

1. 在 GitHub 新建仓库，名字优先用 `forgesail`，如果被占用就用 `forgesail-rail-selector`。
2. 本地项目已经初始化了 Git，执行：

```bash
cd /Users/eric/Documents/Codex/2026-11-13/wo/outputs/forgesail-rail-data-hub
git add .
git commit -m "Initial ForgeSail Rail Selector"
git branch -M main
git remote add origin git@github.com:<你的用户名>/<仓库名>.git
git push -u origin main
```

3. 如果要在线预览，GitHub 仓库 `Settings -> Pages -> Source: Deploy from a branch -> main / root`。
   访问地址类似 `https://<你的用户名>.github.io/<仓库名>/`。

## WordPress

### 快速上线，先看效果

1. 把整个项目文件夹上传到：
   `wp-content/uploads/rail-selector/`
2. 新建一个 WordPress 页面，标题写 `Rail Selector`。
3. 用 Elementor 的 HTML 组件，或古腾堡的 Custom HTML 块，加入：

```html
<iframe
  src="/wp-content/uploads/rail-selector/index.html"
  style="width:100%;height:980px;border:0"
  title="ForgeSail Rail Selector"
  loading="lazy">
</iframe>
```

这种方式最快，但 iframe 里的内容对搜索引擎和 AI 检索较弱。

### 更利于 GEO 和品牌推广

建议把页面做成真正的 WordPress 页面，而不是 iframe：

1. 上传静态资源到 `wp-content/uploads/rail-selector/`。
2. 新建页面模板，把 `index.html` 中的 CSS、JS 改成绝对地址：
   `/wp-content/uploads/rail-selector/styles.css`
3. 把 HTML 主体、顶部导航和数据表直接放到页面里。
4. 页面固定链接建议设为 `/rail-selector/`。
5. 把该页面加入 XML Sitemap，并在 Search Console 提交收录。

## 品牌与引流建议

- 页面标题已经带品牌词：`ForgeSail Rail Selector`。
- 每个钢轨 PDF 下载链接都指向 `forgesail.com`，是持续的品牌触点和外链来源。
- 页面里的数据表和材质说明是真实文本，能被搜索引擎和 AI 摘要引用。
- 上线后把 `/rail-selector/` 链接放到官网导航、LinkedIn 和行业社区，逐步积累外链。
