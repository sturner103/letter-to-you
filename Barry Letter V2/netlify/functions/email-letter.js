// Email letter to user
// Note: This is a placeholder. You'll need to integrate with an email service like:
// - SendGrid
// - Mailgun
// - AWS SES
// - Resend

export async function handler(event) {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const { email, letter, mode } = JSON.parse(event.body);

    if (!email || !letter) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing email or letter content' })
      };
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Invalid email address' })
      };
    }

    // TODO: Replace with actual email service integration
    // Example with SendGrid:
    // 
    // const sgMail = require('@sendgrid/mail');
    // sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    // 
    // const msg = {
    //   to: email,
    //   from: 'letters@lettertoyou.app',
    //   subject: 'Your Letter to You',
    //   text: letter,
    //   html: `
    //     <div style="max-width: 600px; margin: 0 auto; font-family: Georgia, serif; padding: 40px;">
    //       <h1 style="color: #6b7c6e; font-size: 24px; margin-bottom: 24px;">A letter to you, from you</h1>
    //       ${letter.split('\n\n').map(p => `<p style="line-height: 1.7; color: #2c2825; margin-bottom: 16px;">${p}</p>`).join('')}
    //       <p style="margin-top: 32px; font-style: italic;">Sincerely,<br/>me</p>
    //       <hr style="margin: 40px 0; border: none; border-top: 1px solid #e5e1db;" />
    //       <p style="font-size: 12px; color: #8a847d;">This letter was created at lettertoyou.app</p>
    //     </div>
    //   `
    // };
    // 
    // await sgMail.send(msg);

    // For now, log and return success (simulating email sent)
    console.log(`Would send letter to: ${email}`);
    console.log(`Mode: ${mode}`);
    console.log(`Letter length: ${letter.length} characters`);

    // Simulate a small delay like a real email service
    await new Promise(resolve => setTimeout(resolve, 500));

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        success: true,
        message: 'Letter sent successfully'
      })
    };

  } catch (error) {
    console.error('Error sending email:', error);
    
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: 'Failed to send email',
        details: error.message 
      })
    };
  }
}
