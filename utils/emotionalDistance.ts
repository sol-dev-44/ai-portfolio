import { SentimentData } from '@/store/api/moodLensApi';

export interface EmotionalDistance {
    distance: number; // 0-1 (0 = identical, 1 = maximum difference)
    similarity: number; // 0-100% (inverted distance)
    differences: {
        valence: number;
        arousal: number;
        dominance: number;
    };
    dominantDifference: 'valence' | 'arousal' | 'dominance';
}

/**
 * Calculate the emotional distance between two sentiment analyses.
 * Uses Euclidean distance in 3D sentiment space (valence, arousal, dominance).
 */
export function calculateEmotionalDistance(
    sentimentA: SentimentData,
    sentimentB: SentimentData
): EmotionalDistance {
    // Calculate differences for each dimension
    const valenceDiff = Math.abs(sentimentA.valence - sentimentB.valence);
    const arousalDiff = Math.abs(sentimentA.arousal - sentimentB.arousal);
    const dominanceDiff = Math.abs(sentimentA.dominance - sentimentB.dominance);

    // Euclidean distance in 3D space
    // Max possible distance is sqrt(3) when comparing (-1,0,0) to (1,1,1) for example
    // We normalize by dividing by sqrt(3) to get 0-1 range
    const rawDistance = Math.sqrt(
        valenceDiff ** 2 + arousalDiff ** 2 + dominanceDiff ** 2
    );

    const maxDistance = Math.sqrt(3); // sqrt(2^2 + 1^2 + 1^2) for valence range of -1 to 1
    const normalizedDistance = Math.min(rawDistance / maxDistance, 1);

    // Similarity is inverse of distance
    const similarity = (1 - normalizedDistance) * 100;

    // Find which dimension has the largest difference
    const diffs = {
        valence: valenceDiff,
        arousal: arousalDiff,
        dominance: dominanceDiff,
    };

    const dominantDifference = (Object.keys(diffs) as Array<keyof typeof diffs>).reduce((a, b) =>
        diffs[a] > diffs[b] ? a : b
    );

    return {
        distance: normalizedDistance,
        similarity: Math.round(similarity),
        differences: {
            valence: valenceDiff,
            arousal: arousalDiff,
            dominance: dominanceDiff,
        },
        dominantDifference,
    };
}

/**
 * Generate human-readable comparison insights
 */
export function generateComparisonInsights(
    sentimentA: SentimentData,
    sentimentB: SentimentData,
    distance: EmotionalDistance
): string[] {
    const insights: string[] = [];

    // Valence comparison
    if (distance.differences.valence > 0.3) {
        const morePositive = sentimentA.valence > sentimentB.valence ? 'A' : 'B';
        const diff = Math.round(distance.differences.valence * 100);
        insights.push(`Image ${morePositive} is ${diff}% more positive`);
    }

    // Arousal comparison
    if (distance.differences.arousal > 0.3) {
        const moreEnergetic = sentimentA.arousal > sentimentB.arousal ? 'A' : 'B';
        const diff = Math.round(distance.differences.arousal * 100);
        insights.push(`Image ${moreEnergetic} is ${diff}% more energetic`);
    }

    return insights;
}
