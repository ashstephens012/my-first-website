import { prisma } from '@/lib/prisma';

type DeliverableTemplate = {
  category: string;
  name: string;
  annualAllocation: number;
};

export const TIER_TEMPLATES: Record<string, DeliverableTemplate[]> = {
  Platinum: [
    { category: 'Digital Strategy', name: 'Strategic Reports', annualAllocation: 4 },
    { category: 'Digital Strategy', name: 'Annual In-Practice Visit', annualAllocation: 1 },
    { category: 'Digital Strategy', name: 'Strategic Meetings (Online)', annualAllocation: 4 },
    { category: 'Digital Strategy', name: 'Website Maintenance Edits (Minor)', annualAllocation: 72 },
    { category: 'Digital Strategy', name: 'Website Maintenance Edits (Major)', annualAllocation: 12 },
    { category: 'Digital Strategy', name: 'Promotion/Event Campaigns', annualAllocation: 4 },
    { category: 'Digital Strategy', name: 'Landing Pages', annualAllocation: 4 },
    { category: 'Consulting', name: 'In-Practice Strategic Workshop', annualAllocation: 1 },
    { category: 'Consulting', name: 'In-Practice 6 Month Strategic Plan Revisit', annualAllocation: 1 },
    { category: 'Consulting', name: 'Online Consulting Hours', annualAllocation: 12 },
    { category: 'Consulting', name: 'Secret Shopper Calls', annualAllocation: 1 },
    { category: 'Consulting', name: '12 Month Strategic Plan', annualAllocation: 1 },
    { category: 'Consulting', name: 'Annual Benchmarking Report', annualAllocation: 1 },
  ],
  Diamond: [
    { category: 'Digital Strategy', name: 'Strategic Reports', annualAllocation: 12 },
    { category: 'Digital Strategy', name: 'Annual In-Practice Visit', annualAllocation: 1 },
    { category: 'Digital Strategy', name: 'Strategic Meetings (Online)', annualAllocation: 12 },
    { category: 'Digital Strategy', name: 'Promotion/Event Campaigns', annualAllocation: 6 },
    { category: 'Digital Strategy', name: 'Landing Pages', annualAllocation: 6 },
    { category: 'Consulting', name: 'In-Practice Strategic Workshop', annualAllocation: 2 },
    { category: 'Consulting', name: 'In-Practice 6 Month Strategic Plan Revisit', annualAllocation: 1 },
    { category: 'Consulting', name: 'Online Consulting Hours', annualAllocation: 24 },
    { category: 'Consulting', name: 'Secret Shopper Calls', annualAllocation: 2 },
    { category: 'Consulting', name: '12 Month Strategic Plan', annualAllocation: 1 },
    { category: 'Consulting', name: 'Annual Benchmarking Report', annualAllocation: 1 },
  ],
};

/**
 * Populate deliverables for a member based on their tier template.
 * Uses upsert so existing rows are skipped (preserving manual tweaks).
 */
/**
 * Extract the tier level (e.g. "Platinum") from a full tier string
 * that may include a region prefix (e.g. "UKI Platinum").
 */
function extractTierLevel(tier: string): string {
  const parts = tier.trim().split(/\s+/);
  return parts[parts.length - 1];
}

export async function populateDeliverables(memberId: string, tier: string, year: number) {
  const tierLevel = extractTierLevel(tier);
  const templates = TIER_TEMPLATES[tierLevel];
  if (!templates) {
    throw new Error(`No deliverable template found for tier: ${tier}`);
  }

  for (const template of templates) {
    await prisma.memberDeliverable.upsert({
      where: {
        memberId_year_name: {
          memberId,
          year,
          name: template.name,
        },
      },
      update: {},
      create: {
        memberId,
        year,
        category: template.category,
        name: template.name,
        annualAllocation: template.annualAllocation,
      },
    });
  }
}
