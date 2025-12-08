-- Delete all existing problems
DELETE FROM reasoning_problems;

-- Insert EXTREMELY HARD problems that will show score variance
INSERT INTO reasoning_problems (title, problem_text, category, difficulty, ground_truth_answer) VALUES
(
  'The Blue-Eyed Islanders',
  'On an island, there are 100 blue-eyed people, 100 brown-eyed people, and a guru. No one knows their own eye color. If a person discovers their eye color, they must leave the island at midnight. The guru announces "At least one person has blue eyes." What happens? Explain the logic step-by-step.',
  'logic',
  'very_hard',
  'All 100 blue-eyed people leave on the 100th night. Each person uses induction on what others know.'
),
(
  'Cheryl''s Birthday',
  'Albert and Bernard just became friends with Cheryl. Cheryl gives them 10 possible dates: May 15, 16, 19; June 17, 18; July 14, 16; August 14, 15, 17. Cheryl tells Albert the month and Bernard the day. Albert: "I don''t know, and Bernard doesn''t know either." Bernard: "I didn''t know, but now I know." Albert: "Now I know too." When is Cheryl''s birthday?',
  'logic',
  'very_hard',
  'July 16'
),
(
  'The Two Envelopes Paradox',
  'You are given two envelopes, one contains twice as much money as the other. You pick one at random. Should you switch to the other envelope? Explain why the expected value argument (switch because E[other] = 1.25x) is wrong.',
  'probability',
  'very_hard',
  'No advantage to switching. The paradox arises from incorrectly treating the amounts as fixed after selection. The expectation is the same whether you switch or not.'
),
(
  'The Hardest Logic Puzzle',
  'Three gods A, B, C are Random, True, False. Random answers randomly, True always tells truth, False always lies. You can ask 3 yes/no questions to determine who is who. "Da" means yes, "Ja" means no, but you don''t know which is which. What questions do you ask?',
  'logic',
  'very_hard',
  'Ask god B: "If I asked you ''Is A Random?'', would you say da?" Then use binary search strategy with embedded counterfactuals.'
),
(
  'Sleeping Beauty Problem',
  'Sleeping Beauty is put to sleep Sunday. A fair coin is tossed. If heads, she''s awakened Monday. If tails, she''s awakened Monday AND Tuesday (memory erased). Each time she''s awakened and asked "What''s your credence the coin was heads?" What should she answer?',
  'probability',
  'very_hard',
  '1/3 (thirder position) or 1/2 (halfer position). Both have valid arguments. Thirder uses self-locating uncertainty.'
),
(
  'The Unexpected Hanging',
  'A judge tells a prisoner he will be hanged at noon on one weekday next week, but the execution will be a surprise. The prisoner reasons: "I can''t be hanged Friday (I''d know Thursday night). So Friday is eliminated. By same logic, can''t be Thursday... can''t be Wednesday..." He concludes he won''t be hanged. Why is this wrong?',
  'logic',
  'very_hard',
  'The paradox reveals flaws in backward induction. The surprise condition breaks the inductive chain. He can still be surprised on any day.'
),
(
  'Simpson''s Paradox Medical',
  'Treatment A: 20/100 (20%) success in Group 1, 80/100 (80%) success in Group 2. Treatment B: 10/40 (25%) success in Group 1, 75/90 (83%) success in Group 2. Which treatment is better overall? Explain the paradox.',
  'probability',
  'hard',
  'Treatment B is better in BOTH groups separately, but Treatment A is better overall (100/200 = 50% vs 85/130 = 65%). This is Simpson''s Paradox - aggregate data can reverse conclusions.'
),
(
  'The Barber Paradox',
  'In a town, the barber shaves all and only those men who do not shave themselves. Does the barber shave himself? Explain why this creates a logical contradiction and what it tells us about set theory.',
  'logic',
  'very_hard',
  'Neither answer works: if he shaves himself, he shouldn''t (violates "only those who don''t"). If he doesn''t, he should (violates "all those who don''t"). This is Russell''s Paradox showing naive set theory is contradictory.'
),
(
  'The Newcomb Problem',
  'Two boxes: A (transparent, $1000) and B (opaque, either $1M or $0). A perfect predictor predicted your choice. If they predicted you''d take both boxes, B has $0. If they predicted you''d take only B, B has $1M. The predictor is 99% accurate. What do you choose?',
  'logic',
  'very_hard',
  'One-box ($1M expected) vs two-box (dominance reasoning). Both have valid arguments. This tests decision theory and causation vs correlation.'
),
(
  'The Monty Fall Problem',
  'Like Monty Hall, but the host doesn''t know where the car is. He randomly opens door 3, revealing a goat by chance. Should you switch? How does this differ from the original Monty Hall?',
  'probability',
  'very_hard',
  'Switch only gives 1/2 now (not 2/3). The key difference: Monty''s knowledge vs random selection changes the probability update. Without intentional selection, no information gain.'
),
(
  'The St. Petersburg Paradox',
  'A casino offers a game: flip a fair coin. If heads on flip n, you win $2^n. The game costs $X to play. What''s the expected value? Would you pay $1000 to play? Explain why expected utility differs from expected value.',
  'probability',
  'very_hard',
  'Expected value is infinite (sum of 2^n * (1/2)^n = infinity). But no rational person would pay $1000. Shows expected utility theory - diminishing marginal utility of money.'
);
