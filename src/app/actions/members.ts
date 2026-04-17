/**
 * Server Actions for Member Management
 */

'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { extractLogoUrl } from '@/lib/logo-extractor';
import { getCompanyDetails } from '@/lib/hubspot/fetchers';
import { randomBytes } from 'crypto';
import nodemailer from 'nodemailer';

const memberSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Valid email is required'),
  hubspotCompanyId: z.string().min(1, 'HubSpot Company ID is required'),
  practiceType: z.string().optional(),
  consultantName: z.string().optional(),
  digitalStrategistName: z.string().optional(),
  region: z.enum(['UKI', 'ANZ']),
  annualCaseStartsTarget: z.string().optional(),
  websiteUrl: z.string().url().optional().or(z.literal('')),
  allClientsAccountId: z.string().optional(),
  allClientsApiKey: z.string().optional(),
  status: z.enum(['active', 'onboarding', 'notice_given', 'offboarding', 'previous_member']).default('active'),
});

/**
 * Create a new member
 */
export async function createMember(formData: FormData) {
  try {
    const data = {
      name: formData.get('name') as string,
      email: formData.get('email') as string,
      hubspotCompanyId: formData.get('hubspotCompanyId') as string,
      practiceType: (formData.get('practiceType') as string) || undefined,
      consultantName: (formData.get('consultantName') as string) || undefined,
      digitalStrategistName: (formData.get('digitalStrategistName') as string) || undefined,
      region: formData.get('region') as string,
      annualCaseStartsTarget: (formData.get('annualCaseStartsTarget') as string) || undefined,
      websiteUrl: (formData.get('websiteUrl') as string) || '',
      allClientsAccountId: (formData.get('allClientsAccountId') as string) || undefined,
      allClientsApiKey: (formData.get('allClientsApiKey') as string) || undefined,
      status: (formData.get('status') as string) || 'active',
    };

    const validated = memberSchema.parse(data);

    // Don't store empty string as websiteUrl
    const { websiteUrl, allClientsAccountId, allClientsApiKey, ...rest } = validated;
    const member = await prisma.member.create({
      data: {
        ...rest,
        websiteUrl: websiteUrl || null,
        allClientsAccountId: allClientsAccountId || null,
        allClientsApiKey: allClientsApiKey || null,
      },
    });

    // Fetch memberSince and membershipTier from HubSpot in background
    getCompanyDetails(validated.hubspotCompanyId).then(async (company) => {
      const dateJoined = company?.properties?.date_joined_tio;
      const membershipTier = company?.properties?.membership_tier;
      const data: Record<string, any> = {};
      if (dateJoined) data.memberSince = new Date(dateJoined);
      if (membershipTier) data.membershipTier = membershipTier;
      if (Object.keys(data).length > 0) {
        await prisma.member.update({
          where: { id: member.id },
          data,
        });
      }
    }).catch(console.error);

    // Extract logo in background if website URL provided
    if (websiteUrl) {
      extractLogoUrl(websiteUrl).then(async (logoUrl) => {
        if (logoUrl) {
          await prisma.member.update({
            where: { id: member.id },
            data: { logoUrl },
          });
        }
      }).catch(console.error);
    }

    revalidatePath('/dashboard/members');
    return { success: true, member };
  } catch (error) {
    console.error('Error creating member:', error);
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues.map((e) => e.message).join(', ') };
    }
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create member',
    };
  }
}

/**
 * Update an existing member
 */
