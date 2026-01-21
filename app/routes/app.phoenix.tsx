import { useState } from 'react';
import { Form, useNavigation, useActionData, useSubmit } from '@remix-run/react';
import { Page, Layout, Card, Text, TextField, Button, BlockStack } from '@shopify/polaris';

export default function PhoenixFlow() {
    const [prompt, setPrompt] = useState('');
    const nav = useNavigation();
    const actionData = useActionData<{ content?: string; error?: string }>();
    const submit = useSubmit();

    const isLoading = nav.state === 'submitting';

    const handleGenerate = () => {
        // Submit data to the resource route we created
        submit({ prompt }, { method: 'POST', action: '/api/phoenix', encType: 'application/json' });
    };

    return (
        <Page title="Phoenix Flow AI">
            <Layout>
                <Layout.Section>
                    <Card>
                        <BlockStack gap="400">
                            <Text as="h2" variant="headingMd">Generate Content</Text>
                            <TextField
                                label="Prompt"
                                value={prompt}
                                onChange={setPrompt}
                                multiline={4}
                                autoComplete="off"
                                disabled={isLoading}
                            />
                            <Button onClick={handleGenerate} loading={isLoading} variant="primary">
                                Generate with Gemini
                            </Button>

                            {actionData?.content && (
                                <BlockStack gap="200">
                                    <Text as="h3" variant="headingSm">Result:</Text>
                                    <div style={{ padding: '10px', background: '#f4f4f4', borderRadius: '4px' }}>
                                        <Text as="p">{actionData.content}</Text>
                                    </div>
                                </BlockStack>
                            )}
                        </BlockStack>
                    </Card>
                </Layout.Section>
            </Layout>
        </Page>
    );
}
