/**
 * 🛡️ SHADOW'S FORGE: CORE LOGIC GATE
 * WARNING: DO NOT MODIFY THIS FILE WITHOUT EXPLICIT PERMISSION.
 * This file governs the Bulk Analyzer command center and burst routing.
 */
import { useLoaderData, useFetcher, useNavigation } from "@remix-run/react";
import { type LoaderFunctionArgs } from "@remix-run/cloudflare";
import { 
  Page, Layout, Card, Text, BlockStack, Banner, 
  Badge, DataTable, Button, InlineStack, SkeletonPage, 
  SkeletonBodyText, Box 
} from "@shopify/polaris";
import { authenticate } from "../shopify.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
    const { admin } = await authenticate.admin(request);
    
    // ✅ SYNC: Same 50-item audit scan used in Phoenix Flow
    const response = await admin.graphql(`
      query auditInventory {
        products(first: 50) {
          nodes {
            id
            title
            descriptionHtml
            seo { description }
          }
        }
      }
    `);

    const { data } = await response.json();
    
    const audited = data.products.nodes.map((p: any) => {
        let score = 100;
        if (!p.descriptionHtml || p.descriptionHtml.length < 50) score -= 40;
        if (!p.seo?.description) score -= 30;
        return { ...p, healthScore: score };
    });

    return { 
        worstOffenders: audited.sort((a: any, b: any) => a.healthScore - b.healthScore).slice(0, 15) 
    };
};

export default function BulkAnalyzer() {
    const { worstOffenders } = useLoaderData<typeof loader>();
    const fetcher = useFetcher();
    const navigation = useNavigation();

    if (navigation.state === "loading") {
        return <SkeletonPage><Layout><Layout.Section><Card><SkeletonBodyText lines={5} /></Card></Layout.Section></Layout></SkeletonPage>;
    }

    return (
        <Page title="Executive Bulk Analyzer" subtitle="Portfolio-Wide SEO Triage">
            <Layout>
                <Layout.Section>
                    <Banner title="System Ready" tone="info">
                        <p>15 High-Priority targets identified for AI Burst optimization.</p>
                    </Banner>
                </Layout.Section>

                <Layout.Section>
                    <Card>
                        <BlockStack gap="400">
                            <Text variant="headingMd" as="h2">Hit List: Critical SEO Deficits</Text>
                            <DataTable
                                columnContentTypes={['text', 'numeric', 'text']}
                                headings={['Product', 'Health', 'Status']}
                                rows={worstOffenders.map(p => [
                                    p.title,
                                    <Badge tone={p.healthScore < 50 ? "critical" : "warning"}>{`${p.healthScore}%`}</Badge>,
                                    "Pending Fix"
                                ])}
                            />
                            <InlineStack align="end" gap="300">
                                <Button 
                                    onClick={() => fetcher.submit({ intent: "MEDIA_SEO_BURST" }, { method: "POST", action: "/app/logic-controller" })}
                                >
                                    Fix Media Alts
                                </Button>
                                <Button 
                                    variant="primary"
                                    onClick={() => fetcher.submit({ intent: "BULK_PORTFOLIO_SCAN" }, { method: "POST", action: "/app/logic-controller" })}
                                >
                                    Launch Executive Burst
                                </Button>
                            </InlineStack>
                        </BlockStack>
                    </Card>
                </Layout.Section>
            </Layout>
        </Page>
    );
}