import { NextResponse } from 'next/server';

const PROBLEMS = [
  {
    id: 'logic-1',
    title: "The Farmer's Dilemma",
    category: 'logic',
    difficulty: 'medium',
    problem:
      'A farmer needs to cross a river with a wolf, a goat, and a cabbage. The boat can only carry the farmer and one item. If left alone, the wolf will eat the goat, and the goat will eat the cabbage. How can the farmer get everything across safely?',
    expected_answer:
      'Take goat across, return, take wolf across, bring goat back, take cabbage across, return, take goat across',
  },
  {
    id: 'math-1',
    title: 'The Clock Problem',
    category: 'math',
    difficulty: 'hard',
    problem:
      'How many times do the hour and minute hands of a clock overlap in a 12-hour period?',
    expected_answer: '11 times',
  },
  {
    id: 'logic-2',
    title: 'The Hat Puzzle',
    category: 'logic',
    difficulty: 'hard',
    problem:
      "Three people are wearing hats. Each hat is either red or blue. Each person can see the other two hats but not their own. At least one hat is red. They are asked simultaneously if they know their hat color. The first two say no. What color is the third person's hat, and how do they know?",
    expected_answer:
      "Red. If the third person's hat were blue, the second person would see one red (first) and one blue (third), and knowing at least one is red, could deduce their own is red. Since the second person said no, the third person's hat must be red.",
  },
  {
    id: 'math-2',
    title: 'The Coin Problem',
    category: 'math',
    difficulty: 'medium',
    problem:
      "You have 12 coins. One is counterfeit and weighs differently (you don't know if heavier or lighter). Using a balance scale exactly 3 times, find the counterfeit coin and determine if it's heavier or lighter.",
    expected_answer:
      'Divide into groups of 4. Weigh 4 vs 4. Based on result, narrow down and use remaining 2 weighings to identify the coin and whether it is heavier or lighter.',
  },
  {
    id: 'logic-3',
    title: 'The Light Switch',
    category: 'logic',
    difficulty: 'easy',
    problem:
      'You are outside a room with 3 light switches. One controls a lightbulb inside the room. You can only enter the room once. How do you determine which switch controls the bulb?',
    expected_answer:
      "Turn on switch 1 for a few minutes, then turn it off. Turn on switch 2. Enter the room. If the bulb is on, it's switch 2. If off and warm, it's switch 1. If off and cold, it's switch 3.",
  },
];

export async function GET() {
  return NextResponse.json({ problems: PROBLEMS });
}
