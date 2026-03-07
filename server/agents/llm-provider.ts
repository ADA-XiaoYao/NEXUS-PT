/**
 * NEXUS-PT Pro: LLM Provider Abstraction Layer
 * Unified interface for multiple LLM providers (OpenAI, Claude, Ollama, etc.)
 */

import { LLMConfig } from "./types";

/**
 * LLM Message Role
 */
export type MessageRole = "system" | "user" | "assistant";

/**
 * LLM Message
 */
export interface LLMMessage {
  role: MessageRole;
  content: string;
}

/**
 * LLM Response
 */
export interface LLMResponse {
  content: string;
  model: string;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  finishReason: "stop" | "length" | "error";
}

/**
 * Tool Call in LLM Response
 */
export interface ToolCall {
  id: string;
  name: string;
  arguments: Record<string, unknown>;
}

/**
 * LLM Response with Tool Calls
 */
export interface LLMResponseWithTools extends LLMResponse {
  toolCalls?: ToolCall[];
}

/**
 * Base LLM Provider Interface
 */
export abstract class LLMProvider {
  protected config: LLMConfig;
  protected model: string;

  constructor(config: LLMConfig) {
    this.config = config;
    this.model = config.model;
  }

  /**
   * Generate completion from messages
   */
  abstract complete(
    messages: LLMMessage[],
    tools?: ToolDefinition[]
  ): Promise<LLMResponseWithTools>;

  /**
   * Stream completion (for real-time responses)
   */
  abstract stream(
    messages: LLMMessage[],
    onChunk: (chunk: string) => void,
    tools?: ToolDefinition[]
  ): Promise<LLMResponseWithTools>;

  /**
   * Validate configuration
   */
  abstract validateConfig(): Promise<boolean>;

  /**
   * Get available models
   */
  abstract getAvailableModels(): Promise<string[]>;
}

/**
 * Tool Definition for LLM Function Calling
 */
export interface ToolDefinition {
  name: string;
  description: string;
  parameters: {
    type: "object";
    properties: Record<string, unknown>;
    required: string[];
  };
}

/**
 * OpenAI Provider Implementation
 */
export class OpenAIProvider extends LLMProvider {
  private apiKey: string;
  private baseUrl: string = "https://api.openai.com/v1";

  constructor(config: LLMConfig) {
    super(config);
    if (!config.apiKey) {
      throw new Error("OpenAI API key is required");
    }
    this.apiKey = config.apiKey;
    if (config.baseUrl) {
      this.baseUrl = config.baseUrl;
    }
  }

