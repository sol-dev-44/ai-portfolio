import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface ArtParameters {
  palette: string[];
  energy: number;
  complexity: number;
  organicness: number;
  density: number;
  mood: string;
  elements: string[];
  shapes: string[];
  movement: string;
  depth: number;
  glow: number;
  noiseScale: number;
  contrast: number;
  temperature: number;
}

export const defaultParameters: ArtParameters = {
  palette: ['#1a1a2e', '#16213e', '#0f3460', '#533483', '#e94560'],
  energy: 0.5,
  complexity: 0.5,
  organicness: 0.7,
  density: 0.5,
  mood: 'serene',
  elements: ['particles', 'fog'],
  shapes: ['blobs'],
  movement: 'floating',
  depth: 0.6,
  glow: 0.5,
  noiseScale: 0.3,
  contrast: 0.5,
  temperature: 0.5,
};

interface ArtState {
  currentParameters: ArtParameters;
  targetParameters: ArtParameters;
  currentPrompt: string;
  isTransitioning: boolean;
}

const initialState: ArtState = {
  currentParameters: defaultParameters,
  targetParameters: defaultParameters,
  currentPrompt: '',
  isTransitioning: false,
};

export const artSlice = createSlice({
  name: 'art',
  initialState,
  reducers: {
    setTargetParameters: (state, action: PayloadAction<ArtParameters>) => {
      state.targetParameters = action.payload;
      state.isTransitioning = true;
    },
    updateCurrentParameters: (state, action: PayloadAction<ArtParameters>) => {
      state.currentParameters = action.payload;
    },
    setPrompt: (state, action: PayloadAction<string>) => {
      state.currentPrompt = action.payload;
    },
    finishTransition: (state) => {
      state.isTransitioning = false;
      state.currentParameters = state.targetParameters;
    },
    resetParameters: (state) => {
      state.currentParameters = defaultParameters;
      state.targetParameters = defaultParameters;
      state.currentPrompt = '';
      state.isTransitioning = false;
    },
  },
});

export const {
  setTargetParameters,
  updateCurrentParameters,
  setPrompt,
  finishTransition,
  resetParameters,
} = artSlice.actions;

export default artSlice.reducer;