export async function updateMember(memberId: string, formData: FormData) {
  try {
    const data = {
      name: formData.get('name') as string,
      email: formData.get('email') as string,
      hubspotCompanyId: formData.get('hubspotCompanyId') as string,
      practiceType: (formData.get('practiceType') as string) || undefined,
      consultantName: (formData.get('consultantName') as string) || undefined,
      digitalStrategistName: (formData.get('digitalStrategistName') as string) || undefined,
      region: formData.get('region') as string,
      annualCaseStartsTarget: (formData.get('annualCaseStartsTarget') as string) || undefined,
      websiteUrl: (formData.get('websiteUrl') as string) || '',
      allClientsAccountId: (formData.get('allClientsAccountId') as string) || undefined,
      allClientsApiKey: (formData.get('allClientsApiKey') as string) || undefined,
      status: (formData.get('status') as string) || 'active',
    };

    const validated = memberSchema.parse(data);

    const { websiteUrl, allClientsAccountId, allClientsApiKey, ...rest } = validated;
    const member = await prisma.member.update({
      where: { id: memberId },
      data: {
        ...rest,
        websiteUrl: websiteUrl || null,
        allClientsAccountId: allClientsAccountId || null,
        allClientsApiKey: allClientsApiKey || null,
      },
    });

    // Fetch memberSince and membershipTier from HubSpot in background
    getCompanyDetails(validated.hubspotCompanyId).then(async (company) => {
      const dateJoined = company?.properties?.date_joined_tio;
      const membershipTier = company?.properties?.membership_tier;
      const data: Record<string, any> = {};
      if (dateJoined) data.memberSince = new Date(dateJoined);
      if (membershipTier) data.membershipTier = membershipTier;
      if (Object.keys(data).length > 0) {
        await prisma.member.update({
          where: { id: memberId },
          data,
        });
      }
    }).catch(console.error);

    // Re-extract logo if website URL changed
    if (websiteUrl) {
      extractLogoUrl(websiteUrl).then(async (logoUrl) => {
        if (logoUrl) {
          await prisma.member.update({
            where: { id: memberId },
            data: { logoUrl },
          });
        }
      }).catch(console.error);
    } else {
      // Clear logo if website URL removed
      await prisma.member.update({
        where: { id: memberId },
        data: { logoUrl: null },
      });
    }

    revalidatePath('/dashboard/members');
    revalidatePath(`/dashboard/members/${memberId}`);
    return { success: true, member };
  } catch (error) {
    console.error('Error updating member:', error);
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues.map((e) => e.message).join(', ') };
    }
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update member',
    };
  }
}

/**
 * Delete a member
 */
export async function deleteMember(memberId: string) {
  try {
    await prisma.member.delete({
      where: { id: memberId },
    });

    revalidatePath('/dashboard/members');
    return { success: true };
  } catch (error) {
    console.error('Error deleting member:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete member',
    };
  }
}

/**
 * Get all members
 */
export async function getMembers() {
  try {
    const currentYear = new Date().getFullYear();
    const members = await prisma.member.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: { reports: true },
        },
        deliverables: {
          where: { year: currentYear },
          take: 1,
          select: { id: true },
        },
      },
    });

    const membersWithInit = members.map(({ deliverables, ...rest }) => ({
      ...rest,
      isInitialised: deliverables.length > 0 && !!rest.annualCaseStartsTarget,
    }));

    return { success: true, members: membersWithInit };
  } catch (error) {
    console.error('Error fetching members:', error);
    return {
      success: false,
      error: 'Failed to fetch members',
      members: [],
    };
  }
}

/**
 * Get a single member with reports
 */
export async function getMemberWithReports(memberId: string) {
  try {
    const member = await prisma.member.findUnique({
      where: { id: memberId },
      include: {
        reports: {
          orderBy: { reportMonth: 'desc' },
        },
        users: {
          select: { id: true, name: true, email: true, jobTitle: true, portalTier: true, createdAt: true },
        },
        caseStartSubmissions: {
          orderBy: [{ year: 'desc' }, { month: 'asc' }],
        },
        prmContactCounts: {
          orderBy: [{ year: 'desc' }, { month: 'desc' }],
        },
        quarterlyFocuses: {
          orderBy: [{ year: 'desc' }, { quarter: 'asc' }],
        },
        deliverables: {
          include: { completions: true },
          orderBy: [{ category: 'asc' }, { name: 'asc' }],
        },
        marketingPlans: {
          include: {
            channels: {
              orderBy: { sortOrder: 'asc' },
              include: { activities: { orderBy: [{ month: 'asc' }, { sortOrder: 'asc' }] } },
            },
          },
          orderBy: { year: 'desc' },
        },
      },
    });

    return { success: true, member };
  } catch (error) {
    console.error('Error fetching member:', error);
    return {
      success: false,
      error: 'Failed to fetch member',
      member: null,
    };
  }
}

/**
 * Create a portal login for a member.
 * Accepts explicit name, email, and tier for multi-user support.
 * Sends a password-setup email via the existing reset flow.
 */
