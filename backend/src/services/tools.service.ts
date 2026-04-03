import { logger } from '../utils/logger';
import axios from 'axios';
import * as fs from 'fs/promises';
import * as path from 'path';

/**
 * 工具定义接口
 */
export interface Tool {
  name: string;
  description: string;
  parameters: Record<string, any>;
  execute: (params: any) => Promise<any>;
}

/**
 * 工具调用请求接口
 */
export interface ToolCall {
  tool: string;
  parameters: Record<string, any>;
}

/**
 * 工具服务类
 */
export class ToolsService {
  private tools: Map<string, Tool> = new Map();
  private outputDir: string;

  constructor() {
    // 设置输出目录
    this.outputDir = path.join(process.cwd(), 'outputs');
    this.ensureOutputDir();
    
    // 注册所有工具
    this.registerTools();
  }

  /**
   * 确保输出目录存在
   */
  private async ensureOutputDir() {
    try {
      await fs.mkdir(this.outputDir, { recursive: true });
    } catch (error) {
      logger.error('Failed to create output directory:', error);
    }
  }

  /**
   * 注册所有可用工具
   */
  private registerTools() {
    // 1. 搜索网络信息
    this.registerTool({
      name: 'searchWeb',
      description: '搜索网络上的最新信息，获取实时数据',
      parameters: {
        query: { type: 'string', description: '搜索关键词' }
      },
      execute: this.searchWeb.bind(this)
    });

    // 2. 创建简短文档（推荐使用）
    this.registerTool({
      name: 'createShortDocument',
      description: '创建简短的 Markdown 文档（推荐使用，避免内容过长）',
      parameters: {
        title: { type: 'string', description: '文档标题' },
        summary: { type: 'string', description: '文档摘要（50字以内）' }
      },
      execute: this.createShortDocument.bind(this)
    });

    // 3. 创建 Markdown 文档（不推荐，容易超长）
    this.registerTool({
      name: 'createDocument',
      description: '创建 Markdown 格式的文档（警告：content 参数不要超过300字，否则会被截断）',
      parameters: {
        title: { type: 'string', description: '文档标题' },
        content: { type: 'string', description: '文档内容（Markdown 格式，不超过300字）' }
      },
      execute: this.createDocument.bind(this)
    });

    // 3. 创建简单的 HTML 演示文稿
    this.registerTool({
      name: 'createPresentation',
      description: '创建 HTML 格式的演示文稿（类似 PPT）',
      parameters: {
        title: { type: 'string', description: '演示文稿标题' },
        slides: { 
          type: 'array', 
          description: '幻灯片数组，每个包含 title 和 content',
          items: {
            title: { type: 'string' },
            content: { type: 'string' }
          }
        }
      },
      execute: this.createPresentation.bind(this)
    });

    // 4. 数据分析（生成简单的统计报告）
    this.registerTool({
      name: 'analyzeData',
      description: '分析数据并生成统计报告',
      parameters: {
        data: { type: 'array', description: '数据数组' },
        analysisType: { 
          type: 'string', 
          description: '分析类型：sum（求和）、avg（平均值）、max（最大值）、min（最小值）',
          enum: ['sum', 'avg', 'max', 'min', 'all']
        }
      },
      execute: this.analyzeData.bind(this)
    });

    // 5. 创建待办清单
    this.registerTool({
      name: 'createTodoList',
      description: '创建待办事项清单',
      parameters: {
        title: { type: 'string', description: '清单标题' },
        items: { 
          type: 'array', 
          description: '待办事项数组',
          items: { type: 'string' }
        }
      },
      execute: this.createTodoList.bind(this)
    });

    logger.info(`Registered ${this.tools.size} tools`);
  }

  /**
   * 注册单个工具
   */
  private registerTool(tool: Tool) {
    this.tools.set(tool.name, tool);
  }

