// app/page.tsx
// TOBIRA — Root Page
// No header. No footer. No navigation.
// Just the conversation.

import TobiraChat from '@/components/TobiraChat';

export const metadata = {
  title: 'tobira',
  description: '',
  // No description — the app doesn't announce itself
};

export default function Home() {
  return <TobiraChat />;
}