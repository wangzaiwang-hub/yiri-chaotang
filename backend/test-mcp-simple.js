/**
 * 简单的 MCP 测试
 */

const { Client } = require('@modelcontextprotocol/sdk/client/index.js');
const { StdioClientTransport } = require('@modelcontextprotocol/sdk/client/stdio.js');

async function testMCPSimple() {
  console.log('🧪 简单 MCP 测试\n');

  try {
    // 创建客户端
    console.log('1️⃣ 创建 MCP 客户端...');
    const client = new Client(
      { name: 'test-client', version: '1.0.0' },
      { capabilities: {} }
    );
    console.log('✅ 客户端创建成功\n');

    // 创建传输层
    console.log('2️⃣ 创建传输层...');
    const transport = new StdioClientTransport({
      command: 'npx',
      args: ['-y', '@modelcontextprotocol/server-filesystem', process.cwd()],
    });
    console.log('✅ 传输层创建成功\n');

    // 连接
    console.log('3️⃣ 连接到 MCP 服务器...');
    await client.connect(transport);
    console.log('✅ 连接成功\n');

    // 获取工具列表
    console.log('4️⃣ 获取可用工具...');
    const toolsResult = await client.listTools();
    console.log(`✅ 找到 ${toolsResult.tools.length} 个工具:\n`);
    toolsResult.tools.forEach((tool, i) => {
      console.log(`   ${i + 1}. ${tool.name}`);
    });

    console.log('\n5️⃣ 测试读取文件...');
    const readResult = await client.callTool({
      name: 'read_file',
      arguments: { path: 'package.json' },
    });
    console.log('✅ 文件读取成功');
    console.log('内容长度:', JSON.stringify(readResult).length, '字符\n');

    console.log('6️⃣ 测试写入文件...');
    const writeResult = await client.callTool({
      name: 'write_file',
      arguments: {
        path: 'mcp-test-output.txt',
        content: `MCP 测试成功！\n时间: ${new Date().toLocaleString('zh-CN')}\n`,
      },
    });
    console.log('✅ 文件写入成功: mcp-test-output.txt\n');

    console.log('7️⃣ 测试列出目录...');
    const listResult = await client.callTool({
      name: 'list_directory',
      arguments: { path: '.' },
    });
    console.log('✅ 目录列出成功\n');

    // 关闭连接
    console.log('8️⃣ 关闭连接...');
    await client.close();
    console.log('✅ 连接已关闭\n');

    console.log('🎉 所有测试通过！MCP 集成正常工作！');
    process.exit(0);
  } catch (error) {
    console.error('❌ 测试失败:', error);
    process.exit(1);
  }
}

testMCPSimple();
