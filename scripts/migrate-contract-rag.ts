#!/usr/bin/env tsx
/**
 * Migration Script: Contract Auditor RAG to Supabase (EXPANDED)
 * 
 * This script migrates risk definitions from the Python backend to Supabase
 * with vector embeddings for semantic search.
 * 
 * EXPANDED: Now includes 28 comprehensive risk types (up from 13)
 */

import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

// ============================================================================
// Configuration
// ============================================================================

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY!,
});

// ============================================================================
// Risk Definitions - EXPANDED (28 total)
// ============================================================================

const RISK_DEFINITIONS = [
    // ========== ORIGINAL 13 RISKS ==========
    {
        risk_type: 'liability',
        display_name: 'Liability Risk',
        description: 'Unlimited or excessive liability exposure that could result in significant financial loss.',
        key_indicators: ['unlimited liability', 'no cap on damages', 'indemnification without limit', 'broad liability', 'joint and several liability'],
        mitigation_strategy: ['Add liability caps', 'Limit to direct damages', 'Exclude consequential damages', 'Add insurance requirements', 'Cap at contract value'],
        severity_range: '7-9'
    },
    {
        risk_type: 'termination',
        display_name: 'Termination Risk',
        description: 'Unfavorable termination conditions that make it difficult to exit the contract.',
        key_indicators: ['no termination clause', 'long notice period', 'termination penalties', 'automatic renewal', 'termination for convenience restricted'],
        mitigation_strategy: ['Add termination for convenience', 'Reduce notice period', 'Remove penalties', 'Add opt-out provisions', 'Require renewal consent'],
        severity_range: '6-8'
    },
    {
        risk_type: 'payment',
        display_name: 'Payment Risk',
        description: 'Unclear or risky payment terms that could lead to disputes or financial exposure.',
        key_indicators: ['vague payment terms', 'no payment schedule', 'unlimited expenses', 'unclear invoicing', 'net 90+ payment terms'],
        mitigation_strategy: ['Define clear payment schedule', 'Cap expenses', 'Specify invoicing process', 'Add late payment terms', 'Require milestone payments'],
        severity_range: '5-8'
    },
    {
        risk_type: 'ip_rights',
        display_name: 'Intellectual Property Risk',
        description: 'Unclear or unfavorable intellectual property ownership and licensing terms.',
        key_indicators: ['IP ownership unclear', 'broad IP assignment', 'no IP protection', 'unlimited license', 'work for hire without limits'],
        mitigation_strategy: ['Clarify IP ownership', 'Limit IP assignment', 'Add IP protection clauses', 'Define license scope', 'Retain background IP'],
        severity_range: '7-9'
    },
    {
        risk_type: 'confidentiality',
        display_name: 'Confidentiality Risk',
        description: 'Weak or missing confidentiality protections for sensitive information.',
        key_indicators: ['no NDA', 'weak confidentiality terms', 'unclear data handling', 'no return of materials', 'broad disclosure rights'],
        mitigation_strategy: ['Add robust NDA', 'Define confidential information', 'Add data security requirements', 'Require return of materials', 'Limit disclosure exceptions'],
        severity_range: '6-8'
    },
    {
        risk_type: 'indemnification',
        display_name: 'Indemnification Risk',
        description: 'Broad indemnification obligations that could result in significant liability.',
        key_indicators: ['broad indemnification', 'indemnify for own negligence', 'no indemnification cap', 'one-sided indemnity', 'third-party indemnification'],
        mitigation_strategy: ['Narrow indemnification scope', 'Exclude own negligence', 'Add indemnification cap', 'Make mutual', 'Limit to direct claims'],
        severity_range: '7-9'
    },
    {
        risk_type: 'warranties',
        display_name: 'Warranty Risk',
        description: 'Excessive warranty commitments that could lead to liability.',
        key_indicators: ['unlimited warranties', 'performance guarantees', 'no warranty disclaimers', 'broad representations', 'fitness for purpose'],
        mitigation_strategy: ['Limit warranty scope', 'Add disclaimers', 'Cap warranty period', 'Exclude consequential damages', 'Define warranty remedies'],
        severity_range: '6-8'
    },
    {
        risk_type: 'force_majeure',
        display_name: 'Force Majeure Risk',
        description: 'Missing or weak force majeure clause that doesn\'t protect against unforeseeable events.',
        key_indicators: ['no force majeure clause', 'narrow force majeure', 'no pandemic coverage', 'unclear relief', 'no supply chain protection'],
        mitigation_strategy: ['Add comprehensive force majeure', 'Include pandemic/epidemic', 'Define relief provisions', 'Add notice requirements', 'Include cyber events'],
        severity_range: '5-7'
    },
    {
        risk_type: 'dispute_resolution',
        display_name: 'Dispute Resolution Risk',
        description: 'Unfavorable dispute resolution terms that could increase costs or limit remedies.',
        key_indicators: ['unfavorable venue', 'mandatory arbitration', 'no mediation', 'waiver of jury trial', 'class action waiver'],
        mitigation_strategy: ['Negotiate favorable venue', 'Add mediation requirement', 'Preserve jury trial rights', 'Define arbitration rules', 'Preserve injunctive relief'],
        severity_range: '5-7'
    },
    {
        risk_type: 'data_privacy',
        display_name: 'Data Privacy Risk',
        description: 'Inadequate data protection and privacy provisions, especially for personal data.',
        key_indicators: ['no GDPR compliance', 'unclear data handling', 'no security requirements', 'unlimited data retention', 'no breach notification'],
        mitigation_strategy: ['Add GDPR/CCPA compliance', 'Define data handling procedures', 'Require security measures', 'Limit data retention', 'Require breach notification'],
        severity_range: '7-9'
    },
    {
        risk_type: 'non_compete',
        display_name: 'Non-Compete Risk',
        description: 'Overly restrictive non-compete clauses that limit business opportunities.',
        key_indicators: ['broad non-compete', 'long duration', 'wide geographic scope', 'vague restrictions', 'extends to affiliates'],
        mitigation_strategy: ['Narrow scope', 'Reduce duration', 'Limit geography', 'Clarify restrictions', 'Carve out existing business'],
        severity_range: '6-8'
    },
    {
        risk_type: 'assignment',
        display_name: 'Assignment Risk',
        description: 'Unrestricted assignment rights that could transfer obligations to unknown parties.',
        key_indicators: ['free assignment', 'no consent required', 'assignment to competitors', 'change of control', 'assignment of receivables'],
        mitigation_strategy: ['Require consent for assignment', 'Prohibit competitor assignment', 'Add change of control provisions', 'Make mutual', 'Preserve termination rights'],
        severity_range: '5-7'
    },
    {
        risk_type: 'governing_law',
        display_name: 'Governing Law Risk',
        description: 'Unfavorable jurisdiction or governing law that could disadvantage one party.',
        key_indicators: ['unfavorable jurisdiction', 'foreign law', 'inconvenient venue', 'unclear choice of law', 'multiple jurisdictions'],
        mitigation_strategy: ['Negotiate favorable jurisdiction', 'Choose familiar law', 'Select convenient venue', 'Clarify choice of law', 'Add forum selection'],
        severity_range: '4-6'
    },

    // ========== NEW 15 RISKS ==========
    {
        risk_type: 'insurance',
        display_name: 'Insurance Risk',
        description: 'Inadequate insurance requirements that leave parties exposed to uninsured losses.',
        key_indicators: ['no insurance requirements', 'low coverage limits', 'missing coverage types', 'no certificate requirement', 'no additional insured status'],
        mitigation_strategy: ['Require adequate coverage limits', 'Specify coverage types (GL, E&O, cyber)', 'Require certificates of insurance', 'Add as additional insured', 'Require notice of cancellation'],
        severity_range: '5-8'
    },
    {
        risk_type: 'scope_creep',
        display_name: 'Scope & Change Order Risk',
        description: 'Unclear scope definition or change order provisions that could lead to disputes and cost overruns.',
        key_indicators: ['vague scope definition', 'no change order process', 'unlimited scope expansion', 'no pricing for changes', 'unilateral scope changes'],
        mitigation_strategy: ['Define detailed scope of work', 'Add formal change order process', 'Require written approval for changes', 'Define pricing methodology for changes', 'Cap scope expansion'],
        severity_range: '6-8'
    },
    {
        risk_type: 'delivery_acceptance',
        display_name: 'Delivery & Acceptance Risk',
        description: 'Vague or unfavorable delivery and acceptance criteria that could delay payment or create disputes.',
        key_indicators: ['no acceptance criteria', 'subjective acceptance', 'unlimited revision rounds', 'no deemed acceptance', 'unreasonable acceptance period'],
        mitigation_strategy: ['Define objective acceptance criteria', 'Limit revision rounds', 'Add deemed acceptance clause', 'Set reasonable acceptance timeframe', 'Define rejection process'],
        severity_range: '5-7'
    },
    {
        risk_type: 'audit_rights',
        display_name: 'Audit Rights Risk',
        description: 'Missing or excessive audit rights that could create operational burden or compliance exposure.',
        key_indicators: ['unlimited audit rights', 'no audit notice', 'audit at any time', 'no cost allocation for audits', 'excessive record retention'],
        mitigation_strategy: ['Limit audit frequency', 'Require reasonable notice', 'Define audit scope', 'Allocate audit costs fairly', 'Set reasonable record retention'],
        severity_range: '4-6'
    },
    {
        risk_type: 'subcontracting',
        display_name: 'Subcontracting Risk',
        description: 'Unrestricted subcontracting rights that could affect quality, confidentiality, or compliance.',
        key_indicators: ['unlimited subcontracting', 'no approval required', 'no subcontractor standards', 'unclear liability for subcontractors', 'offshore subcontracting allowed'],
        mitigation_strategy: ['Require subcontractor approval', 'Maintain liability for subcontractors', 'Require same terms flow-down', 'Limit offshore work', 'Require subcontractor confidentiality'],
        severity_range: '5-7'
    },
    {
        risk_type: 'exclusivity',
        display_name: 'Exclusivity Risk',
        description: 'Overly broad exclusivity requirements that limit business flexibility.',
        key_indicators: ['broad exclusivity', 'long exclusivity period', 'unclear exclusivity scope', 'no carve-outs', 'most favored customer'],
        mitigation_strategy: ['Narrow exclusivity scope', 'Limit exclusivity duration', 'Add carve-outs for existing relationships', 'Define clear boundaries', 'Add performance conditions'],
        severity_range: '6-8'
    },
    {
        risk_type: 'price_escalation',
        display_name: 'Price Escalation Risk',
        description: 'Unlimited or unclear price increase provisions that could significantly increase costs.',
        key_indicators: ['unlimited price increases', 'no price caps', 'unilateral price changes', 'unclear pricing methodology', 'automatic CPI increases'],
        mitigation_strategy: ['Cap annual price increases', 'Require price increase notice', 'Define pricing methodology', 'Add benchmarking rights', 'Lock pricing for initial term'],
        severity_range: '5-7'
    },
    {
        risk_type: 'liquidated_damages',
        display_name: 'Liquidated Damages Risk',
        description: 'Excessive or uncapped liquidated damages that could result in disproportionate penalties.',
        key_indicators: ['uncapped liquidated damages', 'high daily penalties', 'cumulative penalties', 'no cure period', 'damages for minor breaches'],
        mitigation_strategy: ['Cap total liquidated damages', 'Ensure damages are proportional', 'Add cure periods', 'Limit to material breaches', 'Make exclusive remedy'],
        severity_range: '7-9'
    },
    {
        risk_type: 'service_levels',
        display_name: 'Service Level Risk',
        description: 'Missing or unrealistic service level agreements that could create liability or operational issues.',
        key_indicators: ['no SLA defined', 'unrealistic uptime requirements', 'harsh SLA penalties', 'no exclusions', 'cumulative credits'],
        mitigation_strategy: ['Define achievable SLAs', 'Cap service credits', 'Add exclusions for third-party issues', 'Define measurement methodology', 'Add remediation periods'],
        severity_range: '5-8'
    },
    {
        risk_type: 'limitation_of_remedies',
        display_name: 'Limited Remedies Risk',
        description: 'Overly restricted remedies that limit recourse for breach or non-performance.',
        key_indicators: ['sole remedy clauses', 'no specific performance', 'limited to refund only', 'no injunctive relief', 'time-barred claims'],
        mitigation_strategy: ['Preserve equitable remedies', 'Add right to terminate', 'Preserve injunctive relief rights', 'Ensure adequate monetary remedies', 'Extend limitation periods'],
        severity_range: '6-8'
    },
    {
        risk_type: 'regulatory_compliance',
        display_name: 'Regulatory Compliance Risk',
        description: 'Inadequate provisions for regulatory compliance that could create legal exposure.',
        key_indicators: ['no compliance representations', 'unclear compliance responsibility', 'no regulatory cooperation', 'missing export controls', 'no anti-corruption provisions'],
        mitigation_strategy: ['Add compliance representations', 'Clarify compliance responsibilities', 'Require regulatory cooperation', 'Add export control provisions', 'Include anti-bribery/FCPA clauses'],
        severity_range: '7-9'
    },
    {
        risk_type: 'survival',
        display_name: 'Survival Provisions Risk',
        description: 'Inadequate or overbroad survival clauses affecting post-termination obligations.',
        key_indicators: ['unlimited survival', 'no survival clause', 'unclear surviving obligations', 'perpetual confidentiality', 'excessive post-termination duties'],
        mitigation_strategy: ['Define specific survival periods', 'Limit surviving obligations', 'Cap confidentiality survival', 'Clarify which terms survive', 'Align with statute of limitations'],
        severity_range: '4-6'
    },
    {
        risk_type: 'notice',
        display_name: 'Notice Requirements Risk',
        description: 'Problematic notice requirements that could result in missed deadlines or invalid communications.',
        key_indicators: ['short notice periods', 'restrictive notice methods', 'unclear notice addresses', 'no email notice allowed', 'strict form requirements'],
        mitigation_strategy: ['Extend notice periods', 'Allow multiple notice methods', 'Include email as valid notice', 'Update contact information easily', 'Add grace periods'],
        severity_range: '3-5'
    },
    {
        risk_type: 'amendment',
        display_name: 'Amendment Risk',
        description: 'Contract amendment provisions that could allow unilateral changes or create uncertainty.',
        key_indicators: ['unilateral amendment rights', 'amendment by posting online', 'no notice of amendments', 'automatic acceptance of changes', 'vague amendment process'],
        mitigation_strategy: ['Require mutual written consent', 'Prohibit unilateral changes', 'Require amendment notice', 'Define amendment effective date', 'Add opt-out for material changes'],
        severity_range: '5-7'
    },
    {
        risk_type: 'entire_agreement',
        display_name: 'Integration & Entire Agreement Risk',
        description: 'Missing or weak integration clause that could allow prior agreements to override the contract.',
        key_indicators: ['no entire agreement clause', 'carve-outs for prior agreements', 'oral modification allowed', 'conflicting documents', 'no order of precedence'],
        mitigation_strategy: ['Add entire agreement clause', 'Supersede prior agreements', 'Require written modifications', 'Define document hierarchy', 'List all incorporated documents'],
        severity_range: '4-6'
    }
];

