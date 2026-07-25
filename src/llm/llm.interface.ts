export interface LlmAdapter {
  generate(prompt: string, options?: { maxTokens?: number }): Promise<string>;
}