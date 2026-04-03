# 🌤️ 天气 MCP 服务器使用指南

## ✅ 已安装的 MCP 服务器

### 1. 文件系统服务器（filesystem）
- **工具数量**：14 个
- **功能**：读写文件、创建目录、搜索文件等

### 2. 天气服务器（weather）⭐️ 新增
- **工具数量**：2 个
- **功能**：查询美国天气预警和预报

**总计**：16 个 MCP 工具可用！

---

## 🌡️ 天气工具

### 1. get-alerts - 查询天气预警
**功能**：获取美国各州的天气预警信息

**参数**：
- `state`: 美国州代码（如 CA, NY, TX）

**示例**：
```json
{
  "tool": "get-alerts",
  "arguments": {
    "state": "CA"
  }
}
```

**返回**：
- 预警事件类型（如 Wind Advisory）
- 影响区域
- 严重程度
- 预警时间

---

### 2. get-forecast - 查询天气预报
**功能**：获取指定经纬度的天气预报

**参数**：
- `latitude`: 纬度
- `longitude`: 经度

**示例**：
```json
{
  "tool": "get-forecast",
  "arguments": {
    "latitude": 37.7749,
    "longitude": -122.4194
  }
}
```

**返回**：
- 未来多天的天气预报
- 温度、风速、天气状况
- 按时间段详细预报

---

## 🎯 实际使用示例

### 示例 1：查询旧金山天气
**皇帝下旨**：
```
帮我查一下旧金山的天气
```

**大臣回复**：
```
遵旨！微臣这就为皇上查询旧金山的天气...

[MCP_CALL]
{
  "tool": "get-forecast",
  "arguments": {
    "latitude": 37.7749,
    "longitude": -122.4194
  }
}
[/MCP_CALL]

（系统执行工具，返回天气数据）

回禀皇上，旧金山今日天气：
- 今晚：49°F，可能有阵雨
- 明天：65°F，晴朗
- 风速：12-23 mph
...
```

---

### 示例 2：查询加州天气预警
**皇帝下旨**：
```
查一下加州有没有天气预警
```

**大臣回复**：
```
遵旨！微臣这就查询...

[MCP_CALL]
{
  "tool": "get-alerts",
  "arguments": {
    "state": "CA"
  }
}
[/MCP_CALL]

回禀皇上，加州目前有以下天气预警：
- 大风警告（Wind Advisory）
- 影响区域：Santa Barbara County
- 严重程度：中等
- 有效期：至今晚 11:00 PM
```

---

### 示例 3：组合使用（天气 + 文档）
**皇帝下旨**：
```
查一下纽约的天气，然后帮我写一份天气报告
```

**大臣回复**：
```
遵旨！微臣先查询天气，再撰写报告...

[MCP_CALL]
{
  "tool": "get-forecast",
  "arguments": {
    "latitude": 40.7128,
    "longitude": -74.0060
  }
}
[/MCP_CALL]

[TOOL_CALL]
{
  "tool": "createDocument",
  "parameters": {
    "title": "纽约天气报告",
    "content": "# 纽约天气报告\n\n## 今日天气\n温度：65°F\n天气：晴朗\n..."
  }
}
[/TOOL_CALL]

天气报告已生成，请皇上在文件库中查看。
```

---

## 📍 常用城市经纬度

### 美国主要城市
- **纽约**：40.7128, -74.0060
- **洛杉矶**：34.0522, -118.2437
- **旧金山**：37.7749, -122.4194
- **芝加哥**：41.8781, -87.6298
- **休斯顿**：29.7604, -95.3698
- **西雅图**：47.6062, -122.3321
- **迈阿密**：25.7617, -80.1918
- **波士顿**：42.3601, -71.0589

### 美国州代码
- CA - California（加利福尼亚）
- NY - New York（纽约）
- TX - Texas（德克萨斯）
- FL - Florida（佛罗里达）
- IL - Illinois（伊利诺伊）
- WA - Washington（华盛顿）
- MA - Massachusetts（马萨诸塞）

---

## 🧪 测试结果

### 测试 1：查询加州天气预警
```
✅ 成功
返回：Wind Advisory（大风警告）
区域：Santa Barbara County
```

### 测试 2：查询旧金山天气预报
```
✅ 成功
返回：未来7天天气预报
- 今晚：49°F，可能有阵雨
- 明天：65°F，晴朗
- 后天：73°F，晴朗
...
```

---

## 💡 使用建议

### 1. 明确位置
```
✅ "查询旧金山（37.7749, -122.4194）的天气"
❌ "查询天气"（没有指定位置）
```

### 2. 使用正确的州代码
```
✅ "查询加州（CA）的天气预警"
❌ "查询California的天气预警"
```

### 3. 组合使用工具
```
✅ "查询天气 + 生成报告"
✅ "查询天气 + 创建文件"
```

---

## 🚀 扩展更多 MCP 服务器

### 可以添加的服务器

1. **@modelcontextprotocol/server-brave-search**
   - 真实的网络搜索
   - 需要 Brave API Key

2. **@modelcontextprotocol/server-github**
   - GitHub 仓库操作
   - 创建 Issue、PR

3. **@modelcontextprotocol/server-postgres**
   - 数据库查询
   - 数据分析

4. **@modelcontextprotocol/server-puppeteer**
   - 浏览器自动化
   - 网页截图

5. **@modelcontextprotocol/server-slack**
   - 发送消息
   - 团队协作

### 添加方法

在 `backend/src/services/mcp-client.service.ts` 中添加：

```typescript
{
  name: 'brave-search',
  command: 'npx',
  args: ['-y', '@modelcontextprotocol/server-brave-search'],
  env: { BRAVE_API_KEY: process.env.BRAVE_API_KEY },
  description: '网络搜索'
}
```

---

## 📊 当前工具统计

| 服务器 | 工具数量 | 主要功能 |
|--------|---------|---------|
| filesystem | 14 | 文件系统操作 |
| weather | 2 | 天气查询 |
| **总计** | **16** | **全部功能** |

---

## 🎉 总结

现在虚拟人可以：
- ✅ 查询美国任意地点的天气
- ✅ 查询各州的天气预警
- ✅ 操作文件系统（读写、创建、搜索）
- ✅ 生成文档和演示文稿
- ✅ 数据分析
- ✅ 组合使用多种工具完成复杂任务

**就像一个真正的助手，既能查天气，又能写文档，还能操作电脑！** 🎊

---

## 🧪 测试命令

```bash
# 测试天气 MCP 服务器
cd backend
node test-weather-mcp.js

# 查看后端日志
# 应该看到：
# info: MCP Clients connected: filesystem, weather
# info: Total 16 tools available
```

---

## 📚 相关文档

- [MCP 集成指南](./MCP_INTEGRATION_GUIDE.md)
- [MCP 成功总结](./MCP_SUCCESS_SUMMARY.md)
- [快速开始](./QUICK_START_MCP.md)
