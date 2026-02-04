import { Page, Layout, Card, Text, Button, Banner, BlockStack, Box } from "@shopify/polaris";
import { LockIcon } from "@shopify/polaris-icons";

export default function LockdownUI() {
    return (
        <Page>
            <Layout>
                <Layout.Section>
                    <div style={{ display: 'flex', justifyContent: 'center', marginTop: '50px' }}>
                        <Card>
                            <Box padding="600">
                                <BlockStack gap="500" align="center">
                                    <div style={{ color: '#critical', marginBottom: '20px' }}>
                                        {/* Using Shopify Polaris Icon style */}
                                        <LockIcon width="60" color="base" />
                                    </div>

                                    <Text variant="headingXl" as="h1" alignment="center">
                                        Trial Already Claimed
                                    </Text>

                                    <Banner tone="critical">
                                        <Text as="p">
                                            Our records indicate that this store (or a linked account) has already participated in the
                                            Iron Phoenix trial program within the last 6 months.
                                        </Text>
                                    </Banner>

                                    <BlockStack gap="200">
                                        <Text variant="bodyLg" as="p" alignment="center">
                                            To continue accessing the logic controller and executive burst features,
                                            please upgrade to a professional plan.
                                        </Text>

                                        <Button variant="primary" size="large" url="/app/pricing">
                                            View Upgrade Options
                                        </Button>
                                    </BlockStack>
                                </BlockStack>
                            </Box>
                        </Card>
                    </div>
                </Layout.Section>
            </Layout>
        </Page>
    );
}
