type EmailPayload = {
  from: string;
  to: string;
  subject: string;
  replyTo: string;
  text: string;
};

type EmailResult = {
  data: { id: string } | null;
  error: { name?: string } | null;
};

type ContactOptions = {
  configured: boolean;
  from: string;
  to: string;
  sendEmail: (payload: EmailPayload) => Promise<EmailResult>;
};

const response = (status: number, body: object) =>
  Response.json(body, { status, headers: { 'Cache-Control': 'no-store' } });

export function createContactHandler(options: ContactOptions) {
  return async function handleContact(request: Request): Promise<Response> {
    if (!request.headers.get('content-type')?.includes('application/json')) {
      return response(415, { error: 'Send a JSON project brief.' });
    }

    let body: unknown;
    try {
      const text = await request.text();
      if (text.length > 20_000) return response(413, { error: 'Project brief is too long.' });
      body = JSON.parse(text);
    } catch {
      return response(400, { error: 'Invalid JSON project brief.' });
    }

    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return response(400, { error: 'Invalid project brief.' });
    }

    const fields = body as Record<string, unknown>;
    // This field is hidden from people and catches basic form-filling bots.
    if (typeof fields.website === 'string' && fields.website.trim()) {
      return response(200, { success: true });
    }

    const { name, email, message } = fields;
    if (
      typeof name !== 'string' || !name.trim() || name.trim().length > 120 || /[\r\n]/.test(name) ||
      typeof email !== 'string' || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) ||
      typeof message !== 'string' || !message.trim() || message.trim().length > 6_000
    ) {
      return response(400, { error: 'A valid name, email and project brief are required.' });
    }

    if (!options.configured) {
      return response(503, { error: 'Email is temporarily unavailable. Please use the email link.' });
    }

    try {
      const result = await options.sendEmail({
        from: options.from,
        to: options.to,
        subject: `Project brief from ${name.trim()}`,
        replyTo: email.trim(),
        text: `Name: ${name.trim()}\nEmail: ${email.trim()}\n\nProject brief:\n${message.trim()}`,
      });

      // Resend returns errors as values. Awaiting the request does not mean it was accepted.
      if (result.error || !result.data?.id) {
        console.error('Portfolio contact: email rejected', result.error?.name || 'missing_email_id');
        return response(502, { error: 'Email could not be accepted. Please use the email link.' });
      }

      return response(200, { success: true });
    } catch {
      console.error('Portfolio contact: email provider unavailable');
      return response(502, { error: 'Email could not be accepted. Please use the email link.' });
    }
  };
}
