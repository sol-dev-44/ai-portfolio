// scripts/ingest-lsat.ts - LSAT Pattern & Question Ingestion for RAG
// Run with: npx tsx --env-file=.env.local scripts/ingest-lsat.ts
//
// This creates embeddings for:
// 1. Pattern definitions (solving strategies, indicators, traps)
// 2. Analyzed questions (as examples for few-shot learning)

import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

// =============================================================================
// LSAT PATTERN DATABASE
// =============================================================================

interface PatternDefinition {
    type: string;
    name: string;
    category: 'analytical_reasoning' | 'logical_reasoning' | 'reading_comprehension';
    description: string;
    key_indicators: string[];
    solving_strategy: string[];
    common_traps: string[];
    example_stems: string[];
}

const LSAT_PATTERNS: PatternDefinition[] = [
    // === ANALYTICAL REASONING (Logic Games) ===
    {
        type: 'sequencing',
        name: 'Sequencing',
        category: 'analytical_reasoning',
        description: 'Arranging elements in a linear order based on constraints. Elements must be placed in positions (first to last, earliest to latest, etc.) following rules about relative positions.',
        key_indicators: ['before', 'after', 'earlier', 'later', 'first', 'last', 'immediately', 'adjacent', 'consecutive', 'precedes', 'follows', 'order', 'schedule', 'sequence'],
        solving_strategy: [
            'Draw a number line or slots representing positions',
            'Identify fixed positions first (e.g., "X is third")',
            'Place elements with the most constraints first',
            'Use arrows to show relative ordering (A→B means A before B)',
            'Look for chains: if A→B and B→C, then A→C',
            'Check each answer against ALL rules systematically'
        ],
        common_traps: [
            'Confusing "immediately before" with "somewhere before"',
            'Missing transitive relationships in chains',
            'Forgetting that "not adjacent" works both directions',
            'Assuming order when only relative position is given'
        ],
        example_stems: [
            'Which of the following could be the order',
            'If X is third, which must be true',
            'Which CANNOT be immediately before Y'
        ]
    },
    {
        type: 'grouping',
        name: 'Grouping',
        category: 'analytical_reasoning',
        description: 'Distributing elements into distinct groups, teams, or categories. May involve selection (choosing some from a larger pool) or pure distribution.',
        key_indicators: ['selected', 'chosen', 'team', 'group', 'committee', 'panel', 'assigned', 'divided', 'in', 'out', 'together', 'apart', 'same', 'different'],
        solving_strategy: [
            'Draw containers for each group',
            'Track minimum and maximum group sizes',
            'Note "must be together" and "cannot be together" pairs',
            'Apply contrapositives immediately (if A→B, then not-B→not-A)',
            'Look for numerical deductions (if 3 spots and 2 must be in...)',
            'Track elements that are definitely IN vs definitely OUT'
        ],
        common_traps: [
            'Not tracking group size limits',
            'Forgetting contrapositives of conditional rules',
            'Overlooking mutual exclusivity',
            'Missing that "at least one" leaves room for both'
        ],
        example_stems: [
            'Which could be a complete list of',
            'If X is selected, which must also be selected',
            'Which pair CANNOT both be on the committee'
        ]
    },
    {
        type: 'matching',
        name: 'Matching',
        category: 'analytical_reasoning',
        description: 'Pairing elements from two or more categories. Each element gets assigned attributes or matched with other elements.',
        key_indicators: ['assigned', 'paired', 'matched', 'each', 'attribute', 'characteristic', 'wears', 'drives', 'color', 'type'],
        solving_strategy: [
            'Create a grid with elements on rows, attributes on columns',
            'Mark definite YES and definite NO in cells',
            'If row has one empty cell and needs one more YES, fill it',
            'If column is full, mark remaining cells NO',
            'Track "exactly one" vs "at least one" constraints'
        ],
        common_traps: [
            'Assuming one-to-one when it might be one-to-many',
            'Not considering that an element might have multiple attributes',
            'Missing negative inferences from positive placements'
        ],
        example_stems: [
            'Which attribute must be assigned to X',
            'If X has attribute A, which must be true',
            'Which is a complete and accurate matching'
        ]
    },
    {
        type: 'hybrid',
        name: 'Hybrid',
        category: 'analytical_reasoning',
        description: 'Combines multiple game types - often sequencing with grouping, or matching with sequencing. Requires juggling multiple frameworks.',
        key_indicators: ['scheduled', 'assigned to days', 'morning/afternoon', 'multiple attributes per position'],
        solving_strategy: [
            'Identify which game type is primary (usually sequencing)',
            'Layer the secondary constraint type on top',
            'May need a two-dimensional diagram',
            'Solve the more constrained dimension first',
            'Look for interactions between the two systems'
        ],
        common_traps: [
            'Only tracking one dimension',
            'Not seeing how constraints interact across dimensions',
            'Overcomplicating the diagram'
        ],
        example_stems: [
            'On which day could X be scheduled for the morning',
            'If X and Y are on the same day, which must be true'
        ]
    },

    // === LOGICAL REASONING ===
    {
        type: 'strengthen',
        name: 'Strengthen',
        category: 'logical_reasoning',
        description: 'Find information that makes the conclusion more likely to be true. The correct answer provides additional support for the argument.',
        key_indicators: ['most strengthens', 'provides support', 'justifies', 'adds credibility', 'most helps'],
        solving_strategy: [
            'Identify the EXACT conclusion (not just the topic)',
            'Find the gap between evidence and conclusion',
            'Look for answer that bridges this specific gap',
            'Correct answer makes conclusion MORE likely, not certain',
            'Eliminate irrelevant answers (even if true statements)'
        ],
        common_traps: [
            'Picking answers that merely repeat the conclusion',
            'Choosing answers about the topic but not the argument',
            'Selecting extreme answers that go too far',
            'Confusing relevant background with actual support'
        ],
        example_stems: [
            'Which most strengthens the argument',
            'Which provides the best support for the conclusion',
            'Which, if true, most helps justify the reasoning'
        ]
    },
    {
        type: 'weaken',
        name: 'Weaken',
        category: 'logical_reasoning',
        description: 'Find information that makes the conclusion less likely to be true. Attack the reasoning link, not the premises themselves.',
        key_indicators: ['most weakens', 'casts doubt', 'undermines', 'calls into question', 'most seriously weakens'],
        solving_strategy: [
            'Identify the conclusion precisely',
            'Find the reasoning link to attack (the "bridge")',
            'Look for alternative explanations',
            'Look for counterexamples',
            'Answer should make conclusion LESS likely, not impossible'
        ],
        common_traps: [
            'Attacking premises instead of the reasoning',
            'Picking extreme answers that prove too much',
            'Missing the specific claim being weakened',
            'Choosing answers that strengthen by mistake'
        ],
        example_stems: [
            'Which most seriously weakens the argument',
            'Which casts the most doubt on the conclusion',
            'Which is the strongest objection'
        ]
    },
    {
        type: 'assumption',
        name: 'Necessary Assumption',
        category: 'logical_reasoning',
        description: 'Find the unstated premise that MUST be true for the argument to work. Without this assumption, the argument falls apart.',
        key_indicators: ['assumes', 'assumption', 'depends on', 'relies on', 'presupposes', 'takes for granted'],
        solving_strategy: [
            'Identify conclusion and stated premises',
            'Find the logical gap (what connects evidence to conclusion)',
            'Use NEGATION TEST: negate the answer - if argument breaks, it\'s necessary',
            'Necessary ≠ Sufficient: answer must be REQUIRED, not just helpful',
            'Look for scope shifts between premise and conclusion'
        ],
        common_traps: [
            'Confusing necessary with sufficient assumptions',
            'Picking answers that strengthen but aren\'t required',
            'Missing subtle scope changes (some→all, past→future)',
            'Choosing answers that are true but not assumed'
        ],
        example_stems: [
            'The argument assumes which of the following',
            'Which is an assumption on which the argument depends',
            'The argument relies on the assumption that'
        ]
    },
    {
        type: 'inference',
        name: 'Inference / Must Be True',
        category: 'logical_reasoning',
        description: 'Find what MUST be true based solely on the given information. Treat the stimulus as 100% true and find what follows.',
        key_indicators: ['must be true', 'properly inferred', 'can be concluded', 'follows logically', 'most strongly supported'],
        solving_strategy: [
            'Treat every statement in stimulus as absolute fact',
            'Look for answer provable from given information ALONE',
            'Combine multiple premises when possible',
            'Correct answer is often modest/narrow in scope',
            'Eliminate anything requiring outside assumptions'
        ],
        common_traps: [
            'Going beyond what is actually stated',
            'Confusing "could be true" with "must be true"',
            'Making assumptions not in the stimulus',
            'Picking answers that are likely but not certain'
        ],
        example_stems: [
            'Which must be true based on the statements above',
            'Which can be properly inferred',
            'Which is most strongly supported by the information'
        ]
    },
    {
        type: 'flaw',
        name: 'Flaw / Error in Reasoning',
        category: 'logical_reasoning',
        description: 'Identify the specific reasoning error in the argument. The argument has a logical mistake you must name.',
        key_indicators: ['flaw', 'vulnerable to criticism', 'error', 'questionable', 'problematic', 'weakness'],
        solving_strategy: [
            'Find the conclusion and the evidence',
            'Identify the gap or jump in logic',
            'Match to common flaw types (see list below)',
            'Answer must describe THIS argument\'s specific error',
            'Common flaws: circular, ad hominem, false cause, equivocation, hasty generalization'
        ],
        common_traps: [
            'Picking a general flaw that doesn\'t match this argument',
            'Confusing the conclusion with the flaw',
            'Selecting answers about what argument fails to consider',
            'Choosing answers that describe a different argument'
        ],
        example_stems: [
            'The reasoning is flawed because it',
            'Which identifies a vulnerability in the argument',
            'The argument is questionable because'
        ]
    },
    {
        type: 'parallel',
        name: 'Parallel Reasoning',
        category: 'logical_reasoning',
        description: 'Find an argument with the SAME logical structure as the original. Match the pattern, not the topic.',
        key_indicators: ['parallel', 'similar pattern', 'analogous', 'same logical structure', 'most similar'],
        solving_strategy: [
            'Abstract the original argument to its logical form',
            'Count: how many premises? What type of conclusion?',
            'Note: conditional? Causal? Comparison?',
            'Match STRUCTURE, not content or topic',
            'If original is flawed, correct answer must be flawed the SAME way'
        ],
        common_traps: [
            'Matching topic instead of structure',
            'Missing subtle structural differences',
            'Confusing similar conclusions with similar reasoning',
            'Not checking that flaw type matches'
        ],
        example_stems: [
            'Which argument is most similar in its reasoning',
            'Which exhibits a parallel pattern of reasoning',
            'The structure of the argument is most similar to'
        ]
    },
    {
        type: 'principle',
        name: 'Principle',
        category: 'logical_reasoning',
        description: 'Either identify a principle that justifies an action/conclusion, or apply a given principle to a new situation.',
        key_indicators: ['principle', 'justifies', 'conforms to', 'policy', 'rule', 'guideline'],
        solving_strategy: [
            'For "identify the principle": find the general rule the argument assumes',
            'For "apply the principle": match the rule to new facts',
            'Principles are usually conditional: IF condition, THEN result',
            'Check that ALL conditions of the principle are met'
        ],
        common_traps: [
            'Applying principle when conditions aren\'t fully met',
            'Picking a principle too narrow or too broad',
            'Ignoring parts of a complex principle'
        ],
        example_stems: [
            'Which principle, if valid, most helps justify',
            'The situation conforms to which principle',
            'Which action is in accordance with the policy'
        ]
    },
    {
        type: 'resolve',
        name: 'Resolve / Paradox',
        category: 'logical_reasoning',
        description: 'Find information that explains how two seemingly contradictory facts can both be true.',
        key_indicators: ['resolve', 'reconcile', 'explain', 'paradox', 'discrepancy', 'surprising', 'yet', 'however', 'although'],
        solving_strategy: [
            'Clearly identify the TWO facts that seem contradictory',
            'Correct answer shows how BOTH can be true simultaneously',
            'Often involves a hidden variable or distinction',
            'Answer doesn\'t disprove either fact - it harmonizes them'
        ],
        common_traps: [
            'Picking answers that only address one side',
            'Choosing answers that contradict one of the facts',
            'Selecting interesting information that doesn\'t resolve the conflict'
        ],
        example_stems: [
            'Which most helps resolve the apparent discrepancy',
            'Which explains the surprising finding',
            'Which reconciles the two observations'
        ]
    },
    {
        type: 'evaluate',
        name: 'Evaluate',
        category: 'logical_reasoning',
        description: 'Identify what additional information would help determine if the argument is good or bad.',
        key_indicators: ['evaluate', 'useful to know', 'helpful to determine', 'assess', 'relevant to determining'],
        solving_strategy: [
            'Find the argument\'s conclusion and reasoning',
            'Ask: what information could make this stronger OR weaker?',
            'Correct answer is relevant regardless of what the answer turns out to be',
            'Test both "yes" and "no" scenarios for the answer choice'
        ],
        common_traps: [
            'Picking information only relevant if answer is "yes"',
            'Choosing background information not relevant to argument validity',
            'Selecting answers that would only strengthen or only weaken'
        ],
        example_stems: [
            'Which would be most useful to know in evaluating',
            'The answer to which question would be most helpful',
            'Which is most relevant to assessing the argument'
        ]
    }
];