// ============================================================================
// Helper Functions
// ============================================================================

async function generateEmbedding(text: string): Promise<number[]> {
    const response = await openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: text,
    });
    return response.data[0].embedding;
}

function buildRiskContent(risk: typeof RISK_DEFINITIONS[0]): string {
    return `${risk.display_name}: ${risk.description}. ` +
        `Indicators: ${risk.key_indicators.join(', ')}. ` +
        `Mitigation: ${risk.mitigation_strategy.join(' ')}`;
}

// ============================================================================
// Migration Functions
// ============================================================================

async function migrateRiskDefinitions() {
    console.log('\n🔄 Migrating risk definitions to Supabase...\n');
    console.log(`   Total risks to migrate: ${RISK_DEFINITIONS.length}\n`);

    let successCount = 0;
    let errorCount = 0;

    for (const risk of RISK_DEFINITIONS) {
        try {
            // Build searchable content
            const content = buildRiskContent(risk);

            // Generate embedding
            console.log(`   Generating embedding for: ${risk.display_name}`);
            const embedding = await generateEmbedding(content);

            // Insert into Supabase
            const { error } = await supabase.from('contract_risks').upsert({
                risk_type: risk.risk_type,
                display_name: risk.display_name,
                description: risk.description,
                key_indicators: risk.key_indicators,
                mitigation_strategy: risk.mitigation_strategy,
                severity_range: risk.severity_range,
                content,
                embedding,
                metadata: {
                    source: 'migration_v2',
                    version: '2.0',
                    expanded: true
                }
            }, {
                onConflict: 'risk_type'
            });

            if (error) {
                console.error(`   ❌ Error inserting ${risk.risk_type}:`, error);
                errorCount++;
            } else {
                console.log(`   ✅ Inserted: ${risk.display_name}`);
                successCount++;
            }

            // Rate limit to avoid OpenAI API limits
            await new Promise(resolve => setTimeout(resolve, 100));

        } catch (error) {
            console.error(`   ❌ Error processing ${risk.risk_type}:`, error);
            errorCount++;
        }
    }

    console.log(`\n✅ Risk definitions migration complete!`);
    console.log(`   Success: ${successCount} | Errors: ${errorCount}\n`);
}

