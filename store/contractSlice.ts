import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface Risk {
    type: string;
    severity: number;
    location: string;
    explanation: string;
    suggested_fix: string;
    rewrite_suggestion?: string;
}

interface ContractAnalysis {
    summary: string;
    overall_risk_score: number;
    risks: Risk[];
    missing_clauses: string[];
    key_dates: string[];
    raw_response?: string;
}

interface ContractState {
    contractText: string | null;
    analysis: ContractAnalysis | null;
    isAnalyzing: boolean;
    selectedRiskIndex: number | null;
    ragStats: { risk_definitions: number; analyzed_contracts: number; total_documents: number } | null;
}

const initialState: ContractState = {
    contractText: null,
    analysis: null,
    isAnalyzing: false,
    selectedRiskIndex: null,
    ragStats: null,
};

const contractSlice = createSlice({
    name: 'contract',
    initialState,
    reducers: {
        setContractText(state, action: PayloadAction<string>) {
            state.contractText = action.payload;
            state.analysis = null; // Reset analysis when text changes
            state.selectedRiskIndex = null;
        },
        setAnalysis(state, action: PayloadAction<ContractAnalysis>) {
            state.analysis = action.payload;
        },
        setIsAnalyzing(state, action: PayloadAction<boolean>) {
            state.isAnalyzing = action.payload;
        },
        setSelectedRiskIndex(state, action: PayloadAction<number | null>) {
            state.selectedRiskIndex = action.payload;
        },
        resetContract(state) {
            state.contractText = null;
            state.analysis = null;
            state.isAnalyzing = false;
            state.selectedRiskIndex = null;
        },
        setRagStats(state, action: PayloadAction<{ risk_definitions: number; analyzed_contracts: number; total_documents: number }>) {
            state.ragStats = action.payload;
        }
    },
});

export const {
    setContractText,
    setAnalysis,
    setIsAnalyzing,
    setSelectedRiskIndex,
    resetContract,
    setRagStats
} = contractSlice.actions;

export default contractSlice.reducer;
