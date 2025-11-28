import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { LSATQuestion } from './api/lsatApi';

interface LSATState {
    currentQuestion: LSATQuestion | null;
    history: LSATQuestion[];
    analysisResult: string | null;
    isAnalyzing: boolean;
}

const initialState: LSATState = {
    currentQuestion: null,
    history: [],
    analysisResult: null,
    isAnalyzing: false,
};

const lsatSlice = createSlice({
    name: 'lsat',
    initialState,
    reducers: {
        setCurrentQuestion(state, action: PayloadAction<LSATQuestion>) {
            state.currentQuestion = action.payload;
            state.analysisResult = null; // Reset analysis when question changes
        },
        addToHistory(state, action: PayloadAction<LSATQuestion>) {
            state.history.push(action.payload);
        },
        setAnalysisResult(state, action: PayloadAction<string>) {
            state.analysisResult = action.payload;
        },
        setIsAnalyzing(state, action: PayloadAction<boolean>) {
            state.isAnalyzing = action.payload;
        },
        resetLSAT(state) {
            state.currentQuestion = null;
            state.analysisResult = null;
            state.isAnalyzing = false;
        }
    },
});

export const { setCurrentQuestion, addToHistory, setAnalysisResult, setIsAnalyzing, resetLSAT } = lsatSlice.actions;
export default lsatSlice.reducer;
