// If you host the frontend on GitHub Pages, paste your Vercel backend URL here (e.g. "https://your-project.vercel.app")
// If you host both frontend and backend on Vercel, leave it empty "" to use a relative path.
const BACKEND_API_URL = "";

// Global array for questions currently being played
let activeQuestions = [];

// Questions Database (Local Fallback - Sorted Easy to Hard)
const localFallbackQuestions = [
    {
        question: "เมืองหลวงของประเทศฝรั่งเศสคือเมืองอะไร?",
        options: ["ปารีส", "ลอนดอน", "โรม", "มาดริด"],
        answer: 0
    },
    {
        question: "ดาวเคราะห์ดวงใดอยู่ใกล้ดวงอาทิตย์มากที่สุดในระบบสุริยะ?",
        options: ["ดาวพุธ", "ดาวศุกร์", "โลก", "ดาวอังคาร"],
        answer: 0
    },
    {
        question: "แม่น้ำสายที่ยาวที่สุดในโลกคือแม่น้ำสายใด?",
        options: ["แม่น้ำไนล์", "แม่น้ำอเมซอน", "แม่น้ำแยงซี", "แม่น้ำมิสซิสซิปปี"],
        answer: 0
    },
    {
        question: "ใครคือผู้ประดิษฐ์หลอดไฟคนแรกของโลก?",
        options: ["โทมัส อัลวา เอดิสัน", "อัลเบิร์ต ไอน์สไตน์", "นิกโคลา เทสลา", "อเล็กซานเดอร์ เกรแฮม เบลล์"],
        answer: 0
    },
    {
        question: "สิ่งมีชีวิตใดเป็นสัตว์เลี้ยงลูกด้วยนมที่วางไข่ได้?",
        options: ["ตุ่นปากเป็ด", "จิงโจ้", "ค้างคาว", "วอลรัส"],
        answer: 0
    },
    {
        question: "มหาสมุทรที่ลึกที่สุดในโลกคือมหาสมุทรใดและจุดที่ลึกที่สุดเรียกว่าอะไร?",
        options: [
            "มหาสมุทรแปซิฟิก - ร่องลึกมาเรียนา",
            "มหาสมุทรแอตแลนติก - ร่องลึกเปอร์โตริโก",
            "มหาสมุทรอินเดีย - ร่องลึกชวา",
            "มหาสมุทรอาร์กติก - ร่องลึกยูเรเชีย"
        ],
        answer: 0
    },
    {
        question: "สงครามร้อยปี (Hundred Years' War) เป็นสงครามระหว่างสองประเทศใด?",
        options: ["อังกฤษและฝรั่งเศส", "ฝรั่งเศสและเยอรมนี", "สเปนและโปรตุเกส", "อิตาลีและกรีซ"],
        answer: 0
    },
    {
        question: "ก๊าซที่พบมากที่สุดในชั้นบรรยากาศของโลกคือก๊าซอะไร?",
        options: ["ไนโตรเจน", "ออกซิเจน", "คาร์บอนไดออกไซด์", "อาร์กอน"],
        answer: 0
    },
    {
        question: "ใครคือผู้เขียนวรรณกรรมชิ้นเอกของโลกเรื่อง \"Don Quixote\" (ดอน กิโฆเต้)?",
        options: ["มิเกล เด เซร์บันเตส", "วิลเลียม เชกสเปียร์", "วิกเตอร์ อูโก", "ลีโอ ตอลสตอย"],
        answer: 0
    },
    {
        question: "ธาตุที่หายากที่สุดและมีความเสถียรน้อยที่สุดบนเปลือกโลกตามธรรมชาติคือธาตุใด?",
        options: ["แอสทาทีน", "แฟรนเซียม", "เรเดียม", "โพลอนีเซียม"],
        answer: 0
    }
];

// Game State
let state = {
    score: 100,
    currentQuestionIndex: 0,
    currentBet: 0,
    timeLeft: 10,
    timerInterval: null,
    scoreInterval: null,
    isMuted: false,
    audioCtx: null,
    correctCount: 0,
    incorrectCount: 0,
    maxBetPlaced: 0,
    activePhase: null // 'bet' or 'answer'
};

// DOM Elements
const startScreen = document.getElementById('start-screen');
const betScreen = document.getElementById('bet-screen');
const answerScreen = document.getElementById('answer-screen');
const gameoverScreen = document.getElementById('gameover-screen');
const victoryScreen = document.getElementById('victory-screen');

