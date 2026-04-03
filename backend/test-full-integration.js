/**
 * 完整集成测试 - 模拟虚拟人使用内置工具 + MCP 工具
 */

const { toolsService } = require('./dist/services/tools.service');
const { mcpClientService } = require('./dist/services/mcp-client.service');

async function testFullIntegration() {
  console.log('🎭 完整工具集成测试\n');
  console.log('模拟场景：皇帝下旨"帮我创建一个项目，包含文档和代码文件"\n');
  console.log('='.repeat(70) + '\n');

  // 等待 MCP 初始化
  await mcpClientService.waitForInit();

  // 模拟 AI 的第一次回复（包含工具调用）
  const aiFirstResponse = `
遵旨！微臣这就为皇上创建项目。

让我先规划一下：
1. 创建项目目录结构
2. 创建基础代码文件
3. 生成项目文档
4. 制作演示文稿

现在开始执行...

[MCP_CALL]
{
  "tool": "create_directory",
  "arguments": {
    "path": "test-project"
  }
}
[/MCP_CALL]

[MCP_CALL]
{
  "tool": "write_file",
  "arguments": {
    "path": "test-project/index.ts",
    "content": "// 项目入口文件\\nexport function main() {\\n  console.log('Hello, 朝堂!');\\n}\\n"
  }
}
[/MCP_CALL]

[MCP_CALL]
{
  "tool": "write_file",
  "arguments": {
    "path": "test-project/config.json",
    "content": "{\\n  \\"name\\": \\"test-project\\",\\n  \\"version\\": \\"1.0.0\\"\\n}\\n"
  }
}
[/MCP_CALL]

[TOOL_CALL]
{
  "tool": "createDocument",
  "parameters": {
    "title": "项目说明文档",
    "content": "# 测试项目\\n\\n这是一个测试项目。\\n\\n## 功能\\n- 功能 1\\n- 功能 2\\n\\n## 使用方法\\n运行 \`npm start\`"
  }
}
[/TOOL_CALL]

[TOOL_CALL]
{
  "tool": "createPresentation",
  "parameters": {
    "title": "项目介绍",
    "slides": [
      {
        "title": "项目概述",
        "content": "这是一个测试项目"
      },
      {
        "title": "核心功能",
        "content": "功能 1\\n功能 2\\n功能 3"
      }
    ]
  }
}
[/TOOL_CALL]

微臣正在执行...
  `;

  console.log('📨 AI 第一次回复（包含工具调用）:');
  console.log(aiFirstResponse.substring(0, 500) + '...\n');
  console.log('='.repeat(70) + '\n');

  // 步骤 1：提取工具调用
  console.log('🔍 步骤 1：提取工具调用\n');
  
  const toolCalls = toolsService.extractToolCalls(aiFirstResponse);
  console.log(`找到 ${toolCalls.length} 个内置工具调用:`);
  toolCalls.forEach((call, i) => {
    console.log(`  ${i + 1}. ${call.tool}`);
  });
  console.log('');
  
  const mcpCalls = mcpClientService.extractMCPCalls(aiFirstResponse);
  console.log(`找到 ${mcpCalls.length} 个 MCP 工具调用:`);
  mcpCalls.forEach((call, i) => {
    console.log(`  ${i + 1}. ${call.tool} - ${call.arguments.path || ''}`);
  });
  console.log('\n' + '='.repeat(70) + '\n');

  // 步骤 2：执行内置工具
  console.log('⚙️  步骤 2：执行内置工具\n');
  const toolResults = await toolsService.executeToolCalls(toolCalls);
  toolResults.forEach((result, i) => {
    console.log(`工具 ${i + 1}: ${result.tool}`);
    console.log(`状态: ${result.success ? '✅ 成功' : '❌ 失败'}`);
    if (result.success) {
      console.log(`结果: ${result.result.message || JSON.stringify(result.result)}`);
    }
    console.log('');
  });
  console.log('='.repeat(70) + '\n');

  // 步骤 3：执行 MCP 工具
  console.log('🔧 步骤 3：执行 MCP 工具\n');
  const mcpResults = await mcpClientService.executeMCPCalls(mcpCalls);
  mcpResults.forEach((result, i) => {
    console.log(`工具 ${i + 1}: ${result.tool}`);
    console.log(`状态: ${result.success ? '✅ 成功' : '❌ 失败'}`);
    if (!result.success) {
      console.log(`错误: ${result.error}`);
    }
    console.log('');
  });
  console.log('='.repeat(70) + '\n');

  // 步骤 4：验证创建的文件
  console.log('🔍 步骤 4：验证创建的文件\n');
  try {
    const verifyResult = await mcpClientService.executeMCPCall({
      tool: 'list_directory',
      arguments: { path: 'test-project' }
    });
    console.log('✅ test-project 目录内容:');
    console.log(JSON.stringify(verifyResult, null, 2).substring(0, 300));
  } catch (error) {
    console.log('⚠️  目录可能不存在或为空');
  }
  console.log('\n' + '='.repeat(70) + '\n');

  // 步骤 5：清理工具调用标记
  console.log('🧹 步骤 5：清理 AI 回复\n');
  let cleanResponse = toolsService.removeToolCallMarkers(aiFirstResponse);
  cleanResponse = mcpClientService.removeMCPCallMarkers(cleanResponse);
  console.log('清理后的回复:');
  console.log(cleanResponse.trim().substring(0, 300) + '...\n');
  console.log('='.repeat(70) + '\n');

  // 总结
  console.log('🎉 完整集成测试完成！\n');
  console.log('📊 执行统计:');
  console.log(`  • 内置工具调用: ${toolCalls.length} 个`);
  console.log(`  • MCP 工具调用: ${mcpCalls.length} 个`);
  console.log(`  • 内置工具成功: ${toolResults.filter(r => r.success).length}/${toolResults.length}`);
  console.log(`  • MCP 工具成功: ${mcpResults.filter(r => r.success).length}/${mcpResults.length}`);
  console.log('\n💡 虚拟人现在可以：');
  console.log('  ✅ 使用内置工具生成高级文档和演示文稿');
  console.log('  ✅ 使用 MCP 工具直接操作文件系统');
  console.log('  ✅ 组合使用多种工具完成复杂任务');
  console.log('  ✅ 就像 Cursor、Windsurf 一样操作电脑！');

  // 断开连接
  await mcpClientService.disconnect();
  process.exit(0);
}

testFullIntegration().catch((error) => {
  console.error('❌ 测试失败:', error);
  process.exit(1);
});
