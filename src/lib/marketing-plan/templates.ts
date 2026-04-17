import { prisma } from '@/lib/prisma';

type ActivityTemplate = {
  month: number;
  label: string;
  ownership: 'TIO' | 'PRACTICE';
};

type ChannelTemplate = {
  name: string;
  alwaysOn: boolean;
  description?: string;
  sortOrder: number;
  activities: ActivityTemplate[];
};

export const MARKETING_PLAN_TEMPLATES: Record<string, ChannelTemplate[]> = {
  Platinum: [
    {
      name: 'Digital Ads',
      alwaysOn: true,
      description: 'Always on — Google Ads, Social Ads',
      sortOrder: 0,
      activities: [],
    },
    {
      name: 'Website Upkeep',
      alwaysOn: false,
      description: undefined,
      sortOrder: 1,
      activities: [
        { month: 2, label: 'Blog Post', ownership: 'TIO' },
        { month: 5, label: 'Blog Post', ownership: 'TIO' },
        { month: 8, label: 'Blog Post', ownership: 'TIO' },
        { month: 11, label: 'Blog Post', ownership: 'TIO' },
      ],
    },
    {
      name: 'CRM - Email',
      alwaysOn: false,
      description: undefined,
      sortOrder: 2,
      activities: [
        { month: 1, label: 'Lead Promo', ownership: 'TIO' },
        { month: 3, label: 'Dental Newsletter', ownership: 'TIO' },
        { month: 4, label: 'Lead Promo', ownership: 'TIO' },
        { month: 6, label: 'Dental Newsletter', ownership: 'TIO' },
        { month: 7, label: 'Lead Promo', ownership: 'TIO' },
        { month: 9, label: 'Dental Newsletter', ownership: 'TIO' },
        { month: 10, label: 'Lead Promo', ownership: 'TIO' },
        { month: 12, label: 'Dental Newsletter', ownership: 'TIO' },
      ],
    },
    {
      name: 'CRM - SMS',
      alwaysOn: false,
      description: undefined,
      sortOrder: 3,
      activities: [
        { month: 1, label: 'Lead Promo', ownership: 'TIO' },
        { month: 4, label: 'Lead Promo', ownership: 'TIO' },
        { month: 7, label: 'Lead Promo', ownership: 'TIO' },
        { month: 10, label: 'Lead Promo', ownership: 'TIO' },
      ],
    },
    {
      name: 'Social Media',
      alwaysOn: true,
      description: 'Always on — Practice-managed social content',
      sortOrder: 4,
      activities: [],
    },
    {
      name: 'Google My Business',
      alwaysOn: true,
      description: 'Always on — Listing optimisation & posts',
      sortOrder: 5,
      activities: [],
    },
    {
      name: 'Local Area Marketing',
      alwaysOn: false,
      description: undefined,
      sortOrder: 6,
      activities: [
        { month: 2, label: 'Letterbox Drop', ownership: 'PRACTICE' },
        { month: 5, label: 'Local Initiative', ownership: 'PRACTICE' },
        { month: 8, label: 'Letterbox Drop', ownership: 'PRACTICE' },
        { month: 11, label: 'Local Initiative', ownership: 'PRACTICE' },
      ],
    },
    {
      name: 'Events',
      alwaysOn: false,
      description: undefined,
      sortOrder: 7,
      activities: [
        { month: 3, label: 'GP/Dental Visit', ownership: 'PRACTICE' },
        { month: 6, label: 'Community Event', ownership: 'PRACTICE' },
        { month: 9, label: 'GP/Dental Visit', ownership: 'PRACTICE' },
        { month: 12, label: 'Community Event', ownership: 'PRACTICE' },
      ],
    },
    {
      name: 'School Holidays',
      alwaysOn: false,
      description: undefined,
      sortOrder: 8,
      activities: [
        { month: 1, label: 'Summer Holidays', ownership: 'PRACTICE' },
        { month: 4, label: 'Easter Break', ownership: 'PRACTICE' },
        { month: 7, label: 'Winter Break', ownership: 'PRACTICE' },
        { month: 10, label: 'Spring Break', ownership: 'PRACTICE' },
      ],
    },
  ],
  Diamond: [
    {
      name: 'Digital Ads',
      alwaysOn: true,
      description: 'Always on — Google Ads, Social Ads, Retargeting',
      sortOrder: 0,
      activities: [],
    },
    {
      name: 'Website Upkeep',
      alwaysOn: false,
      description: undefined,
      sortOrder: 1,
      activities: [
        { month: 1, label: 'Blog Post', ownership: 'TIO' },
        { month: 3, label: 'Blog Post', ownership: 'TIO' },
        { month: 5, label: 'Blog Post', ownership: 'TIO' },
        { month: 7, label: 'Blog Post', ownership: 'TIO' },
        { month: 9, label: 'Blog Post', ownership: 'TIO' },
        { month: 11, label: 'Blog Post', ownership: 'TIO' },
      ],
    },
    {
      name: 'CRM - Email',
      alwaysOn: false,
      description: undefined,
      sortOrder: 2,
      activities: [
        { month: 1, label: 'Lead Promo', ownership: 'TIO' },
        { month: 2, label: 'CPD Event', ownership: 'TIO' },
        { month: 3, label: 'Dental Newsletter', ownership: 'TIO' },
        { month: 4, label: 'Lead Promo', ownership: 'TIO' },
        { month: 5, label: 'CPD Event', ownership: 'TIO' },
        { month: 6, label: 'Dental Newsletter', ownership: 'TIO' },
        { month: 7, label: 'Lead Promo', ownership: 'TIO' },
        { month: 8, label: 'CPD Event', ownership: 'TIO' },
        { month: 9, label: 'Dental Newsletter', ownership: 'TIO' },
        { month: 10, label: 'Lead Promo', ownership: 'TIO' },
        { month: 11, label: 'CPD Event', ownership: 'TIO' },
        { month: 12, label: 'Dental Newsletter', ownership: 'TIO' },
      ],
    },
    {
      name: 'CRM - SMS',
      alwaysOn: false,
      description: undefined,
      sortOrder: 3,
      activities: [
        { month: 1, label: 'Lead Promo', ownership: 'TIO' },
        { month: 4, label: 'Lead Promo', ownership: 'TIO' },
        { month: 7, label: 'Lead Promo', ownership: 'TIO' },
        { month: 10, label: 'Lead Promo', ownership: 'TIO' },
      ],
    },
    {
      name: 'Social Media',
      alwaysOn: true,
      description: 'Always on — Practice-managed social content',
      sortOrder: 4,
      activities: [],
    },
    {
      name: 'Google My Business',
      alwaysOn: true,
      description: 'Always on — Listing optimisation & posts',
      sortOrder: 5,
      activities: [],
    },
    {
      name: 'Local Area Marketing',
      alwaysOn: false,
      description: undefined,
      sortOrder: 6,
      activities: [
        { month: 2, label: 'Letterbox Drop', ownership: 'PRACTICE' },
        { month: 5, label: 'Local Initiative', ownership: 'PRACTICE' },
        { month: 8, label: 'Letterbox Drop', ownership: 'PRACTICE' },
        { month: 11, label: 'Local Initiative', ownership: 'PRACTICE' },
      ],
    },
    {
      name: 'Events',
      alwaysOn: false,
      description: undefined,
      sortOrder: 7,
      activities: [
        { month: 3, label: 'GP/Dental Visit', ownership: 'PRACTICE' },
        { month: 6, label: 'Community Event', ownership: 'PRACTICE' },
        { month: 9, label: 'GP/Dental Visit', ownership: 'PRACTICE' },
        { month: 12, label: 'Community Event', ownership: 'PRACTICE' },
      ],
    },
    {
      name: 'School Holidays',
      alwaysOn: false,
      description: undefined,
      sortOrder: 8,
      activities: [
        { month: 1, label: 'Summer Holidays', ownership: 'PRACTICE' },
        { month: 4, label: 'Easter Break', ownership: 'PRACTICE' },
        { month: 7, label: 'Winter Break', ownership: 'PRACTICE' },
        { month: 10, label: 'Spring Break', ownership: 'PRACTICE' },
      ],
    },
  ],
};

