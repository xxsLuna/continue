import {
  ChatMessage,
  CompletionOptions,
  LLMFullCompletionOptions,
} from "../../index";
import { BaseLLM } from "../index";

export class OnlineAgent extends BaseLLM {
  static providerName = "online-agent";

  private get _apiKey() {
    return this.apiKey || "";
  }

  private get _baseUrl() {
    return this.apiBase || "http://localhost:3080";
  }

  async listModels(): Promise<string[]> {
    const response = await this.fetch(`${this._baseUrl}/api/agents/v1/models`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${this._apiKey}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Failed to list models: ${text}`);
    }

    const data = await response.json();
    return data.data.map((model: any) => model.id);
  }

  protected async *_streamChat(
    messages: ChatMessage[],
    signal: AbortSignal,
    options: LLMFullCompletionOptions,
  ): AsyncGenerator<ChatMessage> {
    const response = await this.fetch(
      `${this._baseUrl}/api/agents/v1/chat/completions`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this._apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: options.model,
          messages,
          stream: true,
        }),
        signal,
      },
    );

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Failed to stream chat: ${text}`);
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error("No response body");
    }

    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed === "data: [DONE]") continue;

        if (trimmed.startsWith("data: ")) {
          const json = JSON.parse(trimmed.slice(6));
          if (json.choices?.[0]?.delta?.content) {
            yield {
              role: "assistant",
              content: json.choices[0].delta.content,
            };
          }
          // Handle tool calls if any
          if (json.choices?.[0]?.delta?.tool_calls) {
            yield {
              role: "assistant",
              content: "",
              toolCalls: json.choices[0].delta.tool_calls,
            };
          }
        }
      }
    }
  }

  async *_streamComplete(
    prompt: string,
    signal: AbortSignal,
    options: LLMFullCompletionOptions,
  ): AsyncGenerator<string> {
    // Online Agent usually supports chat, but we can implement complete if needed.
    // For now, we'll just throw or use streamChat.
    throw new Error("streamComplete not implemented for OnlineAgent");
  }
}
