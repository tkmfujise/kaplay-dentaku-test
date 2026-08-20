import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Delete, Divide, Equal, Info, Minus, Plus, RotateCcw, X } from 'lucide-react';
import { ErrorBoundary } from '@/components/error-boundary';
import { KaplayStage } from '@/components/KaplayStage';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import { Route, Switch, useLocation, Router as WouterRouter } from 'wouter';

const queryClient = new QueryClient();

type Operator = '+' | '−' | '×' | '÷';

const operatorValues: Record<Operator, (a: number, b: number) => number> = {
  '+': (a, b) => a + b,
  '−': (a, b) => a - b,
  '×': (a, b) => a * b,
  '÷': (a, b) => a / b,
};

const operatorKeys: Record<Operator, string> = {
  '+': '+',
  '−': '-',
  '×': '*',
  '÷': '/',
};

function formatNumber(value: number) {
  if (!Number.isFinite(value)) return 'ERROR';
  const rounded = Number.parseFloat(value.toPrecision(12));
  return String(rounded);
}

function Calculator() {
  const [display, setDisplay] = useState('0');
  const [storedValue, setStoredValue] = useState<number | null>(null);
  const [operator, setOperator] = useState<Operator | null>(null);
  const [waitingForOperand, setWaitingForOperand] = useState(false);
  const [expression, setExpression] = useState('');
  const [error, setError] = useState('');
  const [pressedKey, setPressedKey] = useState('');

  const clear = useCallback(() => {
    setDisplay('0');
    setStoredValue(null);
    setOperator(null);
    setWaitingForOperand(false);
    setExpression('');
    setError('');
  }, []);

  const inputDigit = useCallback((digit: string) => {
    setError('');
    setDisplay((current) => {
      if (waitingForOperand) return digit;
      if (current === '0') return digit;
      if (current.length >= 14) return current;
      return current + digit;
    });
    setWaitingForOperand(false);
  }, [waitingForOperand]);

  const inputDecimal = useCallback(() => {
    setError('');
    setDisplay((current) => {
      if (waitingForOperand) return '0.';
      return current.includes('.') ? current : `${current}.`;
    });
    setWaitingForOperand(false);
  }, [waitingForOperand]);

  const calculate = useCallback((left: number, right: number, active: Operator) => {
    if (active === '÷' && right === 0) return null;
    return operatorValues[active](left, right);
  }, []);

  const chooseOperator = useCallback((nextOperator: Operator) => {
    setError('');
    const inputValue = Number(display);
    if (storedValue === null) {
      setStoredValue(inputValue);
    } else if (operator && !waitingForOperand) {
      const result = calculate(storedValue, inputValue, operator);
      if (result === null) {
        setError('Cannot divide by zero');
        setDisplay('ERROR');
        return;
      }
      const formatted = formatNumber(result);
      setDisplay(formatted);
      setStoredValue(result);
    }
    setOperator(nextOperator);
    setExpression(`${formatNumber(inputValue)} ${nextOperator}`);
    setWaitingForOperand(true);
  }, [calculate, display, operator, storedValue, waitingForOperand]);

  const evaluate = useCallback(() => {
    if (storedValue === null || !operator) return;
    const inputValue = Number(display);
    const result = calculate(storedValue, inputValue, operator);
    if (result === null) {
      setError('Cannot divide by zero');
      setDisplay('ERROR');
      setStoredValue(null);
      setOperator(null);
      setWaitingForOperand(true);
      return;
    }
    setExpression(`${formatNumber(storedValue)} ${operator} ${formatNumber(inputValue)}`);
    setDisplay(formatNumber(result));
    setStoredValue(null);
    setOperator(null);
    setWaitingForOperand(true);
  }, [calculate, display, operator, storedValue]);

  const toggleSign = useCallback(() => {
    if (display === '0' || display === 'ERROR') return;
    setDisplay((current) => current.startsWith('-') ? current.slice(1) : `-${current}`);
  }, [display]);

  const deleteDigit = useCallback(() => {
    setError('');
    setDisplay((current) => {
      if (current === 'ERROR' || current.length <= 1 || (current.length === 2 && current.startsWith('-'))) return '0';
      return current.slice(0, -1);
    });
  }, []);

  const handleButton = useCallback((value: string) => {
    if (/^\d$/.test(value)) inputDigit(value);
    else if (value === '.') inputDecimal();
    else if (value === 'C') clear();
    else if (value === 'DEL') deleteDigit();
    else if (value === '+/−') toggleSign();
    else if (value === '=') evaluate();
    else chooseOperator(value as Operator);
  }, [chooseOperator, clear, deleteDigit, evaluate, inputDecimal, inputDigit, toggleSign]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const key = event.key;
      const map: Record<string, string> = { Enter: '=', '=': '=', Escape: 'C', Backspace: 'DEL', Delete: 'C', '.': '.' };
      const value = /^\d$/.test(key) ? key : map[key] ?? ({ '+': '+', '-': '−', '*': '×', '/': '÷' }[key] ?? '');
      if (!value) return;
      event.preventDefault();
      setPressedKey(value);
      handleButton(value);
      window.setTimeout(() => setPressedKey(''), 110);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [handleButton]);

  const buttons = [
    { label: 'C', value: 'C', className: 'utility', icon: <RotateCcw size={18} strokeWidth={2.4} /> },
    { label: '+/−', value: '+/−', className: 'utility' },
    { label: 'DEL', value: 'DEL', className: 'utility', icon: <Delete size={17} strokeWidth={2.4} /> },
    { label: '÷', value: '÷', className: 'operator', icon: <Divide size={20} /> },
    { label: '7', value: '7', className: '' },
    { label: '8', value: '8', className: '' },
    { label: '9', value: '9', className: '' },
    { label: '×', value: '×', className: 'operator', icon: <X size={19} /> },
    { label: '4', value: '4', className: '' },
    { label: '5', value: '5', className: '' },
    { label: '6', value: '6', className: '' },
    { label: '−', value: '−', className: 'operator', icon: <Minus size={20} /> },
    { label: '1', value: '1', className: '' },
    { label: '2', value: '2', className: '' },
    { label: '3', value: '3', className: '' },
    { label: '+', value: '+', className: 'operator', icon: <Plus size={20} /> },
    { label: '0', value: '0', className: 'wide' },
    { label: '.', value: '.', className: '' },
    { label: '=', value: '=', className: 'equals', icon: <Equal size={20} /> },
  ];

  return (
    <main className="calculator-app">
      <div className="app-shell">
        <header className="topbar">
          <div className="flex items-center gap-4">
            <div className="brand-mark" aria-hidden="true">K·</div>
            <div>
              <p className="eyebrow">a tiny math toy</p>
              <p className="brand-name">Kaplay calculator</p>
            </div>
          </div>
          <div className="keyboard-note">
            <span className="key-cap">keys</span>
            type to play
          </div>
        </header>

        <div className="hero-layout">
          <section className="intro" aria-labelledby="calculator-title">
            <p className="eyebrow">four moves · no fuss</p>
            <h1 id="calculator-title">Make numbers<br /><em>behave.</em></h1>
            <p className="intro-copy">
              A friendly little stage for everyday arithmetic. Tap a key, watch the answer land, and keep going.
            </p>
            <div className="stage-note">
              <KaplayStage />
              <span>Powered by a playful canvas<br />and very serious math.</span>
            </div>
          </section>

          <section className="calculator-wrap" aria-label="Calculator">
            <div className="calculator-card">
              <div className="display-panel" aria-live="polite">
                <div className="display-expression" data-testid="text-expression">
                  {error ? <span>{error}</span> : expression || <><span className="ready-dot" /> ready when you are</>}
                </div>
                <div className={`display-value ${error ? 'error' : ''}`} data-testid="text-result">{display}</div>
              </div>
              <div className="calculator-grid">
                {buttons.map((button) => (
                  <button
                    key={button.value}
                    type="button"
                    className={`calc-button ${button.className} ${pressedKey === button.value ? 'pressed' : ''}`}
                    data-testid={`button-${button.value.replace(/[^a-zA-Z0-9]/g, 'operator')}`}
                    aria-label={button.label}
                    onClick={() => {
                      setPressedKey(button.value);
                      handleButton(button.value);
                      window.setTimeout(() => setPressedKey(''), 110);
                    }}
                  >
                    {button.icon ?? button.label}
                    {['+', '−', '×', '÷', '='].includes(button.value) && <span className="button-key">{operatorKeys[button.value as Operator] ?? '↵'}</span>}
                  </button>
                ))}
              </div>
            </div>
            <div className="hint-panel">
              <div className="hint-icon"><Info size={15} /></div>
              <p><strong>Quick tip:</strong> use the keyboard for shortcuts. Backspace removes one digit; Escape resets the board.</p>
            </div>
          </section>
        </div>

        <footer className="footer-strip">
          <span>clear thinking / clean answers</span>
          <span>canvas 01 — arithmetic</span>
        </footer>
      </div>
    </main>
  );
}

function Router() {
  return (
    // Keep a shared shell (sidebar, navbar) outside the boundary so it
    // survives a page crash.
    <RoutedErrorBoundary>
      <Switch>
        <Route path="/" component={Calculator} />
        <Route component={NotFound} />
      </Switch>
    </RoutedErrorBoundary>
  );
}

function RoutedErrorBoundary({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}>{children}</ErrorBoundary>;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
