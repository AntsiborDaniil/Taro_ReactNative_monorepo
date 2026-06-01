import OpenAI from 'https://esm.sh/openai@5.5.1';

export function getOpenAIClient(): OpenAI {
  const apiKey = Deno.env.get('OPENAI_API_KEY');
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY is not configured');
  }
  return new OpenAI({ apiKey });
}

export async function chatCompletion(
  systemPrompt: string,
  userContent: string
): Promise<string> {
  const openai = getOpenAIClient();
  const completion = await openai.chat.completions.create({
    model: Deno.env.get('OPENAI_MODEL') ?? 'gpt-4o-mini',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userContent },
    ],
    temperature: 0.8,
  });

  return completion.choices[0]?.message?.content ?? '';
}
