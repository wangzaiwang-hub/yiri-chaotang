# SecondMe 回调 URL 配置指南

## 问题

登录时出现"应用未找到 Redirect URI mismatch"错误。

## 原因

SecondMe OAuth 需要预先在开发者平台配置允许的回调 URL。当前尝试使用的回调 URL：
```
http://192.168.124.47:3001/api/auth/callback
```
还没有在 SecondMe 平台添加。

## 解决步骤

### 1. 访问 SecondMe 开发者平台

打开：https://develop.second-me.cn/integrations/list

### 2. 找到你的应用

- Client ID: `9b8f2a1b-905d-48c3-8db3-aa96085f8148`
- 点击应用进入详情页

### 3. 编辑重定向 URI

在应用设置中找到"重定向 URI"（Redirect URIs）部分，添加以下 URL：

```
http://192.168.124.47:3001/api/auth/callback
```

### 4. 保存配置

点击保存按钮，等待配置生效。

### 5. 测试登录

1. 返回前端：http://192.168.124.47:3000
2. 刷新页面（Cmd+Shift+R）
3. 点击登录
4. 应该能正常跳转并回调

## 建议配置多个回调 URL

为了方便开发和测试，建议同时配置以下回调 URL：

```
http://localhost:3001/api/auth/callback
http://192.168.124.47:3001/api/auth/callback
http://10.251.1.1:3001/api/auth/callback
https://disappointed-tiliaceous-noah.ngrok-free.dev/api/auth/callback
https://你的Railway域名.up.railway.app/api/auth/callback
```

这样可以在不同环境下都能正常使用。

## 常见问题

### Q: 配置后还是报错？

A: 
1. 确认 URL 完全一致（包括协议、端口、路径）
2. 等待几秒钟让配置生效
3. 清除浏览器缓存重试

### Q: 找不到应用设置？

A: 
1. 确认已登录 SecondMe 开发者平台
2. 确认使用的是创建应用的账号
3. 检查应用列表中是否有对应的 Client ID

### Q: 可以使用通配符吗？

A: 
SecondMe 不支持通配符，需要逐个添加完整的回调 URL。

## 截图参考

在 SecondMe 开发者平台，重定向 URI 配置应该类似这样：

```
┌─────────────────────────────────────────────┐
│ 重定向 URI                                   │
├─────────────────────────────────────────────┤
│ http://localhost:3001/api/auth/callback     │
│ http://192.168.124.47:3001/api/auth/callback│
│ [添加更多...]                                │
└─────────────────────────────────────────────┘
```

## 完成后

配置完成后，你应该能够：

1. ✅ 在本机访问 http://localhost:3000 并登录
2. ✅ 在局域网其他设备访问 http://192.168.124.47:3000 并登录
3. ✅ 登录后正确跳转回前端页面
4. ✅ 看到用户信息和朝堂列表

## 需要帮助？

如果配置后还有问题，请检查：

1. SecondMe 平台的回调 URL 是否保存成功
2. 后端 `.env` 文件的 `BASE_URL` 是否正确
3. 前端 `.env` 文件的 `VITE_API_URL` 是否正确
4. 浏览器控制台是否有其他错误信息

---

配置完成后，整个系统就可以在局域网中正常使用了！🎉
