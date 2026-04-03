# 🔧 MCP 服务器目录

## ✅ 已安装的服务器

### 1. @modelcontextprotocol/server-filesystem
- **状态**：✅ 已安装并运行
- **工具数量**：14 个
- **功能**：文件系统操作
- **配置**：无需额外配置

### 2. @h1deya/mcp-server-weather
- **状态**：✅ 已安装并运行
- **工具数量**：2 个
- **功能**：美国天气查询
- **配置**：无需额外配置

---

## 📦 推荐安装的服务器

### 🔍 搜索和信息获取

#### 1. @modelcontextprotocol/server-brave-search
**功能**：真实的网络搜索
**需要**：Brave API Key（免费申请：https://brave.com/search/api/）

**安装方法**：
```typescript
{
  name: 'brave-search',
  command: 'npx',
  args: ['-y', '@modelcontextprotocol/server-brave-search'],
  env: { BRAVE_API_KEY: process.env.BRAVE_API_KEY },
  description: '网络搜索'
}
```

**工具**：
- `brave_web_search` - 网络搜索
- `brave_local_search` - 本地搜索

---

#### 2. @modelcontextprotocol/server-fetch
**功能**：获取网页内容
**需要**：无

**安装方法**：
```typescript
{
  name: 'fetch',
  command: 'npx',
  args: ['-y', '@modelcontextprotocol/server-fetch'],
  description: '获取网页内容'
}
```

**工具**：
- `fetch` - 获取 URL 内容

---

### 💻 开发工具

#### 3. @modelcontextprotocol/server-github
**功能**：GitHub 仓库操作
**需要**：GitHub Personal Access Token

**安装方法**：
```typescript
{
  name: 'github',
  command: 'npx',
  args: ['-y', '@modelcontextprotocol/server-github'],
  env: { GITHUB_PERSONAL_ACCESS_TOKEN: process.env.GITHUB_TOKEN },
  description: 'GitHub 操作'
}
```

**工具**：
- `create_or_update_file` - 创建或更新文件
- `search_repositories` - 搜索仓库
- `create_repository` - 创建仓库
- `get_file_contents` - 获取文件内容
- `push_files` - 推送文件
- `create_issue` - 创建 Issue
- `create_pull_request` - 创建 PR
- `fork_repository` - Fork 仓库
- `create_branch` - 创建分支

---

#### 4. @modelcontextprotocol/server-git
**功能**：Git 版本控制
**需要**：无

**安装方法**：
```typescript
{
  name: 'git',
  command: 'npx',
  args: ['-y', '@modelcontextprotocol/server-git'],
  description: 'Git 版本控制'
}
```

**工具**：
- `git_status` - 查看状态
- `git_commit` - 提交更改
- `git_add` - 添加文件
- `git_log` - 查看历史
- `git_diff` - 查看差异

---

### 🗄️ 数据库

#### 5. @modelcontextprotocol/server-postgres
**功能**：PostgreSQL 数据库操作
**需要**：数据库连接字符串

**安装方法**：
```typescript
{
  name: 'postgres',
  command: 'npx',
  args: ['-y', '@modelcontextprotocol/server-postgres', process.env.DATABASE_URL],
  description: 'PostgreSQL 数据库'
}
```

**工具**：
- `query` - 执行 SQL 查询
- `list_tables` - 列出表
- `describe_table` - 查看表结构

---

#### 6. @modelcontextprotocol/server-sqlite
**功能**：SQLite 数据库操作
**需要**：数据库文件路径

**安装方法**：
```typescript
{
  name: 'sqlite',
  command: 'npx',
  args: ['-y', '@modelcontextprotocol/server-sqlite', '--db-path', './data.db'],
  description: 'SQLite 数据库'
}
```

---

### 🌐 浏览器和网络

#### 7. @modelcontextprotocol/server-puppeteer
**功能**：浏览器自动化
**需要**：无

**安装方法**：
```typescript
{
  name: 'puppeteer',
  command: 'npx',
  args: ['-y', '@modelcontextprotocol/server-puppeteer'],
  description: '浏览器自动化'
}
```

**工具**：
- `puppeteer_navigate` - 访问网页
- `puppeteer_screenshot` - 截图
- `puppeteer_click` - 点击元素
- `puppeteer_fill` - 填写表单
- `puppeteer_evaluate` - 执行 JS

