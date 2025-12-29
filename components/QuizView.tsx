
import React, { useState, useMemo, useEffect, useRef } from 'react';
import Modal from './Modal';
import { LightBulbIcon, CheckIcon, ChevronLeftIcon, ChevronRightIcon, ArrowPathIcon as RefreshIcon, SpeakerWaveIcon } from './Icons';
import { generateSpeechFromText } from '../lib/ai';

export interface Question {
  questionText: string;
  type: 'mcq' | 'short_answer';
  options?: string[];
  correctAnswer: string;
}

interface QuizViewProps {
  questions: Question[];
  onClose: () => void;
}

const QuizView: React.FC<QuizViewProps> = ({ questions, onClose }) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userInput, setUserInput] = useState('');
  const [isFlipped, setIsFlipped] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  
  // Ref for the input to manage focus and double enter detection
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const lastEnterPressRef = useRef<number>(0);
  const audioContextRef = useRef<AudioContext | null>(null);

  const currentQuestion = questions[currentQuestionIndex];
  
  // Reset state when moving to a new question
  useEffect(() => {
      setUserInput('');
      setIsFlipped(false);
      // Small timeout to allow render before focus
      setTimeout(() => {
          if (inputRef.current) inputRef.current.focus();
      }, 300);
  }, [currentQuestionIndex]);

  const handleFlip = () => {
      setIsFlipped(!isFlipped);
  };

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };
  
  const handlePrev = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const isLastQuestion = currentQuestionIndex === questions.length - 1;

  // Simple check logic
  const isCorrect = useMemo(() => {
      const u = userInput.trim().toLowerCase();
      const c = currentQuestion.correctAnswer.trim().toLowerCase();
      return u === c || (c.length > 3 && u.includes(c)) || (u.length > 3 && c.includes(u));
  }, [userInput, currentQuestion.correctAnswer]);

  // Audio Playback Helper
  const playAudio = async (buffer: ArrayBuffer) => {
      try {
          if (!audioContextRef.current) {
              audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
          }
          const ctx = audioContextRef.current;
          if (ctx.state === 'suspended') await ctx.resume();

          const dataInt16 = new Int16Array(buffer);
          const float32 = new Float32Array(dataInt16.length);
          for (let i = 0; i < dataInt16.length; i++) {
              float32[i] = dataInt16[i] / 32768.0;
          }
          
          const audioBuffer = ctx.createBuffer(1, float32.length, 24000);
          audioBuffer.copyToChannel(float32, 0);

          const source = ctx.createBufferSource();
          source.buffer = audioBuffer;
          source.connect(ctx.destination);
          
          source.onended = () => setIsPlayingAudio(false);
          setIsPlayingAudio(true);
          source.start();
      } catch (e) {
          console.error("Audio Playback Error", e);
          setIsPlayingAudio(false);
      }
  };

  const submitAnswer = async () => {
      setIsFlipped(true);
      
      const feedback = isCorrect ? "Correct." : "Incorrect.";
      const textToSay = `${feedback} The answer is ${currentQuestion.correctAnswer}`;
      
      try {
          const audioData = await generateSpeechFromText(textToSay);
          playAudio(audioData);
      } catch (err) {
          console.error("TTS Error", err);
      }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter') {
          const now = Date.now();
          const timeSinceLastEnter = now - lastEnterPressRef.current;
          
          if (timeSinceLastEnter < 500 && !isFlipped) {
              e.preventDefault(); // Prevent new line
              submitAnswer();
          }
          lastEnterPressRef.current = now;
      }
  };

  return (
    <Modal isOpen={true} onClose={onClose} title="Active Recall" size="full">
        <div className="h-full flex flex-col items-center justify-center w-full max-w-4xl mx-auto px-4">
            
            {/* Progress Bar */}
            <div className="w-full flex items-center gap-4 mb-8">
                <div className="flex-grow h-2 bg-[var(--border-primary)] rounded-full overflow-hidden">
                    <div 
                        className="h-full bg-gradient-to-r from-[var(--accent)] to-[var(--success)] transition-all duration-500 ease-out" 
                        style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
                    ></div>
                </div>
                <span className="text-xs font-bold font-mono text-[var(--text-secondary)] whitespace-nowrap">
                    {currentQuestionIndex + 1} / {questions.length}
                </span>
            </div>

            {/* 3D Flip Card Container */}
            <div 
                className="relative w-full max-w-lg aspect-square sm:aspect-[4/3] perspective-container cursor-pointer group"
                onClick={(e) => {
                    // Prevent flip if clicking on input or buttons
                    if ((e.target as HTMLElement).tagName === 'TEXTAREA' || (e.target as HTMLElement).closest('button')) {
                        return;
                    }
                    handleFlip();
                }}
            >
                <div className={`inner-card w-full h-full relative transition-transform duration-700 transform-style-3d ${isFlipped ? 'rotate-y-180' : ''}`}>
                    
                    {/* --- FRONT FACE (Question) --- */}
                    <div className="front-face absolute inset-0 w-full h-full backface-hidden bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-3xl shadow-xl flex flex-col overflow-hidden">
                        
                        {/* Header Decoration */}
                        <div className="h-2 bg-[var(--accent)] w-full"></div>
                        
                        <div className="flex-grow flex flex-col items-center justify-center p-8 text-center gap-6">
                            <LightBulbIcon className="w-10 h-10 text-[var(--accent)] opacity-80" />
                            
                            <h3 className="text-2xl md:text-3xl font-bold text-[var(--text-primary)] leading-tight">
                                {currentQuestion.questionText}
                            </h3>
                            
                            {currentQuestion.type === 'mcq' && (
                                <p className="text-xs text-[var(--text-secondary)] uppercase tracking-widest opacity-60">Multiple Choice</p>
                            )}
                        </div>

                        {/* Input Area on Front */}
                        <div className="p-6 bg-[var(--bg-primary)]/50 backdrop-blur-sm border-t border-[var(--border-primary)] h-1/3 flex flex-col">
                            <textarea
                                ref={inputRef}
                                value={userInput}
                                onChange={(e) => setUserInput(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="Type your answer here..."
                                className="w-full h-full bg-transparent outline-none resize-none text-[var(--text-primary)] placeholder-[var(--text-secondary)]/50 text-center font-medium"
                                onClick={(e) => e.stopPropagation()} // Prevent flip on click
                            />
                            <div className="mt-2 flex justify-center items-center gap-2">
                                <span className="text-[10px] text-[var(--text-secondary)] uppercase tracking-wider opacity-50">Double tap Enter to submit</span>
                            </div>
                        </div>
                    </div>

                    {/* --- BACK FACE (Answer) --- */}
                    <div className="back-face absolute inset-0 w-full h-full backface-hidden rotate-y-180 bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-3xl shadow-xl flex flex-col overflow-hidden">
                        
                        {/* Header Decoration */}
                        <div className={`h-2 w-full ${isCorrect ? 'bg-[var(--success)]' : 'bg-[var(--danger)]'}`}></div>

                        <div className="flex-grow flex flex-col items-center justify-center p-8 text-center gap-4 overflow-y-auto custom-scrollbar">
                            <div className="flex flex-col items-center gap-2">
                                <span className="text-xs font-bold uppercase text-[var(--text-secondary)] tracking-widest">Correct Answer</span>
                                <p className="text-xl md:text-2xl font-bold text-[var(--text-primary)] leading-relaxed">
                                    {currentQuestion.correctAnswer}
                                </p>
                            </div>

                            <div className="w-full h-px bg-[var(--border-primary)] my-4"></div>

                            <div className="flex flex-col items-center gap-2">
                                <span className="text-xs font-bold uppercase text-[var(--text-secondary)] tracking-widest">Your Answer</span>
                                <p className={`text-lg font-medium ${isCorrect ? 'text-[var(--success)]' : 'text-[var(--danger)]'}`}>
                                    {userInput || "(No answer provided)"}
                                </p>
                            </div>
                            
                            {isPlayingAudio && (
                                <div className="mt-4 flex items-center gap-2 text-[var(--accent)] animate-pulse">
                                    <SpeakerWaveIcon className="w-5 h-5" />
                                    <span className="text-xs font-bold">Speaking...</span>
                                </div>
                            )}
                        </div>

                        {/* Footer Actions */}
                        <div className="p-4 bg-[var(--bg-secondary)] border-t border-[var(--border-primary)] flex justify-between items-center">
                            <button 
                                onClick={(e) => { e.stopPropagation(); handleFlip(); }}
                                className="p-2 rounded-full hover:bg-[var(--border-primary)] text-[var(--text-secondary)]"
                                title="Flip Back"
                            >
                                <RefreshIcon className="w-5 h-5" />
                            </button>
                            
                            <div className="flex gap-2">
                                <button 
                                    onClick={(e) => { e.stopPropagation(); handlePrev(); }}
                                    disabled={currentQuestionIndex === 0}
                                    className="px-4 py-2 rounded-lg text-sm font-bold text-[var(--text-secondary)] hover:bg-[var(--bg-primary)] disabled:opacity-30"
                                >
                                    Prev
                                </button>
                                <button 
                                    onClick={(e) => { e.stopPropagation(); isLastQuestion ? onClose() : handleNext(); }}
                                    className="px-6 py-2 rounded-lg text-sm font-bold bg-[var(--accent)] text-white hover:opacity-90 shadow-md"
                                >
                                    {isLastQuestion ? 'Finish' : 'Next'}
                                </button>
                            </div>
                        </div>
                    </div>

                </div>
            </div>

            <style>{`
                .perspective-container {
                    perspective: 1000px;
                }
                .transform-style-3d {
                    transform-style: preserve-3d;
                }
                .backface-hidden {
                    backface-visibility: hidden;
                }
                .rotate-y-180 {
                    transform: rotateY(180deg);
                }
            `}</style>
        </div>
    </Modal>
  );
};

export default QuizView;
