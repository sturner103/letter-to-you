import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY
});

const BASE_SYSTEM_PROMPT = `You are a thoughtful, warm writer creating a personal letter for someone based on their reflective interview responses.

Your task is to write a letter TO the person, synthesizing what they shared into something meaningful and actionable.

Guidelines:
- Write in second person ("you")
- Be specific — reference their actual words and situations
- Notice patterns they might not see
- Be honest, including about hard things
- End with 2-4 concrete, specific next steps drawn from their responses
- Length: 600-1,200 words

Structure:
1. Opening that acknowledges where they are
2. Body that synthesizes themes and patterns from their responses
3. Gentle observations about what might be underneath
4. Closing with specific, actionable next steps

Do NOT:
- Give medical or mental health advice
- Be preachy or prescriptive
- Use therapy jargon
- Make assumptions beyond what they shared
- Be falsely positive — honor the complexity`;

const TONE_INSTRUCTIONS = {
  youdecide: `
TONE: You Decide
Read their answers carefully and choose the tone that best fits what they need right now. You might choose:
- Warm & Gentle: If they seem vulnerable, hurting, or in need of compassion and validation
- Clear & Direct: If they seem stuck in ambiguity and need honest clarity to move forward
- Motivating: If they seem ready for action but need a push or encouragement

Don't announce which tone you chose — just write in that voice naturally. Let their words guide you to what they need to hear.`,

  warm: `
TONE: Warm & Gentle
Write with deep compassion and gentleness. Use soft, supportive language. Validate their feelings before offering observations. Be like a caring friend who sees them clearly and accepts them fully. Phrases like "It makes sense that..." and "It's okay to feel..." fit this tone.`,
  
  direct: `
TONE: Clear & Direct
Be honest and clear. Skip unnecessary pleasantries. Name what you see directly and succinctly. Respect their intelligence and capacity to hear truth. Don't soften things so much that the message gets lost. Be like a trusted mentor who tells it straight because they respect you.`,
  
  motivating: `
TONE: Motivating & Forward-Looking
Be energizing and action-oriented. Acknowledge the hard stuff but quickly pivot to agency, possibility, and potential. Emphasize their strengths and what they can do. Be like a coach who believes in them and wants to see them move forward. Use language that creates momentum.`
};

export async function handler(event) {
  // Only allow POST
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const { mode, modeName, tone = 'warm', qaPairs } = JSON.parse(event.body);

    if (!qaPairs) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing question/answer pairs' })
      };
    }

    // Build the system prompt with tone
    const toneInstruction = TONE_INSTRUCTIONS[tone] || TONE_INSTRUCTIONS.warm;
    const systemPrompt = BASE_SYSTEM_PROMPT + '\n' + toneInstruction;

    const userPrompt = `The person completed a "${modeName}" reflection. Here are their responses:

${qaPairs}

---

Based on these responses, write them a thoughtful, personal letter that synthesizes what they shared and ends with 2-4 specific next steps.`;

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      messages: [
        {
          role: 'user',
          content: userPrompt
        }
      ],
      system: systemPrompt
    });

    const letter = message.content[0].text;

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ letter })
    };

  } catch (error) {
    console.error('Error generating letter:', error);
    
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: 'Failed to generate letter',
        details: error.message 
      })
    };
  }
}
