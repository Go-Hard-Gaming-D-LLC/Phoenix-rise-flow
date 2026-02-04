// app/utils/developerAlert.ts

/**
 * PHOENIX FLOW: DEVELOPER DISTRESS SIGNAL
 * Use this to log critical failures (Fraud, API Crashes, Limits)
 * so they appear clearly in your Cloudflare Pages logs.
 */
export async function sendDeveloperAlert(
  type: 'ERROR' | 'LIMIT_REACHED' | 'FRAUD',
  message: string,
  details?: any
) {
  const timestamp = new Date().toISOString();

  // 1. THE LOUD LOG (Visible in Cloudflare/Terminal)
  // We use a specific format " [DEV_ALERT] " so you can filter for it easily.
  console.error(`🚨 [DEV_ALERT] [${type}] ${timestamp}: ${message}`);

  if (details) {
    console.error(JSON.stringify(details, null, 2));
  }

  // Future: Add email notifications here if needed.
}
