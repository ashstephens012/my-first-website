# Welcome Email Template & Mechanism

Reusable branded welcome email pattern for sending credentials to new users via nodemailer + Gmail SMTP.

## Dependencies

```
npm install nodemailer
npm install -D @types/nodemailer  # if using TypeScript
```

## Environment Variables (.env)

```env
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-gmail@example.com"
SMTP_PASS="xxxx xxxx xxxx xxxx"    # Google App Password (not regular password)
EMAIL_FROM="Display Name <your-gmail@example.com>"
NEXTAUTH_URL="https://your-domain.com"
```

### Getting a Gmail App Password
1. Go to myaccount.google.com → Security → 2-Step Verification (must be enabled)
2. Go to myaccount.google.com/apppasswords
3. Create an app password (gives a 16-character code with spaces)

## Nodemailer Transport Setup

```typescript
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : undefined,
  secure: process.env.SMTP_SECURE === 'true',
  auth: process.env.SMTP_USER
    ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
    : undefined,
} as any);
```

## Send Email Function

```typescript
await transporter.sendMail({
  from: process.env.EMAIL_FROM || 'no-reply@example.com',
  to: recipientEmail,
  subject: 'Welcome to the TIO Member Portal',
  text: plainTextVersion,
  html: htmlVersion,
});
```

Wrap in try/catch if the email is non-critical (e.g. user was already created):
```typescript
try {
  await transporter.sendMail({ ... });
} catch (emailError) {
  console.error('Failed to send welcome email:', emailError);
}
```

## Branded HTML Email Template

Key design tokens (TIO branding):
- Primary navy: `#192845`
- Background: `#f7f9fb`
- Border: `#e2e8f0`
- Muted text: `#64748b`
- Font: `'Century Gothic', CenturyGothic, AppleGothic, sans-serif`
- Logo URL: `https://drive.google.com/uc?export=view&id=1iQ15Z1lfMmqe0RaGl_zldm_J1RaTkhQA`

Replace `${...}` variables with your actual values.

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background-color:#f7f9fb;font-family:'Century Gothic',CenturyGothic,AppleGothic,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f7f9fb;padding:40px 20px;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
          <!-- Header -->
          <tr>
            <td style="background-color:#192845;padding:32px 40px;border-radius:12px 12px 0 0;text-align:center;">
              <img src="${logoUrl}" alt="${orgName}" width="95" style="display:block;margin:0 auto;max-width:95px;height:auto;" />
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="background-color:#ffffff;padding:40px;border-left:1px solid #e2e8f0;border-right:1px solid #e2e8f0;">
              <h2 style="margin:0 0 16px;color:#192845;font-size:20px;text-align:center;font-family:'Century Gothic',CenturyGothic,AppleGothic,sans-serif;">
                ${heading}
              </h2>
              <hr style="border:none;border-top:1px solid #e2e8f0;margin:16px 0 24px;" />
              <p style="margin:0 0 16px;color:#192845;font-size:15px;line-height:1.6;">
                Hi ${name},
              </p>
              <p style="margin:0 0 24px;color:#192845;font-size:15px;line-height:1.6;">
                ${bodyText}
              </p>

              <!-- Credentials Box -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
                <tr>
                  <td style="background-color:#f7f9fb;border:1px solid #e2e8f0;border-radius:8px;padding:20px 24px;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="color:#64748b;font-size:13px;padding-bottom:8px;font-family:'Century Gothic',CenturyGothic,AppleGothic,sans-serif;">Email</td>
                      </tr>
                      <tr>
                        <td style="color:#192845;font-size:15px;font-weight:700;padding-bottom:16px;font-family:'Century Gothic',CenturyGothic,AppleGothic,sans-serif;">${email}</td>
                      </tr>
                      <tr>
                        <td style="color:#64748b;font-size:13px;padding-bottom:8px;font-family:'Century Gothic',CenturyGothic,AppleGothic,sans-serif;">Password</td>
                      </tr>
                      <tr>
                        <td style="color:#192845;font-size:15px;font-weight:700;font-family:'Century Gothic',CenturyGothic,AppleGothic,sans-serif;">${password}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- CTA Button -->
              <table role="presentation" cellpadding="0" cellspacing="0" style="margin-bottom:32px;">
                <tr>
                  <td style="border-radius:8px;background-color:#192845;">
                    <a href="${loginUrl}" target="_blank" style="display:inline-block;padding:14px 32px;color:#ffffff;font-size:15px;font-weight:700;text-decoration:none;font-family:'Century Gothic',CenturyGothic,AppleGothic,sans-serif;">
                      ${buttonText}
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Reset Instructions -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
                <tr>
                  <td style="border-top:1px solid #e2e8f0;padding-top:24px;">
                    <h3 style="margin:0 0 12px;color:#192845;font-size:16px;font-family:'Century Gothic',CenturyGothic,AppleGothic,sans-serif;">
                      Resetting Your Password
                    </h3>
                    <p style="margin:0 0 12px;color:#64748b;font-size:14px;line-height:1.6;">
                      For security, we recommend changing your password after your first login. To reset your password at any time:
                    </p>
                    <ol style="margin:0 0 12px;padding-left:20px;color:#64748b;font-size:14px;line-height:1.8;">
                      <li>Visit the <a href="${resetUrl}" style="color:#192845;font-weight:600;">password reset page</a></li>
                      <li>Enter your email address</li>
                      <li>Check your inbox for a reset link</li>
                      <li>Click the link and set your new password</li>
                    </ol>
                  </td>
                </tr>
              </table>

              <p style="margin:0;color:#64748b;font-size:14px;line-height:1.6;">
                If you have any questions, please contact your team administrator.
              </p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background-color:#f7f9fb;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 12px 12px;padding:24px 40px;text-align:center;">
              <p style="margin:0;color:#94a3b8;font-size:12px;font-family:'Century Gothic',CenturyGothic,AppleGothic,sans-serif;">
                &copy; ${year} ${orgName}. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
```

## Template Variables Reference

| Variable | Description | Example |
|---|---|---|
| `${logoUrl}` | Public URL to logo image | Google Drive direct link or hosted URL |
| `${orgName}` | Organisation name | The Invisible Orthodontist |
| `${heading}` | Email heading text | Welcome to the TIO Member Portal |
| `${name}` | Recipient's name | Ashley |
| `${bodyText}` | Intro paragraph | An account has been created for you... |
| `${email}` | User's login email | user@example.com |
| `${password}` | User's initial password | xxxxxxxx |
| `${loginUrl}` | Sign-in page URL | https://domain.com/signin |
| `${resetUrl}` | Password reset page URL | https://domain.com/signin/request-reset |
| `${buttonText}` | CTA button label | Sign In to Portal |
| `${year}` | Copyright year | 2026 |

## Notes
- Gmail blocks base64 data URI images in emails — always use a public URL for logos
- Google Drive direct image URL format: `https://drive.google.com/uc?export=view&id=FILE_ID`
- Wrap email sending in try/catch if it shouldn't block the main operation
- Always include a plain text fallback alongside the HTML version
- `EMAIL_FROM` supports display name format: `"Display Name <email@example.com>"`
