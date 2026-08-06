# Cloudflare Pages 部署

本仓库按纯静态 Vue/Vite 应用部署，不需要数据库或常驻后端。

## Cloudflare Pages 设置

- Git 仓库：`iszkq/PPTist`
- 生产分支：`main`
- 框架预设：`Vite`
- 构建命令：`npm run build`
- 构建输出目录：`dist`
- 根目录：`/`
- Node.js 版本：`20`

Cloudflare Pages 连接 GitHub 仓库后，每次推送到 `main` 都会自动构建和发布。

## 本地验证

```bash
npm ci
npm run build
```

构建结果位于 `dist`。`wrangler.toml` 也支持使用 Wrangler 直接发布：

```bash
npx wrangler pages deploy dist --project-name pptist
```

## 说明

- PPT 编辑、导入和导出主要在浏览器中完成。
- AI 生成、AI 写作和图片搜索依赖 `server.pptist.cn`，需要联网。
- 用户数据主要保存在当前浏览器中，建议定期导出 `.pptist` 工程文件备份。
