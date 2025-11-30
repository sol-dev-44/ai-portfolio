# Interactive 3D Robot 🤖

An immersive 3D experience featuring a friendly robot that you can control through manual toggles or AI-powered voice commands.

## Features

### 🎮 Manual Controls
- **5 Actions**: Idle, Wave, Dance, Walk, Jump
- **6 Expressions**: Neutral, Happy, Sad, Surprised, Excited, Thinking
- **Speed Control**: Adjust animation speed from 0.5x to 2x

### 🎤 AI Voice Control
- Speak natural language commands like:
  - "Make him wave"
  - "Dance happily"
  - "Walk sadly"
  - "Jump excitedly"
  - "Look surprised and wave"
- AI automatically parses your intent and controls the robot

### 🎨 Technical Highlights

#### Three.js & React Three Fiber
- Procedural 3D robot built from geometric primitives
- Real-time skeletal animations for body movements
- Smooth morph-like transitions for facial expressions
- Interactive camera controls (orbit, zoom)
- Dynamic lighting with ambient, directional, and point lights

#### Web Speech API
- Browser-native speech recognition
- Real-time transcription display
- Works in Chrome, Edge, and other Chromium-based browsers

#### AI Integration
- OpenAI GPT-4 for natural language understanding
- Converts speech to structured robot commands
- Intelligent parsing of actions and expressions

## Architecture

```
/app/robot
├── page.tsx                    # Main page with Canvas setup
├── components/
│   ├── Robot3D.tsx            # 3D robot model with animations
│   ├── ControlPanel.tsx       # Manual control interface
│   └── SpeechControl.tsx      # Voice command interface
└── README.md

/app/api/robot
└── parse-command/
    └── route.ts               # AI command parsing endpoint
```

## How It Works

### 1. 3D Rendering
The robot is rendered using Three.js through React Three Fiber. The model is built procedurally using:
- **Boxes** for the head and body
- **Cylinders** for arms and legs
- **Spheres** for eyes, hands, and feet

### 2. Animation System
Animations are driven by the `useFrame` hook which runs on every render frame:
- **Actions** modify limb rotations and positions
- **Expressions** scale and transform facial features
- **Smooth interpolation** using `THREE.MathUtils.lerp` for natural transitions

### 3. Voice Control Flow
1. User clicks microphone button
2. Browser's Speech Recognition API captures audio
3. Speech is transcribed to text locally
4. Text is sent to `/api/robot/parse-command`
5. OpenAI parses the command into `{ action, expression }`
6. Robot state updates trigger animations

## Usage

### Manual Control
1. Navigate to `/robot`
2. Click any action button (Wave, Dance, etc.)
3. Click any expression button (Happy, Sad, etc.)
4. Adjust speed slider as desired

### Voice Control
1. Click the microphone button
2. Speak your command clearly
3. Wait for processing (1-2 seconds)
4. Watch the robot respond!

## Browser Compatibility

| Feature | Chrome/Edge | Firefox | Safari |
|---------|-------------|---------|--------|
| 3D Rendering | ✅ | ✅ | ✅ |
| Manual Controls | ✅ | ✅ | ✅ |
| Voice Commands | ✅ | ⚠️ Limited | ⚠️ Limited |

*Voice commands work best in Chrome and Edge due to Web Speech API support*

## Performance

- Target: 60 FPS on modern hardware
- Optimizations:
  - Efficient geometry (low poly count)
  - Minimal draw calls
  - Smooth interpolation instead of instant changes
  - Lazy loading with Suspense

## Future Enhancements

- [ ] Custom robot colors/themes
- [ ] More complex animations (backflip, spin, etc.)
- [ ] Save/load custom animation sequences
- [ ] Multi-robot scenes
- [ ] Export robot animations as GIF/video
- [ ] VR support

## Technologies

- **Three.js** - 3D rendering engine
- **React Three Fiber** - React renderer for Three.js
- **@react-three/drei** - Useful Three.js helpers
- **Framer Motion** - UI animations
- **OpenAI GPT-4** - Natural language processing
- **Web Speech API** - Voice recognition
- **Next.js 14** - React framework
- **TypeScript** - Type safety
