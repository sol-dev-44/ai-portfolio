import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Pawfect Match | AI-Powered Dog Breed Discovery',
    description: 'Find your perfect dog breed match using AI-powered semantic search and embeddings. Take a personalized quiz, explore 300+ breeds, compare side-by-side, or chat with any breed!',
    keywords: ['dog breeds', 'pet matcher', 'AI', 'semantic search', 'embeddings', 'OpenAI', 'Supabase', 'RAG'],
    openGraph: {
        title: 'Pawfect Match - AI-Powered Dog Breed Discovery',
        description: 'Find your ideal canine companion using semantic search & AI',
        type: 'website',
    },
};

export default function DogMatcherLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return children;
}