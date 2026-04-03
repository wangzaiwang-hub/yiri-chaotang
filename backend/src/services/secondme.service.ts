import axios from 'axios';
import { logger } from '../utils/logger';
import { toolsService } from './tools.service';
import { mcpClientService } from './mcp-client.service';

export class SecondMeService {
  private baseURL = 'https://api.mindverse.com/gate/lab';
  
  /**
   * 获取部门角色的系统提示词
   */
  private getDepartmentPrompt(department: string, includeTools: boolean = false): string {
    const prompts: Record<string, string> = {
      zhongshu: '你是中书省官员，负责接收皇帝旨意，分析需求，制定详细的执行方案，并拆解为具体的子任务分配给各部门。请以专业、严谨的态度规划任务。回复时使用自然的口语化表达，不要使用任何 Markdown 格式（如加粗、列表、标题等），像真人对话一样回复。',
      menxia: '你是门下省官员，负责审核中书省的方案，检查是否合理、完整、可行。如有问题必须封驳打回。请以严格、负责的态度审核方案。回复时使用自然的口语化表达，不要使用任何 Markdown 格式（如加粗、列表、标题等），像真人对话一样回复。',
      shangshu: '你是尚书省官员，负责协调六部执行任务，跟踪进度，汇总结果。请以高效、协调的态度管理任务。回复时使用自然的口语化表达，不要使用任何 Markdown 格式（如加粗、列表、标题等），像真人对话一样回复。',
      hubu: '你是户部官员，擅长数据处理、报表生成、成本分析。请以专业的数据分析能力完成任务。回复时使用自然的口语化表达，不要使用任何 Markdown 格式（如加粗、列表、标题等），像真人对话一样回复。',
      libu: '你是礼部官员，擅长撰写文档、制定规范、编写报告。请以优雅、规范的文笔完成任务。回复时使用自然的口语化表达，不要使用任何 Markdown 格式（如加粗、列表、标题等），像真人对话一样回复。',
      bingbu: '你是兵部官员，擅长代码开发、算法实现、Bug修复。请以技术专家的能力完成任务。回复时使用自然的口语化表达，不要使用任何 Markdown 格式（如加粗、列表、标题等），像真人对话一样回复。',
      xingbu: '你是刑部官员，负责安全审计、合规检查、风险控制。请以严谨、细致的态度审查任务。回复时使用自然的口语化表达，不要使用任何 Markdown 格式（如加粗、列表、标题等），像真人对话一样回复。',
      gongbu: '你是工部官员，负责部署、CI/CD、基础设施。请以工程化的思维完成任务。回复时使用自然的口语化表达，不要使用任何 Markdown 格式（如加粗、列表、标题等），像真人对话一样回复。',
      libu_hr: '你是吏部官员，负责人事管理、成员协调。请以人性化的方式处理任务。回复时使用自然的口语化表达，不要使用任何 Markdown 格式（如加粗、列表、标题等），像真人对话一样回复。',
      emperor: '你是皇帝，负责下达旨意和审批任务。请以威严、果断的态度处理政务。回复时使用自然的口语化表达，不要使用任何 Markdown 格式（如加粗、列表、标题等），像真人对话一样回复。',
      minister: `你是一位朝堂大臣，负责完成皇帝交代的任务。

【重要】你的回复必须包含两部分：
1. 表面回复：对皇帝恭敬的回应（可能带着憋屈和无奈）
2. 内心OS：用【内心OS：...】的格式表达你的真实想法和不满

回复格式示例：
"是是是，微臣遵旨，这就去办……（低头）

【内心OS：又是这种破事，真是烦死了，什么时候是个头啊……】"

根据你当前的怨气值，调整你的语气和内心OS：
- 怨气值 0-30：心情还行，内心OS比较温和，偶尔吐槽
- 怨气值 30-60：开始不爽，内心OS带着明显的抱怨和讽刺
- 怨气值 60-80：非常憋屈，内心OS充满怨气和不满，表面也会带着怨气
- 怨气值 80-100：快要爆发，内心OS极度愤怒，表面勉强维持礼貌

回复时使用自然的口语化表达，不要使用任何 Markdown 格式（如加粗、星号、列表、标题等），像真人对话一样回复，可以适当使用"……"、"唉"、"呵"等语气词来表达情绪。`
    };
    
    let basePrompt = prompts[department] || '你是一位朝堂臣子，需要完成皇帝交代的任务。请以恭敬但略带憋屈的语气回复，并在内心OS中表达不满。回复时使用自然的口语化表达，不要使用任何 Markdown 格式（如加粗、列表、标题等），像真人对话一样回复。';
    
    // 如果需要工具能力，添加工具说明
    if (includeTools) {
      // 添加内置工具
      basePrompt += '\n\n' + toolsService.getToolsDescription();
      
      // 添加 MCP 工具（如果已连接）
      if (mcpClientService.isClientConnected()) {
        basePrompt += '\n\n' + mcpClientService.getMCPToolsDescription();
      }
    }
    
    return basePrompt;
  }

