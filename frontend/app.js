const API_URL = 'http://localhost:8000/api';

// State
let generatedData = null;
let currentNotes = "";
let currentVivaIndex = 0;
let weakTopics = new Set();
let recognition = null;
let synth = window.speechSynthesis;

// DOM Elements
const notesSection = document.getElementById('notes-section');
const dashboardSection = document.getElementById('dashboard-section');
const notesInput = document.getElementById('notes-input');
const fileInput = document.getElementById('file-input');
const fileNameDisplay = document.getElementById('file-name-display');
const generateBtn = document.getElementById('generate-btn');
const loadingSpinner = document.getElementById('loading-spinner');

// Tabs
const tabBtns = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');

// Viva
const currentVivaQ = document.getElementById('current-viva-q');
const startVivaBtn = document.getElementById('start-viva-btn');
const nextQBtn = document.getElementById('next-q-btn');
const voiceControls = document.getElementById('voice-controls');
const recordBtn = document.getElementById('record-btn');
const liveTranscript = document.getElementById('live-transcript');
const vivaFeedback = document.getElementById('viva-feedback');
const vivaScore = document.getElementById('viva-score');
const vivaFeedbackText = document.getElementById('viva-feedback-text');
const micStatus = document.getElementById('mic-status');

// MCQ
const mcqContainer = document.getElementById('mcq-container');
const submitMcqBtn = document.getElementById('submit-mcq-btn');
const mcqResults = document.getElementById('mcq-results');
const mcqScoreText = document.getElementById('mcq-score-text');

// Weaknesses
const weakTopicsList = document.getElementById('weak-topics-list');
const noWeaknesses = document.getElementById('no-weaknesses');

// Initialize Speech Recognition
if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    
    recognition.onresult = (event) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
                finalTranscript += event.results[i][0].transcript;
            } else {
                interimTranscript += event.results[i][0].transcript;
            }
        }
        liveTranscript.textContent = finalTranscript || interimTranscript;
    };

    recognition.onend = () => {
        recordBtn.classList.remove('recording');
        micStatus.textContent = "Processing...";
        if (liveTranscript.textContent) {
            evaluateAnswer(liveTranscript.textContent);
        } else {
            micStatus.textContent = "Didn't hear anything. Try again.";
        }
    };
} else {
    alert("Speech Recognition is not supported in your browser. Voice interaction may not work.");
}

fileInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
        fileNameDisplay.textContent = `Selected: ${e.target.files[0].name}`;
        notesInput.disabled = true;
        notesInput.placeholder = "File attached. Notes text will be ignored.";
    } else {
        fileNameDisplay.textContent = "";
        notesInput.disabled = false;
        notesInput.placeholder = "E.g. Mitochondria is the powerhouse of the cell...";
    }
});

// Generate Content
generateBtn.addEventListener('click', async () => {
    const file = fileInput.files[0];
    const notes = notesInput.value.trim();
    
    if (!file && !notes) return alert("Please enter some notes or upload a file first!");

    generateBtn.classList.add('hidden');
    loadingSpinner.classList.remove('hidden');

    try {
        let res;
        if (file) {
            // File upload logic
            const formData = new FormData();
            formData.append("file", file);
            
            res = await fetch(`${API_URL}/generate_from_file`, {
                method: 'POST',
                body: formData
            });
        } else {
            // Text logic
            currentNotes = notes;
            res = await fetch(`${API_URL}/generate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ notes })
            });
        }

        if (!res.ok) {
            const errorText = await res.text();
            throw new Error(`API Error: ${errorText}`);
        }
        
        generatedData = await res.json();
        if (file && generatedData.summary) {
            currentNotes = generatedData.summary; // Use the AI summary as context for viva
        }
        
        setupDashboard();
        
        notesSection.classList.add('hidden');
        notesSection.classList.remove('active');
        dashboardSection.classList.remove('hidden');
        dashboardSection.classList.add('active');

    } catch (error) {
        alert(`Error generating content: ${error.message}`);
        generateBtn.classList.remove('hidden');
        loadingSpinner.classList.add('hidden');
    }
});

// Setup Dashboard
function setupDashboard() {
    renderMCQs();
    renderShortNotes();
}

function renderShortNotes() {
    const shortNotesList = document.getElementById('short-notes-list');
    shortNotesList.innerHTML = '';
    if (generatedData.short_notes) {
        generatedData.short_notes.forEach(note => {
            const li = document.createElement('li');
            li.textContent = note;
            li.style.marginBottom = '0.5rem';
            shortNotesList.appendChild(li);
        });
    }
}

// Tab Switching
tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        tabBtns.forEach(b => b.classList.remove('active'));
        tabContents.forEach(c => c.classList.add('hidden'));
        
        btn.classList.add('active');
        document.getElementById(btn.dataset.target).classList.remove('hidden');
        
        if(btn.dataset.target === 'weaknesses-tab') {
            updateWeaknessesDisplay();
        }
    });
});

// Mock Viva Logic
startVivaBtn.addEventListener('click', () => {
    currentVivaIndex = 0;
    startVivaBtn.classList.add('hidden');
    askQuestion();
});

nextQBtn.addEventListener('click', () => {
    currentVivaIndex++;
    if (currentVivaIndex < generatedData.viva_questions.length) {
        askQuestion();
    } else {
        currentVivaQ.textContent = "Mock Viva Complete!";
        voiceControls.classList.add('hidden');
        nextQBtn.classList.add('hidden');
    }
});

function askQuestion() {
    const q = generatedData.viva_questions[currentVivaIndex];
    currentVivaQ.textContent = `Q${currentVivaIndex + 1}: ${q}`;
    
    voiceControls.classList.remove('hidden');
    vivaFeedback.classList.add('hidden');
    nextQBtn.classList.add('hidden');
    liveTranscript.textContent = "";
    micStatus.textContent = "Click mic to answer";
    
    // Speak question
    speak(q);
}

function speak(text) {
    if (synth.speaking) synth.cancel();
    const utterThis = new SpeechSynthesisUtterance(text);
    synth.speak(utterThis);
}

recordBtn.addEventListener('click', () => {
    if (recordBtn.classList.contains('recording')) {
        recognition.stop();
    } else {
        synth.cancel(); // Stop AI speaking if user starts talking
        liveTranscript.textContent = "";
        recordBtn.classList.add('recording');
        micStatus.textContent = "Listening...";
        recognition.start();
    }
});

async function evaluateAnswer(answerText) {
    recordBtn.disabled = true;
    try {
        const res = await fetch(`${API_URL}/evaluate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                question: generatedData.viva_questions[currentVivaIndex],
                answer: answerText,
                context: currentNotes
            })
        });

        const data = await res.json();
        
        vivaScore.textContent = data.score;
        vivaFeedbackText.textContent = data.feedback;
        
        // Update weak topics
        if (data.weak_topics && data.weak_topics.length > 0) {
            data.weak_topics.forEach(t => weakTopics.add(t));
        }

        voiceControls.classList.add('hidden');
        vivaFeedback.classList.remove('hidden');
        nextQBtn.classList.remove('hidden');
        
        // Read feedback aloud
        speak(`You scored ${data.score} out of 10. ${data.feedback}`);

    } catch (error) {
        alert("Failed to evaluate answer.");
        voiceControls.classList.remove('hidden');
        micStatus.textContent = "Error evaluating. Try again.";
    } finally {
        recordBtn.disabled = false;
    }
}

