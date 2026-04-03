# 🚀 MCP 快速开始指南

## 5 分钟体验虚拟人操作电脑

### 1. 确认 MCP 已启动

查看后端日志，应该看到：
```
info: MCP Client connected, 14 tools available
```

### 2. 测试 MCP 工具

```bash
cd backend
node test-mcp-simple.js
```

应该看到所有测试通过 ✅

### 3. 给虚拟人下旨

登录系统后，给大臣下达以下任务：

#### 任务 1：创建文件
```
帮我创建一个文件 hello.txt，内容是"Hello from 朝堂!"
```

#### 任务 2：读取文件
```
读取 package.json 文件，告诉我项目名称和版本
```

#### 任务 3：创建项目
```
帮我创建一个新项目，包含：
- src/index.ts 入口文件
- README.md 说明文档
- config.json 配置文件
```

#### 任务 4：搜索文件
```
搜索一下项目中所有的 .ts 文件
```

#### 任务 5：创建完整项目
```
帮我创建一个完整的项目，包含代码、文档和演示文稿
```

### 4. 查看结果

- 代码文件：在项目目录中
- 文档和演示文稿：点击"📁 文件库"按钮查看

### 5. 验证文件

```bash
cd backend
ls -la test-project/
cat test-project/index.ts
```

---

## 🎯 工具调用格式

虚拟人会在回复中使用以下格式：

### MCP 工具
```
[MCP_CALL]
{
  "tool": "write_file",
  "arguments": {
    "path": "hello.txt",
    "content": "Hello!"
  }
}
[/MCP_CALL]
```

### 内置工具
```
[TOOL_CALL]
{
  "tool": "createDocument",
  "parameters": {
    "title": "文档标题",
    "content": "文档内容"
  }
}
[/TOOL_CALL]
```

---

## 💡 提示

1. **明确文件路径**：说清楚文件名和路径
2. **提供完整内容**：告诉虚拟人文件内容是什么
3. **组合使用**：可以同时使用 MCP 和内置工具
4. **验证结果**：让虚拟人读取文件确认

---

## 🐛 常见问题

**Q: 虚拟人没有使用工具？**
A: 确保任务描述明确需要"创建文件"、"读取文件"等操作

**Q: 工具执行失败？**
A: 查看后端日志，检查文件路径是否正确

**Q: 找不到创建的文件？**
A: MCP 工具创建的文件在 `backend/` 目录下

**Q: 如何查看工具列表？**
A: 运行 `node test-mcp-simple.js` 查看所有可用工具

---

## 🎉 开始使用

现在就试试让虚拟人帮你创建文件吧！
