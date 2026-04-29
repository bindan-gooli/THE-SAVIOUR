from fastapi import FastAPI, HTTPException, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import google.generativeai as genai
import os
import json
import tempfile

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Gemini
from dotenv import load_dotenv
load_dotenv()
API_KEY = os.getenv("GEMINI_API_KEY")
if API_KEY:
    genai.configure(api_key=API_KEY)
else:
    print("WARNING: GEMINI_API_KEY environment variable not set.")

class NotesInput(BaseModel):
    notes: str

class AnswerInput(BaseModel):
    question: str
    answer: str
    context: str

@app.post("/api/generate")
async def generate_questions(input_data: NotesInput):
    if not API_KEY:
        raise HTTPException(status_code=500, detail="Gemini API Key not configured")
        
    prompt = f"""
    Based on the following notes, generate:
    1. A bulleted list of short notes summarizing the key points.
    2. 5 Viva questions (short answer questions)
    3. 5 Multiple Choice Questions (MCQs) with 4 options each and the correct answer indicated.

    Return the output strictly in the following JSON format without any markdown formatting or extra text:
    {{
        "short_notes": ["Point 1", "Point 2", "Point 3"],
        "viva_questions": ["Question 1", "Question 2", "Question 3", "Question 4", "Question 5"],
        "mcqs": [
            {{
                "question": "MCQ 1",
                "options": ["A", "B", "C", "D"],
                "answer": "A"
            }}
        ]
    }}

    Notes:
    {input_data.notes}
    """
    
    try:
        model = genai.GenerativeModel('gemini-2.5-flash')
        response = model.generate_content(prompt)
        text = response.text
        if "```json" in text:
            text = text.split("```json")[1].split("```")[0].strip()
        elif "```" in text:
            text = text.split("```")[1].split("```")[0].strip()
        
        return json.loads(text)
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/generate_from_file")
async def generate_from_file(file: UploadFile = File(...)):
    if not API_KEY:
        raise HTTPException(status_code=500, detail="Gemini API Key not configured")
        
    try:
        suffix = os.path.splitext(file.filename)[1]
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as temp_file:
            temp_file.write(await file.read())
            temp_path = temp_file.name

        gemini_file = genai.upload_file(path=temp_path, display_name=file.filename)
        
        prompt = """
        Based on the provided document/image, generate:
        1. A comprehensive text summary of the contents (to be used as context later).
        2. A bulleted list of short notes summarizing the key points.
        3. 5 Viva questions (short answer questions)
        4. 5 Multiple Choice Questions (MCQs) with 4 options each and the correct answer indicated.

        Return the output strictly in the following JSON format without any markdown formatting or extra text:
        {
            "summary": "Full text summary...",
            "short_notes": ["Point 1", "Point 2", "Point 3"],
            "viva_questions": ["Question 1", "Question 2", "Question 3", "Question 4", "Question 5"],
            "mcqs": [
                {
                    "question": "MCQ 1",
                    "options": ["A", "B", "C", "D"],
                    "answer": "A"
                }
            ]
        }
        """
        
        model = genai.GenerativeModel('gemini-2.5-flash')
        response = model.generate_content([gemini_file, prompt])
        
        os.remove(temp_path)
        genai.delete_file(gemini_file.name)
        
        text = response.text
        if "```json" in text:
            text = text.split("```json")[1].split("```")[0].strip()
        elif "```" in text:
            text = text.split("```")[1].split("```")[0].strip()
            
        return json.loads(text)
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/evaluate")
async def evaluate_answer(input_data: AnswerInput):
    if not API_KEY:
        raise HTTPException(status_code=500, detail="Gemini API Key not configured")
        
    prompt = f"""
    Evaluate the user's answer to the viva question based on the provided notes context.
    
    Context (Notes):
    {input_data.context}
    
    Question: {input_data.question}
    User's Answer: {input_data.answer}
    
    Provide:
    1. A score from 0 to 10.
    2. Constructive feedback on what was good and what was missing.
    3. A list of specific topics or concepts from the context that the user seems weak at based on their answer.

    Return the output strictly in the following JSON format without any markdown formatting or extra text:
    {{
        "score": 8,
        "feedback": "Your answer was good but...",
        "weak_topics": ["topic 1", "topic 2"]
    }}
    """
    
    try:
        model = genai.GenerativeModel('gemini-2.5-flash')
        response = model.generate_content(prompt)
        text = response.text
        if "```json" in text:
            text = text.split("```json")[1].split("```")[0].strip()
        elif "```" in text:
            text = text.split("```")[1].split("```")[0].strip()
            
        return json.loads(text)
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
