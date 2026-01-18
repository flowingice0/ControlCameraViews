# ControlCameraViews

An interactive tool to control camera angles and generate consistent character/object views using **Nano Banana**.

![Demo Banner](https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6)

## ✨ Features

- 🎮 **Interactive 3D Camera Control** - Drag to adjust azimuth, elevation, and distance
- 🖼️ **Image Upload** - Upload any character or object image
- 🤖 **AI-Powered Generation** - Uses Gemini 2.5 Flash to re-render images from new camera angles
- ⚡ **Real-time Preview** - See parameter changes instantly in the 3D visualizer

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- A Gemini API Key from [Google AI Studio](https://aistudio.google.com/apikey)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/YOUR_USERNAME/ControlCameraViews.git
   cd ControlCameraViews
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env.local
   ```
   Then edit `.env.local` and add your Gemini API key:
   ```
   GEMINI_API_KEY=your_actual_api_key_here
   ```

4. Run the development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🎯 How to Use

1. **Enter your API Key** - Paste your Gemini API key in the input field (top left)
2. **Upload an Image** - Click the upload box to select a character or object image
3. **Adjust Camera** - Use the 3D visualizer or sliders to set your desired camera angle
4. **Generate** - Click "Generate New View" to create a new perspective

## 🛠️ Tech Stack

- **React 18** with TypeScript
- **Three.js** / **React Three Fiber** for 3D visualization
- **Vite** for fast development and building
- **Tailwind CSS** for styling
- **Google Gemini API** for AI image generation

## 📝 License

This project is open source and available under the [MIT License](LICENSE).

## 🤝 Contributing

Contributions, issues, and feature requests are welcome! Feel free to open an issue or submit a pull request.
