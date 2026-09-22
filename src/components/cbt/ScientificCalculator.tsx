'use client';

import { useState, useRef, useEffect } from 'react';
import { X, Move } from 'lucide-react';

/**
 * Draggable scientific calculator overlay.
 * Toggles on/off from a button. Locked inside exam window.
 */
export default function ScientificCalculator({ onClose }: { onClose: () => void }) {
  const [display, setDisplay] = useState('0');
  const [expression, setExpression] = useState('');
  const [memory, setMemory] = useState(0);
  const [isRad, setIsRad] = useState(true);   // radians vs degrees for trig
  const [isInv, setIsInv] = useState(false);  // inverse mode for sin/cos/tan
  const [position, setPosition] = useState({ x: window.innerWidth - 340, y: 80 });
  const [dragging, setDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0, ex: 0, ey: 0 });

  useEffect(() => {
    function onMove(e: MouseEvent) {
      if (!dragging) return;
      const dx = e.clientX - dragStart.current.x;
      const dy = e.clientY - dragStart.current.y;
      setPosition({
        x: Math.max(0, Math.min(window.innerWidth - 320, dragStart.current.ex + dx)),
        y: Math.max(0, Math.min(window.innerHeight - 100, dragStart.current.ey + dy)),
      });
    }
    function onUp() { setDragging(false); }
    if (dragging) {
      window.addEventListener('mousemove', onMove);
      window.addEventListener('mouseup', onUp);
      return () => {
        window.removeEventListener('mousemove', onMove);
        window.removeEventListener('mouseup', onUp);
      };
    }
  }, [dragging]);

  function handleDragStart(e: React.MouseEvent) {
    dragStart.current = { x: e.clientX, y: e.clientY, ex: position.x, ey: position.y };
    setDragging(true);
  }

  function append(v: string) {
    setExpression((prev) => (prev === '0' ? v : prev + v));
    setDisplay((prev) => (prev === '0' ? v : prev + v));
  }

  function clear() {
    setDisplay('0');
    setExpression('');
  }

  function backspace() {
    setExpression((prev) => prev.slice(0, -1));
    setDisplay((prev) => (prev.length > 1 ? prev.slice(0, -1) : '0'));
  }

  function evaluate() {
    try {
      // Sanitize and translate expression to JS
      let expr = expression
        .replace(/π/g, 'Math.PI')
        .replace(/e(?![a-zA-Z])/g, 'Math.E')
        .replace(/×/g, '*')
        .replace(/÷/g, '/')
        .replace(/√\(/g, 'Math.sqrt(')
        .replace(/\^/g, '**');

      // Trig with rad/deg awareness
      const trig = (fn: string, mathFn: string, inv: boolean) => {
        const pattern = new RegExp(`${fn}\\(([^)]+)\\)`, 'g');
        expr = expr.replace(pattern, (_, arg) => {
          if (inv) return `Math.${mathFn}(${arg})${isRad ? '' : ' * 180 / Math.PI'}`;
          return `Math.${mathFn}(${isRad ? arg : `(${arg}) * Math.PI / 180`})`;
        });
      };
      trig('asin', 'asin', true);
      trig('acos', 'acos', true);
      trig('atan', 'atan', true);
      trig('sin', 'sin', false);
      trig('cos', 'cos', false);
      trig('tan', 'tan', false);
      expr = expr.replace(/log\(/g, 'Math.log10(');
      expr = expr.replace(/ln\(/g, 'Math.log(');
      expr = expr.replace(/exp\(/g, 'Math.exp(');
      expr = expr.replace(/abs\(/g, 'Math.abs(');
      expr = expr.replace(/(\d+)!/g, (_, n) => {
        let f = 1;
        for (let i = 2; i <= Number(n); i++) f *= i;
        return f.toString();
      });

      // eslint-disable-next-line no-new-func
      const result = new Function('return ' + expr)();
      const rounded = Math.round(result * 1e10) / 1e10;
      setDisplay(String(rounded));
      setExpression(String(rounded));
    } catch (e) {
      setDisplay('Error');
      setExpression('');
    }
  }

  const btn = 'h-10 rounded-md text-sm font-medium transition-colors select-none';
  const numBtn = `${btn} bg-white hover:bg-gray-100 text-gray-900 border border-gray-200`;
  const opBtn = `${btn} bg-indigo-100 hover:bg-indigo-200 text-indigo-700 border border-indigo-200`;
  const fnBtn = `${btn} bg-purple-100 hover:bg-purple-200 text-purple-700 border border-purple-200 text-xs`;
  const eqBtn = `${btn} bg-indigo-600 hover:bg-indigo-700 text-white`;
  const clrBtn = `${btn} bg-red-100 hover:bg-red-200 text-red-700 border border-red-200`;

  return (
    <div
      style={{ left: position.x, top: position.y }}
      className="fixed z-[100] w-[320px] bg-white rounded-xl shadow-2xl border border-gray-300 overflow-hidden"
    >
      {/* Drag handle */}
      <div
        onMouseDown={handleDragStart}
        className="flex items-center justify-between px-3 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white cursor-move select-none"
      >
        <div className="flex items-center gap-1.5 text-sm font-semibold">
          <Move className="w-3.5 h-3.5" /> Calculator
        </div>
        <button onClick={onClose} className="hover:bg-white/20 rounded p-1">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Display */}
      <div className="bg-gray-900 px-3 py-3 text-right">
        <div className="text-xs text-gray-400 h-4 overflow-hidden">{expression || '\u00a0'}</div>
        <div className="text-2xl font-mono text-white truncate">{display}</div>
      </div>

      {/* Mode toggles */}
      <div className="flex gap-1 p-2 bg-gray-50 border-b border-gray-200 text-xs">
        <button
          onClick={() => setIsRad(!isRad)}
          className={`flex-1 py-1 rounded font-medium ${isRad ? 'bg-indigo-600 text-white' : 'bg-white border border-gray-300 text-gray-700'}`}
        >
          {isRad ? 'RAD' : 'DEG'}
        </button>
        <button
          onClick={() => setIsInv(!isInv)}
          className={`flex-1 py-1 rounded font-medium ${isInv ? 'bg-purple-600 text-white' : 'bg-white border border-gray-300 text-gray-700'}`}
        >
          INV {isInv ? 'ON' : 'OFF'}
        </button>
        <button
          onClick={() => {
            setMemory(Number(display) || 0);
          }}
          className="px-2 py-1 rounded font-medium bg-white border border-gray-300 text-gray-700"
        >
          MS
        </button>
        <button
          onClick={() => append(String(memory))}
          className="px-2 py-1 rounded font-medium bg-white border border-gray-300 text-gray-700"
        >
          MR
        </button>
      </div>

      {/* Buttons */}
      <div className="grid grid-cols-5 gap-1 p-2">
        {/* Row 1 - Functions */}
        <button onClick={() => append(isInv ? 'asin(' : 'sin(')} className={fnBtn}>{isInv ? 'sin⁻¹' : 'sin'}</button>
        <button onClick={() => append(isInv ? 'acos(' : 'cos(')} className={fnBtn}>{isInv ? 'cos⁻¹' : 'cos'}</button>
        <button onClick={() => append(isInv ? 'atan(' : 'tan(')} className={fnBtn}>{isInv ? 'tan⁻¹' : 'tan'}</button>
        <button onClick={() => append('π')} className={fnBtn}>π</button>
        <button onClick={() => append('e')} className={fnBtn}>e</button>

        {/* Row 2 - More Functions */}
        <button onClick={() => append('log(')} className={fnBtn}>log</button>
        <button onClick={() => append('ln(')} className={fnBtn}>ln</button>
        <button onClick={() => append('√(')} className={fnBtn}>√</button>
        <button onClick={() => append('^')} className={fnBtn}>x^y</button>
        <button onClick={() => append('!')} className={fnBtn}>n!</button>

        {/* Row 3 - Brackets + basic ops */}
        <button onClick={() => append('(')} className={opBtn}>(</button>
        <button onClick={() => append(')')} className={opBtn}>)</button>
        <button onClick={clear} className={clrBtn}>AC</button>
        <button onClick={backspace} className={clrBtn}>DEL</button>
        <button onClick={() => append('÷')} className={opBtn}>÷</button>

        {/* Row 4 */}
        <button onClick={() => append('7')} className={numBtn}>7</button>
        <button onClick={() => append('8')} className={numBtn}>8</button>
        <button onClick={() => append('9')} className={numBtn}>9</button>
        <button onClick={() => append('×')} className={opBtn}>×</button>
        <button onClick={() => append('%')} className={opBtn}>%</button>

        {/* Row 5 */}
        <button onClick={() => append('4')} className={numBtn}>4</button>
        <button onClick={() => append('5')} className={numBtn}>5</button>
        <button onClick={() => append('6')} className={numBtn}>6</button>
        <button onClick={() => append('-')} className={opBtn}>−</button>
        <button onClick={() => append('abs(')} className={fnBtn}>|x|</button>

        {/* Row 6 */}
        <button onClick={() => append('1')} className={numBtn}>1</button>
        <button onClick={() => append('2')} className={numBtn}>2</button>
        <button onClick={() => append('3')} className={numBtn}>3</button>
        <button onClick={() => append('+')} className={opBtn}>+</button>
        <button onClick={() => append('exp(')} className={fnBtn}>eˣ</button>

        {/* Row 7 */}
        <button onClick={() => append('0')} className={`${numBtn} col-span-2`}>0</button>
        <button onClick={() => append('.')} className={numBtn}>.</button>
        <button onClick={evaluate} className={`${eqBtn} col-span-2`}>=</button>
      </div>
    </div>
  );
}
