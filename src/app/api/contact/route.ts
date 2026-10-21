import { Resend } from 'resend';
import { createContactHandler } from '@/lib/contact';

export const POST = createContactHandler({
  configured: Boolean(process.env.RESEND_API_KEY),
  from: process.env.CONTACT_FROM_EMAIL || 'Portfolio Contact <onboarding@resend.dev>',
  to: 'chatoui.wael40@gmail.com',
  sendEmail: async (payload) => new Resend(process.env.RESEND_API_KEY).emails.send(payload),
});