async function verifyMigration() {
    console.log('🔍 Verifying migration...\n');

    // Check risk count
    const { count: riskCount, error: riskError } = await supabase
        .from('contract_risks')
        .select('*', { count: 'exact', head: true });

    if (riskError) {
        console.error('❌ Error counting risks:', riskError);
    } else {
        console.log(`   ✅ Risk definitions: ${riskCount}`);
    }

    // Check examples count
    const { count: exampleCount, error: exampleError } = await supabase
        .from('contract_examples')
        .select('*', { count: 'exact', head: true });

    if (exampleError) {
        console.error('❌ Error counting examples:', exampleError);
    } else {
        console.log(`   ✅ Contract examples: ${exampleCount}`);
    }

    // Test semantic search
    console.log('\n🧪 Testing semantic search...\n');
    const testQuery = 'unlimited liability exposure';
    const testEmbedding = await generateEmbedding(testQuery);

    const { data, error } = await supabase.rpc('match_contract_risks', {
        query_embedding: testEmbedding,
        match_threshold: 0.3,
        match_count: 5
    });

    if (error) {
        console.error('❌ Semantic search error:', error);
    } else {
        console.log(`   Query: "${testQuery}"`);
        console.log(`   Results: ${data?.length || 0} matches\n`);
        data?.forEach((match: any, i: number) => {
            console.log(`   ${i + 1}. ${match.display_name} (similarity: ${match.similarity.toFixed(3)})`);
        });
    }

    // Test a new risk type
    console.log('\n🧪 Testing new risk types...\n');
    const newRiskQuery = 'service level agreement penalties uptime';
    const newRiskEmbedding = await generateEmbedding(newRiskQuery);

    const { data: newData, error: newError } = await supabase.rpc('match_contract_risks', {
        query_embedding: newRiskEmbedding,
        match_threshold: 0.3,
        match_count: 3
    });

    if (newError) {
        console.error('❌ New risk search error:', newError);
    } else {
        console.log(`   Query: "${newRiskQuery}"`);
        console.log(`   Results: ${newData?.length || 0} matches\n`);
        newData?.forEach((match: any, i: number) => {
            console.log(`   ${i + 1}. ${match.display_name} (similarity: ${match.similarity.toFixed(3)})`);
        });
    }

    console.log('\n✅ Verification complete!\n');
}

// ============================================================================
// Main
// ============================================================================

async function main() {
    console.log('╔════════════════════════════════════════════════════════════╗');
    console.log('║  Contract Auditor RAG - Supabase Migration (EXPANDED v2)  ║');
    console.log('║  28 Risk Types (up from 13)                               ║');
    console.log('╚════════════════════════════════════════════════════════════╝');

    try {
        // Check environment variables
        if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
            throw new Error('NEXT_PUBLIC_SUPABASE_URL not found in environment');
        }
        if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
            throw new Error('SUPABASE_SERVICE_ROLE_KEY not found in environment');
        }
        if (!process.env.OPENAI_API_KEY) {
            throw new Error('OPENAI_API_KEY not found in environment');
        }

        console.log('\n✅ Environment variables loaded\n');

        // Run migration
        await migrateRiskDefinitions();

        // Verify migration
        await verifyMigration();

        console.log('╔════════════════════════════════════════════════════════════╗');
        console.log('║  Migration Complete! 🎉                                    ║');
        console.log('║  You now have 28 risk definitions in your RAG database    ║');
        console.log('╚════════════════════════════════════════════════════════════╝\n');

    } catch (error) {
        console.error('\n❌ Migration failed:', error);
        process.exit(1);
    }
}

main();