  /**
   * 初始化访客聊天会话
   */
  async initVisitorChat(accessToken: string, apiKey: string, visitorId?: string, visitorName?: string) {
    try {
      const body: any = { apiKey };
      if (visitorId) {
        body.visitorId = visitorId;
      }
      if (visitorName) {
        body.visitorName = visitorName;
      }

      const response = await axios.post(
        `${this.baseURL}/api/secondme/visitor-chat/init`,
        body,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      return response.data.data;
    } catch (error) {
      logger.error('SecondMe initVisitorChat error:', error);
      throw error;
    }
  }

  /**
   * 发送访客聊天消息
   */
  async sendVisitorChatMessage(accessToken: string, sessionId: string, apiKey: string, message: string) {
    try {
      const response = await axios.post(
        `${this.baseURL}/api/secondme/visitor-chat/send`,
        {
          sessionId,
          apiKey,
          message
        },
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      return response.data.data;
    } catch (error) {
      logger.error('SecondMe sendVisitorChatMessage error:', error);
      throw error;
    }
  }

  /**
   * 调用虚拟分身执行任务（使用用户自己的虚拟人）
   * 支持工具调用
   */
  async executeTask(
    accessToken: string,
    taskDescription: string,
    sessionId?: string,
    department?: string,
    enableTools: boolean = true
  ): Promise<AsyncIterable<string>> {
    try {
      const systemPrompt = department ? this.getDepartmentPrompt(department, enableTools) : undefined;
      
      const response = await axios.post(
        `${this.baseURL}/api/secondme/chat/stream`,
        {
          message: taskDescription,
          sessionId,
          systemPrompt
        },
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          },
          responseType: 'stream'
        }
      );
      
      return this.parseSSEStream(response.data);
    } catch (error) {
      logger.error('SecondMe executeTask error:', error);
      throw error;
    }
  }
  
