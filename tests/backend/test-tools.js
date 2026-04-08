/**
 * 工具系统测试脚本
 * 
 * 使用方法：
 * node test-tools.js
 */

const { toolsService } = require('./dist/services/tools.service');

async function testTools() {
  console.log('🧪 开始测试工具系统...\n');

  // 测试 1：创建文档
  console.log('📝 测试 1：创建文档');
  try {
    const result1 = await toolsService.executeToolCall({
      tool: 'createDocument',
      parameters: {
        title: '测试文档',
        content: '这是一个测试文档。\n\n## 章节 1\n内容 1\n\n## 章节 2\n内容 2'
      }
    });
    console.log('✅ 成功:', result1);
  } catch (error) {
    console.error('❌ 失败:', error.message);
  }
  console.log('');

  // 测试 2：创建演示文稿
  console.log('🎬 测试 2：创建演示文稿');
  try {
    const result2 = await toolsService.executeToolCall({
      tool: 'createPresentation',
      parameters: {
        title: '测试演示文稿',
        slides: [
          { title: '第一页', content: '欢迎来到测试演示' },
          { title: '第二页', content: '这是第二页的内容' },
          { title: '第三页', content: '谢谢观看！' }
        ]
      }
    });
    console.log('✅ 成功:', result2);
  } catch (error) {
    console.error('❌ 失败:', error.message);
  }
  console.log('');

  // 测试 3：数据分析
  console.log('📊 测试 3：数据分析');
  try {
    const result3 = await toolsService.executeToolCall({
      tool: 'analyzeData',
      parameters: {
        data: [10, 20, 30, 40, 50],
        analysisType: 'all'
      }
    });
    console.log('✅ 成功:', result3);
  } catch (error) {
    console.error('❌ 失败:', error.message);
  }
  console.log('');

  // 测试 4：创建待办清单
  console.log('✅ 测试 4：创建待办清单');
  try {
    const result4 = await toolsService.executeToolCall({
      tool: 'createTodoList',
      parameters: {
        title: '本周任务',
        items: [
          '完成项目文档',
          '准备演示文稿',
          '代码审查',
          '团队会议'
        ]
      }
    });
    console.log('✅ 成功:', result4);
  } catch (error) {
    console.error('❌ 失败:', error.message);
  }
  console.log('');

  // 测试 5：工具调用提取
  console.log('🔍 测试 5：工具调用提取');
  const aiResponse = `
好的，我来帮你创建文档。

[TOOL_CALL]
{
  "tool": "createDocument",
  "parameters": {
    "title": "测试",
    "content": "内容"
  }
}
[/TOOL_CALL]

文档已创建完成。
  `;
  
  const toolCalls = toolsService.extractToolCalls(aiResponse);
  console.log('提取到的工具调用:', toolCalls);
  
  const cleanResponse = toolsService.removeToolCallMarkers(aiResponse);
  console.log('清理后的回复:', cleanResponse.trim());
  console.log('');

  console.log('🎉 所有测试完成！');
  console.log('📁 生成的文件在 backend/outputs/ 目录下');
}

testTools().catch(console.error);
