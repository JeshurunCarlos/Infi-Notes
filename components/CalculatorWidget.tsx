
import React, { useState } from 'react';
import { ArrowsPointingOutIcon, ArrowsPointingInIcon } from './Icons';

// Calculator Widget
export const CalculatorWidget: React.FC<{
    isScientific?: boolean;
    onClose?: () => void;
    onExpand?: () => void;
}> = ({ isScientific = false, onClose, onExpand }) => {
    const [display, setDisplay] = useState('0');
    const [history, setHistory] = useState('');
    const [isResult, setIsResult] = useState(false);
    const [isDeg, setIsDeg] = useState(true);
    const [isInv, setIsInv] = useState(false);
    const [memory, setMemory] = useState(0);

    const safeEval = (expr: string) => {
        try {
            if (/[^0-9+\-*/().%^sincotaelogPIE\se!abssqrt]/.test(expr)) {
                console.error("Invalid characters in expression");
                return 'Error';
            }
            
            let newExpr = expr.replace(/\^/g, '**');
            
            // Pre-process standard mathematical functions
            const trigFuncs = ['sin', 'cos', 'tan', 'asin', 'acos', 'atan', 'sinh', 'cosh', 'tanh'];
            trigFuncs.forEach(f => {
                const re = new RegExp(`\\b${f}\\(`, 'g');
                if (isDeg && !f.startsWith('a') && !f.endsWith('h')) {
                    // Standard trig in degrees: convert arg to radians
                    newExpr = newExpr.replace(re, `Math.${f}(Math.PI/180*`);
                } else if (isDeg && f.startsWith('a')) {
                    // Inverse trig in degrees: result is radians, convert to degrees
                    // We can't easily wrap the result in simple regex replace unless we balance parens.
                    // For simplicity in this safeEval, let's assume standard Math functions and post-process or pre-process carefully.
                    // Actually, simpler to just map the function name to a custom one in the Function constructor.
                    newExpr = newExpr.replace(re, `d_${f}(`);
                } else {
                    newExpr = newExpr.replace(re, `Math.${f}(`);
                }
            });

            newExpr = newExpr.replace(/log\(/g, 'Math.log10(')
                             .replace(/ln\(/g, 'Math.log(')
                             .replace(/sqrt\(/g, 'Math.sqrt(')
                             .replace(/abs\(/g, 'Math.abs(')
                             .replace(/PI/g, 'Math.PI')
                             .replace(/E/g, 'Math.E');
                             
            // Handle Factorial fact(n)
            newExpr = newExpr.replace(/fact\(/g, 'factorial(');

            // Define helpers for the Function constructor
            const degToRad = (d: number) => d * (Math.PI / 180);
            const radToDeg = (r: number) => r * (180 / Math.PI);
            
            const helpers = {
                d_asin: (x: number) => radToDeg(Math.asin(x)),
                d_acos: (x: number) => radToDeg(Math.acos(x)),
                d_atan: (x: number) => radToDeg(Math.atan(x)),
                factorial: function f(n: number): number { return n <= 1 ? 1 : n * f(n - 1); }
            };

            // Construct the function body
            // We'll add the helpers to the scope by passing them as arguments
            const funcBody = `
                const { d_asin, d_acos, d_atan, factorial } = helpers;
                return ${newExpr};
            `;

            // eslint-disable-next-line no-new-func
            const result = new Function('helpers', funcBody)(helpers);
            
            // Format result to avoid float errors
            return String(Math.round(result * 1e10) / 1e10);
        } catch (e) {
            console.error("Calculation Error:", e);
            return 'Error';
        }
    }

    const handleInput = (value: string) => {
        if (display === 'Error') {
            setDisplay(value);
            setHistory('');
            setIsResult(false);
            return;
        }

        if (isResult) {
            setIsResult(false);
            if (!'/*-+^%'.includes(value)) {
                setDisplay(value);
                setHistory('');
                return;
            }
        }
        
        // Functions that open a parenthesis
        if (['sin(', 'cos(', 'tan(', 'asin(', 'acos(', 'atan(', 'sinh(', 'cosh(', 'tanh(', 'log(', 'ln(', 'sqrt(', 'fact(', 'abs('].includes(value)) {
             if (display === '0') setDisplay(value);
             else setDisplay(prev => prev + value);
        } else if (display === '0' && value !== '.') {
            setDisplay(value);
        } else {
            setDisplay(prev => prev + value);
        }
    };

    const handleOperator = (op: string) => {
        if (display === 'Error') return;
        setIsResult(false);
        const lastChar = display.slice(-1);
        if ('/*-+.^'.includes(lastChar)) {
            setDisplay(prev => prev.slice(0, -1) + op);
        } else {
            setDisplay(prev => prev + op);
        }
    };

    const calculate = () => {
        if (display === 'Error') return;
        const result = safeEval(display);
        setHistory(display + '=');
        setDisplay(result);
        setIsResult(true);
    };

    const clear = () => {
        setDisplay('0');
        setHistory('');
        setIsResult(false);
    };
    
    const backspace = () => {
        if (display === 'Error' || isResult) {
            clear();
            return;
        }
        setDisplay(prev => prev.length > 1 ? prev.slice(0, -1) : '0');
    }
    
    const handleMemory = (op: 'MC' | 'MR' | 'M+' | 'M-') => {
        const currentVal = parseFloat(display);
        if (isNaN(currentVal)) return;
        
        switch (op) {
            case 'MC': setMemory(0); break;
            case 'MR': setDisplay(String(memory)); setIsResult(true); break;
            case 'M+': setMemory(memory + currentVal); setIsResult(true); break;
            case 'M-': setMemory(memory - currentVal); setIsResult(true); break;
        }
    };

    const btnClassMapBasic = {
        'light-gray': 'bg-[var(--calc-btn-light-gray-bg)] text-[var(--calc-btn-light-gray-text)]',
        'dark-gray': 'bg-[var(--calc-btn-dark-gray-bg)] text-[var(--calc-btn-dark-gray-text)]',
        'orange': 'bg-[var(--calc-btn-orange-bg)] text-[var(--calc-btn-orange-text)]',
    };

    // Use CSS Variables for Scientific mode
    const btnClassMapScientific = {
        'number': 'bg-[var(--calc-sci-btn-num-bg)] text-[var(--calc-sci-btn-num-text)] shadow-lg',
        'operator': 'bg-[var(--calc-sci-btn-op-bg)] text-[var(--calc-sci-btn-op-text)] shadow-lg',
        'action': 'bg-[var(--calc-sci-btn-action-bg)] text-[var(--calc-sci-btn-action-text)] shadow-lg',
        'function': 'bg-[var(--calc-sci-btn-func-bg)] text-[var(--calc-sci-btn-func-text)] shadow-lg',
        'equals': 'bg-[var(--calc-sci-btn-op-bg)] text-[var(--calc-sci-btn-op-text)] shadow-lg'
    };

    const scientificButtons = [
        // Row 1
        { label: '2nd', action: () => setIsInv(!isInv), class: isInv ? 'equals' : 'function' },
        { label: 'deg', action: () => setIsDeg(!isDeg), class: 'function' }, // Toggle display handled in header, this just dummy or visual
        { label: '(', action: () => handleInput('('), class: 'function' },
        { label: ')', action: () => handleInput(')'), class: 'function' },
        { label: 'AC', action: clear, class: 'action' },

        // Row 2
        { label: 'MC', action: () => handleMemory('MC'), class: 'function' },
        { label: 'M+', action: () => handleMemory('M+'), class: 'function' },
        { label: 'M-', action: () => handleMemory('M-'), class: 'function' },
        { label: 'MR', action: () => handleMemory('MR'), class: 'function' },
        { label: 'DEL', action: backspace, class: 'action' },
        
        // Row 3
        { label: isInv ? 'asin' : 'sin', action: () => handleInput(isInv ? 'asin(' : 'sin('), class: 'function' },
        { label: isInv ? 'acos' : 'cos', action: () => handleInput(isInv ? 'acos(' : 'cos('), class: 'function' },
        { label: isInv ? 'atan' : 'tan', action: () => handleInput(isInv ? 'atan(' : 'tan('), class: 'function' },
        { label: isInv ? '10^x' : 'log', action: () => isInv ? handleInput('10^') : handleInput('log('), class: 'function' },
        { label: isInv ? 'e^x' : 'ln', action: () => isInv ? handleInput('E^') : handleInput('ln('), class: 'function' },

        // Row 4
        { label: '^', action: () => handleOperator('^'), class: 'function' },
        { label: 'sqrt', action: () => handleInput('sqrt('), class: 'function' },
        { label: '!', action: () => handleInput('fact('), class: 'function' },
        { label: '1/x', action: () => handleOperator('^(-1)'), class: 'function' }, // Simplified as power -1
        { label: '÷', action: () => handleOperator('/'), class: 'operator' },

        // Row 5
        { label: 'pi', action: () => handleInput('PI'), class: 'function' },
        { label: '7', action: () => handleInput('7'), class: 'number' },
        { label: '8', action: () => handleInput('8'), class: 'number' },
        { label: '9', action: () => handleInput('9'), class: 'number' },
        { label: '×', action: () => handleOperator('*'), class: 'operator' },

        // Row 6
        { label: 'e', action: () => handleInput('E'), class: 'function' },
        { label: '4', action: () => handleInput('4'), class: 'number' },
        { label: '5', action: () => handleInput('5'), class: 'number' },
        { label: '6', action: () => handleInput('6'), class: 'number' },
        { label: '-', action: () => handleOperator('-'), class: 'operator' },

        // Row 7
        { label: 'abs', action: () => handleInput('abs('), class: 'function' },
        { label: '1', action: () => handleInput('1'), class: 'number' },
        { label: '2', action: () => handleInput('2'), class: 'number' },
        { label: '3', action: () => handleInput('3'), class: 'number' },
        { label: '+', action: () => handleOperator('+'), class: 'operator' },

        // Row 8
        { label: 'RND', action: () => handleInput(String(Math.random().toFixed(3))), class: 'function' }, // Random number
        { label: '0', action: () => handleInput('0'), class: 'number' },
        { label: '.', action: () => handleInput('.'), class: 'number' },
        { label: '=', action: calculate, class: 'equals col-span-2' }, // Span 2 cols
    ];
    
    // Basic Mode Configuration
    const basicButtons = [
        { label: 'AC', action: clear, class: 'light-gray' },
        { label: '+/-', action: () => setDisplay(d => String(parseFloat(d) * -1)), class: 'light-gray' },
        { label: '/', action: () => handleOperator('/'), class: 'orange' },
        { label: '%', action: () => handleOperator('%'), class: 'light-gray' },
        { label: '7', action: () => handleInput('7'), class: 'dark-gray' },
        { label: '8', action: () => handleInput('8'), class: 'dark-gray' },
        { label: '9', action: () => handleInput('9'), class: 'dark-gray' },
        { label: '*', action: () => handleOperator('*'), class: 'orange' },
        { label: '4', action: () => handleInput('4'), class: 'dark-gray' },
        { label: '5', action: () => handleInput('5'), class: 'dark-gray' },
        { label: '6', action: () => handleInput('6'), class: 'dark-gray' },
        { label: '-', action: () => handleOperator('-'), class: 'orange' },
        { label: '1', action: () => handleInput('1'), class: 'dark-gray' },
        { label: '2', action: () => handleInput('2'), class: 'dark-gray' },
        { label: '3', action: () => handleInput('3'), class: 'dark-gray' },
        { label: '+', action: () => handleOperator('+'), class: 'orange' },
        { label: '0', action: () => handleInput('0'), class: 'dark-gray zero' },
        { label: '.', action: () => handleInput('.'), class: 'dark-gray' },
        { label: '=', action: calculate, class: 'orange' },
    ];

    if (isScientific) {
        return (
            <div className="w-full h-full flex flex-col font-sans bg-gradient-to-br from-[var(--calc-sci-bg-start)] to-[var(--calc-sci-bg-end)] text-[var(--calc-sci-text)] p-4 rounded-lg select-none transition-colors duration-300">
                <div className="flex justify-between items-center mb-2">
                     {onClose && (
                        <button onClick={onClose} className="p-2 rounded-full hover:bg-[var(--bg-primary-glass)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
                            <ArrowsPointingInIcon className="w-5 h-5" />
                        </button>
                    )}
                    <span className="text-[var(--warning)] font-bold tracking-widest text-sm uppercase">Scientific</span>
                     <button onClick={() => setIsDeg(!isDeg)} className="text-xs font-bold px-3 py-1 rounded bg-[var(--bg-primary-glass)] hover:bg-[var(--bg-secondary-glass)] text-[var(--warning)]">
                        {isDeg ? 'DEG' : 'RAD'}
                    </button>
                </div>
                
                {/* Display Area */}
                <div className="flex-shrink-0 flex flex-col justify-end text-right mb-3 bg-[var(--bg-primary-glass)] rounded-xl p-3 min-h-[100px] backdrop-blur-md">
                     <div className="text-sm text-[var(--text-secondary)] h-6 font-mono mb-1">{history}</div>
                     <div className="text-4xl font-light tracking-wide break-all">{display}</div>
                </div>

                {/* Keypad Grid - Expanded */}
                <div className="flex-grow grid grid-cols-5 gap-2">
                    {scientificButtons.map((btn, idx) => (
                         <button
                            key={idx}
                            onClick={btn.action}
                            className={`flex items-center justify-center text-sm font-medium rounded-lg transition-all active:scale-95 duration-100 ${btnClassMapScientific[btn.class as keyof typeof btnClassMapScientific]} ${btn.class.includes('col-span-2') ? 'col-span-2' : ''}`}
                        >
                            {btn.label}
                        </button>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="w-full h-full bg-[var(--calc-bg)] text-[var(--calc-display-text)] flex flex-col font-sans overflow-hidden relative group">
             {onExpand && (
                <button 
                    onClick={onExpand}
                    className="absolute top-2 left-2 p-1 rounded-full bg-black/10 hover:bg-black/20 text-[var(--calc-display-text)] z-20 opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Expand to Scientific Calculator"
                >
                    <ArrowsPointingOutIcon className="w-4 h-4" />
                </button>
             )}
             
             <div className="flex-shrink-0 flex flex-col justify-end p-2 text-right relative z-10">
                <div className="text-xs text-[var(--calc-history-text)] h-4 truncate text-right mb-0.5">{history}</div>
                <div className="text-3xl font-light truncate">{display}</div>
            </div>
            <div className="flex-grow grid gap-0.5 p-0.5 grid-cols-4">
                {basicButtons.map((btn, idx) => (
                    <button
                        key={idx}
                        onClick={btn.action}
                        className={`text-xs h-full flex items-center justify-center rounded-sm transition-colors focus:outline-none focus:ring-2 focus:ring-inset focus:ring-[var(--accent)] btn-press ${btnClassMapBasic[btn.class as keyof typeof btnClassMapBasic]} ${btn.label === '0' ? 'col-span-2' : ''}`}
                    >
                        {btn.label}
                    </button>
                ))}
            </div>
        </div>
    );
};
