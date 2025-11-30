---
title: "Interactive 3D Robot"
description: "AI-powered 3D character control with voice commands and manual toggles"
date: "2025-11-29"
featured: true
technologies:
  - Three.js
  - React Three Fiber
  - OpenAI GPT-4
  - Web Speech API
  - TypeScript
  - Next.js
category: "3D Graphics & AI"
github: ""
demo: "/robot"
---

# Interactive 3D Robot

An immersive 3D experience featuring a friendly robot that responds to your voice commands and manual controls.

## Overview

This project showcases the intersection of 3D graphics and AI by creating an interactive robot character that can be controlled through:
- **Manual toggles** for precise control over actions and expressions
- **AI-powered voice commands** for natural language interaction

## Key Features

### 🎨 Procedural 3D Modeling
Built entirely with Three.js geometric primitives - no external 3D models required. The robot features:
- Articulated limbs with skeletal animation
- Morph-like facial expressions
- Smooth interpolated transitions
- Real-time lighting and shadows

### 🤖 AI Voice Control
Speak naturally to control the robot:
- "Make him wave happily"
- "Dance excitedly"
- "Look surprised and jump"

The AI understands context and extracts both the desired action and emotional expression from your command.

### 🎮 Rich Animation System
- **5 Actions**: Idle, Wave, Dance, Walk, Jump
- **6 Expressions**: Neutral, Happy, Sad, Surprised, Excited, Thinking
- **Variable Speed**: Control animation playback from 0.5x to 2x

## Technical Implementation

### Three.js Integration
Uses React Three Fiber for declarative 3D scene management with:
- Custom animation loops via `useFrame`
- OrbitControls for camera interaction
- Environment mapping for realistic lighting
- Shadow casting and receiving

### AI Command Parsing
Natural language processing pipeline:
1. Browser Speech Recognition API captures voice
2. Transcription sent to OpenAI GPT-4
3. AI extracts structured command: `{ action, expression }`
4. Robot state updates trigger smooth animations

### Performance Optimizations
- Low-poly geometry for efficient rendering
- Lerp-based interpolation for smooth transitions
- Lazy loading with React Suspense
- Optimized render loop targeting 60 FPS

## Inspiration

Inspired by the Three.js morph animation examples, this project demonstrates how procedural modeling and AI can create engaging, interactive 3D experiences without complex 3D modeling tools.

## Use Cases

- **Educational**: Learn 3D graphics and AI integration
- **Portfolio**: Showcase full-stack + 3D capabilities
- **Interactive Demos**: Engage users with voice-controlled characters
- **Prototyping**: Test animation systems and AI parsing