  async complete(
    messages: LLMMessage[],
    tools?: ToolDefinition[]
  ): Promise<LLMResponseWithTools> {
    const requestBody: any = {
      model: this.model,
      messages,
      temperature: this.config.temperature ?? 0.7,
      max_tokens: this.config.maxTokens ?? 2048,
    };

    if (tools && tools.length > 0) {
      requestBody.tools = tools.map((tool) => ({
        type: "function",
        function: tool,
      }));
    }

    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify(requestBody),
        signal: AbortSignal.timeout(this.config.timeout ?? 30000),
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.statusText}`);
      }

      const data = await response.json();
      const choice = data.choices[0];

      const result: LLMResponseWithTools = {
        content: choice.message.content || "",
        model: data.model,
        usage: {
          promptTokens: data.usage.prompt_tokens,
          completionTokens: data.usage.completion_tokens,
          totalTokens: data.usage.total_tokens,
        },
        finishReason: choice.finish_reason,
      };

      if (choice.message.tool_calls) {
        result.toolCalls = choice.message.tool_calls.map((tc: any) => ({
          id: tc.id,
          name: tc.function.name,
          arguments: JSON.parse(tc.function.arguments),
        }));
      }

      return result;
    } catch (error) {
      throw new Error(`OpenAI completion failed: ${error}`);
    }
  }

  async stream(
    messages: LLMMessage[],
    onChunk: (chunk: string) => void,
    tools?: ToolDefinition[]
  ): Promise<LLMResponseWithTools> {
    const requestBody: any = {
      model: this.model,
      messages,
      stream: true,
      temperature: this.config.temperature ?? 0.7,
      max_tokens: this.config.maxTokens ?? 2048,
    };

    if (tools && tools.length > 0) {
      requestBody.tools = tools.map((tool) => ({
        type: "function",
        function: tool,
      }));
    }

    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify(requestBody),
        signal: AbortSignal.timeout(this.config.timeout ?? 30000),
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.statusText}`);
      }

      let fullContent = "";
      const reader = response.body?.getReader();
      if (!reader) throw new Error("No response body");

      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6);
            if (data === "[DONE]") continue;

            try {
              const parsed = JSON.parse(data);
              const chunk = parsed.choices[0]?.delta?.content || "";
              if (chunk) {
                fullContent += chunk;
                onChunk(chunk);
              }
            } catch (e) {
              // Skip parsing errors
            }
          }
        }
      }

      return {
        content: fullContent,
        model: this.model,
        usage: {
          promptTokens: 0,
          completionTokens: 0,
          totalTokens: 0,
        },
        finishReason: "stop",
      };
    } catch (error) {
      throw new Error(`OpenAI stream failed: ${error}`);
    }
  }

  async validateConfig(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/models/${this.model}`, {
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
        },
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  async getAvailableModels(): Promise<string[]> {
    try {
      const response = await fetch(`${this.baseUrl}/models`, {
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
        },
      });
      const data = await response.json();
      return data.data
        .filter((m: any) => m.id.includes("gpt"))
        .map((m: any) => m.id);
    } catch {
      return ["gpt-4o", "gpt-4-turbo", "gpt-4"];
    }
  }
}

/**
 * Anthropic Claude Provider Implementation
 */
export class AnthropicProvider extends LLMProvider {
  private apiKey: string;
  private baseUrl: string = "https://api.anthropic.com/v1";

  constructor(config: LLMConfig) {
    super(config);
    if (!config.apiKey) {
      throw new Error("Anthropic API key is required");
    }
    this.apiKey = config.apiKey;
  }

  async complete(
    messages: LLMMessage[],
    tools?: ToolDefinition[]
  ): Promise<LLMResponseWithTools> {
    const requestBody: any = {
      model: this.model,
      max_tokens: this.config.maxTokens ?? 2048,
      messages: messages.map((m) => ({
        role: m.role === "assistant" ? "assistant" : "user",
        content: m.content,
      })),
    };

    if (tools && tools.length > 0) {
      requestBody.tools = tools;
    }

    try {
      const response = await fetch(`${this.baseUrl}/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": this.apiKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify(requestBody),
        signal: AbortSignal.timeout(this.config.timeout ?? 30000),
      });

      if (!response.ok) {
        throw new Error(`Anthropic API error: ${response.statusText}`);
      }

      const data = await response.json();
      const content = data.content[0];

      const result: LLMResponseWithTools = {
        content: content.type === "text" ? content.text : "",
        model: data.model,
        usage: {
          promptTokens: data.usage.input_tokens,
          completionTokens: data.usage.output_tokens,
          totalTokens: data.usage.input_tokens + data.usage.output_tokens,
        },
        finishReason: data.stop_reason === "end_turn" ? "stop" : "length",
      };

      if (content.type === "tool_use") {
        result.toolCalls = [
          {
            id: content.id,
            name: content.name,
            arguments: content.input,
          },
        ];
      }

      return result;
    } catch (error) {
      throw new Error(`Anthropic completion failed: ${error}`);
    }
  }

  async stream(
    messages: LLMMessage[],
    onChunk: (chunk: string) => void,
    tools?: ToolDefinition[]
  ): Promise<LLMResponseWithTools> {
    const requestBody: any = {
      model: this.model,
      max_tokens: this.config.maxTokens ?? 2048,
      stream: true,
      messages: messages.map((m) => ({
        role: m.role === "assistant" ? "assistant" : "user",
        content: m.content,
      })),
    };

    if (tools && tools.length > 0) {
      requestBody.tools = tools;
    }

    try {
      const response = await fetch(`${this.baseUrl}/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": this.apiKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify(requestBody),
        signal: AbortSignal.timeout(this.config.timeout ?? 30000),
      });

      if (!response.ok) {
        throw new Error(`Anthropic API error: ${response.statusText}`);
      }

      let fullContent = "";
      const reader = response.body?.getReader();
      if (!reader) throw new Error("No response body");

      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6);
            try {
              const parsed = JSON.parse(data);
              if (parsed.type === "content_block_delta") {
                const chunk = parsed.delta?.text || "";
                if (chunk) {
                  fullContent += chunk;
                  onChunk(chunk);
                }
              }
            } catch (e) {
              // Skip parsing errors
            }
          }
        }
      }

      return {
        content: fullContent,
        model: this.model,
        usage: {
          promptTokens: 0,
          completionTokens: 0,
          totalTokens: 0,
        },
        finishReason: "stop",
      };
    } catch (error) {
      throw new Error(`Anthropic stream failed: ${error}`);
    }
  }

  async validateConfig(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/models/${this.model}`, {
        headers: {
          "x-api-key": this.apiKey,
          "anthropic-version": "2023-06-01",
        },
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  async getAvailableModels(): Promise<string[]> {
    return ["claude-3-5-sonnet-20241022", "claude-3-opus-20240229", "claude-3-sonnet-20240229"];
  }
}

/**
 * Ollama Local Provider Implementation
 */
export class OllamaProvider extends LLMProvider {
  private baseUrl: string;

  constructor(config: LLMConfig) {
    super(config);
    this.baseUrl = config.baseUrl || "http://localhost:11434";
  }

  async complete(
    messages: LLMMessage[],
    tools?: ToolDefinition[]
  ): Promise<LLMResponseWithTools> {
    const requestBody = {
      model: this.model,
      messages,
      stream: false,
      temperature: this.config.temperature ?? 0.7,
    };

    try {
      const response = await fetch(`${this.baseUrl}/api/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
        signal: AbortSignal.timeout(this.config.timeout ?? 60000),
      });

      if (!response.ok) {
        throw new Error(`Ollama API error: ${response.statusText}`);
      }

      const data = await response.json();

      return {
        content: data.message.content,
        model: this.model,
        usage: {
          promptTokens: 0,
          completionTokens: 0,
          totalTokens: 0,
        },
        finishReason: "stop",
      };
    } catch (error) {
      throw new Error(`Ollama completion failed: ${error}`);
    }
  }

  async stream(
    messages: LLMMessage[],
    onChunk: (chunk: string) => void,
    tools?: ToolDefinition[]
  ): Promise<LLMResponseWithTools> {
    const requestBody = {
      model: this.model,
      messages,
      stream: true,
      temperature: this.config.temperature ?? 0.7,
    };

    try {
      const response = await fetch(`${this.baseUrl}/api/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
        signal: AbortSignal.timeout(this.config.timeout ?? 60000),
      });

      if (!response.ok) {
        throw new Error(`Ollama API error: ${response.statusText}`);
      }

      let fullContent = "";
      const reader = response.body?.getReader();
      if (!reader) throw new Error("No response body");

      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.trim()) {
            try {
              const parsed = JSON.parse(line);
              const chunk = parsed.message?.content || "";
              if (chunk) {
                fullContent += chunk;
                onChunk(chunk);
              }
            } catch (e) {
              // Skip parsing errors
            }
          }
        }
      }

      return {
        content: fullContent,
        model: this.model,
        usage: {
          promptTokens: 0,
          completionTokens: 0,
          totalTokens: 0,
        },
        finishReason: "stop",
      };
    } catch (error) {
      throw new Error(`Ollama stream failed: ${error}`);
    }
  }

  async validateConfig(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/tags`);
      return response.ok;
    } catch {
      return false;
    }
  }

  async getAvailableModels(): Promise<string[]> {
    try {
      const response = await fetch(`${this.baseUrl}/api/tags`);
      const data = await response.json();
      return data.models.map((m: any) => m.name);
    } catch {
      return [];
    }
  }
}

/**
 * LLM Provider Factory
 */
export class LLMProviderFactory {
  static create(config: LLMConfig): LLMProvider {
    switch (config.provider) {
      case "openai":
        return new OpenAIProvider(config);
      case "anthropic":
        return new AnthropicProvider(config);
      case "ollama":
        return new OllamaProvider(config);
      default:
        throw new Error(`Unknown LLM provider: ${config.provider}`);
    }
  }
}
