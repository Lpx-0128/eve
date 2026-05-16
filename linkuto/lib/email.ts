import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendConfirmationEmail(name: string, email: string, programmeName: string, hostEmail?: string, hostName?: string) {
  if (!process.env.RESEND_API_KEY) {
    console.warn("RESEND_API_KEY is not set. Skipping email dispatch.");
    return { success: false, error: "Missing API Key" };
  }

  const senderName = hostName ? `${hostName} via Linkuto` : 'Linkuto';

  try {
    const data = await resend.emails.send({
      from: `${senderName} <onboarding@resend.dev>`, // Use a verified domain in production
      replyTo: hostEmail,
      to: [email],
      subject: `Registration Confirmed: ${programmeName}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #eaeaeb; border-radius: 8px; overflow: hidden;">
          <div style="background-color: #00508B; padding: 32px 24px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 24px;">Registration Confirmed!</h1>
          </div>
          <div style="padding: 32px 24px; background-color: #ffffff; color: #333333;">
            <p style="font-size: 16px; margin-top: 0;">Hi <strong>${name}</strong>,</p>
            <p style="font-size: 16px; line-height: 1.5;">
              Thank you for registering for <strong>${programmeName}</strong>.
            </p>
            <p style="font-size: 16px; line-height: 1.5;">
              We have successfully received your application. The organiser will review your details and be in touch regarding the next steps.
            </p>
            <div style="margin: 32px 0; padding: 24px; background-color: #f9fafb; border-radius: 8px;">
              <p style="margin: 0; font-size: 14px; color: #6b7280; text-align: center;">
                If you have any questions, feel free to reply to this email.
              </p>
            </div>
            <p style="font-size: 16px; margin-bottom: 0;">Best regards,<br>The Linkuto Team</p>
          </div>
        </div>
      `,
    });

    return { success: true, data };
  } catch (error) {
    console.error("Failed to send email:", error);
    return { success: false, error };
  }
}