// =============================================================================
// EMBEDDING & STORAGE
// =============================================================================

async function generateEmbedding(text: string): Promise<number[]> {
    const response = await openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: text,
    });
    return response.data[0].embedding;
}

async function storeDocument(doc: {
    title: string;
    content: string;
    embedding: number[];
    metadata: Record<string, any>;
    url?: string;
}) {
    const { error } = await supabase.from('documents').insert({
        title: doc.title,
        content: doc.content,
        embedding: doc.embedding,
        metadata: doc.metadata,
        url: doc.url || '',
        chunk_index: 0,
        total_chunks: 1,
    });

    if (error) {
        console.error(`❌ Failed to store: ${doc.title}`, error.message);
        return false;
    }
    return true;
}

// =============================================================================
// INGESTION
// =============================================================================

async function ingestPatterns() {
    console.log('📚 Ingesting LSAT Pattern Definitions...\n');

    let success = 0;
    let failed = 0;

    for (const pattern of LSAT_PATTERNS) {
        // Create rich text for embedding
        const content = `
LSAT Pattern: ${pattern.name} (${pattern.type})
Category: ${pattern.category}

Description: ${pattern.description}

Key Indicators (words that signal this pattern):
${pattern.key_indicators.map(i => `- ${i}`).join('\n')}

Solving Strategy:
${pattern.solving_strategy.map((s, i) => `${i + 1}. ${s}`).join('\n')}

Common Traps to Avoid:
${pattern.common_traps.map(t => `⚠️ ${t}`).join('\n')}

Example Question Stems:
${pattern.example_stems.map(e => `• "${e}"`).join('\n')}
        `.trim();

        try {
            console.log(`  📝 ${pattern.name}...`);
            const embedding = await generateEmbedding(content);

            const stored = await storeDocument({
                title: `LSAT Pattern: ${pattern.name}`,
                content: content,
                embedding: embedding,
                metadata: {
                    type: 'lsat_pattern',
                    pattern_type: pattern.type,
                    category: pattern.category,
                    indicators: pattern.key_indicators,
                },
                url: `lsat://pattern/${pattern.type}`,
            });

            if (stored) {
                success++;
                console.log(`     ✅ Stored`);
            } else {
                failed++;
            }

            // Rate limiting
            await new Promise(r => setTimeout(r, 200));

        } catch (error: any) {
            console.error(`     ❌ Error: ${error.message}`);
            failed++;
        }
    }

    console.log(`\n📊 Pattern ingestion complete: ${success} stored, ${failed} failed`);
    return { success, failed };
}

