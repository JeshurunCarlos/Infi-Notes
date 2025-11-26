import React, { useState, useMemo } from 'react';
import Modal from './Modal';

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
  const [userAnswers, setUserAnswers] = useState<string[]>(Array(questions.length).fill(''));
  const [isSubmitted, setIsSubmitted] = useState(false);
  
  const currentQuestion = questions[currentQuestionIndex];
  
  const handleAnswerChange = (answer: string) => {
    const newAnswers = [...userAnswers];
    newAnswers[currentQuestionIndex] = answer;
    setUserAnswers(newAnswers);
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
  
  const handleSubmit = () => {
    setIsSubmitted(true);
  };

  const score = useMemo(() => {
    if (!isSubmitted) return 0;
    return userAnswers.reduce((total, answer, index) => {
        const question = questions[index];
        const correctAnswer = question.correctAnswer.trim().toLowerCase();
        const userAnswer = answer.trim().toLowerCase();
        return total + (correctAnswer === userAnswer ? 1 : 0);
    }, 0);
  }, [isSubmitted, userAnswers, questions]);

  const renderQuestion = () => {
    return (
        <div>
            <p className="text-lg font-semibold mb-4">{currentQuestion.questionText}</p>
            {currentQuestion.type === 'mcq' ? (
                <div className="space-y-3">
                    {currentQuestion.options?.map((option, index) => {
                        const isSelected = userAnswers[currentQuestionIndex] === option;
                        return (
                             <button
                                key={index}
                                onClick={() => handleAnswerChange(option)}
                                className={`w-full text-left p-3 rounded-md border-2 transition-all btn-press ${isSelected ? 'bg-[var(--accent)] text-white border-[var(--accent)]' : 'bg-[var(--bg-primary)] border-[var(--border-primary)] hover:border-[var(--accent)]'}`}
                            >
                                {option}
                            </button>
                        )
                    })}
                </div>
            ) : (
                <input
                    type="text"
                    value={userAnswers[currentQuestionIndex]}
                    onChange={(e) => handleAnswerChange(e.target.value)}
                    placeholder="Your answer..."
                    className="w-full px-3 py-2 bg-[var(--bg-primary)] text-[var(--text-primary)] border-2 border-[var(--border-primary)] rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--accent)] transition-all"
                />
            )}
        </div>
    );
  };
  
  const renderResults = () => {
    return (
        <div>
            <h3 className="text-2xl font-bold text-center mb-2">Quiz Complete!</h3>
            <p className="text-xl text-center text-[var(--text-secondary)] mb-6">Your Score: <span className="font-bold text-[var(--accent)]">{score} / {questions.length}</span></p>
            
            <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-2">
                {questions.map((q, index) => {
                    const userAnswer = userAnswers[index];
                    const isCorrect = q.correctAnswer.trim().toLowerCase() === userAnswer.trim().toLowerCase();
                    const resultColor = isCorrect ? 'border-[var(--success)]' : 'border-[var(--danger)]';
                    
                    return (
                        <div key={index} className={`p-4 border-l-4 ${resultColor} bg-[var(--bg-primary)] rounded`}>
                            <p className="font-semibold">{index + 1}. {q.questionText}</p>
                            <p className={`mt-2 text-sm ${isCorrect ? 'text-[var(--success)]' : 'text-[var(--danger)]'}`}>Your answer: {userAnswer || "No answer"}</p>
                            {!isCorrect && <p className="mt-1 text-sm text-[var(--text-secondary)]">Correct answer: {q.correctAnswer}</p>}
                        </div>
                    )
                })}
            </div>
            <div className="flex justify-end mt-6">
                 <button onClick={onClose} className="px-6 py-2 font-semibold text-white bg-[var(--accent)] rounded-md hover:opacity-90 transition-all btn-press">Finish</button>
            </div>
        </div>
    );
  };

  return (
    <Modal isOpen={true} onClose={onClose} title={isSubmitted ? "Quiz Results" : `Question ${currentQuestionIndex + 1} of ${questions.length}`} size="full">
        {isSubmitted ? renderResults() : (
            <div className="h-full flex flex-col">
                <div className="w-full bg-[var(--border-primary)] rounded-full h-2.5 mb-6">
                    <div className="bg-[var(--accent)] h-2.5 rounded-full" style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}></div>
                </div>
                <div className="flex-grow mb-6">
                  {renderQuestion()}
                </div>
                <div className="flex justify-between items-center flex-shrink-0">
                    <button onClick={handlePrev} disabled={currentQuestionIndex === 0} className="px-6 py-2 font-semibold bg-[var(--bg-primary)] text-[var(--text-primary)] rounded-md hover:bg-[var(--border-primary)] disabled:opacity-50 transition-all btn-press">Previous</button>
                    {currentQuestionIndex === questions.length - 1 ? (
                        <button onClick={handleSubmit} className="px-6 py-2 font-semibold text-white bg-[var(--success)] rounded-md hover:opacity-90 transition-all btn-press">Submit</button>
                    ) : (
                        <button onClick={handleNext} className="px-6 py-2 font-semibold text-white bg-[var(--accent)] rounded-md hover:opacity-90 transition-all btn-press">Next</button>
                    )}
                </div>
            </div>
        )}
    </Modal>
  );
};

export default QuizView;