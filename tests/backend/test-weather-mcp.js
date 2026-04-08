/**
 * 天气 MCP 服务器测试
 */

const { mcpClientService } = require('./dist/services/mcp-client.service');

async function testWeather() {
  console.log('🌤️  测试天气 MCP 服务器\n');

  // 等待初始化
  await mcpClientService.waitForInit();

  // 检查连接
  if (!mcpClientService.isClientConnected()) {
    console.log('❌ MCP 客户端未连接');
    return;
  }

  // 获取所有工具
  const tools = mcpClientService.getAvailableTools();
  console.log(`✅ 已连接，共 ${tools.length} 个工具\n`);

  // 按服务器分组显示
  const toolsByServer = {};
  tools.forEach(tool => {
    const server = tool.serverName || 'unknown';
    if (!toolsByServer[server]) {
      toolsByServer[server] = [];
    }
    toolsByServer[server].push(tool);
  });

  console.log('📋 可用的 MCP 服务器和工具:\n');
  for (const [server, serverTools] of Object.entries(toolsByServer)) {
    console.log(`🔧 ${server} (${serverTools.length} 个工具):`);
    serverTools.forEach(tool => {
      console.log(`   • ${tool.name} - ${tool.description || '无描述'}`);
    });
    console.log('');
  }

  console.log('='.repeat(70) + '\n');

  // 测试天气查询
  console.log('🌡️  测试 1：查询天气预警（美国加州）\n');
  try {
    const alertsResult = await mcpClientService.executeMCPCall({
      tool: 'get-alerts',
      arguments: {
        state: 'CA'  // California
      }
    });
    console.log('✅ 天气预警查询成功');
    console.log('结果:', JSON.stringify(alertsResult, null, 2).substring(0, 500) + '...\n');
  } catch (error) {
    console.error('❌ 失败:', error.message, '\n');
  }

  console.log('='.repeat(70) + '\n');

  // 测试天气预报
  console.log('🌤️  测试 2：查询天气预报（旧金山）\n');
  try {
    const forecastResult = await mcpClientService.executeMCPCall({
      tool: 'get-forecast',
      arguments: {
        latitude: 37.7749,   // 旧金山纬度
        longitude: -122.4194  // 旧金山经度
      }
    });
    console.log('✅ 天气预报查询成功');
    console.log('结果:', JSON.stringify(forecastResult, null, 2).substring(0, 800) + '...\n');
  } catch (error) {
    console.error('❌ 失败:', error.message, '\n');
  }

  console.log('='.repeat(70) + '\n');

  // 模拟 AI 使用天气工具
  console.log('🤖 模拟 AI 使用天气工具\n');
  
  const aiResponse = `
遵旨！微臣这就为皇上查询天气。

[MCP_CALL]
{
  "tool": "get-forecast",
  "arguments": {
    "latitude": 37.7749,
    "longitude": -122.4194
  }
}
[/MCP_CALL]

微臣正在查询旧金山的天气...
  `;

  const mcpCalls = mcpClientService.extractMCPCalls(aiResponse);
  console.log(`提取到 ${mcpCalls.length} 个 MCP 调用:`, mcpCalls);
  console.log('');

  if (mcpCalls.length > 0) {
    console.log('执行工具调用...');
    const results = await mcpClientService.executeMCPCalls(mcpCalls);
    results.forEach((result, i) => {
      console.log(`\n工具 ${i + 1}: ${result.tool}`);
      console.log(`状态: ${result.success ? '✅ 成功' : '❌ 失败'}`);
      if (result.success) {
        console.log('结果:', JSON.stringify(result.result, null, 2).substring(0, 300) + '...');
      }
    });
  }

  console.log('\n' + '='.repeat(70) + '\n');

  console.log('🎉 测试完成！\n');
  console.log('💡 现在虚拟人可以：');
  console.log('  ✅ 查询美国各州的天气预警');
  console.log('  ✅ 查询任意经纬度的天气预报');
  console.log('  ✅ 操作文件系统（14个工具）');
  console.log('  ✅ 组合使用多种工具完成任务');
  console.log('\n🌟 总共 16 个 MCP 工具可用！');

  // 断开连接
  await mcpClientService.disconnect();
  process.exit(0);
}

testWeather().catch((error) => {
  console.error('❌ 测试失败:', error);
  process.exit(1);
});
