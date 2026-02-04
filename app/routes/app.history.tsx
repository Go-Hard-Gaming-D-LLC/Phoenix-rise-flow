import { json, type LoaderFunctionArgs } from "@remix-run/cloudflare";
import { useLoaderData } from "@remix-run/react";
import { Page, Layout, Card, ResourceList, ResourceItem, Text, Badge, BlockStack } from "@shopify/polaris";
import { authenticate } from "../shopify.server";
import db from "../db.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
    const { session } = await authenticate.admin(request);

    // Fetch the truth from the ledger 
    const history = await db.optimizationHistory.findMany({
        where: { shop: session.shop },
        orderBy: { createdAt: "desc" },
        take: 50,
    });

    return json({ history });
};

export default function HistoryPage() {
    const { history } = useLoaderData<typeof loader>();

    return (
        <Page title="Phoenix History Ledger">
            <Layout>
                <Layout.Section>
                    <Card padding="0">
                        <ResourceList
                            resourceName={{ singular: 'optimization', plural: 'optimizations' }}
                            items={history}
                            renderItem={(item) => {
                                const { id, productName, optimizationType, createdAt, status } = item;
                                const date = new Date(createdAt).toLocaleDateString();

                                return (
                                    <ResourceItem
                                        id={id.toString()}
                                        onClick={() => { }}
                                        accessibilityLabel={`View details for ${productName}`}
                                    >
                                        <BlockStack gap="100">
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <Text variant="bodyMd" fontWeight="bold" as="h3">
                                                    {productName}
                                                </Text>
                                                <Badge tone={status === "success" ? "success" : "warning"}>
                                                    {optimizationType}
                                                </Badge>
                                            </div>
                                            <Text variant="bodySm" tone="subdued" as="p">
                                                Executed on {date}
                                            </Text>
                                        </BlockStack>
                                    </ResourceItem>
                                );
                            }}
                        />
                    </Card>
                </Layout.Section>
            </Layout>
        </Page>
    );
}
