
export class ShopifyClient {
    private token: string;
    private domain: string;

    constructor(domain: string, token: string) {
        // Store the domain to dynamically build API paths
        this.domain = domain.replace(/^https?:\/\//, '').replace(/\/$/, '');
        this.token = token;
    }

    private getHeaders() {
        return {
            'Content-Type': 'application/json',
            'X-Shopify-Access-Token': this.token,
        };
    }

    private getApiUrl(path: string): string {
        // Build URL using the stored domain
        return `${this.domain}${path}`;
    }

    // Helper to extract handle from URL
    private getHandleFromUrl(url: string): string | null {
        try {
            const urlObj = new URL(url);
            const pathParts = urlObj.pathname.split('/');
            // varied paths: /products/handle or /collections/.../products/handle
            const productIndex = pathParts.lastIndexOf('products');
            if (productIndex !== -1 && productIndex + 1 < pathParts.length) {
                return pathParts[productIndex + 1];
            }
            return null;
        } catch (e) {
            return null;
        }
    }

    async findProductIdByHandle(handle: string): Promise<string | null> {
        try {
            const proxyUrl = new URL('/api/proxy/shopify', window.location.origin);
            proxyUrl.searchParams.append('shopify_url', `https://${this.domain}`);
            proxyUrl.searchParams.append('path', `/admin/api/2024-01/products.json?handle=${handle}`);
            proxyUrl.searchParams.append('token', this.token);

            const response = await fetch(proxyUrl.toString(), {
                method: 'GET',
                headers: this.getHeaders(),
            });

            if (!response.ok) {
                throw new Error(`Shopify API Error: ${response.statusText}`);
            }

            const data = await response.json();
            if (data.products && data.products.length > 0) {
                return data.products[0].id;
            }
            return null;
        } catch (error) {
            console.error("Failed to find product:", error);
            throw error;
        }
    }

    async updateProduct(productId: string, data: any): Promise<boolean> {
        try {
            const proxyUrl = new URL('/api/proxy/shopify', window.location.origin);
            const response = await fetch(proxyUrl.toString(), {
                method: 'POST',
                headers: this.getHeaders(),
                body: JSON.stringify({
                    shopify_url: `https://${this.domain}`,
                    path: `/admin/api/2024-01/products/${productId}.json`,
                    token: this.token,
                    method: 'PUT',
                    data: { product: data }
                }),
            });

            if (!response.ok) {
                const err = await response.json();
                console.error("Shopify Update Error:", err);
                throw new Error(JSON.stringify(err));
            }
            return true;
        } catch (error) {
            console.error("Failed to update product:", error);
            throw error;
        }
    }

    async applyOptimization(url: string, optimization: any): Promise<{ success: boolean; message: string }> {
        const handle = this.getHandleFromUrl(url);
        if (!handle) return { success: false, message: "Could not parse product handle from URL." };

        try {
            const productId = await this.findProductIdByHandle(handle);
            if (!productId) return { success: false, message: "Product not found in Shopify Admin." };

            const updatePayload: any = {
                id: productId,
                title: optimization.shopifyProductTitle,
                body_html: optimization.optimizedDescription, // basic description update
                tags: optimization.shopifyTags,
                // Metafields are harder (require separate endpoints), doing basics first.
            };

            await this.updateProduct(productId, updatePayload);
            return { success: true, message: "Product updated successfully!" };
        } catch (e: any) {
            return { success: false, message: `Update failed: ${e.message}` };
        }
    }

    async getLinkLists(): Promise<any[]> {
        try {
            const proxyUrl = new URL('/api/proxy/shopify', window.location.origin);
            proxyUrl.searchParams.append('shopify_url', `https://${this.domain}`);
            proxyUrl.searchParams.append('path', `/admin/api/2024-01/link_lists.json`);
            proxyUrl.searchParams.append('token', this.token);

            const response = await fetch(proxyUrl.toString(), {
                method: 'GET',
                headers: this.getHeaders(),
            });
            const data = await response.json();
            return data.link_lists || [];
        } catch (error) {
            console.error('Failed to get link lists:', error);
            return [];
        }
    }

    async updateLinkList(id: number, links: any[]): Promise<boolean> {
        try {
            const proxyUrl = new URL('/api/proxy/shopify', window.location.origin);
            const response = await fetch(proxyUrl.toString(), {
                method: 'POST',
                headers: this.getHeaders(),
                body: JSON.stringify({
                    shopify_url: `https://${this.domain}`,
                    path: `/admin/api/2024-01/link_lists/${id}.json`,
                    token: this.token,
                    method: 'PUT',
                    data: { link_list: { id, links } }
                }),
            });
            return response.ok;
        } catch (error) {
            console.error('Failed to update link list:', error);
            return false;
        }
    }

    // --- MOBILE FIXER LOGIC ---

    async getThemes(): Promise<any[]> {
        try {
            const proxyUrl = new URL('/api/proxy/shopify', window.location.origin);
            proxyUrl.searchParams.append('shopify_url', `https://${this.domain}`);
            proxyUrl.searchParams.append('path', `/admin/api/2024-01/themes.json`);
            proxyUrl.searchParams.append('token', this.token);

            const response = await fetch(proxyUrl.toString(), {
                method: 'GET',
                headers: this.getHeaders(),
            });
            const data = await response.json();
            return data.themes || [];
        } catch (error) {
            console.error('Failed to get themes:', error);
            return [];
        }
    }

    async getAsset(themeId: number, key: string): Promise<string> {
        try {
            const proxyUrl = new URL('/api/proxy/shopify', window.location.origin);
            proxyUrl.searchParams.append('shopify_url', `https://${this.domain}`);
            proxyUrl.searchParams.append('path', `/admin/api/2024-01/themes/${themeId}/assets.json?asset[key]=${key}`);
            proxyUrl.searchParams.append('token', this.token);

            const response = await fetch(proxyUrl.toString(), {
                method: 'GET',
                headers: this.getHeaders(),
            });
            const data = await response.json();
            return data.asset?.value || '';
        } catch (error) {
            console.error('Failed to get asset:', error);
            return '';
        }
    }

    async updateAsset(themeId: number, key: string, value: string): Promise<boolean> {
        try {
            const proxyUrl = new URL('/api/proxy/shopify', window.location.origin);
            const response = await fetch(proxyUrl.toString(), {
                method: 'POST',
                headers: this.getHeaders(),
                body: JSON.stringify({
                    shopify_url: `https://${this.domain}`,
                    path: `/admin/api/2024-01/themes/${themeId}/assets.json`,
                    token: this.token,
                    method: 'PUT',
                    data: { asset: { key, value } }
                }),
            });
            return response.ok;
        } catch (error) {
            console.error('Failed to update asset:', error);
            return false;
        }
    }

    async applyMobileFix(): Promise<{ success: boolean; message: string }> {
        try {
            const themes = await this.getThemes();
            const mainTheme = themes.find((t: any) => t.role === 'main');
            if (!mainTheme) return { success: false, message: "Could not find a live theme." };

            const html = await this.getAsset(mainTheme.id, 'layout/theme.liquid');

            // Logic check similar to python script
            if (html.includes('<meta name="viewport"')) {
                return { success: true, message: "Mobile view is already active (viewport meta tag present)." };
            }

            if (!html.includes('<head>')) {
                return { success: false, message: "Could not find <head> tag in theme.liquid." };
            }

            // Inject the fix
            const newHtml = html.replace('<head>', '<head>\n  <meta name="viewport" content="width=device-width, initial-scale=1">');

            const result = await this.updateAsset(mainTheme.id, 'layout/theme.liquid', newHtml);
            if (result) {
                return { success: true, message: "✅ FIXED! Your site is now mobile-responsive." };
            } else {
                return { success: false, message: "Failed to update theme asset." };
            }
        } catch (e: any) {
            console.error(e);
            return { success: false, message: `Fix failed: ${e.message}` };
        }
    }

    async getSmartCollections(): Promise<any[]> {
        try {
            const proxyUrl = new URL('/api/proxy/shopify', window.location.origin);
            proxyUrl.searchParams.append('shopify_url', `https://${this.domain}`);
            proxyUrl.searchParams.append('path', `/admin/api/2024-01/smart_collections.json`);
            proxyUrl.searchParams.append('token', this.token);

            const response = await fetch(proxyUrl.toString(), {
                method: 'GET',
                headers: this.getHeaders(),
            });
            const data = await response.json();
            return data.smart_collections || [];
        } catch (error) {
            console.error('Failed to get smart collections:', error);
            return [];
        }
    }

    async createSmartCollection(title: string, ruleTag: string): Promise<{ success: boolean; message: string }> {
        try {
            const payload = {
                smart_collection: {
                    title: title,
                    rules: [
                        {
                            column: 'tag',
                            relation: 'equals',
                            condition: ruleTag
                        }
                    ]
                }
            };

            const proxyUrl = new URL('/api/proxy/shopify', window.location.origin);
            const response = await fetch(proxyUrl.toString(), {
                method: 'POST',
                headers: this.getHeaders(),
                body: JSON.stringify({
                    shopify_url: `https://${this.domain}`,
                    path: `/admin/api/2024-01/smart_collections.json`,
                    token: this.token,
                    method: 'POST',
                    data: payload
                }),
            });

            if (!response.ok) {
                const err = await response.json();
                throw new Error(JSON.stringify(err));
            }
            return { success: true, message: `Collection "${title}" created successfully!` };
        } catch (e: any) {
            return { success: false, message: `Failed to create collection: ${e.message}` };
        }
    }

    async graphql(query: string, variables: any = {}): Promise<any> {
        const proxyUrl = new URL('/api/proxy/shopify', window.location.origin);
        const response = await fetch(proxyUrl.toString(), {
            method: 'POST',
            headers: this.getHeaders(),
            body: JSON.stringify({
                shopify_url: `https://${this.domain}`,
                path: `/admin/api/2024-01/graphql.json`,
                token: this.token,
                method: 'POST',
                data: { query, variables }
            }),
        });
        const data = await response.json();
        if (data.errors) {
            throw new Error(JSON.stringify(data.errors));
        }
        return data.data;
    }

    async autoFixPolicies(): Promise<{ success: boolean; message: string }> {
        try {
            // 1. Check existing policies
            const checkQuery = `
                query {
                    shop {
                        refundPolicy { id }
                        privacyPolicy { id }
                        termsOfService { id }
                        shippingPolicy { id }
                    }
                }
            `;
            const checkData = await this.graphql(checkQuery);
            const missing: any[] = [];
            if (!checkData.shop.refundPolicy) missing.push({ type: "REFUND_POLICY", title: "Refund Policy", body: "We have a 30-day return policy..." });
            if (!checkData.shop.privacyPolicy) missing.push({ type: "PRIVACY_POLICY", title: "Privacy Policy", body: "This Privacy Policy describes how..." });
            if (!checkData.shop.termsOfService) missing.push({ type: "TERMS_OF_SERVICE", title: "Terms of Service", body: "Overview..." });
            if (!checkData.shop.shippingPolicy) missing.push({ type: "SHIPPING_POLICY", title: "Shipping Policy", body: "Shipping rates are calculated..." });

            // 2. Create missing policies via GraphQL Mutation
            // Note: shopPolicyUpdate handles creation if missing for some types, or we use shopPolicyCreate (deprecated in favor of specific mutations or updates depending on API version).
            // Actually, for policies, 'shopPolicyUpdate' is the standard way to set them.
            for (const m of missing) {
                const mutation = `
                    mutation shopPolicyUpdate($shopPolicy: ShopPolicyInput!) {
                        shopPolicyUpdate(shopPolicy: $shopPolicy) {
                            shopPolicy {
                                id
                                title
                                url
                            }
                            userErrors {
                                field
                                message
                            }
                        }
                    }
                `;
                // Default generic text for now - in a real app, this would be smarter/templated
                await this.graphql(mutation, {
                    shopPolicy: {
                        type: m.type,
                        body: m.body
                    }
                });
            }

            // 3. Link to Footer Menu
            // First get the Footer menu ID
            const menus = await this.getLinkLists();
            const footer = menus.find((m: any) => m.handle === 'footer');
            if (!footer) throw new Error("Footer menu not found");

            // We use the REST endpoint for menu updates as it's often simpler for appending than GraphQL unless using specific ID structure
            // But let's check what links already exist to avoid duplicates
            const currentLinks = footer.links.map((l: any) => l.title);
            const newLinks = [...footer.links];

            const standardPolicies = [
                { title: "Refund Policy", url: "/policies/refund-policy" },
                { title: "Privacy Policy", url: "/policies/privacy-policy" },
                { title: "Terms of Service", url: "/policies/terms-of-service" },
                { title: "Shipping Policy", url: "/policies/shipping-policy" }
            ];

            let addedCount = 0;
            for (const p of standardPolicies) {
                if (!currentLinks.includes(p.title)) {
                    newLinks.push({ title: p.title, type: 'http', url: p.url });
                    addedCount++;
                }
            }

            if (addedCount > 0) {
                await this.updateLinkList(footer.id, newLinks);
                return { success: true, message: `✅ Fixed ${missing.length} missing policies & added ${addedCount} links to Footer.` };
            } else {
                return { success: true, message: "✅ Policies checked. Footer menu already up to date." };
            }

        } catch (e: any) {
            console.error("Policy fix failed:", e);
            return { success: false, message: `Fix failed: ${e.message}` };
        }
    }

    async getProductsGraphQL(): Promise<any[]> {
        const query = `
            query {
                products(first: 50) {
                    edges {
                        node {
                            id
                            title
                            handle
                            descriptionHtml
                            tags
                            media(first: 1) {
                                edges { node { preview { image { url } } } }
                            }
                        }
                    }
                }
            }
        `;
        const data = await this.graphql(query);
        return data.products.edges.map((e: any) => ({
            id: e.node.id,
            title: e.node.title,
            handle: e.node.handle,
            descriptionHtml: e.node.descriptionHtml || '',
            tags: e.node.tags || [],
            image: e.node.media.edges[0]?.node.preview?.image?.url || ''
        }));
    }

    async uploadVideoToProduct(productId: string, videoUrl: string): Promise<any> {
        const mutation = `
            mutation productCreateMedia($media: [CreateMediaInput!]!, $productId: ID!) {
                productCreateMedia(media: $media, productId: $productId) {
                    media {
                        id
                        status
                        ... on MediaVideo {
                           sources { url }
                        }
                    }
                    mediaUserErrors {
                        field
                        message
                    }
                }
            }
        `;
        return await this.graphql(mutation, {
            productId: productId,
            media: [
                {
                    originalSource: videoUrl,
                    mediaContentType: "VIDEO"
                }
            ]
        });
    }

    async updateProductSEO(productId: string, title: string, descriptionHtml: string, seoTitle: string, seoDesc: string): Promise<any> {
        const mutation = `
            mutation productUpdate($input: ProductInput!) {
                productUpdate(input: $input) {
                    product {
                        id
                        title
                    }
                    userErrors {
                        field
                        message
                    }
                }
            }
        `;
        return await this.graphql(mutation, {
            input: {
                id: productId,
                title: title,
                descriptionHtml: descriptionHtml,
                seo: {
                    title: seoTitle,
                    description: seoDesc
                }
            }
        });
    }

    async updateProductImageAlt(productId: string, imageId: string, altText: string): Promise<any> {
        const mutation = `
            mutation productImageUpdate($productId: ID!, $image: ImageInput!) {
                productImageUpdate(productId: $productId, image: $image) {
                    image {
                        id
                        altText
                    }
                    userErrors {
                        field
                        message
                    }
                }
            }
        `;
        return await this.graphql(mutation, {
            productId: productId,
            image: {
                id: imageId,
                altText: altText
            }
        });
    }

    async updateProductDescription(productId: string, newDescriptionHtml: string): Promise<any> {
        const mutation = `
            mutation productUpdate($input: ProductInput!) {
                productUpdate(input: $input) {
                    product { id }
                    userErrors { field message }
                }
            }
        `;
        return await this.graphql(mutation, {
            input: {
                id: productId,
                descriptionHtml: newDescriptionHtml
            }
        });
    }
}