const gameHeader = document.getElementById('game-header');
const questionProgress = document.getElementById('question-progress');
const progressBarFill = document.getElementById('progress-bar-fill');
const scoreDisplay = document.getElementById('score-display');
const scoreFloat = document.getElementById('score-float');

const timerWrapper = document.getElementById('timer-wrapper');
const timerBar = document.getElementById('timer-bar');
const timerText = document.getElementById('timer-text');

const muteBtn = document.getElementById('mute-btn');
const startGameBtn = document.getElementById('start-game-btn');
const retryGameBtn = document.getElementById('retry-game-btn');
const restartGameBtn = document.getElementById('restart-game-btn');

// Betting Screen Elements
const betQuestionText = document.getElementById('bet-question-text');
const betOpt1 = document.getElementById('bet-opt-1');
const betOpt2 = document.getElementById('bet-opt-2');
const betOpt3 = document.getElementById('bet-opt-3');
const betOpt4 = document.getElementById('bet-opt-4');
const betBtns = document.querySelectorAll('.bet-btn');

// Answer Screen Elements
const answerQuestionText = document.getElementById('answer-question-text');
const currentBetBadge = document.getElementById('current-bet-badge');
const answersContainer = document.getElementById('answers-container');
const feedbackBox = document.getElementById('feedback-box');

// Web Audio API Synthesizer
function playSound(type) {
    if (state.isMuted) return;
    
    try {
        if (!state.audioCtx) {
            state.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        }
        
        if (state.audioCtx.state === 'suspended') {
            state.audioCtx.resume();
        }
        
        const now = state.audioCtx.currentTime;
        
        switch(type) {
            case 'click': {
                const osc = state.audioCtx.createOscillator();
                const gain = state.audioCtx.createGain();
                osc.type = 'sine';
                osc.frequency.setValueAtTime(600, now);
                gain.gain.setValueAtTime(0.08, now);
                gain.gain.linearRampToValueAtTime(0, now + 0.1);
                osc.connect(gain);
                gain.connect(state.audioCtx.destination);
                osc.start(now);
                osc.stop(now + 0.1);
                osc.onended = () => {
                    osc.disconnect();
                    gain.disconnect();
                };
                break;
            }
            case 'bet': {
                const osc = state.audioCtx.createOscillator();
                const gain = state.audioCtx.createGain();
                osc.type = 'sine';
                osc.frequency.setValueAtTime(350, now);
                osc.frequency.exponentialRampToValueAtTime(750, now + 0.15);
                gain.gain.setValueAtTime(0.1, now);
                gain.gain.linearRampToValueAtTime(0, now + 0.15);
                osc.connect(gain);
                gain.connect(state.audioCtx.destination);
                osc.start(now);
                osc.stop(now + 0.15);
                osc.onended = () => {
                    osc.disconnect();
                    gain.disconnect();
                };
                break;
            }
            case 'correct': {
                const notes = [523.25, 659.25, 783.99]; // C5, E5, G5 arpeggio
                notes.forEach((f, idx) => {
                    const startTime = now + idx * 0.08;
                    const stopTime = startTime + 0.25;
                    
                    const osc = state.audioCtx.createOscillator();
                    const gain = state.audioCtx.createGain();
                    
                    osc.type = 'sine';
                    osc.frequency.setValueAtTime(f, startTime);
                    
                    gain.gain.setValueAtTime(0.08, startTime);
                    gain.gain.linearRampToValueAtTime(0, stopTime);
                    
                    osc.connect(gain);
                    gain.connect(state.audioCtx.destination);
                    
                    osc.start(startTime);
                    osc.stop(stopTime);
                    osc.onended = () => {
                        osc.disconnect();
                        gain.disconnect();
                    };
                });
                break;
            }
            case 'incorrect': {
                const osc = state.audioCtx.createOscillator();
                const gain = state.audioCtx.createGain();
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(180, now);
                osc.frequency.linearRampToValueAtTime(90, now + 0.4);
                gain.gain.setValueAtTime(0.15, now);
                gain.gain.linearRampToValueAtTime(0, now + 0.4);
                osc.connect(gain);
                gain.connect(state.audioCtx.destination);
                osc.start(now);
                osc.stop(now + 0.4);
                osc.onended = () => {
                    osc.disconnect();
                    gain.disconnect();
                };
                break;
            }
            case 'tick': {
                const osc = state.audioCtx.createOscillator();
                const gain = state.audioCtx.createGain();
                osc.type = 'sine';
                osc.frequency.setValueAtTime(state.timeLeft <= 3 ? 1100 : 750, now);
                gain.gain.setValueAtTime(0.03, now);
                gain.gain.linearRampToValueAtTime(0, now + 0.05);
                osc.connect(gain);
                gain.connect(state.audioCtx.destination);
                osc.start(now);
                osc.stop(now + 0.05);
                osc.onended = () => {
                    osc.disconnect();
                    gain.disconnect();
                };
                break;
            }
            case 'gameover': {
                const notes = [130.81, 110.00, 82.41]; // C3, A2, E2
                notes.forEach((f, idx) => {
                    const startTime = now + idx * 0.12;
                    const stopTime = startTime + 0.4;
                    
                    const osc = state.audioCtx.createOscillator();
                    const gain = state.audioCtx.createGain();
                    
                    osc.type = 'sawtooth';
                    osc.frequency.setValueAtTime(f, startTime);
                    osc.frequency.linearRampToValueAtTime(f - 15, stopTime);
                    
                    gain.gain.setValueAtTime(0.05, startTime);
                    gain.gain.linearRampToValueAtTime(0, stopTime);
                    
                    osc.connect(gain);
                    gain.connect(state.audioCtx.destination);
                    
                    osc.start(startTime);
                    osc.stop(stopTime);
                    osc.onended = () => {
                        osc.disconnect();
                        gain.disconnect();
                    };
                });
                break;
            }
            case 'victory': {
                const notes = [261.63, 329.63, 392.00, 523.25, 659.25, 783.99, 1046.50]; // C4 to C6 arpeggio
                notes.forEach((f, idx) => {
                    const startTime = now + idx * 0.08;
                    const stopTime = startTime + 0.3;
                    
                    const osc = state.audioCtx.createOscillator();
                    const gain = state.audioCtx.createGain();
                    
                    osc.type = 'sine';
                    osc.frequency.setValueAtTime(f, startTime);
                    
                    gain.gain.setValueAtTime(0.06, startTime);
                    gain.gain.linearRampToValueAtTime(0, stopTime);
                    
                    osc.connect(gain);
                    gain.connect(state.audioCtx.destination);
                    
                    osc.start(startTime);
                    osc.stop(stopTime);
                    osc.onended = () => {
                        osc.disconnect();
                        gain.disconnect();
                    };
                });
                break;
            }
        }
    } catch (e) {
        console.error("Audio playback error:", e);
    }
}

