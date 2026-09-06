# 腾讯云 CloudBase 数据库接入

该项目在服务端检测到 CloudBase 环境变量后，商品读取、新增、更新和删除会使用 CloudBase PostgreSQL。没有配置时继续使用原来的 `DATABASE_URL` / 本地 PGLite 路径。

部署平台需要配置：

```text
CLOUDBASE_ENV_ID=你的环境ID
CLOUDBASE_REGION=ap-shanghai
TENCENTCLOUD_SECRETID=部署专用SecretId
TENCENTCLOUD_SECRETKEY=部署专用SecretKey
```

若环境位于新加坡，把地域改成 `ap-singapore`。

密钥只应配置在部署平台的环境变量或密钥管理中，不要写进源码、`.env` 或 GitHub。建议使用权限限定到目标 CloudBase 环境的子账号密钥。

首次接入前，在 CloudBase SQL 编辑器执行 `guanqiao-import-87-styles.sql`。成功后应返回 `total_styles = 87`。

当前商品图片路径仍为 `/catalog/...`，由网站的 `public/catalog` 提供；迁移数据库不会自动将图片上传到 CloudBase 云存储。
