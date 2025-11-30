import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Dog Breed Matcher | AI Portfolio',
    description: 'Find your perfect dog breed match using AI-powered semantic search and embeddings. Take a personalized quiz to discover ideal breeds for your lifestyle.',
};

export default function DogMatcherLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return children;
}