/**
 * Extract the tier level (e.g. "Platinum") from a full tier string
 * that may include a region prefix (e.g. "UKI Platinum").
 */
function extractTierLevel(tier: string): string {
  const parts = tier.trim().split(/\s+/);
  return parts[parts.length - 1];
}

/**
 * Populate a marketing plan for a member based on their tier template.
 * Upserts the plan and channels; only seeds activities when a channel has zero
 * (preserves consultant customisations on re-init).
 */
export async function populateMarketingPlan(memberId: string, tier: string, year: number) {
  const tierLevel = extractTierLevel(tier);
  const templates = MARKETING_PLAN_TEMPLATES[tierLevel];
  if (!templates) {
    throw new Error(`No marketing plan template found for tier: ${tier}`);
  }

  // Upsert the plan
  const plan = await prisma.marketingPlan.upsert({
    where: { memberId_year: { memberId, year } },
    update: {},
    create: { memberId, year },
  });

  for (const template of templates) {
    // Upsert the channel
    const channel = await prisma.marketingChannel.upsert({
      where: {
        marketingPlanId_name: {
          marketingPlanId: plan.id,
          name: template.name,
        },
      },
      update: {
        alwaysOn: template.alwaysOn,
        description: template.description ?? null,
        sortOrder: template.sortOrder,
      },
      create: {
        marketingPlanId: plan.id,
        name: template.name,
        alwaysOn: template.alwaysOn,
        description: template.description ?? null,
        sortOrder: template.sortOrder,
      },
    });

    // Only seed activities when channel has none (preserve existing customisations)
    const existingCount = await prisma.marketingActivity.count({
      where: { marketingChannelId: channel.id },
    });

    if (existingCount === 0 && template.activities.length > 0) {
      await prisma.marketingActivity.createMany({
        data: template.activities.map((a, idx) => ({
          marketingChannelId: channel.id,
          month: a.month,
          label: a.label,
          ownership: a.ownership,
          sortOrder: idx,
        })),
      });
    }
  }
}