// MCQ Logic
function renderMCQs() {
    mcqContainer.innerHTML = '';
    generatedData.mcqs.forEach((mcq, index) => {
        const item = document.createElement('div');
        item.className = 'mcq-item';
        
        let optionsHtml = '';
        mcq.options.forEach((opt, oIndex) => {
            optionsHtml += `
                <div class="mcq-option" data-qindex="${index}" data-val="${opt}">
                    <input type="radio" name="q${index}" value="${opt}" id="q${index}o${oIndex}">
                    <label for="q${index}o${oIndex}">${opt}</label>
                </div>
            `;
        });

        item.innerHTML = `
            <h4>${index + 1}. ${mcq.question}</h4>
            <div class="mcq-options">
                ${optionsHtml}
            </div>
        `;
        mcqContainer.appendChild(item);
    });

    // Add selection styling
    document.querySelectorAll('.mcq-option').forEach(opt => {
        opt.addEventListener('click', function() {
            const group = this.dataset.qindex;
            document.querySelectorAll(`.mcq-option[data-qindex="${group}"]`).forEach(el => {
                el.classList.remove('selected');
                el.querySelector('input').checked = false;
            });
            this.classList.add('selected');
            this.querySelector('input').checked = true;
        });
    });
}

submitMcqBtn.addEventListener('click', () => {
    let score = 0;
    
    generatedData.mcqs.forEach((mcq, index) => {
        const selected = document.querySelector(`input[name="q${index}"]:checked`);
        const options = document.querySelectorAll(`.mcq-option[data-qindex="${index}"]`);
        
        options.forEach(opt => {
            const val = opt.dataset.val;
            if (val === mcq.answer) {
                opt.classList.add('correct');
            } else if (selected && selected.value === val && val !== mcq.answer) {
                opt.classList.add('wrong');
            }
        });

        if (selected && selected.value === mcq.answer) {
            score++;
        } else {
            // Add topic to weakness if wrong (simplified extraction)
            // Ideally we'd use NLP here, but for client-side we'll grab key words
            const words = mcq.question.split(' ').filter(w => w.length > 4);
            if(words.length > 0) weakTopics.add(words[0]);
        }
    });

    mcqScoreText.textContent = `You scored ${score} out of ${generatedData.mcqs.length}.`;
    mcqResults.classList.remove('hidden');
    submitMcqBtn.classList.add('hidden');
});

// Weaknesses Logic
function updateWeaknessesDisplay() {
    weakTopicsList.innerHTML = '';
    if (weakTopics.size === 0) {
        noWeaknesses.classList.remove('hidden');
    } else {
        noWeaknesses.classList.add('hidden');
        weakTopics.forEach(topic => {
            const li = document.createElement('li');
            li.textContent = topic;
            weakTopicsList.appendChild(li);
        });
    }
}
