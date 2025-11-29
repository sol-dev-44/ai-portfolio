import json
from enum import Enum
from typing import List, Dict, Any, Optional
from dataclasses import dataclass, asdict

# =============================================================================
# RISK TAXONOMY
# =============================================================================

class RiskType(str, Enum):
    INDEMNIFICATION = "indemnification"
    TERMINATION = "termination"
    LIABILITY = "liability"
    CONFIDENTIALITY = "confidentiality"
    JURISDICTION = "jurisdiction"
    PAYMENT = "payment"
    IP_RIGHTS = "ip_rights"
    NON_COMPETE = "non_compete"
    GENERAL = "general"

@dataclass
class RiskInfo:
    """Metadata about a contract risk type."""
    type: RiskType
    display_name: str
    description: str
    key_indicators: List[str]
    severity_factors: List[str]
    mitigation_strategy: List[str]

# Comprehensive risk database
RISK_DATABASE: Dict[RiskType, RiskInfo] = {
    RiskType.INDEMNIFICATION: RiskInfo(
        type=RiskType.INDEMNIFICATION,
        display_name="Indemnification",
        description="Clauses requiring one party to compensate the other for losses.",
        key_indicators=[
            "indemnify",
            "hold harmless",
            "defend against",
            "liable for all claims"
        ],
        severity_factors=[
            "Uncapped liability",
            "Covering third-party claims",
            "Broad definition of 'Losses'"
        ],
        mitigation_strategy=[
            "Cap the indemnification amount",
            "Limit to direct damages only",
            "Exclude gross negligence/willful misconduct"
        ]
    ),
    RiskType.LIABILITY: RiskInfo(
        type=RiskType.LIABILITY,
        display_name="Limitation of Liability",
        description="Clauses limiting the amount one party has to pay if they are sued.",
        key_indicators=[
            "aggregate liability",
            "consequential damages",
            "lost profits",
            "maximum liability"
        ],
        severity_factors=[
            "No cap on liability",
            "Cap is too high (e.g., > 2x contract value)",
            "Exclusion of indirect damages missing"
        ],
        mitigation_strategy=[
            "Ensure mutual limitation",
            "Set a reasonable cap (e.g., 12 months fees)",
            "Explicitly exclude consequential damages"
        ]
    ),
    RiskType.TERMINATION: RiskInfo(
        type=RiskType.TERMINATION,
        display_name="Termination",
        description="Conditions under which the contract can be ended.",
        key_indicators=[
            "terminate for convenience",
            "material breach",
            "notice period",
            "automatic renewal"
        ],
        severity_factors=[
            "No termination for convenience",
            "Long notice periods",
            "Automatic renewal without easy opt-out"
        ],
        mitigation_strategy=[
            "Negotiate right to terminate for convenience",
            "Shorten notice periods",
            "Require written notice for renewal"
        ]
    ),
    RiskType.CONFIDENTIALITY: RiskInfo(
        type=RiskType.CONFIDENTIALITY,
        display_name="Confidentiality",
        description="Obligations to keep shared information secret.",
        key_indicators=[
            "confidential information",
            "trade secrets",
            "non-disclosure",
            "proprietary data"
        ],
        severity_factors=[
            "Definition too broad",
            "Perpetual obligation",
            "No exceptions for legal requirements"
        ],
        mitigation_strategy=[
            "Define specific categories of confidential info",
            "Set a time limit (e.g., 3-5 years)",
            "Standard exceptions (public domain, court order)"
        ]
    ),
    RiskType.JURISDICTION: RiskInfo(
        type=RiskType.JURISDICTION,
        display_name="Jurisdiction & Governing Law",
        description="Which laws apply and where disputes will be settled.",
        key_indicators=[
            "governed by the laws of",
            "exclusive jurisdiction",
            "venue",
            "arbitration"
        ],
        severity_factors=[
            "Foreign jurisdiction",
            "Unfavorable governing law",
            "Mandatory arbitration in remote location"
        ],
        mitigation_strategy=[
            "Neutral jurisdiction",
            "Home court advantage if possible",
            "Allow for mediation before arbitration"
        ]
    ),
     RiskType.PAYMENT: RiskInfo(
        type=RiskType.PAYMENT,
        display_name="Payment Terms",
        description="When and how payments are made.",
        key_indicators=[
            "net 30",
            "net 60",
            "late fees",
            "interest",
            "invoicing"
        ],
        severity_factors=[
            "Long payment terms (> 45 days)",
            "High late fees",
            "Right to withhold payment"
        ],
        mitigation_strategy=[
            "Standard Net 30 terms",
            "Cap late fees",
            "Dispute resolution mechanism for invoices"
        ]
    ),
    RiskType.IP_RIGHTS: RiskInfo(
        type=RiskType.IP_RIGHTS,
        display_name="Intellectual Property",
        description="Ownership of work product and pre-existing IP.",
        key_indicators=[
            "work made for hire",
            "assigns all rights",
            "perpetual license",
            "moral rights"
        ],
        severity_factors=[
            "Transfer of background IP",
            "No license back for vendor",
            "Broad 'work made for hire' clauses"
        ],
        mitigation_strategy=[
            "Clearly distinguish background IP vs. deliverables",
            "Grant license instead of assignment where appropriate",
            "Retain rights to generic tools/methods"
        ]
    ),
    RiskType.NON_COMPETE: RiskInfo(
        type=RiskType.NON_COMPETE,
        display_name="Non-Compete",
        description="Restrictions on working with competitors.",
        key_indicators=[
            "non-compete",
            "exclusivity",
            "restrictive covenant",
            "similar business"
        ],
        severity_factors=[
            "Broad geographic scope",
            "Long duration",
            "Prevents doing business with other clients"
        ],
        mitigation_strategy=[
            "Remove if possible",
            "Narrow scope to specific direct competitors",
            "Limit duration to contract term"
        ]
    ),
    RiskType.GENERAL: RiskInfo(
        type=RiskType.GENERAL,
        display_name="General Risk",
        description="Other potential risks or ambiguous clauses.",
        key_indicators=[],
        severity_factors=[],
        mitigation_strategy=[]
    )
}