// Initialize audio context on first click/tap to bypass browser security policies
function initAudio() {
    if (!state.audioCtx) {
        state.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (state.audioCtx.state === 'suspended') {
        state.audioCtx.resume();
    }
}

// Audio Control Button Handler
muteBtn.addEventListener('click', () => {
    initAudio();
    state.isMuted = !state.isMuted;
    if (state.isMuted) {
        muteBtn.innerHTML = '<i class="fas fa-volume-mute"></i>';
        muteBtn.classList.add('muted');
    } else {
        muteBtn.innerHTML = '<i class="fas fa-volume-up"></i>';
        muteBtn.classList.remove('muted');
        playSound('click');
    }
});

// Dynamic Bet Calculations
function generateBets(score) {
    if (score >= 60) {
        return [10, 30, 50, score];
    }
    if (score <= 4) {
        return [1, Math.min(2, score), Math.min(3, score), score];
    }
    // Interpolated values for middle points
    const opt1 = Math.max(1, Math.floor(score * 0.2));
    const opt2 = Math.max(opt1 + 1, Math.floor(score * 0.4));
    const opt3 = Math.max(opt2 + 1, Math.floor(score * 0.7));
    const opt4 = score;
    return [opt1, opt2, opt3, opt4];
}

// Timer Functions
function startTimer(phase) {
    clearInterval(state.timerInterval);
    state.timeLeft = 10;
    state.activePhase = phase;
    
    updateTimerUI();
    
    state.timerInterval = setInterval(() => {
        state.timeLeft--;
        updateTimerUI();
        
        if (state.timeLeft > 0) {
            playSound('tick');
        } else {
            clearInterval(state.timerInterval);
            handleTimeout();
        }
    }, 1000);
}

function updateTimerUI() {
    timerText.textContent = state.timeLeft;
    
    // Scale the countdown bar horizontally
    const scale = state.timeLeft / 10;
    timerBar.style.transform = `scaleX(${scale})`;
    
    // Alert state colors
    timerBar.classList.remove('warning', 'critical');
    if (state.timeLeft <= 3) {
        timerBar.classList.add('critical');
    } else if (state.timeLeft <= 5) {
        timerBar.classList.add('warning');
    }
}

function stopTimer() {
    clearInterval(state.timerInterval);
}

// Handle time-out scenario
function handleTimeout() {
    if (state.activePhase === 'bet') {
        // Auto-select option 1 (the lowest bet)
        const options = generateBets(state.score);
        const autoBet = options[0];
        selectBet(autoBet);
    } else if (state.activePhase === 'answer') {
        // Automatically incorrect due to timeout
        processAnswer(null, true);
    }
}

// Start Game
startGameBtn.addEventListener('click', () => {
    initAudio();
    playSound('click');
    setupNewGame();
});

// Fetch questions dynamically from Google Gemini 2.5 Flash API via Backend Proxy
async function fetchAIQuestions() {
    const endpoint = BACKEND_API_URL ? `${BACKEND_API_URL}/api/questions` : '/api/questions';
    
    let response;
    try {
        response = await fetch(endpoint, {
            method: "GET",
            headers: {
                "Content-Type": "application/json"
            }
        });
    } catch (netErr) {
        throw new Error(`ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้ (Failed to fetch: ${netErr.message})`);
    }
    
    if (!response.ok) {
        let errDetails = `HTTP error! status: ${response.status}`;
        try {
            const errJson = await response.json();
            if (errJson && errJson.error) {
                errDetails = errJson.error;
            }
        } catch(e) {}
        throw new Error(errDetails);
    }
    
    const parsedQuestions = await response.json();
    
    if (!Array.isArray(parsedQuestions) || parsedQuestions.length !== 10) {
        throw new Error("โครงสร้างคำถามที่ AI ส่งกลับมาไม่ถูกต้อง");
    }
    
    // Basic verification
    parsedQuestions.forEach((q, idx) => {
        if (!q.question || !Array.isArray(q.options) || q.options.length !== 4 || typeof q.answer !== 'number') {
            throw new Error(`คำถามข้อที่ ${idx + 1} รูปแบบฟิลด์ไม่ตรงตามข้อกำหนด`);
        }
    });
    
    return parsedQuestions;
}

// Setup New Game
const startStatus = document.getElementById('start-status');

async function setupNewGame() {
    state.score = 100;
    state.currentQuestionIndex = 0;
    state.correctCount = 0;
    state.incorrectCount = 0;
    state.maxBetPlaced = 0;
    
    // Switch immediately to Start Screen to show loading progress
    showScreen(startScreen);
    gameHeader.classList.add('hidden');
    timerWrapper.classList.add('hidden');
    
    // Show Loading feedback and disable all play buttons to prevent double click
    startStatus.textContent = "กำลังเชื่อมต่อ Gemini AI เพื่อสร้างคำถามใหม่...";
    startStatus.className = "start-status";
    startStatus.classList.remove('hidden');
    
    startGameBtn.disabled = true;
    retryGameBtn.disabled = true;
    restartGameBtn.disabled = true;
    
    try {
        activeQuestions = await fetchAIQuestions();
        
        startStatus.textContent = "สร้างคำถามสำเร็จ!";
        startStatus.className = "start-status success";
        
        setTimeout(() => {
            startGameBtn.disabled = false;
            retryGameBtn.disabled = false;
            restartGameBtn.disabled = false;
            startStatus.classList.add('hidden');
            proceedToGame();
        }, 800);
    } catch (err) {
        console.warn("Gemini API failed or key missing. Swapping to local fallback pool.", err);
        
        startStatus.innerHTML = `ไม่สามารถเชื่อมต่อ AI ได้ (${err.message})<br><small style="font-size: 0.8em; opacity: 0.8;">กำลังสลับไปใช้คำถามสำรอง...</small>`;
        startStatus.className = "start-status error";
        
        // Copy the local fallback questions directly to keep the easy-to-hard sorting order
        activeQuestions = [...localFallbackQuestions];
        
        setTimeout(() => {
            startGameBtn.disabled = false;
            retryGameBtn.disabled = false;
            restartGameBtn.disabled = false;
            startStatus.classList.add('hidden');
            proceedToGame();
        }, 3500);
    }
}

function proceedToGame() {
    // Clear any active score animation
    if (state.scoreInterval) {
        clearInterval(state.scoreInterval);
        state.scoreInterval = null;
    }
    
    scoreDisplay.textContent = state.score;
    gameHeader.classList.remove('hidden');
    timerWrapper.classList.remove('hidden');
    
    goToBetScreen();
}

// Switch Screens helper
function showScreen(screen) {
    startScreen.classList.add('hidden');
    betScreen.classList.add('hidden');
    answerScreen.classList.add('hidden');
    gameoverScreen.classList.add('hidden');
    victoryScreen.classList.add('hidden');
    
    screen.classList.remove('hidden');
}

// Phase 1: Go to Betting Screen
function goToBetScreen() {
    const question = activeQuestions[state.currentQuestionIndex];
    
    // Set Header
    questionProgress.textContent = `${state.currentQuestionIndex + 1} / 10`;
    progressBarFill.style.width = `${((state.currentQuestionIndex) / 10) * 100}%`;
    
    // Setup Betting Screen
    betQuestionText.textContent = question.question;
    
    const betOptions = generateBets(state.score);
    
    betOpt1.textContent = betOptions[0];
    betOpt2.textContent = betOptions[1];
    betOpt3.textContent = betOptions[2];
    betOpt4.textContent = betOptions[3];
    
    // Store original options on the buttons for handling click
    betBtns.forEach((btn, index) => {
        btn.dataset.betAmount = betOptions[index];
    });
    
    showScreen(betScreen);
    startTimer('bet');
}

// Bind Bet Clicks
betBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
        initAudio();
        const betAmount = parseInt(e.currentTarget.dataset.betAmount);
        playSound('bet');
        selectBet(betAmount);
    });
});

