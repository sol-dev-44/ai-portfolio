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
  const [activeTab, setActiveTab] = React.useState('overview');
  
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 100
      }
    }
  };

  const metrics = [
    { label: 'Total Users', value: '12,345', change: '+12%', icon: '👥', color: 'blue' },
    { label: 'Revenue', value: '$45.2k', change: '+8.5%', icon: '💰', color: 'green' },
    { label: 'Active Sessions', value: '1,234', change: '-2%', icon: '⚡', color: 'purple' },
    { label: 'Bounce Rate', value: '42.3%', change: '+0.8%', icon: '📉', color: 'orange' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8 font-sans">
      <motion.div 
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        className="max-w-6xl mx-auto space-y-8"
      >
        {/* Header Section */}
        <motion.div variants={itemVariants} className="flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600 mb-2">
              Analytics Dashboard
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Real-time insights and performance metrics
            </p>
          </div>
          <div className="flex gap-2 bg-white dark:bg-gray-800 p-1 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            {['overview', 'reports', 'settings'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={\`px-4 py-2 rounded-md text-sm font-medium transition-all \${
                  activeTab === tab 
                    ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' 
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                }\`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Metrics Grid */}
        <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {metrics.map((metric) => (
            <motion.div
              key={metric.label}
              whileHover={{ y: -5, boxShadow: "0 10px 30px -10px rgba(0,0,0,0.1)" }}
              className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700 shadow-sm"
            >
              <div className="flex justify-between items-start mb-4">
                <div className={\`p-3 rounded-xl bg-\${metric.color}-50 dark:bg-\${metric.color}-900/20 text-2xl\`}>
                  {metric.icon}
                </div>
                <span className={\`text-xs font-bold px-2 py-1 rounded-full \${
                  metric.change.startsWith('+') 
                    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' 
                    : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                }\`}>
                  {metric.change}
                </span>
              </div>
              <h3 className="text-gray-500 dark:text-gray-400 text-sm font-medium mb-1">
                {metric.label}
              </h3>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {metric.value}
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Main Content Area */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Chart Section */}
          <motion.div 
            variants={itemVariants}
            className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-2xl p-8 border border-gray-100 dark:border-gray-700 shadow-sm"
          >
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Traffic Overview</h2>
              <select className="bg-gray-50 dark:bg-gray-700 border-none rounded-lg text-sm p-2 outline-none">
                <option>Last 7 Days</option>
                <option>Last 30 Days</option>
              </select>
            </div>
            <div className="h-64 flex items-end justify-between gap-2 px-4">
              {[40, 70, 45, 90, 65, 85, 55].map((h, i) => (
                <div key={i} className="w-full h-full flex items-end relative group cursor-pointer">
                  <motion.div
                    initial={{ height: "0%" }}
                    animate={{ height: h + "%" }}
                    transition={{ duration: 1, delay: i * 0.1 }}
                    style={{ height: h + "%" }} 
                    className="w-full bg-blue-600 bg-gradient-to-t from-blue-600 to-purple-600 dark:from-blue-500 dark:to-purple-500 rounded-t-lg shadow-lg hover:brightness-110 transition-all"
                  >
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                      {h}%
                    </div>
                  </motion.div>
                </div>
              ))}
            </div>
            <div className="flex justify-between mt-4 text-xs text-gray-400 font-medium uppercase tracking-wider">
              <span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span>
            </div>
          </motion.div>

          {/* Activity Feed */}
          <motion.div 
            variants={itemVariants}
            className="bg-white dark:bg-gray-800 rounded-2xl p-8 border border-gray-100 dark:border-gray-700 shadow-sm"
          >
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Recent Activity</h2>
            <div className="space-y-6">
              {[
                { user: 'Alice', action: 'deployed to production', time: '2m ago', color: 'blue' },
                { user: 'Bob', action: 'updated the database', time: '15m ago', color: 'purple' },
                { user: 'Charlie', action: 'fixed a critical bug', time: '1h ago', color: 'green' },
                { user: 'Diana', action: 'created a new project', time: '3h ago', color: 'orange' },
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-4">
                  <div className={\`w-2 h-2 mt-2 rounded-full bg-\${item.color}-500 ring-4 ring-\${item.color}-100 dark:ring-\${item.color}-900/30\`} />
                  <div>
                    <p className="text-sm text-gray-900 dark:text-white font-medium">
                      <span className="font-bold">{item.user}</span> {item.action}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">{item.time}</p>
                  </div>
                </div>
              ))}
            </div>
            <button className="w-full mt-8 py-3 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
              View All Activity
            </button>
          </motion.div>
        </div>
      </motion.div>
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