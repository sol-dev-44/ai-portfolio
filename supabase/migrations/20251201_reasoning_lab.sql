-- Deep Reasoner Lab Tables
-- Migration: 20251201_reasoning_lab

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Table 1: Problem Library
CREATE TABLE reasoning_problems (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  problem_text TEXT NOT NULL,
  category TEXT, -- 'math', 'logic', 'research', 'general'
  difficulty TEXT, -- 'easy', 'medium', 'hard'
  ground_truth_answer TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table 2: Reasoning Sessions
CREATE TABLE reasoning_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  problem_id UUID REFERENCES reasoning_problems(id) ON DELETE SET NULL,
  strategy TEXT NOT NULL, -- 'zero_shot_cot', 'self_consistency', 'star'
  user_query TEXT, -- custom user input if not using problem library
  status TEXT DEFAULT 'running', -- 'running', 'completed', 'failed'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Table 3: Individual Reasoning Traces
CREATE TABLE reasoning_traces (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID REFERENCES reasoning_sessions(id) ON DELETE CASCADE,
  round_number INT DEFAULT 1, -- for STaR iterations
  trace_index INT NOT NULL, -- which parallel path (0-9)
  reasoning_text TEXT NOT NULL, -- full chain of thought
  final_answer TEXT,
  score FLOAT, -- 0-10 quality/reward score
  is_golden BOOLEAN DEFAULT FALSE, -- selected for next round in STaR
  model_used TEXT DEFAULT 'gpt-4', -- 'gpt-4', 'o1', 'gpt-4-turbo'
  tokens_used INT,
  latency_ms INT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table 4: STaR Round Metrics
CREATE TABLE star_rounds (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID REFERENCES reasoning_sessions(id) ON DELETE CASCADE,
  round_number INT NOT NULL,
  num_traces INT DEFAULT 10,
  avg_score FLOAT,
  improvement_pct FLOAT, -- percentage improvement vs previous round
  golden_trace_ids UUID[], -- array of trace IDs selected as golden
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(session_id, round_number)
);

-- Indexes for performance
CREATE INDEX idx_reasoning_traces_session ON reasoning_traces(session_id);
CREATE INDEX idx_reasoning_traces_round ON reasoning_traces(session_id, round_number);
CREATE INDEX idx_star_rounds_session ON star_rounds(session_id);
CREATE INDEX idx_reasoning_sessions_created ON reasoning_sessions(created_at DESC);

-- Seed challenging problems that show reasoning variance
INSERT INTO reasoning_problems (title, problem_text, category, difficulty, ground_truth_answer) VALUES
(
  'The Monty Hall Problem',
  'You are on a game show with 3 doors. Behind one door is a car, behind the other two are goats. You pick door #1. The host, who knows what is behind each door, opens door #3 to reveal a goat. He then asks if you want to switch your choice to door #2. Should you switch? What is your probability of winning if you switch vs. if you stay?',
  'probability',
  'hard',
  'Yes, switch. Switching gives 2/3 probability, staying gives 1/3 probability'
),
(
  'River Crossing Puzzle',
  'A farmer needs to transport a fox, a chicken, and a sack of grain across a river using a boat that can only carry him and one item at a time. If left alone, the fox will eat the chicken, and the chicken will eat the grain. How should the farmer transport all three items safely across the river? Describe each trip.',
  'logic',
  'hard',
  '1) Take chicken across. 2) Return alone. 3) Take fox across. 4) Bring chicken back. 5) Take grain across. 6) Return alone. 7) Take chicken across.'
),
(
  'Age Riddle',
  'A father is 4 times as old as his daughter. In 20 years, he will be only twice as old as she is. How old are they now?',
  'math',
  'medium',
  'Father is 40, daughter is 10'
),
(
  'Counterfactual Reasoning',
  'If yesterday was tomorrow, today would be Friday. What day is it actually today?',
  'logic',
  'hard',
  'Thursday'
),
(
  'Logic Grid Puzzle',
  'Three friends - Alice, Bob, and Carol - each have a different pet (dog, cat, bird) and a different favorite color (red, blue, green). Alice does not have a dog. Bob''s favorite color is not blue. Carol has a bird. The person with the dog likes red. What pet does Alice have and what is Bob''s favorite color?',
  'logic',
  'medium',
  'Alice has a cat, Bob''s favorite color is red'
),
(
  'Pigeonhole Principle',
  'You have a drawer containing 10 black socks and 10 white socks, all mixed up. If you reach in and pull out socks at random in complete darkness, what is the minimum number of socks you must pull out to guarantee you have a matching pair?',
  'probability',
  'medium',
  '3 socks'
),
(
  'Chain of Discounts',
  'A store applies two successive discounts to an item: first 20% off, then an additional 30% off the reduced price. If the original price was $100, what is the final price? Is this the same as a single 50% discount?',
  'math',
  'medium',
  '$56. No, single 50% discount would give $50'
),
(
  'Nested Conditionals',
  'In a certain code, if X is true, then Y must be false. If Y is false, then Z must be true. If Z is true, then W could be either true or false. Given that X is always true, what can we definitively say about W?',
  'logic',
  'hard',
  'We cannot determine W definitively. It could be true or false.'
),
(
  'Birthday Probability',
  'In a room of 23 people, what is the approximate probability that at least two people share the same birthday? Ignore leap years.',
  'probability',
  'hard',
  'Approximately 50.7%'
),
(
  'The Poisoned Wine',
  'A king has 1000 bottles of wine, one of which is poisoned. The poison takes exactly 24 hours to kill. The king needs to identify the poisoned bottle within 24 hours using prisoners as testers. What is the minimum number of prisoners needed?',
  'logic',
  'hard',
  '10 prisoners (using binary encoding)'
),
(
  'Work Rate Problem',
  'Alice can paint a room in 6 hours. Bob can paint the same room in 8 hours. If they work together for 2 hours, then Alice leaves and Bob finishes alone, how many total hours will it take to complete the job?',
  'math',
  'medium',
  '4.75 hours total (2 hours together, 2.75 hours Bob alone)'
);

COMMENT ON TABLE reasoning_problems IS 'Library of reasoning problems for testing different strategies';
COMMENT ON TABLE reasoning_sessions IS 'Each reasoning experiment session';
COMMENT ON TABLE reasoning_traces IS 'Individual reasoning chains with scores';
COMMENT ON TABLE star_rounds IS 'Per-round metrics for STaR simulations';