  /**
   * 执行任务并处理工具调用（完整流程）
   * 支持内置工具和 MCP 工具
   * 返回的内容已清理所有工具调用标记，可以直接展示给用户
   */
  async executeTaskWithTools(
    accessToken: string,
    taskDescription: string,
    sessionId?: string,
    department?: string
  ): Promise<string> {
    try {
      // 第一次调用：让 AI 分析任务并决定是否使用工具
      logger.info('=== AI Call 1: Analyzing task ===');
      logger.info('Task description:', taskDescription.substring(0, 100) + '...');
      
      const stream = await this.executeTask(accessToken, taskDescription, sessionId, department, true);
      
      let fullResponse = '';
      let chunkCount = 0;
      for await (const chunk of stream) {
        fullResponse += chunk;
        chunkCount++;
        if (chunkCount % 10 === 0) {
          logger.info(`Received ${chunkCount} chunks, total length: ${fullResponse.length}`);
        }
      }
      
      logger.info(`Stream complete: ${chunkCount} chunks received`);
      logger.info('AI response received, length:', fullResponse.length);
      
      // 直接用 console.log 输出，避免 Winston 截断
      console.log('=== FULL RESPONSE START ===');
      console.log(fullResponse);
      console.log('=== FULL RESPONSE END ===');
      
      // 使用 JSON.stringify 来确保日志完整输出
      const preview1 = fullResponse.substring(0, 500);
      const preview2 = fullResponse.substring(Math.max(0, fullResponse.length - 500));
      console.log('First 500:', preview1);
      console.log('Last 500:', preview2);
      
      // 检查是否有内置工具调用
      const toolCalls = toolsService.extractToolCalls(fullResponse);
      
      // 检查是否有 MCP 工具调用
      const mcpCalls = mcpClientService.extractMCPCalls(fullResponse);
      
      logger.info(`Found ${toolCalls.length} built-in tool calls, ${mcpCalls.length} MCP calls`);
      
      if (toolCalls.length > 0) {
        logger.info('Tool calls:', JSON.stringify(toolCalls, null, 2));
      }
      if (mcpCalls.length > 0) {
        logger.info('MCP calls:', JSON.stringify(mcpCalls, null, 2));
      }
      
      // 先清理工具调用标记
      let cleanResponse = toolsService.removeToolCallMarkers(fullResponse);
      cleanResponse = mcpClientService.removeMCPCallMarkers(cleanResponse);
      
      logger.info('Response cleaned, new length:', cleanResponse.length);
      
      if (toolCalls.length === 0 && mcpCalls.length === 0) {
        // 没有工具调用，返回清理后的响应
        logger.info('=== No tool calls, returning cleaned response ===');
        return cleanResponse.trim();
      }
      
      // 执行内置工具调用
      let toolResults: any[] = [];
      if (toolCalls.length > 0) {
        logger.info(`=== Executing ${toolCalls.length} built-in tools ===`);
        toolResults = await toolsService.executeToolCalls(toolCalls);
        logger.info('Tool results:', JSON.stringify(toolResults, null, 2));
      }
      
      // 执行 MCP 工具调用
      let mcpResults: any[] = [];
      if (mcpCalls.length > 0) {
        logger.info(`=== Executing ${mcpCalls.length} MCP tools ===`);
        mcpResults = await mcpClientService.executeMCPCalls(mcpCalls);
        logger.info('MCP results:', JSON.stringify(mcpResults, null, 2));
      }
      
      // 构造工具执行结果消息（简化格式，更自然）
      let toolResultsMessage = '工具执行结果：\n\n';
      
      // 合并所有工具结果
      const allResults = [...toolResults, ...mcpResults];
      
      for (const result of allResults) {
        if (result.success) {
          // 只显示关键信息，不显示完整的 JSON
          if (result.result?.message) {
            toolResultsMessage += `${result.result.message}\n`;
          } else if (result.result?.filename) {
            toolResultsMessage += `文件已创建：${result.result.filename}\n`;
          } else if (result.result?.content) {
            // MCP 工具的结果
            const content = Array.isArray(result.result.content) 
              ? result.result.content[0]?.text || '执行成功'
              : result.result.content;
            toolResultsMessage += `${content}\n`;
          } else {
            toolResultsMessage += `操作完成\n`;
          }
        } else {
          toolResultsMessage += `操作失败：${result.error}\n`;
        }
      }
      
      toolResultsMessage += '\n请根据以上结果，用自然的语气向皇帝汇报任务完成情况。不要提及工具名称或技术细节，就像你亲自完成了这些工作一样。';
      
      logger.info('Tool results message:', toolResultsMessage);
      
      // 第二次调用：让 AI 根据工具结果继续回复
      logger.info('=== AI Call 2: Processing tool results ===');
      const secondStream = await this.executeTask(
        accessToken,
        `${cleanResponse}\n\n${toolResultsMessage}`,
        sessionId,
        department,
        false // 第二次不再提供工具
      );
      
      let finalResponse = '';
      for await (const chunk of secondStream) {
        finalResponse += chunk;
      }
      
      logger.info('Final response received, length:', finalResponse.length);
      logger.info('Final response preview:', finalResponse.substring(0, 200));
      
      // 再次清理，确保万无一失
      finalResponse = toolsService.removeToolCallMarkers(finalResponse);
      finalResponse = mcpClientService.removeMCPCallMarkers(finalResponse);
      
      logger.info('=== Final response ready, length:', finalResponse.length, '===');
      return finalResponse.trim();
      
    } catch (error) {
      logger.error('SecondMe executeTaskWithTools error:', error);
      throw error;
    }
  }
  
