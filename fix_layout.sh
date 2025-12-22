#!/bin/bash
# Change the main container from 2-column to single column layout
sed -i '' '129s/grid grid-cols-1 lg:grid-cols-2 gap-8/space-y-8/' /Users/alan_campbell_precedent/ai-portfolio/app/mood-lens/page.tsx

# Change Visual Physics grid from 2 columns to 4 columns for better spacing
sed -i '' 's/grid grid-cols-2 gap-4/grid grid-cols-4 gap-4/g' /Users/alan_campbell_precedent/ai-portfolio/app/mood-lens/page.tsx
