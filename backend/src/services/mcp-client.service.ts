import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { logger } from '../utils/logger';

/**
 * MCP 客户端服务
 * 连接到 MCP 服务器，让虚拟人可以操作文件系统、执行命令等
 */
/**
 * MCP 客户端服务
 * 连接到多个 MCP 服务器，让虚拟人可以操作文件系统、查询天气、搜索网络等
 */
export class MCPClientService {
  private clients: Map<string, Client> = new Map();
  private transports: Map<string, StdioClientTransport> = new Map();
  private isConnected: boolean = false;
  private availableTools: any[] = [];
  private initPromise: Promise<void> | null = null;

  constructor() {
    // 启动异步初始化，但不阻塞构造函数
    this.initPromise = this.initialize();
  }

  /**
   * 初始化所有 MCP 服务器
   */
  private async initialize() {
    try {
      logger.info('Initializing MCP clients...');
      
      // 定义要连接的 MCP 服务器
      const servers = [
        {
          name: 'filesystem',
          command: 'npx',
          args: ['-y', '@modelcontextprotocol/server-filesystem', `${process.cwd()}/outputs`],
          description: '文件系统操作'
        },
        {
          name: 'weather',
          command: 'npx',
          args: ['-y', '@h1deya/mcp-server-weather'],
          description: '天气查询（美国地区）'
        },
        // 可以添加更多服务器
        // {
        //   name: 'brave-search',
        //   command: 'npx',
        //   args: ['-y', '@modelcontextprotocol/server-brave-search'],
        //   env: { BRAVE_API_KEY: process.env.BRAVE_API_KEY },
        //   description: '网络搜索'
        // },
      ];

      // 连接所有服务器
      for (const serverConfig of servers) {
        try {
          await this.connectServer(serverConfig);
        } catch (error) {
          logger.error(`Failed to connect to ${serverConfig.name} server:`, error);
        }
      }

      this.isConnected = this.clients.size > 0;

      if (this.isConnected) {
        logger.info(`MCP Clients connected: ${Array.from(this.clients.keys()).join(', ')}`);
        logger.info(`Total ${this.availableTools.length} tools available`);
      } else {
        logger.warn('No MCP servers connected');
      }
    } catch (error) {
      logger.error('Failed to initialize MCP clients:', error);
      this.isConnected = false;
    }
  }

  /**
   * 连接单个 MCP 服务器
   */
  private async connectServer(config: {
    name: string;
    command: string;
    args: string[];
    env?: Record<string, string>;
    description?: string;
  }) {
    try {
      // 创建客户端
      const client = new Client(
        {
          name: `chaotang-${config.name}`,
          version: '1.0.0',
        },
        {
          capabilities: {},
        }
      );

      // 创建传输层
      const transport = new StdioClientTransport({
        command: config.command,
        args: config.args,
        env: config.env,
      });

      // 连接
      await client.connect(transport);

      // 获取工具列表
      const toolsResult = await client.listTools();
      
      // 为每个工具添加服务器名称标记
      const toolsWithServer = toolsResult.tools.map(tool => ({
        ...tool,
        serverName: config.name,
        serverDescription: config.description,
      }));

      // 保存客户端和工具
      this.clients.set(config.name, client);
      this.transports.set(config.name, transport);
      this.availableTools.push(...toolsWithServer);

      logger.info(`Connected to ${config.name} server: ${toolsResult.tools.length} tools`);
    } catch (error) {
      throw new Error(`Failed to connect ${config.name}: ${error}`);
    }
  }

  /**
   * 等待初始化完成
   */
  public async waitForInit(): Promise<void> {
    if (this.initPromise) {
      await this.initPromise;
    }
  }

  /**
   * 获取所有可用的 MCP 工具描述（用于 AI 提示词）
   */
  public getMCPToolsDescription(): string {
    if (!this.isConnected || this.availableTools.length === 0) {
      return '';
    }

    // 按服务器分组
    const toolsByServer = new Map<string, any[]>();
    this.availableTools.forEach(tool => {
      const serverName = tool.serverName || 'unknown';
      if (!toolsByServer.has(serverName)) {
        toolsByServer.set(serverName, []);
      }
      toolsByServer.get(serverName)!.push(tool);
    });

    let description = '你可以使用以下 MCP 工具：\n\n';

    // 为每个服务器生成描述
    for (const [serverName, tools] of toolsByServer) {
      const serverDesc = tools[0]?.serverDescription || serverName;
      description += `## ${serverDesc} (${serverName})\n\n`;
      
      tools.forEach(tool => {
        const params = tool.inputSchema?.properties
          ? Object.entries(tool.inputSchema.properties)
              .map(([key, value]: [string, any]) => `  - ${key}: ${value.description || value.type}`)
              .join('\n')
          : '  无参数';

        description += `【${tool.name}】\n${tool.description || '无描述'}\n参数：\n${params}\n\n`;
      });
    }

    description += `\n如果需要使用 MCP 工具，请在回复中使用以下格式：
[MCP_CALL]
{
  "tool": "工具名称",
  "arguments": {
    "参数名": "参数值"
  }
}
[/MCP_CALL]

**重要提示**：
1. 所有参数值请保持简洁（不超过100字），避免响应被截断
2. 工具调用的 JSON 必须完整，确保有结束标记 [/MCP_CALL]
3. 如果需要创建长文档，可以先创建简短版本，然后在工具执行后再补充
4. 你可以在一次回复中调用多个工具
5. 工具执行完成后，我会把结果告诉你，然后你再继续回复`;

    return description;
  }

