# MoodLens

**Upload an image to reveal its hidden emotional landscape through AI vision and generative art.**

MoodLens is an AI-powered image analysis tool that extracts emotional dimensions, color palettes, and artistic style attributes from any image, then visualizes them through interactive 3D generative art and data visualizations.

![MoodLens Banner](https://img.shields.io/badge/AI-Vision%20%2B%20Generative%20Art-purple?style=for-the-badge)
![Next.js](https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=for-the-badge&logo=typescript)

---

## ✨ Features

### 🎨 Single Image Analysis
- **AI Vision Analysis**: Powered by Claude 3.5 Sonnet to extract emotional dimensions, moods, and visual attributes
- **Color Palette Extraction**: Identifies the 5 dominant colors with hex codes (click to copy)
- **Emotional Signature**: Real-time 3D generative visualization using React Three Fiber
- **Multi-Dimensional Metrics**: Valence-Arousal-Dominance (VAD) emotional model
- **Interactive Visualizations**:
  - Color Harmony Wheel
  - Sentiment Flow Animation
  - Emotion Spectrum Breakdown
  - Style Attributes Radar

### 🔄 Comparison Mode
- **Side-by-Side Analysis**: Upload two images to compare their emotional signatures
- **Similarity Score**: Calculates emotional distance in 3D VAD space
- **Comparative Visualizations**:
  - Palette Overlap Analysis
  - Mood Keyword Cloud
  - Style Radar Comparison
  - Dual Generative Scenes

### 📱 Image Format Support
- JPEG, PNG, WebP, GIF
- HEIC/HEIF (iPhone photos with automatic conversion)
- BMP, TIFF, AVIF
- Automatic image compression to prevent upload errors

---

## 🛠️ Tech Stack

| Category | Technologies |
|----------|-------------|
| **Framework** | Next.js 16, TypeScript |
| **Styling** | Tailwind CSS |
| **Animation** | Framer Motion |
| **3D Graphics** | Three.js, React Three Fiber (R3F) |
| **State Management** | Redux Toolkit (RTK Query) |
| **AI Vision** | Claude 3.5 Sonnet (Anthropic) |
| **Data Visualization** | Recharts |
| **Icons** | Lucide Icons |

---

## 📂 Project Structure

```
app/mood-lens/
├── page.tsx              # Main MoodLens page with single & compare modes
├── layout.tsx            # Layout wrapper
└── README.md             # This file

app/api/mood-lens/
└── analyze/
    └── route.ts          # API endpoint for Claude vision analysis

components/mood-lens/
├── ImageUploader.tsx     # Drag-and-drop image upload with HEIC support
├── ModeToggle.tsx        # Single/Compare mode switcher
├── TechBreakdown.tsx     # Expandable "How It Works" section
├── GenerativeViz.tsx     # 3D React Three Fiber visualization
├── QuantitativeViz.tsx   # VAD metrics display
├── EmotionBreakdown.tsx  # Emotion spectrum chart
├── ColorHarmonyWheel.tsx # Color palette relationships
├── SentimentFlow.tsx     # Animated particle flow
├── ComparisonView.tsx    # Comparison mode layout
├── PaletteComparison.tsx # Color palette overlap analysis
├── MoodCloud.tsx         # Keyword cloud comparison
└── StyleRadar.tsx        # Style attributes radar chart
```

---

## 🚀 How It Works

### 1. **Image Analysis**
Claude 3.5 Sonnet vision model analyzes your image to extract:
- **Emotional dimensions**: Valence (-1 to 1), Arousal (0 to 1), Dominance (0 to 1)
- **Mood keywords**: 3 abstract descriptors
- **Visual style**: Contrast, brightness, warmth, sharpness
- **Semantic description**: 2-3 sentence scene description

### 2. **Color Extraction**
Advanced color quantization algorithm extracts the dominant 5-color palette, analyzing hue, saturation, and luminance.

### 3. **Emotion Mapping**
Sentiment scores are mapped to the **Valence-Arousal-Dominance (VAD)** emotional model:
- **Valence**: Measures positivity (-1 = negative, 1 = positive)
- **Arousal**: Measures energy (0 = calm, 1 = energetic)
- **Dominance**: Measures control (0 = submissive, 1 = dominant)

### 4. **Generative Rendering**
React Three Fiber renders a real-time 3D scene with:
- Distorting sphere driven by arousal (energy)
- Particle count based on arousal
- Colors from extracted palette
- Post-processing effects (bloom, vignette) adapted to style attributes

### 5. **Multi-Viz Display**
Four synchronized visualizations display your image's emotional signature:
- Radar chart for emotional dimensions
- Color harmony wheel showing palette relationships
- Animated particle flow representing sentiment energy
- Emotion spectrum breakdown

### 6. **Compare Mode**
When comparing two images:
- Calculates emotional distance using Euclidean distance in 3D VAD space
- Analyzes palette overlap
- Compares mood keywords
- Visualizes style attribute differences with dual radar charts

---

## 🎯 API Reference

### POST `/api/mood-lens/analyze`

Analyzes an image and returns emotional, color, and style data.

**Request Body:**
```json
{
  "imageBlob": "data:image/jpeg;base64,..."
}
```

**Response:**
```json
{
  "description": "A serene sunset over calm waters...",
  "sentiment": {
    "valence": 0.7,
    "arousal": 0.3,
    "dominance": 0.5,
    "labels": ["peaceful", "warm", "contemplative"]
  },
  "emotions": [
    { "name": "joy", "score": 65 },
    { "name": "serenity", "score": 80 },
    { "name": "nostalgia", "score": 45 }
  ],
  "style": {
    "contrast": 0.6,
    "brightness": 0.7,
    "warmth": 0.8,
    "sharpness": 0.5
  },
  "colorPalette": ["#FF6B35", "#F7931E", "#FDC830", "#37B7C3", "#088395"],
  "moodKeywords": ["tranquil", "golden", "reflective"]
}
```

**Configuration:**
- Max execution time: 60 seconds
- Runtime: Node.js
- Supports images up to ~4.5MB (client-side compression reduces file size)

---

## 🎨 Key Features Explained

### HEIC/HEIF Support (iPhone Photos)
MoodLens automatically detects and converts HEIC/HEIF images from iPhone cameras to JPEG using the `heic2any` library, ensuring seamless compatibility.

### Image Compression
Images are automatically compressed before upload to prevent 413 errors:
- Max dimension: 1920px on longest side
- Quality: 85% JPEG compression
- Typical reduction: 70-90% file size

### State Persistence
When switching between Single and Compare modes, the current mode's data is preserved, allowing you to switch back without re-uploading.

### Dark Mode Support
All visualizations and UI components are fully theme-aware, supporting both light and dark modes.

---

## 🧪 Usage Examples

### Single Mode
1. Navigate to `/mood-lens`
2. Upload an image (drag-and-drop or click to select)
3. View AI-generated analysis and visualizations
4. Click color swatches to copy hex codes

### Compare Mode
1. Toggle to "Compare" mode
2. Upload Image A and Image B
3. View similarity score and comparative insights
4. Explore side-by-side visualizations

---

## 🔧 Environment Variables

```bash
ANTHROPIC_API_KEY=your_claude_api_key_here
```

---

## 📊 Performance Metrics

- **Analysis Time**: ~2-5 seconds per image
- **3D Rendering**: 60 FPS on modern devices
- **Image Compression**: 70-90% size reduction
- **Supported Formats**: 9 image formats

---

## 🐛 Troubleshooting

### "413 Request Entity Too Large" Error
- **Cause**: Image file too large
- **Solution**: Automatic compression is enabled. If error persists, try a smaller image or different format.

### HEIC Conversion Failed
- **Cause**: Browser compatibility issue
- **Solution**: The app will attempt to process the image anyway. If it fails, convert to JPEG manually.

### Analysis Failed
- **Cause**: API error or invalid image format
- **Solution**: Check browser console for detailed error. Ensure image is a valid format.

---

## 🎓 Educational Value

MoodLens demonstrates:
- **AI Vision Integration**: Using Claude's multimodal capabilities
- **3D Graphics in React**: React Three Fiber for generative art
- **Emotion AI**: VAD emotional model implementation
- **Color Theory**: Palette extraction and harmony analysis
- **Data Visualization**: Multiple chart types with Recharts
- **Image Processing**: Format conversion and compression
- **State Management**: Redux Toolkit with RTK Query

---

## 📝 License

Part of the AI Portfolio project by Alan Campbell.

---

## 🔗 Related Features

- [SnapFix](/app/snapfix) - AI-powered screenshot debugging tool
- [Main Portfolio](/app) - Full portfolio showcase

---

**Built with ❤️ using Next.js, Claude AI, and React Three Fiber**
