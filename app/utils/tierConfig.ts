/**
 * PHOENIX FLOW: TIER MANAGEMENT
 * Pricing based on industry standards ($1/ad generation)
 */

export interface TierConfig {
  name: string;
  price: number; // USD per month
  productsPerScan: number;
  features: string[];
  limits: {
    descriptionsPerMonth: number;
    adsPerMonth: number;
    musicVideosPerMonth: number;
  };
}

export const TIERS: Record<string, TierConfig> = {
  free: {
    name: "Free Tier",
    price: 0,
    productsPerScan: 5,
    features: [
      'description_generator',
      'alt_text',
      'policy_scan',
      'pdf_report'
    ],
    limits: {
      descriptionsPerMonth: 10,
      adsPerMonth: 0,
      musicVideosPerMonth: 0
    }
  },
  
  starter: {
    name: "Starter",
    price: 29, // $29/month - industry standard for basic Shopify apps
    productsPerScan: 25,
    features: [
      'description_generator',
      'alt_text',
      'policy_scan',
      'pdf_report',
      'bulk_analyzer',
      'product_ads'
    ],
    limits: {
      descriptionsPerMonth: 100,
      adsPerMonth: 30, // ~$1/ad = $30 value included
      musicVideosPerMonth: 0
    }
  },
  
  professional: {
    name: "Professional",
    price: 79, // $79/month - mid-tier Shopify apps
    productsPerScan: 100,
    features: [
      'description_generator',
      'alt_text',
      'policy_scan',
      'pdf_report',
      'bulk_analyzer',
      'product_ads',
      'music_video',
      'song_showcase',
      'priority_support'
    ],
    limits: {
      descriptionsPerMonth: 500,
      adsPerMonth: 100, // ~$100 value included
      musicVideosPerMonth: 10 // Premium feature
    }
  },
  
  enterprise: {
    name: "Enterprise",
    price: 199, // $199/month - premium tier
    productsPerScan: -1, // unlimited
    features: [
      'description_generator',
      'alt_text',
      'policy_scan',
      'pdf_report',
      'bulk_analyzer',
      'product_ads',
      'music_video',
      'song_showcase',
      'priority_support',
      'white_label',
      'api_access',
      'custom_training'
    ],
    limits: {
      descriptionsPerMonth: -1, // unlimited
      adsPerMonth: -1, // unlimited
      musicVideosPerMonth: -1 // unlimited
    }
  }
};

/**
 * Check if user can access a feature
 */
export function canAccessFeature(userTier: string, feature: string): boolean {
  const tier = TIERS[userTier];
  if (!tier) return false;
  return tier.features.includes(feature);
}

/**
 * Check if user has reached their usage limit
 */
export function hasReachedLimit(
  userTier: string,
  limitType: 'descriptionsPerMonth' | 'adsPerMonth' | 'musicVideosPerMonth',
  currentUsage: number
): boolean {
  const tier = TIERS[userTier];
  if (!tier) return true;
  
  const limit = tier.limits[limitType];
  if (limit === -1) return false; // unlimited
  
  return currentUsage >= limit;
}

/**
 * Calculate overage charges for pay-as-you-go
 */
export function calculateOverage(
  userTier: string,
  limitType: 'descriptionsPerMonth' | 'adsPerMonth' | 'musicVideosPerMonth',
  currentUsage: number
): { overage: number; cost: number } {
  const tier = TIERS[userTier];
  if (!tier) return { overage: 0, cost: 0 };
  
  const limit = tier.limits[limitType];
  if (limit === -1) return { overage: 0, cost: 0 }; // unlimited
  
  const overage = Math.max(0, currentUsage - limit);
  
  // Pricing per additional unit
  const rates = {
    descriptionsPerMonth: 0.10, // $0.10 per extra description
    adsPerMonth: 1.00, // $1.00 per extra ad
    musicVideosPerMonth: 5.00 // $5.00 per extra video
  };
  
  return {
    overage,
    cost: overage * rates[limitType]
  };
}

/**
 * Get user's current tier from database
 */
export async function getUserTier(shop: string): Promise<string> {
  // TODO: Query from database or Shopify billing
  // For now, return 'free' as default
  return 'free';
}

/**
 * Format tier limits for display
 */
export function formatTierLimits(tier: TierConfig): string[] {
  const limits = [];
  
  if (tier.productsPerScan === -1) {
    limits.push("Unlimited products per scan");
  } else {
    limits.push(`Scan up to ${tier.productsPerScan} products`);
  }
  
  if (tier.limits.descriptionsPerMonth === -1) {
    limits.push("Unlimited AI descriptions");
  } else {
    limits.push(`${tier.limits.descriptionsPerMonth} AI descriptions/month`);
  }
  
  if (tier.limits.adsPerMonth > 0) {
    limits.push(`${tier.limits.adsPerMonth} product ads/month (~$${tier.limits.adsPerMonth} value)`);
  }
  
  if (tier.limits.musicVideosPerMonth > 0) {
    if (tier.limits.musicVideosPerMonth === -1) {
      limits.push("Unlimited music videos");
    } else {
      limits.push(`${tier.limits.musicVideosPerMonth} music videos/month`);
    }
  }
  
  return limits;
}