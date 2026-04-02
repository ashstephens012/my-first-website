'use server';

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import bcrypt from 'bcrypt';
import nodemailer from 'nodemailer';
import { randomBytes } from 'crypto';

const updateRoleSchema = z.object({
  userId: z.string().min(1),
  role: z.enum(['USER', 'LEADERSHIP']),
});

const changePasswordSchema = z.object({
  userId: z.string().min(1),
  newPassword: z.string().min(8, 'Password must be at least 8 characters'),
});

const createUserSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  role: z.enum(['USER', 'LEADERSHIP']),
});

export async function createUser(data: {
  name: string;
  email: string;
  password: string;
  role: string;
}) {
  try {
    const session = await getServerSession(authOptions);
    if (session?.user?.role !== 'LEADERSHIP') {
      return { success: false, error: 'Only admins can create users' };
    }

    const validated = createUserSchema.parse(data);

    const existing = await prisma.user.findUnique({
      where: { email: validated.email },
    });
    if (existing) {
      return { success: false, error: 'A user with that email already exists' };
    }

    const passwordHash = await bcrypt.hash(validated.password, 10);

    await prisma.user.create({
      data: {
        name: validated.name,
        email: validated.email,
        passwordHash,
        role: validated.role,
      },
    });

    // Send welcome email with credentials
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    const loginUrl = `${baseUrl}/signin`;
    const resetUrl = `${baseUrl}/signin/request-reset`;

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : undefined,
      secure: process.env.SMTP_SECURE === 'true',
      auth: process.env.SMTP_USER
        ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
        : undefined,
    } as any);

    try {
      await transporter.sendMail({
        from: process.env.EMAIL_FROM || 'no-reply@example.com',
        to: validated.email,
        subject: 'Welcome to the TIO Member Portal',
        text: [
          `Welcome to The Invisible Orthodontist Portal`,
          ``,
          `Hi ${validated.name},`,
          ``,
          `An account has been created for you on The Invisible Orthodontist staff portal.`,
          ``,
          `Your login details:`,
          `  Email: ${validated.email}`,
          `  Password: ${validated.password}`,
          ``,
          `Sign in here: ${loginUrl}`,
          ``,
          `For security, we recommend changing your password after your first login.`,
          `To reset your password at any time, visit: ${resetUrl}`,
          `Enter your email address and you will receive a link to set a new password.`,
          ``,
          `If you have any questions, please contact your team administrator.`,
          ``,
          `— The Invisible Orthodontist`,
        ].join('\n'),
        html: `
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
              <img src="https://drive.google.com/uc?export=view&id=1iQ15Z1lfMmqe0RaGl_zldm_J1RaTkhQA" alt="The Invisible Orthodontist" width="95" style="display:block;margin:0 auto;max-width:95px;height:auto;" />
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="background-color:#ffffff;padding:40px;border-left:1px solid #e2e8f0;border-right:1px solid #e2e8f0;">
              <h2 style="margin:0 0 16px;color:#192845;font-size:20px;text-align:center;font-family:'Century Gothic',CenturyGothic,AppleGothic,sans-serif;">
                Welcome to the TIO Member Portal
              </h2>
              <hr style="border:none;border-top:1px solid #e2e8f0;margin:16px 0 24px;" />
              <p style="margin:0 0 16px;color:#192845;font-size:15px;line-height:1.6;">
                Hi ${validated.name},
              </p>
              <p style="margin:0 0 24px;color:#192845;font-size:15px;line-height:1.6;">
                An account has been created for you on the Member Portal. Please make a note of your log-in details below:
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
                        <td style="color:#192845;font-size:15px;font-weight:700;padding-bottom:16px;font-family:'Century Gothic',CenturyGothic,AppleGothic,sans-serif;">${validated.email}</td>
                      </tr>
                      <tr>
                        <td style="color:#64748b;font-size:13px;padding-bottom:8px;font-family:'Century Gothic',CenturyGothic,AppleGothic,sans-serif;">Password</td>
                      </tr>
                      <tr>
                        <td style="color:#192845;font-size:15px;font-weight:700;font-family:'Century Gothic',CenturyGothic,AppleGothic,sans-serif;">${validated.password}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Sign In Button -->
              <table role="presentation" cellpadding="0" cellspacing="0" style="margin-bottom:32px;">
                <tr>
                  <td style="border-radius:8px;background-color:#192845;">
                    <a href="${loginUrl}" target="_blank" style="display:inline-block;padding:14px 32px;color:#ffffff;font-size:15px;font-weight:700;text-decoration:none;font-family:'Century Gothic',CenturyGothic,AppleGothic,sans-serif;">
                      Sign In to Portal
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
                &copy; ${new Date().getFullYear()} The Invisible Orthodontist. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,
      });
    } catch (emailError) {
      console.error('Failed to send welcome email:', emailError);
      // User was created successfully — don't fail the whole operation
    }

    revalidatePath('/dashboard/users');
    return { success: true };
  } catch (error) {
    console.error('Error creating user:', error);
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues.map((e) => e.message).join(', ') };
    }
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create user',
    };
  }
}

export async function updateUserRole(userId: string, role: string) {
  try {
    const session = await getServerSession(authOptions);
    if (session?.user?.role !== 'LEADERSHIP') {
      return { success: false, error: 'Only admins can change user roles' };
    }

    const validated = updateRoleSchema.parse({ userId, role });

    const user = await prisma.user.findUnique({ where: { id: validated.userId } });
    if (!user) {
      return { success: false, error: 'User not found' };
    }

    if (user.role === 'MEMBER') {
      return { success: false, error: 'MEMBER users are managed via the member detail page' };
    }

    await prisma.user.update({
      where: { id: validated.userId },
      data: { role: validated.role },
    });

    revalidatePath('/dashboard/users');
    return { success: true };
  } catch (error) {
    console.error('Error updating user role:', error);
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues.map((e) => e.message).join(', ') };
    }
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update user role',
    };
  }
}

/**
 * Delete a dashboard user. LEADERSHIP-only.
 * Cannot delete MEMBER users (managed via member detail page)
 * or your own account.
 */
export async function deleteUser(userId: string) {
  try {
    const session = await getServerSession(authOptions);
    if (session?.user?.role !== 'LEADERSHIP') {
      return { success: false, error: 'Only admins can delete users' };
    }

    if (session.user.id === userId) {
      return { success: false, error: 'You cannot delete your own account' };
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return { success: false, error: 'User not found' };
    }

    if (user.role === 'MEMBER') {
      return { success: false, error: 'MEMBER users are managed via the member detail page' };
    }

    // Clean up related records then delete user
    await prisma.session.deleteMany({ where: { userId } });
    await prisma.account.deleteMany({ where: { userId } });
    if (user.email) {
      await prisma.verificationToken.deleteMany({ where: { identifier: user.email } });
    }
    await prisma.user.delete({ where: { id: userId } });

    revalidatePath('/dashboard/users');
    return { success: true };
  } catch (error) {
    console.error('Error deleting user:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete user',
    };
  }
}

export async function changeUserPassword(userId: string, newPassword: string) {
  try {
    const session = await getServerSession(authOptions);
    if (session?.user?.role !== 'LEADERSHIP') {
      return { success: false, error: 'Only admins can change passwords' };
    }

    const validated = changePasswordSchema.parse({ userId, newPassword });

    const user = await prisma.user.findUnique({ where: { id: validated.userId } });
    if (!user) {
      return { success: false, error: 'User not found' };
    }

    if (user.role === 'MEMBER') {
      return { success: false, error: 'MEMBER users are managed via the member detail page' };
    }

    const passwordHash = await bcrypt.hash(validated.newPassword, 10);
    await prisma.user.update({
      where: { id: validated.userId },
      data: { passwordHash },
    });

    revalidatePath('/dashboard/users');
    return { success: true };
  } catch (error) {
    console.error('Error changing user password:', error);
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues.map((e) => e.message).join(', ') };
    }
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to change password',
    };
  }
}

export async function sendPasswordResetEmail(userId: string) {
  try {
    const session = await getServerSession(authOptions);
    if (session?.user?.role !== 'LEADERSHIP') {
      return { success: false, error: 'Only admins can send reset emails' };
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return { success: false, error: 'User not found' };
    }

    if (user.role === 'MEMBER') {
      return { success: false, error: 'MEMBER users are managed via the member detail page' };
    }

    if (!user.email) {
      return { success: false, error: 'User has no email address' };
    }

    const token = randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 1000 * 60 * 60); // 1 hour

    await prisma.verificationToken.create({
      data: { identifier: user.email, token, expires },
    });

    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    const resetUrl = `${baseUrl}/auth/reset?token=${token}&email=${encodeURIComponent(user.email)}`;

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : undefined,
      secure: process.env.SMTP_SECURE === 'true',
      auth: process.env.SMTP_USER
        ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
        : undefined,
    } as any);

    await transporter.sendMail({
      from: process.env.EMAIL_FROM || 'no-reply@example.com',
      to: user.email,
      subject: 'Password Reset — TIO Portal',
      text: [
        'Password Reset Request',
        '',
        `Hi ${user.name || 'there'},`,
        '',
        'An administrator has requested a password reset for your TIO Portal account.',
        '',
        `Click here to reset your password: ${resetUrl}`,
        '',
        'This link will expire in 1 hour.',
        '',
        'If you did not expect this, please contact your team administrator.',
        '',
        '— The Invisible Orthodontist',
      ].join('\n'),
      html: `
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
              <img src="https://drive.google.com/uc?export=view&id=1iQ15Z1lfMmqe0RaGl_zldm_J1RaTkhQA" alt="The Invisible Orthodontist" width="95" style="display:block;margin:0 auto;max-width:95px;height:auto;" />
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="background-color:#ffffff;padding:40px;border-left:1px solid #e2e8f0;border-right:1px solid #e2e8f0;">
              <h2 style="margin:0 0 16px;color:#192845;font-size:20px;text-align:center;font-family:'Century Gothic',CenturyGothic,AppleGothic,sans-serif;">
                Password Reset
              </h2>
              <hr style="border:none;border-top:1px solid #e2e8f0;margin:16px 0 24px;" />
              <p style="margin:0 0 16px;color:#192845;font-size:15px;line-height:1.6;">
                Hi ${user.name || 'there'},
              </p>
              <p style="margin:0 0 24px;color:#192845;font-size:15px;line-height:1.6;">
                An administrator has requested a password reset for your TIO Portal account. Click the button below to set a new password:
              </p>

              <!-- Reset Button -->
              <table role="presentation" cellpadding="0" cellspacing="0" style="margin-bottom:32px;">
                <tr>
                  <td style="border-radius:8px;background-color:#192845;">
                    <a href="${resetUrl}" target="_blank" style="display:inline-block;padding:14px 32px;color:#ffffff;font-size:15px;font-weight:700;text-decoration:none;font-family:'Century Gothic',CenturyGothic,AppleGothic,sans-serif;">
                      Reset Password
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin:0 0 16px;color:#64748b;font-size:14px;line-height:1.6;">
                This link will expire in 1 hour. If you did not expect this email, please contact your team administrator.
              </p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background-color:#f7f9fb;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 12px 12px;padding:24px 40px;text-align:center;">
              <p style="margin:0;color:#94a3b8;font-size:12px;font-family:'Century Gothic',CenturyGothic,AppleGothic,sans-serif;">
                &copy; ${new Date().getFullYear()} The Invisible Orthodontist. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,
    });

    return { success: true };
  } catch (error) {
    console.error('Error sending password reset email:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send reset email',
    };
  }
}
