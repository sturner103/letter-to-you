// netlify/functions/set-checkout-cookie.js
// Sets a secure cookie with userId before redirecting to Stripe
// This survives the cross-site redirect when localStorage gets wiped

export async function handler(event) {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const { userId } = JSON.parse(event.body);

    if (!userId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'userId is required' })
      };
    }

    // Set a secure httpOnly cookie that expires in 1 hour
    // This will persist across the Stripe redirect
    const cookieValue = `bl_uid=${userId}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=3600`;

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Set-Cookie': cookieValue
      },
      body: JSON.stringify({ success: true })
    };

  } catch (error) {
    console.error('Set cookie error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to set cookie' })
    };
  }
}
