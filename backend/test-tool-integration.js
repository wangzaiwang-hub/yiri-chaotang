/**
 * 工具集成测试 - 模拟完整的 AI 工具调用流程
 * 
 * 使用方法：
 * node test-tool-integration.js
 */

const { toolsService } = require('./dist/services/tools.service');

async function testIntegration() {
  console.log('🧪 测试完整的工具调用流程\n');

  // 模拟 AI 的回复（包含工具调用）
  const aiResponse = `
遵旨！微臣这就为皇上制作一份演示文稿。

让我先构思一下内容……嗯，应该包含朝堂的组织架构、各部门职责，还有工作流程。

[TOOL_CALL]
{
  "tool": "createPresentation",
  "parameters": {
    "title": "朝堂管理系统介绍",
    "slides": [
      {
        "title": "组织架构",
        "content": "三省：中书省（规划）、门下省（审核）、尚书省（执行）\\n六部：户部、礼部、兵部、刑部、工部、吏部"
      },
      {
        "title": "工作流程",
        "content": "1. 皇帝下旨\\n2. 中书省规划\\n3. 门下省审核\\n4. 尚书省派发\\n5. 六部执行\\n6. 汇总上报"
      },
      {
        "title": "核心特色",
        "content": "• 虚拟人自动处理任务\\n• 实时怨气值系统\\n• 智能工具调用\\n• 多人协作"
      }
    ]
  }
}
[/TOOL_CALL]

微臣已经准备好演示文稿的内容了，正在生成……
  `;

  console.log('📨 AI 回复（包含工具调用）:');
  console.log(aiResponse);
  console.log('\n' + '='.repeat(60) + '\n');

  // 步骤 1：提取工具调用
  console.log('🔍 步骤 1：提取工具调用');
  const toolCalls = toolsService.extractToolCalls(aiResponse);
  console.log(`找到 ${toolCalls.length} 个工具调用:`);
  console.log(JSON.stringify(toolCalls, null, 2));
  console.log('');

  // 步骤 2：执行工具
  console.log('⚙️  步骤 2：执行工具');
  const results = await toolsService.executeToolCalls(toolCalls);
  console.log('工具执行结果:');
  results.forEach((result, index) => {
    console.log(`\n工具 ${index + 1}: ${result.tool}`);
    console.log(`状态: ${result.success ? '✅ 成功' : '❌ 失败'}`);
    if (result.success) {
      console.log('结果:', JSON.stringify(result.result, null, 2));
    } else {
      console.log('错误:', result.error);
    }
  });
  console.log('\n' + '='.repeat(60) + '\n');

  // 步骤 3：清理 AI 回复
  console.log('🧹 步骤 3：清理 AI 回复（移除工具调用标记）');
  const cleanResponse = toolsService.removeToolCallMarkers(aiResponse);
  console.log(cleanResponse.trim());
  console.log('\n' + '='.repeat(60) + '\n');

  // 步骤 4：构造工具结果消息（发送给 AI）
  console.log('📤 步骤 4：构造工具结果消息（将发送给 AI）');
  const toolResultsMessage = `
【工具执行结果】

${results.map((result, index) => `
工具 ${index + 1}：${result.tool}
${result.success ? '✅ 执行成功' : '❌ 执行失败'}
${result.success ? JSON.stringify(result.result, null, 2) : `错误：${result.error}`}
`).join('\n')}

请根据以上工具执行结果，继续完成任务并给出最终回复。`;
  
  console.log(toolResultsMessage);
  console.log('\n' + '='.repeat(60) + '\n');

  console.log('🎉 测试完成！');
  console.log('\n💡 实际使用时的流程：');
  console.log('1. 皇帝下旨："帮我做一个演示文稿"');
  console.log('2. 大臣虚拟人分析任务，决定使用工具');
  console.log('3. 系统检测到工具调用，执行工具');
  console.log('4. 将工具结果返回给虚拟人');
  console.log('5. 虚拟人整理结果，向皇帝汇报');
  console.log('6. 皇帝可以下载生成的文件');
  console.log('\n📁 生成的文件在 backend/outputs/ 目录下');
}

testIntegration().catch(console.error);
