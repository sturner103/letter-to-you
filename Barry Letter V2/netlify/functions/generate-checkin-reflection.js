// netlify/functions/generate-checkin-reflection.js
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export const handler = async (event) => {
  // Only allow POST
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    const { moodRating, energyLevel, wins, challenges, gratitude, focusNextWeek } = JSON.parse(event.body);

    const prompt = `You are a supportive, insightful reflection companion. Based on someone's weekly check-in, write a brief, personalized reflection (2-3 sentences) that:
- Acknowledges their experience
- Offers gentle insight or encouragement
- Connects to their stated focus for next week

Weekly Check-in Data:
- Mood: ${moodRating}/10
- Energy: ${energyLevel}/10
- What went well: ${wins || 'Not shared'}
- Challenges: ${challenges || 'Not shared'}
- Gratitude: ${gratitude || 'Not shared'}
- Focus for next week: ${focusNextWeek || 'Not shared'}

Write a warm, brief reflection (2-3 sentences max). Don't use bullet points or lists. Be genuine, not generic.`;

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 200,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ]
    });

    const reflection = message.content[0].text;

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ reflection }),
    };

  } catch (error) {
    console.error('Error generating reflection:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to generate reflection' }),
    };
  }
};
