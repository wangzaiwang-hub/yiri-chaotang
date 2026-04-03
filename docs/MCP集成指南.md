# MCP 集成指南 - 让虚拟人操作电脑

## ✅ 集成成功！

MCP (Model Context Protocol) 已成功集成到朝堂系统！虚拟人现在可以：

- 📁 读取和写入文件
- 📂 创建和管理目录
- 🔍 搜索文件
- 📝 编辑文件内容
- 🚚 移动和重命名文件
- 📊 获取文件信息

就像 Cursor、Windsurf 等 AI IDE 一样，虚拟人可以真正操作文件系统了！

---

## 🔧 可用的 MCP 工具（14个）

### 文件读取
1. **read_file** - 读取文件内容
2. **read_text_file** - 读取文本文件
3. **read_media_file** - 读取媒体文件
4. **read_multiple_files** - 批量读取多个文件

### 文件写入
5. **write_file** - 写入文件内容
6. **edit_file** - 编辑文件（部分修改）

### 目录操作
7. **create_directory** - 创建目录
8. **list_directory** - 列出目录内容
9. **list_directory_with_sizes** - 列出目录（包含文件大小）
10. **directory_tree** - 显示目录树结构

### 文件管理
11. **move_file** - 移动或重命名文件
12. **search_files** - 搜索文件
13. **get_file_info** - 获取文件信息
14. **list_allowed_directories** - 列出允许访问的目录

---

## 🎯 使用示例

### 示例 1：创建项目文档
**皇帝下旨**：
```
帮朕创建一个项目文档，文件名叫 project-plan.md，内容包含：
1. 项目目标
2. 时间规划
3. 人员分工
```

**大臣回复**：
```
遵旨！微臣这就为皇上创建项目文档...

[MCP_CALL]
{
  "tool": "write_file",
  "arguments": {
    "path": "project-plan.md",
    "content": "# 项目规划\n\n## 项目目标\n...\n\n## 时间规划\n...\n\n## 人员分工\n..."
  }
}
[/MCP_CALL]

文档已创建完成，请皇上查阅。
```

---

### 示例 2：读取并分析文件
**皇帝下旨**：
```
读取一下 package.json 文件，告诉朕项目用了哪些依赖
```

**大臣回复**：
```
遵旨！微臣这就查看...

[MCP_CALL]
{
  "tool": "read_file",
  "arguments": {
    "path": "package.json"
  }
}
[/MCP_CALL]

（系统执行工具，返回文件内容）

微臣已查阅，项目主要依赖有：
- express: Web 框架
- typescript: 类型系统
- supabase: 数据库客户端
...
```

---

### 示例 3：创建多个文件
**皇帝下旨**：
```
帮朕创建一个新功能的文件结构：
- services/notification.service.ts
- routes/notifications.ts
- types/notification.types.ts
```

**大臣回复**：
```
遵旨！微臣这就创建文件结构...

[MCP_CALL]
{
  "tool": "create_directory",
  "arguments": {
    "path": "src/services"
  }
}
[/MCP_CALL]

[MCP_CALL]
{
  "tool": "write_file",
  "arguments": {
    "path": "src/services/notification.service.ts",
    "content": "export class NotificationService {\n  // TODO: 实现通知服务\n}\n"
  }
}
[/MCP_CALL]

（继续创建其他文件...）

文件结构已创建完成！
```

---

## 🚀 工作流程

```
1. 皇帝下旨
   "帮我创建一个文档"
   
2. 大臣虚拟人分析任务
   判断需要使用 MCP 工具
   
3. 虚拟人在回复中包含 MCP 调用
   [MCP_CALL]
   { "tool": "write_file", ... }
   [/MCP_CALL]
   
4. 后端检测到 MCP 调用
   解析工具名称和参数
   
5. 通过 MCP 客户端执行工具
   实际操作文件系统
   
6. 将执行结果返回给虚拟人
   "文件已创建成功"
   
7. 虚拟人整理结果
   向皇帝汇报完成情况
```

---

## 📊 工具能力对比

### 内置工具（5个）
- ✅ createDocument - 创建 Markdown 文档
- ✅ createPresentation - 创建 HTML 演示文稿
- ✅ analyzeData - 数据分析
- ✅ createTodoList - 创建待办清单
- ⚠️ searchWeb - 搜索网络（模拟）

**特点**：高级功能，生成格式化的文档和演示文稿

### MCP 工具（14个）
- ✅ read_file - 读取文件
- ✅ write_file - 写入文件
- ✅ edit_file - 编辑文件
- ✅ create_directory - 创建目录
- ✅ list_directory - 列出目录
- ✅ move_file - 移动文件
- ✅ search_files - 搜索文件
- ✅ get_file_info - 文件信息
- ... 等 14 个工具

**特点**：底层操作，直接操作文件系统

---

## 🎨 组合使用

虚拟人可以同时使用内置工具和 MCP 工具：