async function ingestAnalyzedQuestion(
    question: {
        context: string;
        question: string;
        options: string[];
        answer: string | number;
    },
    analysis: {
        pattern_type: string;
        breakdown: any;
        correct_answer: any;
        incorrect_answers: any[];
        pattern_recognition_tips: string[];
    }
) {
    // Create content that captures the full example
    const content = `
LSAT Example Question - Pattern: ${analysis.pattern_type}

STIMULUS:
${question.context}

QUESTION:
${question.question}

OPTIONS:
${question.options.map((o, i) => `${String.fromCharCode(65 + i)}. ${o}`).join('\n')}

CORRECT ANSWER: ${analysis.correct_answer.letter}

ANALYSIS:
Setup: ${analysis.breakdown.setup}
Question asks: ${analysis.breakdown.question_stem}

Key constraints:
${analysis.breakdown.key_constraints.map((c: string) => `- ${c}`).join('\n')}

Reasoning chain:
${analysis.breakdown.logical_chain.map((s: string, i: number) => `${i + 1}. ${s}`).join('\n')}

Why ${analysis.correct_answer.letter} is correct:
${analysis.correct_answer.explanation}

Key insight: ${analysis.correct_answer.key_insight}

Why other answers are wrong:
${analysis.incorrect_answers.map((a: any) => `${a.letter}: ${a.reason}`).join('\n')}

Pattern Recognition Tips:
${analysis.pattern_recognition_tips.map((t: string) => `💡 ${t}`).join('\n')}
    `.trim();

    try {
        const embedding = await generateEmbedding(content);

        return await storeDocument({
            title: `LSAT Example: ${analysis.pattern_type} - ${question.question.substring(0, 50)}...`,
            content: content,
            embedding: embedding,
            metadata: {
                type: 'lsat_example',
                pattern_type: analysis.pattern_type,
                has_analysis: true,
            },
            url: `lsat://example/${Date.now()}`,
        });
    } catch (error: any) {
        console.error(`❌ Failed to store example: ${error.message}`);
        return false;
    }
}

// =============================================================================
// CLI
// =============================================================================

async function main() {
    console.log('🚀 LSAT RAG Ingestion\n');
    console.log('─'.repeat(60));

    const args = process.argv.slice(2);

    if (args.includes('--clear')) {
        console.log('🗑️  Clearing existing LSAT documents...');
        await supabase
            .from('documents')
            .delete()
            .or('url.like.lsat://%,metadata->>type.eq.lsat_pattern,metadata->>type.eq.lsat_example');
        console.log('✅ Cleared\n');
    }

    // Always ingest patterns
    await ingestPatterns();

    console.log('\n─'.repeat(60));
    console.log('✨ LSAT RAG ingestion complete!');
    console.log('\nThe system now has:');
    console.log(`  • ${LSAT_PATTERNS.length} pattern definitions with strategies`);
    console.log('  • Embeddings for semantic search');
    console.log('\nNext steps:');
    console.log('  1. Run your app: npm run dev:all');
    console.log('  2. Analyze questions - they\'ll auto-store as examples');
    console.log('  3. RAG will retrieve similar patterns & examples');
}

main().catch(console.error);

// Export for use in API routes
export { ingestAnalyzedQuestion, generateEmbedding, LSAT_PATTERNS };