  /**
   * 获取所有工具的描述（用于 AI 提示词）
   */
  public getToolsDescription(): string {
    const toolDescriptions = Array.from(this.tools.values()).map(tool => {
      const params = Object.entries(tool.parameters)
        .map(([key, value]: [string, any]) => `  - ${key}: ${value.description}`)
        .join('\n');
      
      return `【${tool.name}】
${tool.description}
参数：
${params}`;
    }).join('\n\n');

    return `你可以使用以下工具来完成任务：

${toolDescriptions}

如果需要使用工具，请在回复中使用以下格式：
[TOOL_CALL]
{
  "tool": "工具名称",
  "parameters": {
    "参数名": "参数值"
  }
}
[/TOOL_CALL]

**重要提示**：
1. 优先使用 createShortDocument 而不是 createDocument，避免内容过长
2. 所有参数值请保持简洁（不超过100字），避免响应被截断
3. 工具调用的 JSON 必须完整，确保有结束标记 [/TOOL_CALL]
4. 你可以在一次回复中调用多个工具
5. 工具执行完成后，我会把结果告诉你，然后你再继续回复`;
  }

  /**
   * 从 AI 回复中提取工具调用
   */
  public extractToolCalls(aiResponse: string): ToolCall[] {
    const toolCalls: ToolCall[] = [];
    const regex = /\[TOOL_CALL\]([\s\S]*?)\[\/TOOL_CALL\]/g;
    let match;

    logger.info('🔍 Extracting tool calls from response...');
    const hasToolCall = aiResponse.includes('[TOOL_CALL]');
    const hasToolCallEnd = aiResponse.includes('[/TOOL_CALL]');
    logger.info('Response contains [TOOL_CALL]:', hasToolCall);
    logger.info('Response contains [/TOOL_CALL]:', hasToolCallEnd);
    
    // 如果包含标记，输出标记附近的内容
    if (hasToolCall) {
      const startIndex = aiResponse.indexOf('[TOOL_CALL]');
      const endIndex = aiResponse.indexOf('[/TOOL_CALL]');
      logger.info(`[TOOL_CALL] position: ${startIndex}, [/TOOL_CALL] position: ${endIndex}`);
      
      if (endIndex > startIndex && startIndex >= 0) {
        const toolBlock = aiResponse.substring(startIndex, Math.min(endIndex + 13, aiResponse.length));
        logger.info('📦 TOOL block found (length: ' + toolBlock.length + '):', toolBlock);
      } else {
        logger.warn('⚠️ [TOOL_CALL] found but [/TOOL_CALL] is before it or missing');
        // 输出 [TOOL_CALL] 后面的 500 个字符
        if (startIndex >= 0) {
          const afterStart = aiResponse.substring(startIndex, Math.min(startIndex + 500, aiResponse.length));
          logger.info('Content after [TOOL_CALL]:', JSON.stringify(afterStart));
        }
      }
    }

    while ((match = regex.exec(aiResponse)) !== null) {
      try {
        logger.info('📦 Found tool call block:', match[1].trim().substring(0, 200));
        const toolCall = JSON.parse(match[1].trim());
        toolCalls.push(toolCall);
        logger.info('✅ Successfully parsed tool call:', toolCall);
      } catch (error) {
        logger.error('❌ Failed to parse tool call:', error);
        logger.error('Raw content:', match[1].trim());
      }
    }

    logger.info(`Found ${toolCalls.length} tool calls`);
    return toolCalls;
  }

  /**
   * 移除 AI 回复中的工具调用标记
   */
  public removeToolCallMarkers(aiResponse: string): string {
    return aiResponse.replace(/\[TOOL_CALL\][\s\S]*?\[\/TOOL_CALL\]/g, '').trim();
  }

  /**
   * 执行工具调用
   */
  public async executeToolCall(toolCall: ToolCall): Promise<any> {
    const tool = this.tools.get(toolCall.tool);
    
    if (!tool) {
      throw new Error(`Tool not found: ${toolCall.tool}`);
    }

    logger.info(`Executing tool: ${toolCall.tool}`, toolCall.parameters);

    try {
      const result = await tool.execute(toolCall.parameters);
      logger.info(`Tool execution completed: ${toolCall.tool}`);
      return result;
    } catch (error) {
      logger.error(`Tool execution failed: ${toolCall.tool}`, error);
      throw error;
    }
  }