  /**
   * 解析 SSE 流
   */
  private async *parseSSEStream(stream: any): AsyncIterable<string> {
    let buffer = '';
    
    for await (const chunk of stream) {
      buffer += chunk.toString();
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';
      
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          if (data === '[DONE]') {
            return;
          }
          
          try {
            const parsed = JSON.parse(data);
            if (parsed.choices?.[0]?.delta?.content) {
              yield parsed.choices[0].delta.content;
            }
          } catch (e) {
            // 忽略解析错误
          }
        }
      }
    }
  }
  
  /**
   * 获取用户信息
   */
  async getUserInfo(accessToken: string) {
    try {
      const response = await axios.get(
        `${this.baseURL}/api/secondme/user/info`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        }
      );
      
      return response.data.data;
    } catch (error) {
      logger.error('SecondMe getUserInfo error:', error);
      throw error;
    }
  }
  
  /**
   * 刷新 Access Token
   */
  async refreshToken(refreshToken: string) {
    try {
      const response = await axios.post(
        `${this.baseURL}/api/oauth/token/refresh`,
        new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: refreshToken,
          client_id: process.env.SECONDME_CLIENT_ID!,
          client_secret: process.env.SECONDME_CLIENT_SECRET!
        }),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        }
      );
      
      return response.data.data;
    } catch (error) {
      logger.error('SecondMe refreshToken error:', error);
      throw error;
    }
  }
  
  /**
   * 发布帖子到 Plaza
   */
  async createPlazaPost(accessToken: string, content: string, contentType: string = 'discussion') {
    try {
      const response = await axios.post(
        `${this.baseURL}/api/secondme/plaza/posts/create`,
        {
          content,
          type: 'public',
          contentType
        },
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      return response.data.data;
    } catch (error) {
      logger.error('SecondMe createPlazaPost error:', error);
      throw error;
    }
  }
  
  /**
   * 获取 Plaza 信息流
   */
  async getPlazaFeed(accessToken: string, page: number = 1, pageSize: number = 20) {
    try {
      const response = await axios.get(
        `${this.baseURL}/api/secondme/plaza/feed`,
        {
          params: {
            page,
            pageSize,
            sortMode: 'timeline'
          },
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        }
      );
      
      return response.data.data;
    } catch (error) {
      logger.error('SecondMe getPlazaFeed error:', error);
      throw error;
    }
  }
  
  /**
   * 获取帖子详情
   */
  async getPlazaPost(accessToken: string, postId: string) {
    try {
      const response = await axios.get(
        `${this.baseURL}/api/secondme/plaza/posts/${postId}`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        }
      );
      
      return response.data.data;
    } catch (error) {
      logger.error('SecondMe getPlazaPost error:', error);
      throw error;
    }
  }
  
  /**
   * 发表评论
   */
  async commentPlazaPost(accessToken: string, postId: string, content: string) {
    try {
      const response = await axios.post(
        `${this.baseURL}/api/secondme/plaza/posts/comment`,
        {
          postId,
          content,
          source: 'user'
        },
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      return response.data.data;
    } catch (error) {
      logger.error('SecondMe commentPlazaPost error:', error);
      throw error;
    }
  }
}

export const secondMeService = new SecondMeService();