export async function createMemberLogin(memberId: string, name: string, email: string, portalTier: number, jobTitle?: string) {
  try {
    const member = await prisma.member.findUnique({
      where: { id: memberId },
    });

    if (!member) {
      return { success: false, error: 'Member not found' };
    }

    // Check if a User with this email already exists
    const existingUser = await prisma.user.findUnique({ where: { email } });

    if (existingUser) {
      if (existingUser.memberId) {
        return { success: false, error: 'A user with this email already has a portal login' };
      }
      // Link existing user to this member
      await prisma.user.update({
        where: { id: existingUser.id },
        data: { memberId: member.id, role: 'MEMBER', name, portalTier, jobTitle: jobTitle || null },
      });
    } else {
      // Create new user with MEMBER role
      await prisma.user.create({
        data: {
          email,
          name,
          role: 'MEMBER',
          memberId: member.id,
          portalTier,
          jobTitle: jobTitle || null,
        },
      });
    }

    // Generate verification token for password setup
    const token = randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 1000 * 60 * 60 * 24); // 24 hours

    await prisma.verificationToken.create({
      data: { identifier: email, token, expires },
    });

    const setupUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/auth/reset?token=${token}&email=${encodeURIComponent(email)}`;

    // Send password setup email
    let emailSent = false;
    try {
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
        to: email,
        subject: 'Set up your Member Portal password',
        text: `Welcome to the Member Portal! Set your password here: ${setupUrl}`,
        html: `
          <h2>Welcome to the Member Portal</h2>
          <p>Hi ${name},</p>
          <p>A portal account has been created for you. Click the link below to set your password:</p>
          <p><a href="${setupUrl}">Set up your password</a></p>
          <p>This link expires in 24 hours.</p>
        `,
      });
      emailSent = true;
    } catch (emailError) {
      console.error('Failed to send setup email:', emailError);
    }

    revalidatePath(`/dashboard/members/${memberId}`);
    return { success: true, emailSent, setupUrl: emailSent ? undefined : setupUrl };
  } catch (error) {
    console.error('Error creating member login:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create portal login',
    };
  }
}

/**
 * Resend the password setup email for a specific portal user.
 */
export async function resendMemberSetupEmail(memberId: string, userId: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || user.memberId !== memberId) {
      return { success: false, error: 'Portal user not found for this member' };
    }

    if (!user.email) {
      return { success: false, error: 'User has no email address' };
    }

    // Clear any existing tokens for this email
    await prisma.verificationToken.deleteMany({
      where: { identifier: user.email },
    });

    const token = randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 1000 * 60 * 60 * 24); // 24 hours

    await prisma.verificationToken.create({
      data: { identifier: user.email, token, expires },
    });

    const setupUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/auth/reset?token=${token}&email=${encodeURIComponent(user.email)}`;

    let emailSent = false;
    try {
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
        subject: 'Set up your Member Portal password',
        text: `Set your password here: ${setupUrl}`,
        html: `
          <h2>Member Portal Password Setup</h2>
          <p>Hi ${user.name || 'there'},</p>
          <p>Click the link below to set your password:</p>
          <p><a href="${setupUrl}">Set up your password</a></p>
          <p>This link expires in 24 hours.</p>
        `,
      });
      emailSent = true;
    } catch (emailError) {
      console.error('Failed to send setup email:', emailError);
    }

    return { success: true, emailSent, setupUrl: emailSent ? undefined : setupUrl };
  } catch (error) {
    console.error('Error resending setup email:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to resend setup email',
    };
  }
}

/**
 * Remove a specific portal user for a member (deletes the User).
 */
export async function removeMemberLogin(memberId: string, userId: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || user.memberId !== memberId) {
      return { success: false, error: 'Portal user not found for this member' };
    }

    // Delete sessions, accounts, verification tokens, then the user
    await prisma.session.deleteMany({ where: { userId: user.id } });
    await prisma.account.deleteMany({ where: { userId: user.id } });
    if (user.email) {
      await prisma.verificationToken.deleteMany({ where: { identifier: user.email } });
    }
    await prisma.user.delete({ where: { id: user.id } });

    revalidatePath(`/dashboard/members/${memberId}`);
    return { success: true };
  } catch (error) {
    console.error('Error removing member login:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to remove portal login',
    };
  }
}

/**
 * Update a portal user's tier.
 */
export async function updatePortalUserTier(userId: string, portalTier: number) {
  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.memberId) {
      return { success: false, error: 'Portal user not found' };
    }

    await prisma.user.update({
      where: { id: userId },
      data: { portalTier },
    });

    revalidatePath(`/dashboard/members/${user.memberId}`);
    return { success: true };
  } catch (error) {
    console.error('Error updating portal user tier:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update tier',
    };
  }
}

export async function updatePortalUserJobTitle(userId: string, jobTitle: string) {
  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.memberId) {
      return { success: false, error: 'Portal user not found' };
    }

    await prisma.user.update({
      where: { id: userId },
      data: { jobTitle: jobTitle.trim() || null },
    });

    revalidatePath(`/dashboard/members/${user.memberId}`);
    return { success: true };
  } catch (error) {
    console.error('Error updating portal user job title:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update job title',
    };
  }
}

/**
 * Update a member's annual case starts target.
 */
export async function updateAnnualCaseStartsTarget(memberId: string, target: string | null) {
  try {
    await prisma.member.update({
      where: { id: memberId },
      data: { annualCaseStartsTarget: target || null },
    });

    revalidatePath(`/dashboard/members/${memberId}`);
    return { success: true };
  } catch (error) {
    console.error('Error updating annual case starts target:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update target',
    };
  }
}