# =============================================================================
# PROMPT ENGINEERING
# =============================================================================

def build_analysis_prompt(contract_text: str, rag_context: str) -> tuple[str, str]:
    """Build system and user prompts for contract analysis."""
    
    system_prompt = """You are an expert Contract Auditor and Legal Risk Analyst. Your role is to:
1. Analyze the provided contract text for potential risks and liabilities.
2. Identify specific clauses that are problematic or non-standard.
3. Categorize risks using standard legal taxonomy (Indemnification, Liability, etc.).
4. Provide a severity score (1-10) for each risk.
5. Suggest specific improvements or rewrites to mitigate the risks.

You have access to a knowledge base of common contract risks and mitigation strategies. Use this context to inform your analysis.

Always respond with valid JSON in this exact format:
{
    "summary": "Brief executive summary of the contract's overall risk profile.",
    "overall_risk_score": "integer 1-100",
    "risks": [
        {
            "type": "string - one of: indemnification, termination, liability, confidentiality, jurisdiction, payment, ip_rights, non_compete, general",
            "severity": "integer 1-10",
            "location": "string - quote the specific text triggering the risk",
            "explanation": "string - why this is a risk",
            "suggested_fix": "string - brief description of how to fix it",
            "rewrite_suggestion": "string - actual proposed text to replace the risky clause (optional but recommended)"
        }
    ],
    "missing_clauses": ["list of standard protective clauses that are missing"],
    "key_dates": ["list of important dates/deadlines found"]
}"""

    user_prompt = f"""Analyze this contract text using the risk knowledge provided.

{rag_context}

---

## CONTRACT TEXT TO ANALYZE

{contract_text}

---

Provide your complete analysis in the JSON format specified."""

    return system_prompt, user_prompt

def build_rewrite_prompt(clause_text: str, risk_type: str, context: str) -> tuple[str, str]:
    """Build prompt for rewriting a specific clause."""
    
    system_prompt = """You are an expert Legal Drafter. Your goal is to rewrite contract clauses to be more favorable to the user while remaining reasonable and legally sound.
    
    Output ONLY the rewritten clause text. Do not include explanations or markdown formatting unless requested."""
    
    user_prompt = f"""Rewrite the following contract clause to mitigate risks related to {risk_type}.
    
    Original Clause:
    "{clause_text}"
    
    Context/Guidance:
    {context}
    
    Rewritten Clause:"""
    
    return system_prompt, user_prompt
