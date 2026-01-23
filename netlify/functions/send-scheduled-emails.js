// netlify/functions/send-scheduled-emails.js
// This function runs on a schedule (configured in netlify.toml)
// It checks for letters due to be delivered and sends them

import { createClient } from '@supabase/supabase-js';

// Initialize Supabase with service role key (server-side only)
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Email sending - using Resend (recommended) or adapt for your provider
// npm install resend
// import { Resend } from 'resend';
// const resend = new Resend(process.env.RESEND_API_KEY);

export const handler = async (event) => {
  console.log('Running scheduled email check...');

  try {
    // Find all pending emails that are due
    const now = new Date().toISOString();
    
    const { data: pendingEmails, error: fetchError } = await supabase
      .from('scheduled_emails')
      .select(`
        id,
        letter_id,
        user_id,
        scheduled_for,
        letters (
          letter_content,
          mode,
          tone,
          created_at
        ),
        profiles:user_id (
          email,
          display_name
        )
      `)
      .eq('status', 'pending')
      .lte('scheduled_for', now)
      .limit(50); // Process in batches

    if (fetchError) {
      throw fetchError;
    }

    if (!pendingEmails || pendingEmails.length === 0) {
      console.log('No emails due for delivery');
      return {
        statusCode: 200,
        body: JSON.stringify({ message: 'No emails to send', processed: 0 }),
      };
    }

    console.log(`Found ${pendingEmails.length} emails to send`);

    let successCount = 0;
    let failCount = 0;

    for (const emailJob of pendingEmails) {
      try {
        // Get user email and letter content
        const userEmail = emailJob.profiles?.email;
        const userName = emailJob.profiles?.display_name || 'Friend';
        const letterContent = emailJob.letters?.letter_content;
        const letterDate = new Date(emailJob.letters?.created_at).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });

        if (!userEmail || !letterContent) {
          throw new Error('Missing email or letter content');
        }

        // Format the email
        const emailSubject = `A Letter From Your Past Self 💌`;
        const emailHtml = formatEmailHtml(userName, letterContent, letterDate);
        const emailText = formatEmailText(userName, letterContent, letterDate);

        // Send the email
        // OPTION 1: Using Resend (recommended)
        // await resend.emails.send({
        //   from: 'Letter to You <letters@yourdomain.com>',
        //   to: userEmail,
        //   subject: emailSubject,
        //   html: emailHtml,
        //   text: emailText,
        // });

        // OPTION 2: Using Netlify's built-in email (if configured)
        // Or use SendGrid, Mailgun, etc.
        
        // For now, log what would be sent (remove in production)
        console.log(`Would send email to: ${userEmail}`);
        console.log(`Subject: ${emailSubject}`);

        // Update scheduled_emails status
        await supabase
          .from('scheduled_emails')
          .update({
            status: 'sent',
            sent_at: new Date().toISOString()
          })
          .eq('id', emailJob.id);

        // Update letter delivery status
        await supabase
          .from('letters')
          .update({
            delivered_at: new Date().toISOString(),
            delivery_status: 'delivered'
          })
          .eq('id', emailJob.letter_id);

        successCount++;

      } catch (emailError) {
        console.error(`Failed to send email ${emailJob.id}:`, emailError);
        
        // Mark as failed
        await supabase
          .from('scheduled_emails')
          .update({
            status: 'failed',
            error_message: emailError.message
          })
          .eq('id', emailJob.id);

        // Update letter status
        await supabase
          .from('letters')
          .update({
            delivery_status: 'failed'
          })
          .eq('id', emailJob.letter_id);

        failCount++;
      }
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Email processing complete',
        processed: pendingEmails.length,
        success: successCount,
        failed: failCount
      }),
    };

  } catch (error) {
    console.error('Scheduled email error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
};

// Format email as HTML
function formatEmailHtml(name, letterContent, originalDate) {
  // Convert line breaks to paragraphs
  const formattedContent = letterContent
    .split('\n\n')
    .map(p => `<p style="margin-bottom: 16px; line-height: 1.6;">${p}</p>`)
    .join('');

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; background-color: #faf9f6; color: #2d2d2d;">
  <div style="background: white; padding: 40px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.08);">
    
    <div style="text-align: center; margin-bottom: 32px;">
      <h1 style="font-size: 24px; font-weight: normal; color: #5c4a3d; margin: 0;">
        A Letter From Your Past Self
      </h1>
      <p style="color: #8b7355; font-size: 14px; margin-top: 8px;">
        Written on ${originalDate}
      </p>
    </div>

    <div style="border-top: 1px solid #e8e4df; border-bottom: 1px solid #e8e4df; padding: 32px 0; margin-bottom: 32px;">
      <p style="margin-bottom: 16px;">Dear ${name},</p>
      ${formattedContent}
    </div>

    <div style="text-align: center; color: #8b7355; font-size: 14px;">
      <p style="margin: 0;">Delivered with care by</p>
      <p style="margin: 4px 0 0 0; font-weight: 500;">Letter to You</p>
    </div>

  </div>
</body>
</html>
  `.trim();
}

// Format email as plain text
function formatEmailText(name, letterContent, originalDate) {
  return `
A LETTER FROM YOUR PAST SELF
Written on ${originalDate}

---

Dear ${name},

${letterContent}

---

Delivered with care by Letter to You
  `.trim();
}