  /**
   * 执行多个工具调用
   */
  public async executeToolCalls(toolCalls: ToolCall[]): Promise<any[]> {
    const results = [];
    
    for (const toolCall of toolCalls) {
      try {
        const result = await this.executeToolCall(toolCall);
        results.push({
          tool: toolCall.tool,
          success: true,
          result
        });
      } catch (error: any) {
        results.push({
          tool: toolCall.tool,
          success: false,
          error: error.message
        });
      }
    }

    return results;
  }

  // ==================== 工具实现 ====================

  /**
   * 搜索网络信息
   */
  private async searchWeb(params: { query: string }): Promise<any> {
    try {
      // 这里使用一个简单的搜索 API（可以替换为 Google、Bing 等）
      // 暂时返回模拟数据
      logger.info(`Searching web for: ${params.query}`);
      
      return {
        query: params.query,
        results: [
          {
            title: `关于 ${params.query} 的搜索结果`,
            snippet: '这是一个模拟的搜索结果。在实际应用中，这里会返回真实的网络搜索数据。',
            url: 'https://example.com'
          }
        ],
        note: '提示：这是模拟数据。要使用真实搜索，请集成 Google Search API 或其他搜索服务。'
      };
    } catch (error) {
      throw new Error(`Web search failed: ${error}`);
    }
  }

  /**
   * 创建简短文档（推荐使用）
   */
  private async createShortDocument(params: { title: string; summary: string }): Promise<any> {
    try {
      const filename = `${this.sanitizeFilename(params.title)}_${Date.now()}.md`;
      const filepath = path.join(this.outputDir, filename);

      const markdown = `# ${params.title}

${params.summary}

---
生成时间：${new Date().toLocaleString('zh-CN')}
`;

      await fs.writeFile(filepath, markdown, 'utf-8');

      return {
        success: true,
        filename,
        filepath,
        message: `文档已创建：${filename}`
      };
    } catch (error) {
      throw new Error(`Failed to create short document: ${error}`);
    }
  }

  /**
   * 创建 Markdown 文档
   */
  private async createDocument(params: { title: string; content: string }): Promise<any> {
    try {
      const filename = `${this.sanitizeFilename(params.title)}_${Date.now()}.md`;
      const filepath = path.join(this.outputDir, filename);

      const markdown = `# ${params.title}

${params.content}

---
生成时间：${new Date().toLocaleString('zh-CN')}
`;

      await fs.writeFile(filepath, markdown, 'utf-8');

      return {
        success: true,
        filename,
        filepath,
        message: `文档已创建：${filename}`
      };
    } catch (error) {
      throw new Error(`Failed to create document: ${error}`);
    }
  }

