// Optional LLM enhancement layer for dashboard summary
// Deterministic summary is always the source of truth.
// LLM only rewrites it into more natural language if enabled.

interface SummaryItem {
  icon: string;
  text: string;
  priority?: number;
}

interface SummaryInput {
  greeting: string;
  items: SummaryItem[];
  nextStep: string;
}

export interface LLMProvider {
  enhance(input: SummaryInput): Promise<SummaryInput>;
}

// No-op provider — returns deterministic summary as-is
class PassthroughProvider implements LLMProvider {
  async enhance(input: SummaryInput): Promise<SummaryInput> {
    return input;
  }
}

// Claude/OpenAI-style provider stub
class APILLMProvider implements LLMProvider {
  private apiKey: string;
  private model: string;

  constructor(apiKey: string, model = "claude-sonnet-4-5-20250514") {
    this.apiKey = apiKey;
    this.model = model;
  }

  async enhance(input: SummaryInput): Promise<SummaryInput> {
    try {
      const bulletPoints = input.items.map((i) => `- ${i.text}`).join("\n");
      const prompt = `Rewrite these dashboard summary bullet points into more natural, concise, action-oriented language. Keep exactly the same meaning and data. Max 5 items. Return only the rewritten bullets, one per line, no markdown:\n\n${bulletPoints}\n\nNext step: ${input.nextStep}`;

      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "x-api-key": this.apiKey,
          "anthropic-version": "2023-06-01",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: this.model,
          max_tokens: 256,
          messages: [{ role: "user", content: prompt }],
        }),
      });

      if (!res.ok) return input; // graceful fallback

      const data = await res.json();
      const text = data.content?.[0]?.text || "";
      const lines = text.split("\n").filter((l: string) => l.trim());

      if (lines.length === 0) return input;

      // Last line is the rewritten next step
      const nextStep = lines.length > input.items.length
        ? lines.pop()!.replace(/^(Next step:|→)\s*/i, "")
        : input.nextStep;

      const items = lines.slice(0, 5).map((line: string, i: number) => ({
        icon: input.items[i]?.icon || "action",
        text: line.replace(/^[-•]\s*/, ""),
      }));

      return { greeting: input.greeting, items, nextStep };
    } catch {
      return input; // graceful fallback
    }
  }
}

export function createLLMProvider(): LLMProvider {
  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  if (anthropicKey) {
    return new APILLMProvider(anthropicKey);
  }
  return new PassthroughProvider();
}
