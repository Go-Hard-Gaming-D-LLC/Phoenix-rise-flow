/**
 * PHOENIX FLOW: USAGE TRACKING
 * Track feature usage per shop for billing
 */

import db from "../db.server";

export interface UsageStats {
  descriptionsThisMonth: number;
  adsThisMonth: number;
  musicVideosThisMonth: number;
  resetDate: Date;
}

/**
 * Get current month's usage for a shop
 */
export async function getMonthlyUsage(shop: string): Promise<UsageStats> {
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  // Count optimizations by type for current month
  const descriptions = await db.optimizationHistory.count({
    where: {
      shop,
      optimizationType: { in: ['bulk_analysis', 'description'] },
      createdAt: { gte: startOfMonth }
    }
  });

  const ads = await db.optimizationHistory.count({
    where: {
      shop,
      optimizationType: 'product_ad',
      createdAt: { gte: startOfMonth }
    }
  });

  const musicVideos = await db.optimizationHistory.count({
    where: {
      shop,
      optimizationType: 'music_video',
      createdAt: { gte: startOfMonth }
    }
  });

  // Next reset date (first day of next month)
  const resetDate = new Date(startOfMonth);
  resetDate.setMonth(resetDate.getMonth() + 1);

  return {
    descriptionsThisMonth: descriptions,
    adsThisMonth: ads,
    musicVideosThisMonth: musicVideos,
    resetDate
  };
}

/**
 * Check if user can perform an action based on their tier and usage
 */
export async function canPerformAction(
  shop: string,
  userTier: string,
  actionType: 'description' | 'ad' | 'music_video'
): Promise<{ allowed: boolean; reason?: string }> {
  const { TIERS, hasReachedLimit } = await import('./tierConfig');
  const tier = TIERS[userTier];
  
  if (!tier) {
    return { allowed: false, reason: "Invalid tier" };
  }

  const usage = await getMonthlyUsage(shop);

  // Map action type to limit type
  const limitMap = {
    description: 'descriptionsPerMonth' as const,
    ad: 'adsPerMonth' as const,
    music_video: 'musicVideosPerMonth' as const
  };

  const usageMap = {
    description: usage.descriptionsThisMonth,
    ad: usage.adsThisMonth,
    music_video: usage.musicVideosThisMonth
  };

  const limitType = limitMap[actionType];
  const currentUsage = usageMap[actionType];

  if (hasReachedLimit(userTier, limitType, currentUsage)) {
    const limit = tier.limits[limitType];
    return {
      allowed: false,
      reason: `Monthly limit reached (${limit}/${limit}). Upgrade your plan or wait until ${usage.resetDate.toLocaleDateString()}.`
    };
  }

  return { allowed: true };
}

/**
 * Record usage of a feature
 */
export async function recordUsage(
  shop: string,
  actionType: 'description' | 'ad' | 'music_video',
  metadata?: Record<string, any>
): Promise<void> {
  const typeMap = {
    description: 'bulk_analysis',
    ad: 'product_ad',
    music_video: 'music_video'
  };

  await db.optimizationHistory.create({
    data: {
      shop,
      productId: metadata?.productId || null,
      productName: metadata?.productName || 'N/A',
      optimizationType: typeMap[actionType],
      optimizedContent: JSON.stringify(metadata || {}),
      aiModel: 'gemini-1.5-flash',
      status: 'success'
    }
  });
}

/**
 * Get usage summary with overage calculations
 */
export async function getUsageSummary(shop: string, userTier: string) {
  const { TIERS, calculateOverage } = await import('./tierConfig');
  const tier = TIERS[userTier];
  const usage = await getMonthlyUsage(shop);

  const descriptionOverage = calculateOverage(
    userTier,
    'descriptionsPerMonth',
    usage.descriptionsThisMonth
  );

  const adOverage = calculateOverage(
    userTier,
    'adsPerMonth',
    usage.adsThisMonth
  );

  const videoOverage = calculateOverage(
    userTier,
    'musicVideosPerMonth',
    usage.musicVideosThisMonth
  );

  const totalOverageCost = 
    descriptionOverage.cost + 
    adOverage.cost + 
    videoOverage.cost;

  return {
    tier: tier.name,
    usage: {
      descriptions: {
        used: usage.descriptionsThisMonth,
        limit: tier.limits.descriptionsPerMonth === -1 
          ? 'Unlimited' 
          : tier.limits.descriptionsPerMonth,
        overage: descriptionOverage
      },
      ads: {
        used: usage.adsThisMonth,
        limit: tier.limits.adsPerMonth === -1 
          ? 'Unlimited' 
          : tier.limits.adsPerMonth,
        overage: adOverage
      },
      musicVideos: {
        used: usage.musicVideosThisMonth,
        limit: tier.limits.musicVideosPerMonth === -1 
          ? 'Unlimited' 
          : tier.limits.musicVideosPerMonth,
        overage: videoOverage
      }
    },
    totalOverageCost,
    resetDate: usage.resetDate
  };
}