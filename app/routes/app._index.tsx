import { useEffect } from "react";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { useFetcher } from "@remix-run/react";
import {
  Page,
  Layout,
  Text,
  Card,
  Button,
  BlockStack,
  Box,
  List,
  Link,
  InlineStack,
} from "@shopify/polaris";
import { TitleBar, useAppBridge } from "@shopify/app-bridge-react";
import { authenticate } from "../shopify.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  await authenticate.admin(request);

  return null;
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { admin } = await authenticate.admin(request);
  const color = ["Red", "Orange", "Yellow", "Green"][
    Math.floor(Math.random() * 4)
  ];
  const response = await admin.graphql(
    `#graphql
      mutation populateProduct($product: ProductCreateInput!) {
        productCreate(product: $product) {
          product {
            id
            title
            handle
            status
            variants(first: 10) {
              edges {
                node {
                  id
                  price
                  barcode
                  createdAt
                }
              }
            }
          }
        }
      }`,
    {
      variables: {
        product: {
          title: `${color} Snowboard`,
        },
      },
    },
  );
  const responseJson = await response.json();

  const product = responseJson.data!.productCreate!.product!;
  const variantId = product.variants.edges[0]!.node!.id!;

  const variantResponse = await admin.graphql(
    `#graphql
    mutation shopifyRemixTemplateUpdateVariant($productId: ID!, $variants: [ProductVariantsBulkInput!]!) {
      productVariantsBulkUpdate(productId: $productId, variants: $variants) {
        productVariants {
          id
          price
          barcode
          createdAt
        }
      }
    }`,
    {
      variables: {
        productId: product.id,
        variants: [{ id: variantId, price: "100.00" }],
      },
    },
  );

  const variantResponseJson = await variantResponse.json();

  return {
    product: responseJson!.data!.productCreate!.product,
    variant:
      variantResponseJson!.data!.productVariantsBulkUpdate!.productVariants,
  };
};

export default function Index() {
  const fetcher = useFetcher<typeof action>();

  const shopify = useAppBridge();
  const isLoading =
    ["loading", "submitting"].includes(fetcher.state) &&
    fetcher.formMethod === "POST";
  const productId = fetcher.data?.product?.id.replace(
    "gid://shopify/Product/",
    "",
  );

  useEffect(() => {
    if (productId) {
      shopify.toast.show("Product created");
    }
  }, [productId, shopify]);
  const generateProduct = () => fetcher.submit({}, { method: "POST" });

  return (
    <Page fullWidth>
      <TitleBar title="Phoenix Flow Dashboard" />
      <Layout>
        <Layout.Section>
          <BlockStack gap="500">
            <Card>
              <BlockStack gap="400">
                <Text as="h2" variant="headingLg">
                  Welcome to your Merchant Co-Pilot 🚀
                </Text>
                <Text as="p" variant="bodyMd">
                  Your AI-powered assistant for SEO, Trend Spotting, and High-Conversion Copywriting.
                  Select a tool below to get started.
                </Text>
              </BlockStack>
            </Card>

            <InlineStack gap="400" align="start">
              <div style={{ flex: 1, minWidth: "300px" }}>
                <Card>
                  <BlockStack gap="400">
                    <Text as="h3" variant="headingMd">
                      ✍️ Product Description Generator
                    </Text>
                    <Text as="p">
                      Create SEO-optimized product pages in seconds using Semrush & RankMath standards.
                    </Text>
                    <Link url="/app/description-generator">
                      <Button variant="primary">Launch Generator</Button>
                    </Link>
                  </BlockStack>
                </Card>
              </div>

              <div style={{ flex: 1, minWidth: "300px" }}>
                <Card>
                  <BlockStack gap="400">
                    <Text as="h3" variant="headingMd">
                      ⚙️ Business Vitals
                    </Text>
                    <Text as="p">
                      Configure your Brand Identity, Etsy Links, and Store Strategy.
                    </Text>
                    <Link url="/app/onboarding">
                      <Button variant="primary" tone="critical">Configure Vitals</Button>
                    </Link>
                  </BlockStack>
                </Card>
              </div>

              <div style={{ flex: 1, minWidth: "300px" }}>
                <Card>
                  <BlockStack gap="400">
                    <Text as="h3" variant="headingMd">
                      🔍 Bulk Portfolio Analyzer
                    </Text>
                    <Text as="p">
                      Audit 10 products at a time for SEO gaps, accessibility issues, and trend alignment.
                    </Text>
                    <Link url="/app/bulk-analyzer">
                      <Button variant="primary">Start Analysis</Button>
                    </Link>
                  </BlockStack>
                </Card>
              </div>

              <div style={{ flex: 1, minWidth: "300px" }}>
                <Card>
                  <BlockStack gap="400">
                    <Text as="h3" variant="headingMd">
                      🤖 Phoenix AI Chat
                    </Text>
                    <Text as="p">
                      Chat with your strategic assistant about market trends, blog ideas, and more.
                    </Text>
                    <Link url="/app/phoenix">
                      <Button variant="primary">Chat with Phoenix</Button>
                    </Link>
                  </BlockStack>
                </Card>
              </div>
            </InlineStack>
          </BlockStack>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