---

### 💬 通讯协作

#### 8. @modelcontextprotocol/server-slack
**功能**：Slack 消息和频道管理
**需要**：Slack Bot Token

**安装方法**：
```typescript
{
  name: 'slack',
  command: 'npx',
  args: ['-y', '@modelcontextprotocol/server-slack'],
  env: { SLACK_BOT_TOKEN: process.env.SLACK_BOT_TOKEN },
  description: 'Slack 协作'
}
```

**工具**：
- `slack_post_message` - 发送消息
- `slack_list_channels` - 列出频道
- `slack_get_channel_history` - 获取历史消息

---

### 📊 数据和分析

#### 9. @modelcontextprotocol/server-google-maps
**功能**：地图和位置服务
**需要**：Google Maps API Key

**工具**：
- `geocode` - 地址转经纬度
- `reverse_geocode` - 经纬度转地址
- `directions` - 路线规划
- `places_nearby` - 附近地点

---

## 🎯 安装新 MCP 服务器的步骤

### 1. 在代码中添加配置
编辑 `backend/src/services/mcp-client.service.ts`：

```typescript
const servers = [
  // ... 现有服务器
  {
    name: '服务器名称',
    command: 'npx',
    args: ['-y', 'npm包名', ...其他参数],
    env: { API_KEY: process.env.API_KEY }, // 如果需要
    description: '服务器描述'
  }
];
```

### 2. 添加环境变量（如果需要）
编辑 `backend/.env`：

```env
BRAVE_API_KEY=your_api_key_here
GITHUB_TOKEN=your_token_here
```

### 3. 重新编译和启动
```bash
cd backend
npm run build
npm start
```

### 4. 验证连接
查看日志，应该看到：
```
info: Connected to 服务器名称 server: X tools
info: MCP Clients connected: filesystem, weather, 服务器名称
```

---

## 📊 工具能力矩阵

| 功能类型 | 内置工具 | MCP 工具 | 推荐使用 |
|---------|---------|---------|---------|
| 文件读写 | ❌ | ✅ filesystem | MCP |
| 目录操作 | ❌ | ✅ filesystem | MCP |
| 文档生成 | ✅ createDocument | ❌ | 内置 |
| 演示文稿 | ✅ createPresentation | ❌ | 内置 |
| 数据分析 | ✅ analyzeData | ❌ | 内置 |
| 天气查询 | ❌ | ✅ weather | MCP |
| 网络搜索 | ⚠️ searchWeb（模拟） | ✅ brave-search | MCP |
| GitHub | ❌ | ✅ github | MCP |
| 数据库 | ❌ | ✅ postgres/sqlite | MCP |
| 浏览器 | ❌ | ✅ puppeteer | MCP |

---

## 🎉 当前状态

### 已安装（2个服务器，16个工具）
- ✅ filesystem（14个工具）
- ✅ weather（2个工具）

### 推荐安装
- 🔍 brave-search - 网络搜索
- 💻 github - GitHub 操作
- 🗄️ postgres - 数据库（你已经在用 Supabase）
- 🌐 puppeteer - 浏览器自动化

### 可选安装
- git - Git 版本控制
- slack - 团队协作
- google-maps - 地图服务

---

## 💡 使用场景

### 场景 1：天气 + 文档
```
"查询纽约天气，写一份天气报告"
→ MCP weather + 内置 createDocument
```

### 场景 2：搜索 + 文件
```
"搜索最新的技术趋势，保存到文件"
→ MCP brave-search + MCP write_file
```

### 场景 3：GitHub + 文档
```
"从 GitHub 读取代码，生成文档"
→ MCP github + 内置 createDocument
```

### 场景 4：数据库 + 分析
```
"查询数据库，分析数据，生成报告"
→ MCP postgres + 内置 analyzeData + createDocument
```

---

## 🧪 测试命令

```bash
# 测试天气服务器
cd backend
node test-weather-mcp.js

# 查看所有可用工具
# 在后端日志中查看：
# info: Total 16 tools available
```

---

## 📚 参考资源

- [MCP 官方文档](https://modelcontextprotocol.io/)
- [MCP 服务器列表](https://github.com/modelcontextprotocol/servers)
- [Brave Search API](https://brave.com/search/api/)
- [GitHub Personal Access Token](https://github.com/settings/tokens)