  /**
   * 从 AI 回复中提取 MCP 工具调用
   */
  public extractMCPCalls(aiResponse: string): Array<{ tool: string; arguments: any }> {
    const mcpCalls: Array<{ tool: string; arguments: any }> = [];
    const regex = /\[MCP_CALL\]([\s\S]*?)\[\/MCP_CALL\]/g;
    let match;

    logger.info('🔍 Extracting MCP calls from response...');
    const hasMCPCall = aiResponse.includes('[MCP_CALL]');
    const hasMCPCallEnd = aiResponse.includes('[/MCP_CALL]');
    logger.info('Response contains [MCP_CALL]:', hasMCPCall);
    logger.info('Response contains [/MCP_CALL]:', hasMCPCallEnd);
    
    // 如果包含标记，输出标记附近的内容
    if (hasMCPCall) {
      const startIndex = aiResponse.indexOf('[MCP_CALL]');
      const endIndex = aiResponse.indexOf('[/MCP_CALL]');
      logger.info(`[MCP_CALL] position: ${startIndex}, [/MCP_CALL] position: ${endIndex}`);
      
      if (endIndex > startIndex && startIndex >= 0) {
        const mcpBlock = aiResponse.substring(startIndex, Math.min(endIndex + 12, aiResponse.length));
        logger.info('📦 MCP block found (length: ' + mcpBlock.length + '):', mcpBlock);
      } else {
        logger.warn('⚠️ [MCP_CALL] found but [/MCP_CALL] is before it or missing');
        // 输出 [MCP_CALL] 后面的 500 个字符
        if (startIndex >= 0) {
          const afterStart = aiResponse.substring(startIndex, Math.min(startIndex + 500, aiResponse.length));
          logger.info('Content after [MCP_CALL]:', afterStart);
        }
      }
    }

    while ((match = regex.exec(aiResponse)) !== null) {
      try {
        logger.info('📦 Found MCP call block:', match[1].trim().substring(0, 200));
        const mcpCall = JSON.parse(match[1].trim());
        mcpCalls.push(mcpCall);
        logger.info('✅ Successfully parsed MCP call:', mcpCall);
      } catch (error) {
        logger.error('❌ Failed to parse MCP call:', error);
        logger.error('Raw content:', match[1].trim());
      }
    }

    logger.info(`Found ${mcpCalls.length} MCP calls`);
    return mcpCalls;
  }

  /**
   * 移除 AI 回复中的 MCP 调用标记
   */
  public removeMCPCallMarkers(aiResponse: string): string {
    return aiResponse.replace(/\[MCP_CALL\][\s\S]*?\[\/MCP_CALL\]/g, '').trim();
  }

  /**
   * 执行 MCP 工具调用
   */
  public async executeMCPCall(mcpCall: { tool: string; arguments: any }): Promise<any> {
    // 确保已初始化
    await this.waitForInit();
    
    if (!this.isConnected || this.clients.size === 0) {
      throw new Error('MCP clients are not connected');
    }

    logger.info(`Executing MCP tool: ${mcpCall.tool}`, mcpCall.arguments);

    // 找到拥有该工具的服务器
    const tool = this.availableTools.find(t => t.name === mcpCall.tool);
    if (!tool) {
      throw new Error(`Tool not found: ${mcpCall.tool}`);
    }

    const serverName = tool.serverName;
    const client = this.clients.get(serverName);
    
    if (!client) {
      throw new Error(`Server not found for tool: ${mcpCall.tool}`);
    }

    try {
      const result = await client.callTool({
        name: mcpCall.tool,
        arguments: mcpCall.arguments,
      });

      logger.info(`MCP tool execution completed: ${mcpCall.tool}`);
      return result;
    } catch (error) {
      logger.error(`MCP tool execution failed: ${mcpCall.tool}`, error);
      throw error;
    }
  }

  /**
   * 执行多个 MCP 工具调用
   */
  public async executeMCPCalls(mcpCalls: Array<{ tool: string; arguments: any }>): Promise<any[]> {
    const results = [];

    for (const mcpCall of mcpCalls) {
      try {
        const result = await this.executeMCPCall(mcpCall);
        results.push({
          tool: mcpCall.tool,
          success: true,
          result,
        });
      } catch (error: any) {
        results.push({
          tool: mcpCall.tool,
          success: false,
          error: error.message,
        });
      }
    }

    return results;
  }

  /**
   * 检查是否已连接
   */
  public isClientConnected(): boolean {
    return this.isConnected;
  }

  /**
   * 获取可用工具列表
   */
  public getAvailableTools(): any[] {
    return this.availableTools;
  }

  /**
   * 断开所有连接
   */
  public async disconnect() {
    for (const [name, client] of this.clients) {
      try {
        await client.close();
        logger.info(`MCP client ${name} disconnected`);
      } catch (error) {
        logger.error(`Failed to disconnect MCP client ${name}:`, error);
      }
    }
    this.clients.clear();
    this.transports.clear();
    this.isConnected = false;
  }
}

export const mcpClientService = new MCPClientService();