function selectBet(amount) {
    if (state.activePhase !== 'bet') return;
    state.activePhase = 'answer';
    stopTimer();
    state.currentBet = amount;
    if (amount > state.maxBetPlaced) {
        state.maxBetPlaced = amount;
    }
    goToAnswerScreen();
}

// Phase 2: Go to Answering Screen
function goToAnswerScreen() {
    const question = activeQuestions[state.currentQuestionIndex];
    
    answerQuestionText.textContent = question.question;
    currentBetBadge.textContent = state.currentBet;
    
    // Clear & populate answers
    answersContainer.innerHTML = '';
    feedbackBox.classList.add('hidden');
    
    question.options.forEach((opt, index) => {
        const btn = document.createElement('button');
        btn.className = 'answer-btn';
        
        // ABCDE Badge
        const letter = String.fromCharCode(65 + index); // A, B, C, D
        btn.innerHTML = `<span class="ans-badge">${letter}</span> <span class="ans-text">${opt}</span>`;
        
        btn.addEventListener('click', () => {
            initAudio();
            processAnswer(index, false);
        });
        
        answersContainer.appendChild(btn);
    });
    
    showScreen(answerScreen);
    startTimer('answer');
}

// Process selected answer or timeout
function processAnswer(selectedIndex, isTimeout) {
    if (state.activePhase !== 'answer') return;
    state.activePhase = null;
    stopTimer();
    
    const question = activeQuestions[state.currentQuestionIndex];
    const isCorrect = !isTimeout && selectedIndex === question.answer;
    
    const answerButtons = answersContainer.querySelectorAll('.answer-btn');
    
    // Disable all options immediately
    answerButtons.forEach(btn => btn.disabled = true);
    
    if (isCorrect) {
        playSound('correct');
        state.correctCount++;
        
        // Highlight answer green
        answerButtons[selectedIndex].classList.add('correct');
        
        // Dynamic Score Ticking animation
        const oldScore = state.score;
        state.score += state.currentBet;
        animateScoreChange(oldScore, state.score, true);
        
        // Show Success Feedback
        feedbackBox.className = 'feedback-box correct';
        feedbackBox.querySelector('.feedback-icon').innerHTML = '<i class="fas fa-check-circle"></i>';
        feedbackBox.querySelector('.feedback-message').textContent = `ถูกต้อง! ได้รับ +${state.currentBet} คะแนน`;
        feedbackBox.classList.remove('hidden');
        
    } else {
        playSound('incorrect');
        state.incorrectCount++;
        
        // Highlight correct answer green, and selected wrong answer red
        if (selectedIndex !== null) {
            answerButtons[selectedIndex].classList.add('incorrect');
        }
        answerButtons[question.answer].classList.add('correct');
        
        // Dynamic Score Ticking animation
        const oldScore = state.score;
        state.score = Math.max(0, state.score - state.currentBet);
        animateScoreChange(oldScore, state.score, false);
        
        // Show Error Feedback
        feedbackBox.className = 'feedback-box incorrect';
        feedbackBox.querySelector('.feedback-icon').innerHTML = '<i class="fas fa-times-circle"></i>';
        
        if (isTimeout) {
            feedbackBox.querySelector('.feedback-message').textContent = `หมดเวลา! ถูกหัก -${state.currentBet} คะแนน`;
        } else {
            feedbackBox.querySelector('.feedback-message').textContent = `ตอบผิด! ถูกหัก -${state.currentBet} คะแนน`;
        }
        feedbackBox.classList.remove('hidden');
    }
    
    // Wait 2.5 seconds to show feedback, then check game flow transitions
    setTimeout(() => {
        if (state.score <= 0) {
            // Player lost all points
            endGame(false);
        } else {
            state.currentQuestionIndex++;
            if (state.currentQuestionIndex >= 10) {
                // Completed all 10 questions successfully
                endGame(true);
            } else {
                goToBetScreen();
            }
        }
    }, 2500);
}

