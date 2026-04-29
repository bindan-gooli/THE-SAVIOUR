# THE SAVIOUR (AI Study Assistant)

An AI-powered tool that acts as your personal savior during exam preparation. It converts your notes (text, PDF, or images) into interactive mock vivas, short summaries, and multiple-choice questions (MCQs). It uses voice interaction to simulate a real examiner and tracks your weak topics!

## Features
- **Converts Notes, PDFs, and Images**: Upload a document or an image of your textbook, and the Gemini 2.5 Flash AI will analyze it!
- **Generates Short Notes**: Get a quick, bulleted summary of your material for last-minute review.
- **Voice-Based Mock Viva**: Uses the Web Speech API to read out questions and listen to your spoken answers. AI evaluates your answers and provides a score and feedback.
- **MCQ Practice**: Take an interactive quiz based on your notes.
- **Tracks Weak Topics**: Automatically identifies areas where you struggled in the viva or MCQs and lists them for review.
- **Futuristic UI**: Beautiful dark mode with glassmorphism, dynamic glowing orbs, and modern typography.

## Tech Stack
- **Frontend**: Vanilla HTML, CSS, JavaScript.
- **Backend**: Python, FastAPI.
- **AI Model**: Google Gemini 2.5 Flash API.

## Setup Instructions

### 1. Prerequisites
- Python 3.8+
- A Google Gemini API Key. Get one from [Google AI Studio](https://aistudio.google.com/).

### 2. Backend Setup
1. Navigate to the `backend` directory:
   ```bash
   cd backend
   ```
2. Install the required Python packages:
   ```bash
   pip install -r requirements.txt
   ```
3. Create a `.env` file in the `backend` directory using `.env.example` as a template:
   ```bash
   cp .env.example .env
   ```
4. Open the `.env` file and insert your API key:
   ```env
   GEMINI_API_KEY="your-api-key-here"
   ```
5. Run the FastAPI server:
   ```bash
   python main.py
   ```
   The backend will start running at `http://localhost:8000`.

### 3. Frontend Setup
1. Open the `frontend` directory.
2. Serve it using a simple HTTP server (Chrome requires this for the Speech API):
   ```bash
   cd frontend
   python -m http.server 8080
   ```
   Then open `http://localhost:8080` in your browser.

## Usage
1. Paste your study notes into the text area OR upload a PDF/Image of your notes.
2. Click **"Generate Study Material"**.
3. Use the tabs to navigate between **Mock Viva Mode**, **MCQ Practice**, **Short Notes**, and **Weak Topics**.
4. In Mock Viva Mode, click **"Start Viva"**, listen to the question, and click the microphone to speak your answer!
