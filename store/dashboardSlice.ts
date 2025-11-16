import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface DashboardVersion {
  id: string;
  code: string;
  prompt: string;
  timestamp: string;
}

interface DashboardState {
  versions: DashboardVersion[];
  currentIndex: number;
  shareId: string | null;
}

const INITIAL_CODE = `function DashboardComponent() {
  const chartRef = React.useRef(null);

  const metrics = [
    { label: 'Accuracy', value: '94.2%', icon: '🎯' },
    { label: 'Latency', value: '45ms', icon: '⚡' },
    { label: 'Throughput', value: '1.2K/s', icon: '🚀' },
    { label: 'Uptime', value: '99.9%', icon: '✅' },
  ];

  const chartData = [
    { label: 'Mon', value: 65 },
    { label: 'Tue', value: 85 },
    { label: 'Wed', value: 45 },
    { label: 'Thu', value: 75 },
    { label: 'Fri', value: 95 },
  ];

  React.useEffect(() => {
    if (!chartRef.current) return;

    const svg = d3.select(chartRef.current);
    svg.selectAll('*').remove();

    const width = 600;
    const height = 200;
    const margin = { top: 20, right: 20, bottom: 40, left: 40 };

    const x = d3
      .scaleBand()
      .domain(chartData.map(d => d.label))
      .range([margin.left, width - margin.right])
      .padding(0.2);

    const y = d3
      .scaleLinear()
      .domain([0, d3.max(chartData, d => d.value) || 100])
      .nice()
      .range([height - margin.bottom, margin.top]);

    svg
      .selectAll('rect')
      .data(chartData)
      .join('rect')
      .attr('x', d => x(d.label) || 0)
      .attr('y', d => y(d.value))
      .attr('width', x.bandwidth())
      .attr('height', d => height - margin.bottom - y(d.value))
      .attr('fill', '#3b82f6')
      .attr('rx', 4);

    svg
      .append('g')
      .attr('transform', 'translate(0,' + (height - margin.bottom) + ')')
      .call(d3.axisBottom(x))
      .attr('color', '#6b7280');

    svg
      .append('g')
      .attr('transform', 'translate(' + margin.left + ',0)')
      .call(d3.axisLeft(y))
      .attr('color', '#6b7280');
  }, []);

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            AI Dashboard Playground
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Modify this dashboard with natural language
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {metrics.map((metric, index) => (
            <motion.div
              key={metric.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-gray-50 dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700"
            >
              <div className="text-3xl mb-2">{metric.icon}</div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                {metric.value}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {metric.label}
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-gray-50 dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700"
        >
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
            Performance Over Time
          </h2>
          <div className="flex justify-center">
            <svg
              ref={chartRef}
              width="600"
              height="200"
              className="text-gray-700 dark:text-gray-300"
            />
          </div>
        </motion.div>
      </div>
    </div>
  );
}`;

const initialState: DashboardState = {
  versions: [
    {
      id: 'initial',
      code: INITIAL_CODE,
      prompt: 'Initial version',
      timestamp: new Date().toISOString(),
    },
  ],
  currentIndex: 0,
  shareId: null,
};

const dashboardSlice = createSlice({
  name: 'dashboard',
  initialState,
  reducers: {
    addVersion: (state, action: PayloadAction<{ code: string; prompt: string }>) => {
      const newVersion: DashboardVersion = {
        id: `v-${Date.now()}`,
        code: action.payload.code,
        prompt: action.payload.prompt,
        timestamp: new Date().toISOString(),
      };
      
      // If we're not at the end, remove future versions
      if (state.currentIndex < state.versions.length - 1) {
        state.versions = state.versions.slice(0, state.currentIndex + 1);
      }
      
      state.versions.push(newVersion);
      state.currentIndex = state.versions.length - 1;
    },
    
    undo: (state) => {
      if (state.currentIndex > 0) {
        state.currentIndex -= 1;
      }
    },
    
    redo: (state) => {
      if (state.currentIndex < state.versions.length - 1) {
        state.currentIndex += 1;
      }
    },
    
    jumpToVersion: (state, action: PayloadAction<number>) => {
      if (action.payload >= 0 && action.payload < state.versions.length) {
        state.currentIndex = action.payload;
      }
    },
    
    reset: (state) => {
      state.versions = [initialState.versions[0]];
      state.currentIndex = 0;
      state.shareId = null;
    },
    
    setShareId: (state, action: PayloadAction<string>) => {
      state.shareId = action.payload;
    },
  },
});

export const { addVersion, undo, redo, jumpToVersion, reset, setShareId } = dashboardSlice.actions;
export default dashboardSlice.reducer;

// Selectors
export const selectCurrentVersion = (state: { dashboard: DashboardState }) => 
  state.dashboard.versions[state.dashboard.currentIndex];

export const selectCanUndo = (state: { dashboard: DashboardState }) => 
  state.dashboard.currentIndex > 0;

export const selectCanRedo = (state: { dashboard: DashboardState }) => 
  state.dashboard.currentIndex < state.dashboard.versions.length - 1;

export const selectAllVersions = (state: { dashboard: DashboardState }) => 
  state.dashboard.versions;

export const selectCurrentIndex = (state: { dashboard: DashboardState }) => 
  state.dashboard.currentIndex;

export const selectShareId = (state: { dashboard: DashboardState }) => 
  state.dashboard.shareId;