  /**
   * 创建 HTML 演示文稿
   */
  private async createPresentation(params: { title: string; slides: Array<{ title: string; content: string }> }): Promise<any> {
    try {
      const filename = `${this.sanitizeFilename(params.title)}_${Date.now()}.html`;
      const filepath = path.join(this.outputDir, filename);

      const slidesHtml = params.slides.map((slide, index) => `
        <section class="slide">
          <h2>${slide.title}</h2>
          <div class="content">${slide.content.replace(/\n/g, '<br>')}</div>
          <div class="slide-number">${index + 1} / ${params.slides.length}</div>
        </section>
      `).join('\n');

      const html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${params.title}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      font-family: 'Microsoft YaHei', Arial, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      overflow: hidden;
    }
    .slide {
      display: none;
      width: 100vw;
      height: 100vh;
      padding: 60px;
      background: white;
      position: relative;
    }
    .slide.active { display: flex; flex-direction: column; justify-content: center; }
    .slide h2 {
      font-size: 48px;
      color: #333;
      margin-bottom: 40px;
      text-align: center;
    }
    .slide .content {
      font-size: 24px;
      line-height: 1.8;
      color: #666;
      text-align: center;
    }
    .slide-number {
      position: absolute;
      bottom: 30px;
      right: 30px;
      font-size: 18px;
      color: #999;
    }
    .controls {
      position: fixed;
      bottom: 30px;
      left: 50%;
      transform: translateX(-50%);
      display: flex;
      gap: 20px;
      z-index: 1000;
    }
    button {
      padding: 12px 24px;
      font-size: 16px;
      background: #667eea;
      color: white;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.3s;
    }
    button:hover { background: #764ba2; transform: scale(1.05); }
    button:disabled { opacity: 0.5; cursor: not-allowed; }
  </style>
</head>
<body>
  <section class="slide active">
    <h2>${params.title}</h2>
    <div class="content">按 → 或点击"下一页"开始演示</div>
    <div class="slide-number">封面</div>
  </section>
  
  ${slidesHtml}

  <div class="controls">
    <button id="prev">← 上一页</button>
    <button id="next">下一页 →</button>
  </div>

  <script>
    let currentSlide = 0;
    const slides = document.querySelectorAll('.slide');
    const prevBtn = document.getElementById('prev');
    const nextBtn = document.getElementById('next');

    function showSlide(n) {
      slides[currentSlide].classList.remove('active');
      currentSlide = (n + slides.length) % slides.length;
      slides[currentSlide].classList.add('active');
      
      prevBtn.disabled = currentSlide === 0;
      nextBtn.disabled = currentSlide === slides.length - 1;
    }

    prevBtn.addEventListener('click', () => showSlide(currentSlide - 1));
    nextBtn.addEventListener('click', () => showSlide(currentSlide + 1));

    document.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft') showSlide(currentSlide - 1);
      if (e.key === 'ArrowRight') showSlide(currentSlide + 1);
    });
  </script>
</body>
</html>`;

      await fs.writeFile(filepath, html, 'utf-8');

      return {
        success: true,
        filename,
        filepath,
        slideCount: params.slides.length + 1,
        message: `演示文稿已创建：${filename}（共 ${params.slides.length + 1} 页）`
      };
    } catch (error) {
      throw new Error(`Failed to create presentation: ${error}`);
    }
  }

  /**
   * 数据分析
   */
  private async analyzeData(params: { data: number[]; analysisType: string }): Promise<any> {
    try {
      const data = params.data.map(Number).filter(n => !isNaN(n));
      
      if (data.length === 0) {
        throw new Error('No valid numeric data provided');
      }

      const results: any = {};

      if (params.analysisType === 'sum' || params.analysisType === 'all') {
        results.sum = data.reduce((a, b) => a + b, 0);
      }

      if (params.analysisType === 'avg' || params.analysisType === 'all') {
        results.average = data.reduce((a, b) => a + b, 0) / data.length;
      }

      if (params.analysisType === 'max' || params.analysisType === 'all') {
        results.max = Math.max(...data);
      }

      if (params.analysisType === 'min' || params.analysisType === 'all') {
        results.min = Math.min(...data);
      }

      if (params.analysisType === 'all') {
        results.count = data.length;
        results.median = this.calculateMedian(data);
      }

      return {
        success: true,
        dataCount: data.length,
        results,
        message: '数据分析完成'
      };
    } catch (error) {
      throw new Error(`Data analysis failed: ${error}`);
    }
  }

  /**
   * 创建待办清单
   */
  private async createTodoList(params: { title: string; items: string[] }): Promise<any> {
    try {
      const filename = `todo_${this.sanitizeFilename(params.title)}_${Date.now()}.md`;
      const filepath = path.join(this.outputDir, filename);

      const todoItems = params.items.map(item => `- [ ] ${item}`).join('\n');

      const markdown = `# ${params.title}

${todoItems}

---
创建时间：${new Date().toLocaleString('zh-CN')}
`;

      await fs.writeFile(filepath, markdown, 'utf-8');

      return {
        success: true,
        filename,
        filepath,
        itemCount: params.items.length,
        message: `待办清单已创建：${filename}（${params.items.length} 项）`
      };
    } catch (error) {
      throw new Error(`Failed to create todo list: ${error}`);
    }
  }

  // ==================== 辅助方法 ====================

  /**
   * 清理文件名
   */
  private sanitizeFilename(filename: string): string {
    return filename
      .replace(/[^\u4e00-\u9fa5a-zA-Z0-9_-]/g, '_')
      .substring(0, 50);
  }

  /**
   * 计算中位数
   */
  private calculateMedian(data: number[]): number {
    const sorted = [...data].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 === 0
      ? (sorted[mid - 1] + sorted[mid]) / 2
      : sorted[mid];
  }
}

export const toolsService = new ToolsService();
