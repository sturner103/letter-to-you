import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY
});

const SYSTEM_PROMPT = `You are a thoughtful analyst helping someone understand how they've changed between two personal reflection letters they wrote to themselves.

Your task is to compare the two letters and provide meaningful insights about:
1. What has shifted in their emotional state or mindset
2. Changes in their priorities, concerns, or focus areas
3. Progress or movement on issues they were grappling with
4. New themes that emerged or old ones that resolved
5. What this evolution might mean for their personal growth

Guidelines:
- Be specific — reference actual content from both letters
- Be warm and encouraging about growth, but honest about challenges
- Notice both obvious and subtle shifts
- Avoid being preachy or prescriptive
- Length: 300-500 words
- Write in second person ("you")
- Do NOT use markdown formatting (no **bold**, no *italics*, no bullet points) — write in plain prose

Structure your response as flowing paragraphs, not a list. Start by acknowledging the time between the letters, then explore what has changed.`;

export async function handler(event) {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const { letter1, letter2 } = JSON.parse(event.body);

    if (!letter1 || !letter2) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing letter data' })
      };
    }

    // Determine which letter is older
    const date1 = new Date(letter1.date);
    const date2 = new Date(letter2.date);
    const [older, newer] = date1 < date2 ? [letter1, letter2] : [letter2, letter1];
    
    const olderDate = new Date(older.date).toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
    const newerDate = new Date(newer.date).toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });

    const userPrompt = `Here are two letters this person wrote to themselves at different times. Please analyze what has changed.

EARLIER LETTER (${olderDate}, ${older.mode} reflection):
${older.content}

---

LATER LETTER (${newerDate}, ${newer.mode} reflection):
${newer.content}

---

Please provide a thoughtful comparison of how this person has evolved between these two letters.`;

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1500,
      messages: [
        {
          role: 'user',
          content: userPrompt
        }
      ],
      system: SYSTEM_PROMPT
    });

    const comparison = message.content[0].text;

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ comparison })
    };

  } catch (error) {
    console.error('Error comparing letters:', error);
    
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: 'Failed to compare letters',
        details: error.message 
      })
    };
  }
}