// Premium Score Ticking and Floating FX Animation
function animateScoreChange(startValue, endValue, isGain) {
    // 1. Clear any existing score animation interval to prevent overlap
    if (state.scoreInterval) {
        clearInterval(state.scoreInterval);
        state.scoreInterval = null;
    }
    
    // 2. Trigger Floating indicator
    scoreFloat.textContent = isGain ? `+${endValue - startValue}` : `-${startValue - endValue}`;
    scoreFloat.className = 'score-float'; // reset classes
    scoreFloat.classList.add(isGain ? 'add' : 'subtract');
    
    // 3. Ticking number effect
    let currentVal = startValue;
    const diff = Math.abs(endValue - startValue);
    if (diff === 0) {
        scoreDisplay.textContent = endValue;
        return;
    }
    
    const duration = 400; // total animation duration in ms (very fast!)
    const totalSteps = Math.min(diff, 15); // cap steps at 15 to ensure reliable browser timing
    const stepDuration = duration / totalSteps;
    const stepAmount = Math.ceil(diff / totalSteps);
    
    let stepCount = 0;
    state.scoreInterval = setInterval(() => {
        stepCount++;
        if (isGain) {
            currentVal += stepAmount;
            if (currentVal >= endValue || stepCount >= totalSteps) {
                currentVal = endValue;
                clearInterval(state.scoreInterval);
                state.scoreInterval = null;
            }
        } else {
            currentVal -= stepAmount;
            if (currentVal <= endValue || stepCount >= totalSteps) {
                currentVal = endValue;
                clearInterval(state.scoreInterval);
                state.scoreInterval = null;
            }
        }
        scoreDisplay.textContent = currentVal;
    }, stepDuration);
}