**示例：创建项目结构并生成文档**
```
皇帝：帮我创建一个新项目，包含基本的文件结构和项目文档

大臣：
1. 使用 MCP 创建目录结构
   [MCP_CALL] create_directory
   
2. 使用 MCP 创建基础文件
   [MCP_CALL] write_file
   
3. 使用内置工具生成项目文档
   [TOOL_CALL] createDocument
   
4. 使用内置工具生成演示文稿
   [TOOL_CALL] createPresentation
```

---

## 🔒 安全性

### 访问控制
- MCP 服务器只能访问 `backend` 目录
- 不能访问系统敏感目录
- 所有文件操作都有日志记录

### 权限管理
- 可以配置允许访问的目录
- 可以限制特定工具的使用
- 可以设置文件大小限制

---

## 🧪 测试结果

### MCP 连接测试
```bash
cd backend
node test-mcp-simple.js
```

**结果**：
- ✅ MCP 客户端创建成功
- ✅ 连接到文件系统服务器成功
- ✅ 找到 14 个可用工具
- ✅ 文件读取测试通过
- ✅ 文件写入测试通过
- ✅ 目录列出测试通过

### 后端启动日志
```
✅ 环境变量加载成功
info: Registered 5 tools
info: Initializing MCP client...
info: MCP Client connected, 14 tools available
info: Server running on port 3001
```

---

## 📝 实际使用

### 1. 创建文件
**下旨**：
```
帮我创建一个 README.md 文件，介绍一下朝堂系统
```

### 2. 读取文件
**下旨**：
```
读取一下 package.json，告诉我项目的依赖情况
```

### 3. 搜索文件
**下旨**：
```
搜索一下项目中所有的 .ts 文件
```

### 4. 创建项目结构
**下旨**：
```
帮我创建一个新功能的文件结构：
- src/features/notifications/
  - service.ts
  - routes.ts
  - types.ts
```

### 5. 编辑文件
**下旨**：
```
在 package.json 中添加一个新的依赖：axios
```

---

## 🚀 扩展 MCP 服务器

### 可以添加的 MCP 服务器

1. **@modelcontextprotocol/server-filesystem** ✅ 已集成
   - 文件系统操作

2. **@modelcontextprotocol/server-github**
   - GitHub 仓库操作
   - 创建 Issue、PR
   - 代码审查

3. **@modelcontextprotocol/server-postgres**
   - 数据库查询
   - 数据分析
   - Schema 管理

4. **@modelcontextprotocol/server-brave-search**
   - 真实的网络搜索
   - 获取最新信息

5. **@modelcontextprotocol/server-puppeteer**
   - 浏览器自动化
   - 网页截图
   - 数据抓取

6. **@modelcontextprotocol/server-slack**
   - 发送消息
   - 管理频道
   - 团队协作

### 添加新 MCP 服务器的方法

在 `backend/src/services/mcp-client.service.ts` 中添加：

```typescript
// 连接到多个 MCP 服务器
const servers = [
  {
    name: 'filesystem',
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-filesystem', process.cwd()]
  },
  {
    name: 'github',
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-github']
  }
];
```

---

## 💡 最佳实践

### 1. 明确文件路径
```
✅ "创建文件 src/utils/helper.ts"
❌ "创建一个帮助文件"
```

### 2. 提供完整内容
```
✅ "创建 config.json，内容是 {...}"
❌ "创建一个配置文件"
```

### 3. 分步操作
```
✅ "先创建目录，然后创建文件"
❌ "一次性创建所有东西"
```

### 4. 验证结果
```
✅ "创建文件后，读取一下确认内容"
❌ "创建就行了"
```

---

## 🎉 总结

现在朝堂系统拥有两套工具系统：

### 内置工具（5个）
- 高级功能
- 生成格式化文档
- 数据分析和可视化

### MCP 工具（14个）
- 底层文件操作
- 直接操作文件系统
- 就像 AI IDE 一样

虚拟人可以根据任务需求，灵活选择使用哪种工具，甚至组合使用！

**现在你的虚拟人不仅会说话、会思考，还真的能动手操作电脑了！** 🎊

---

## 📚 相关文件

- `backend/src/services/mcp-client.service.ts` - MCP 客户端服务
- `backend/src/services/tools.service.ts` - 内置工具服务
- `backend/src/services/secondme.service.ts` - SecondMe 集成
- `backend/test-mcp-simple.js` - MCP 测试脚本

---

## 🧪 测试命令

```bash
# 测试 MCP 连接
cd backend
node test-mcp-simple.js

# 查看生成的测试文件
cat mcp-test-output.txt

# 启动后端（MCP 自动初始化）
npm start
```

---

## 🎯 下一步

1. ✅ MCP 文件系统集成
2. ⏳ 添加更多 MCP 服务器（GitHub、数据库等）
3. ⏳ 前端显示工具执行过程
4. ⏳ 工具权限管理
5. ⏳ 工具使用统计和日志
