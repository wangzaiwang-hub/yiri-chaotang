/**
 * MCP 集成测试
 * 
 * 使用方法：
 * node test-mcp.js
 */

const { mcpClientService } = require('./dist/services/mcp-client.service');

async function testMCP() {
  console.log('🧪 测试 MCP 客户端集成\n');

  // 等待 MCP 客户端初始化
  console.log('⏳ 等待 MCP 客户端初始化...');
  await mcpClientService.waitForInit();
  console.log('✅ 初始化完成\n');

  // 检查连接状态
  console.log('📡 连接状态:', mcpClientService.isClientConnected() ? '✅ 已连接' : '❌ 未连接');
  
  if (!mcpClientService.isClientConnected()) {
    console.log('❌ MCP 客户端未连接，请检查配置');
    return;
  }

  // 获取可用工具
  const tools = mcpClientService.getAvailableTools();
  console.log(`\n🔧 可用工具数量: ${tools.length}`);
  console.log('工具列表:');
  tools.forEach((tool, index) => {
    console.log(`  ${index + 1}. ${tool.name} - ${tool.description || '无描述'}`);
  });

  console.log('\n' + '='.repeat(60) + '\n');

  // 测试 1：读取文件
  console.log('📖 测试 1：读取文件');
  try {
    const result = await mcpClientService.executeMCPCall({
      tool: 'read_file',
      arguments: {
        path: 'package.json'
      }
    });
    console.log('✅ 成功读取文件');
    console.log('文件内容（前 200 字符）:', JSON.stringify(result).substring(0, 200) + '...');
  } catch (error) {
    console.error('❌ 失败:', error.message);
  }
  console.log('');

  // 测试 2：列出目录
  console.log('📁 测试 2：列出目录');
  try {
    const result = await mcpClientService.executeMCPCall({
      tool: 'list_directory',
      arguments: {
        path: '.'
      }
    });
    console.log('✅ 成功列出目录');
    console.log('结果:', JSON.stringify(result, null, 2).substring(0, 300) + '...');
  } catch (error) {
    console.error('❌ 失败:', error.message);
  }
  console.log('');

  // 测试 3：创建文件
  console.log('✍️  测试 3：创建文件');
  try {
    const result = await mcpClientService.executeMCPCall({
      tool: 'write_file',
      arguments: {
        path: 'test-mcp-output.txt',
        content: '这是通过 MCP 创建的测试文件\n创建时间: ' + new Date().toLocaleString('zh-CN')
      }
    });
    console.log('✅ 成功创建文件: test-mcp-output.txt');
    console.log('结果:', result);
  } catch (error) {
    console.error('❌ 失败:', error.message);
  }
  console.log('');

  // 测试 4：工具调用提取
  console.log('🔍 测试 4：工具调用提取');
  const aiResponse = `
好的，我来帮你创建文件。

[MCP_CALL]
{
  "tool": "write_file",
  "arguments": {
    "path": "example.txt",
    "content": "示例内容"
  }
}
[/MCP_CALL]

文件已创建完成。
  `;
  
  const mcpCalls = mcpClientService.extractMCPCalls(aiResponse);
  console.log('提取到的 MCP 调用:', mcpCalls);
  
  const cleanResponse = mcpClientService.removeMCPCallMarkers(aiResponse);
  console.log('清理后的回复:', cleanResponse.trim());
  console.log('');

  console.log('='.repeat(60));
  console.log('\n🎉 测试完成！');
  console.log('\n💡 MCP 工具可以让虚拟人：');
  console.log('  • 读取和写入文件');
  console.log('  • 列出目录内容');
  console.log('  • 搜索文件');
  console.log('  • 获取文件信息');
  console.log('  • 创建和修改文件');
  console.log('\n这样虚拟人就能真正操作文件系统了！');

  // 断开连接
  await mcpClientService.disconnect();
}

testMCP().catch(console.error);