// End Game (Victory or Game Over)
function endGame(isVictory) {
    stopTimer();
    gameHeader.classList.add('hidden');
    timerWrapper.classList.add('hidden');
    
    // Clear any active score animation and set display to final value
    if (state.scoreInterval) {
        clearInterval(state.scoreInterval);
        state.scoreInterval = null;
    }
    scoreDisplay.textContent = state.score;
    
    if (isVictory) {
        playSound('victory');
        
        // Set stats
        document.getElementById('final-score-display').textContent = state.score;
        document.getElementById('stat-correct').textContent = `${state.correctCount} / 10`;
        document.getElementById('stat-incorrect').textContent = `${state.incorrectCount} / 10`;
        document.getElementById('stat-max-bet').textContent = `${state.maxBetPlaced} คะแนน`;
        
        showScreen(victoryScreen);
    } else {
        playSound('gameover');
        
        // Set stats
        document.getElementById('gameover-progress').textContent = `${state.currentQuestionIndex + 1} / 10 ข้อ`;
        
        // Tailor the reason
        const reasonText = document.getElementById('gameover-reason');
        if (state.score <= 0) {
            reasonText.textContent = "คะแนนสะสมของคุณหมดเกลี้ยงแล้ว!";
        } else {
            reasonText.textContent = "คุณไม่สามารถทนทานเวลาได้หมด";
        }
        
        showScreen(gameoverScreen);
    }
}

// Restart buttons handlers
retryGameBtn.addEventListener('click', () => {
    initAudio();
    playSound('click');
    setupNewGame();
});

restartGameBtn.addEventListener('click', () => {
    initAudio();
    playSound('click');
    setupNewGame();
});
