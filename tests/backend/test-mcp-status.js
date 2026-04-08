const axios = require('axios');

// 测试 MCP 工具状态
async function testMCPStatus() {
  try {
    console.log('=== 测试 MCP 工具状态 ===\n');

    // 1. 检查后端是否运行
    try {
      const healthCheck = await axios.get('http://localhost:3001/health');
      console.log('✅ 后端服务运行正常');
      console.log('健康检查:', healthCheck.data);
    } catch (error) {
      console.error('❌ 后端服务未运行！请先启动后端服务：');
      console.error('   cd backend && npm run dev');
      return;
    }

    console.log('\n=== MCP 工具检查 ===');
    console.log('MCP 工具应该在后端启动时自动初始化');
    console.log('请检查后端控制台日志，查找以下信息：');
    console.log('  - "Initializing MCP clients..."');
    console.log('  - "Connected to filesystem server: X tools"');
    console.log('  - "Connected to weather server: X tools"');
    console.log('  - "MCP Clients connected: filesystem, weather"');
    
    console.log('\n=== 文件输出目录 ===');
    console.log('内置工具创建的文件位置：backend/outputs/');
    console.log('MCP 工具创建的文件位置：backend/（项目根目录）');
    
    console.log('\n=== 如何测试 MCP 工具 ===');
    console.log('1. 确保后端正在运行');
    console.log('2. 在朝堂中发布任务，要求大臣创建文件');
    console.log('3. 例如："帮我创建一个名为 test.txt 的文件，内容是 Hello World"');
    console.log('4. 检查 backend/ 目录下是否生成了文件');
    
    console.log('\n=== 常见问题 ===');
    console.log('Q: 为什么没有生成文件？');
    console.log('A: 可能原因：');
    console.log('   1. MCP 客户端初始化失败（检查后端日志）');
    console.log('   2. AI 没有调用工具（任务描述不够明确）');
    console.log('   3. 工具调用失败（检查后端错误日志）');
    
    console.log('\nQ: 如何查看后端日志？');
    console.log('A: 在运行 npm run dev 的终端窗口中查看');

  } catch (error) {
    console.error('测试失败:', error.message);
  }
}

testMCPStatus();
