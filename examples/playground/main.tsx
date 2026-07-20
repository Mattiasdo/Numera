import React, { useLayoutEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import NumberFlow, { NumberFlowGroup } from '@number-flow/react';
import type { Format as NumberFlowFormat } from '@number-flow/react';
import '@fontsource-variable/google-sans-flex/full.css';
import Numorph from '../../src';
import '../../src/NumericText.css';
import './styles.css';

const OTP_LENGTH = 6;
const partModes = ['currency', 'positive', 'negative', 'plain'] as const;
const NUMBER_FLOW_SLOW_MOTION_PROPS = {
  transformTiming: { duration: 2600, easing: 'cubic-bezier(0.2, 0, 0, 1)' },
  spinTiming: { duration: 2600, easing: 'cubic-bezier(0.2, 0, 0, 1)' },
  opacityTiming: { duration: 1800, easing: 'cubic-bezier(0.2, 0, 0, 1)' },
};
const NO_SLOW_MOTION_PROPS = {};
const NUMORPH_SLOW_MOTION_PROPS = { duration: 3600, stagger: 140 };

type PartMode = (typeof partModes)[number];

interface FontSettings {
  weight: number;
  width: number;
  roundness: number;
  grade: number;
  opticalSize: number;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function FontSlider({
  label,
  value,
  min,
  max,
  step = 1,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (value: number) => void;
}) {
  return (
    <label className="font-slider">
      <span className="slider-label">
        {label}
        <strong>{value}</strong>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </label>
  );
}

function getSlotAnimationKey(digit: string, isFilled: boolean) {
  return `${isFilled ? 'filled' : 'empty'}:${digit}`;
}

function PlaygroundOTPInput({
  value,
  onChange,
  hasError,
  animate,
  slowMotion,
}: {
  value: string;
  onChange: (value: string) => void;
  hasError: boolean;
  animate: boolean;
  slowMotion: boolean;
}) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const boxRefs = useRef<Array<HTMLDivElement | null>>([]);
  const [activeRing, setActiveRing] = useState({ left: 0, width: 40, height: 59 });
  const digits = Array.from({ length: OTP_LENGTH }, (_, index) => value[index] || '');
  const currentSlots = digits.map((digit) => {
    const isFilled = digit.length > 0;
    const displayDigit = isFilled ? digit : '0';

    return {
      digit: displayDigit,
      value: Number(displayDigit),
      isFilled,
      animationKey: getSlotAnimationKey(displayDigit, isFilled),
    };
  });
  const activeIndex = Math.min(value.length, OTP_LENGTH - 1);
  const slowMotionProps = slowMotion ? NUMORPH_SLOW_MOTION_PROPS : NO_SLOW_MOTION_PROPS;

  const normalizeCode = (nextValue: string) => nextValue.replace(/\D/g, '').slice(0, OTP_LENGTH);
  const focusInput = () => inputRef.current?.focus();

  useLayoutEffect(() => {
    const activeBox = boxRefs.current[activeIndex];
    if (!activeBox) return undefined;

    const updateActiveRing = () => {
      setActiveRing({
        left: activeBox.offsetLeft,
        width: activeBox.offsetWidth,
        height: activeBox.offsetHeight,
      });
    };

    updateActiveRing();

    if (typeof ResizeObserver === 'undefined') return undefined;

    const resizeObserver = new ResizeObserver(updateActiveRing);
    resizeObserver.observe(activeBox);
    return () => resizeObserver.disconnect();
  }, [activeIndex]);

  return (
    <div className="otp-input" role="group" aria-label="Classroom code" onClick={focusInput}>
      <input
        ref={inputRef}
        type="text"
        inputMode="numeric"
        autoComplete="one-time-code"
        value={value}
        onChange={(event) => onChange(normalizeCode(event.target.value))}
        aria-label="Classroom code"
        className="otp-hidden-input"
      />
      <div className="otp-slots" aria-hidden="true">
        <div
          className="otp-active-ring"
          style={{
            transform: `translate3d(${activeRing.left}px, 0, 0)`,
            width: activeRing.width,
            height: activeRing.height,
          }}
        />
        {currentSlots.map((slot, index) => {
          return (
            <div
              key={index}
              ref={(node) => {
                boxRefs.current[index] = node;
              }}
              className="otp-slot"
              data-filled={slot.isFilled ? 'true' : undefined}
              data-error={hasError ? 'true' : undefined}
            >
              <Numorph
                {...slowMotionProps}
                value={slot.value}
                animate={animate}
                trend={slot.isFilled ? 'up' : 'down'}
                animationKey={slot.animationKey}
                layoutCorrection={false}
                className="otp-slot-digit"
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

function App() {
  const [score, setScore] = useState(1284);
  const [gems, setGems] = useState(4217);
  const [percent, setPercent] = useState(0.684);
  const [temperature, setTemperature] = useState(-8.4);
  const [partValue, setPartValue] = useState(998);
  const [partMode, setPartMode] = useState<PartMode>('currency');
  const [flowScore, setFlowScore] = useState(1284);
  const [flowGems, setFlowGems] = useState(4217);
  const [flowPercent, setFlowPercent] = useState(0.684);
  const [flowTemperature, setFlowTemperature] = useState(-8.4);
  const [flowPartValue, setFlowPartValue] = useState(998);
  const [flowPartMode, setFlowPartMode] = useState<PartMode>('currency');
  const [classCode, setClassCode] = useState('');
  const [classCodeError, setClassCodeError] = useState(false);
  const [animate, setAnimate] = useState(true);
  const [slowMotion, setSlowMotion] = useState(false);
  const [fontSettings, setFontSettings] = useState<FontSettings>({
    weight: 600,
    width: 100,
    roundness: 100,
    grade: 0,
    opticalSize: 44,
  });

  const updateFontSetting = (key: keyof FontSettings, value: number) => {
    setFontSettings((current) => ({
      ...current,
      [key]: value,
    }));
  };
  const cyclePartMode = () => {
    setPartMode((currentMode) => {
      const currentIndex = partModes.indexOf(currentMode);
      return partModes[(currentIndex + 1) % partModes.length];
    });
  };
  const cycleFlowPartMode = () => {
    setFlowPartMode((currentMode) => {
      const currentIndex = partModes.indexOf(currentMode);
      return partModes[(currentIndex + 1) % partModes.length];
    });
  };
  const partDisplayValue = partMode === 'negative' ? -partValue : partValue;
  const partFormat: NumberFlowFormat | undefined =
    partMode === 'currency'
      ? { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }
      : partMode === 'positive' || partMode === 'negative'
        ? { signDisplay: 'always', maximumFractionDigits: 0 }
        : { maximumFractionDigits: 0 };
  const partSuffix = partMode === 'plain' ? ' pts' : undefined;
  const flowPartDisplayValue = flowPartMode === 'negative' ? -flowPartValue : flowPartValue;
  const flowPartFormat: NumberFlowFormat | undefined =
    flowPartMode === 'currency'
      ? { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }
      : flowPartMode === 'positive' || flowPartMode === 'negative'
        ? { signDisplay: 'always', maximumFractionDigits: 0 }
        : { maximumFractionDigits: 0 };
  const flowPartSuffix = flowPartMode === 'plain' ? ' pts' : undefined;
  const numorphSlowMotionProps = slowMotion
    ? NUMORPH_SLOW_MOTION_PROPS
    : NO_SLOW_MOTION_PROPS;
  const numberFlowSlowMotionProps = slowMotion
    ? NUMBER_FLOW_SLOW_MOTION_PROPS
    : NO_SLOW_MOTION_PROPS;
  const fontStyle = {
    '--demo-font-weight': fontSettings.weight,
    '--demo-font-width': `${fontSettings.width}%`,
    '--demo-font-grade': fontSettings.grade,
    '--demo-font-roundness': fontSettings.roundness,
    '--demo-font-optical-size': fontSettings.opticalSize,
  } as React.CSSProperties;

  return (
    <main className="page-shell" style={fontStyle}>
      <header className="topbar">
        <div className="headline">
          <span className="badge">Numorph</span>
          <h1>Playground</h1>
          <p>Test animated number formatting, motion controls, and Google Sans Flex settings.</p>
        </div>
        <div className="toolbar" aria-label="Playground settings">
          <label className="toggle">
            <input
              type="checkbox"
              checked={animate}
              onChange={(event) => setAnimate(event.target.checked)}
            />
            <span>Animate</span>
          </label>
          <label className="toggle">
            <input
              type="checkbox"
              checked={slowMotion}
              onChange={(event) => setSlowMotion(event.target.checked)}
            />
            <span>Slow motion</span>
          </label>
        </div>
      </header>

      <section className="panel font-lab" aria-label="Google Sans Flex controls">
        <div>
          <span className="section-label">Google Sans Flex</span>
          <p className="font-sample">123,456.78</p>
        </div>
        <div className="font-controls">
          <FontSlider
            label="Weight"
            min={100}
            max={900}
            value={fontSettings.weight}
            onChange={(value) => updateFontSetting('weight', value)}
          />
          <FontSlider
            label="Width"
            min={75}
            max={125}
            value={fontSettings.width}
            onChange={(value) => updateFontSetting('width', value)}
          />
          <FontSlider
            label="Round"
            min={0}
            max={100}
            value={fontSettings.roundness}
            onChange={(value) => updateFontSetting('roundness', value)}
          />
          <FontSlider
            label="Grade"
            min={-100}
            max={100}
            value={fontSettings.grade}
            onChange={(value) => updateFontSetting('grade', value)}
          />
          <FontSlider
            label="Optical"
            min={6}
            max={144}
            value={fontSettings.opticalSize}
            onChange={(value) => updateFontSetting('opticalSize', value)}
          />
        </div>
      </section>

      <section className="panel controls" aria-label="Numorph controls">
        <div className="control-title">
          <span className="section-label">Numorph Values</span>
          <p>Click a control to trigger new animated states.</p>
        </div>
        <div className="button-row">
        <button type="button" className="button button-secondary" onClick={() => setScore((value) => value + 1)}>
          Score +1
        </button>
        <button type="button" className="button button-secondary" onClick={() => setScore((value) => value + 25)}>
          Score +25
        </button>
        <button type="button" className="button button-secondary" onClick={() => setScore((value) => Math.max(0, value - 13))}>
          Score -13
        </button>
        <button type="button" className="button button-secondary" onClick={() => setGems((value) => value + 250)}>
          Gems +250
        </button>
        <button type="button" className="button button-secondary" onClick={() => setPercent((value) => clamp(value + 0.037, 0, 1))}>
          Percent +
        </button>
        <button type="button" className="button button-secondary" onClick={() => setTemperature((value) => Number((value + 2.7).toFixed(1)))}>
          Temp +
        </button>
        <button type="button" className="button button-secondary" onClick={() => setPartValue((value) => (value < 1000 ? 1002 : 998))}>
          Comma toggle
        </button>
        <button type="button" className="button button-secondary" onClick={cyclePartMode}>
          Part swap
        </button>
        <button
          type="button"
          className="button button-primary"
          onClick={() => {
            setScore(Math.floor(Math.random() * 99999));
            setGems(Math.floor(Math.random() * 250000));
            setPercent(Number(Math.random().toFixed(3)));
            setTemperature(Number((Math.random() * 80 - 30).toFixed(1)));
            setPartValue(Math.random() > 0.5 ? 998 : 1002);
            setPartMode(partModes[Math.floor(Math.random() * partModes.length)]);
          }}
        >
          Randomize
        </button>
        </div>
      </section>

      <section className="example-grid" aria-label="Numorph examples">
        <article className="card example example-large">
          <span className="section-label">Score</span>
          <Numorph {...numorphSlowMotionProps} value={score} locales="en-US" animate={animate} />
        </article>

        <article className="card example">
          <span className="section-label">Currency</span>
          <Numorph
            {...numorphSlowMotionProps}
            value={gems}
            locales="en-US"
            format={{ style: 'currency', currency: 'USD', maximumFractionDigits: 0 }}
            animate={animate}
          />
        </article>

        <article className="card example">
          <span className="section-label">Compact</span>
          <Numorph
            {...numorphSlowMotionProps}
            value={gems * 42}
            locales="en-US"
            format={{ notation: 'compact', maximumFractionDigits: 1 }}
            suffix=" views"
            animate={animate}
          />
        </article>

        <article className="card example">
          <span className="section-label">Percent</span>
          <Numorph
            {...numorphSlowMotionProps}
            value={percent}
            locales="en-US"
            format={{ style: 'percent', maximumFractionDigits: 1 }}
            animate={animate}
          />
        </article>

        <article className="card example">
          <span className="section-label">Signed Decimal</span>
          <Numorph
            {...numorphSlowMotionProps}
            value={temperature}
            locales="en-US"
            format={{ signDisplay: 'exceptZero', minimumFractionDigits: 1, maximumFractionDigits: 1 }}
            suffix=" deg"
            animate={animate}
          />
        </article>

        <article className="card example">
          <span className="section-label">Level Prefix</span>
          <Numorph {...numorphSlowMotionProps} value={Math.floor(score / 250) + 1} prefix="Level " animate={animate} />
        </article>

        <article className="card example parts-example">
          <div>
            <span className="section-label">Animated Parts</span>
          </div>
          <Numorph
            {...numorphSlowMotionProps}
            value={partDisplayValue}
            locales="en-US"
            format={partFormat}
            suffix={partSuffix}
            animate={animate}
            animationKey={`${partMode}:${partValue}`}
          />
          <div className="card-actions">
            <button type="button" className="button button-secondary" onClick={() => setPartValue((value) => (value < 1000 ? 1002 : 998))}>
              Comma
            </button>
            <button type="button" className="button button-secondary" onClick={cyclePartMode}>
              Swap
            </button>
          </div>
        </article>

        <article className="card example otp-example">
          <div>
            <span className="section-label">Classroom Code</span>
            <p className="example-copy">Enter your teacher&apos;s unique 6-digit code.</p>
          </div>
          <PlaygroundOTPInput
            value={classCode}
            onChange={(nextCode) => {
              setClassCode(nextCode);
              setClassCodeError(false);
            }}
            hasError={classCodeError}
            animate={animate}
            slowMotion={slowMotion}
          />
          <div className="otp-actions">
            <button
              type="button"
              className="button button-secondary"
              onClick={() => {
                setClassCode('184739');
                setClassCodeError(false);
              }}
            >
              Fill sample
            </button>
            <button
              type="button"
              className="button button-secondary"
              onClick={() => {
                setClassCode('');
                setClassCodeError(false);
              }}
            >
              Clear
            </button>
            <button
              type="button"
              className="button button-secondary"
              onClick={() => setClassCodeError((hasError) => !hasError)}
            >
              Error
            </button>
          </div>
          {classCodeError && (
            <p className="otp-error">Incorrect code. Try again.</p>
          )}
        </article>
      </section>

      <section className="comparison-section" aria-label="NumberFlow comparison examples">
        <div className="comparison-heading">
          <span className="badge">NumberFlow</span>
        </div>
        <section className="panel controls" aria-label="NumberFlow controls">
          <div className="control-title">
            <span className="section-label">NumberFlow Values</span>
            <p>Click a control to trigger new animated states.</p>
          </div>
          <div className="button-row">
          <button type="button" className="button button-secondary" onClick={() => setFlowScore((value) => value + 1)}>
            Score +1
          </button>
          <button type="button" className="button button-secondary" onClick={() => setFlowScore((value) => value + 25)}>
            Score +25
          </button>
          <button type="button" className="button button-secondary" onClick={() => setFlowScore((value) => Math.max(0, value - 13))}>
            Score -13
          </button>
          <button type="button" className="button button-secondary" onClick={() => setFlowGems((value) => value + 250)}>
            Gems +250
          </button>
          <button type="button" className="button button-secondary" onClick={() => setFlowPercent((value) => clamp(value + 0.037, 0, 1))}>
            Percent +
          </button>
          <button type="button" className="button button-secondary" onClick={() => setFlowTemperature((value) => Number((value + 2.7).toFixed(1)))}>
            Temp +
          </button>
          <button type="button" className="button button-secondary" onClick={() => setFlowPartValue((value) => (value < 1000 ? 1002 : 998))}>
            Comma toggle
          </button>
          <button type="button" className="button button-secondary" onClick={cycleFlowPartMode}>
            Part swap
          </button>
          <button
            type="button"
            className="button button-primary"
            onClick={() => {
              setFlowScore(Math.floor(Math.random() * 99999));
              setFlowGems(Math.floor(Math.random() * 250000));
              setFlowPercent(Number(Math.random().toFixed(3)));
              setFlowTemperature(Number((Math.random() * 80 - 30).toFixed(1)));
              setFlowPartValue(Math.random() > 0.5 ? 998 : 1002);
              setFlowPartMode(partModes[Math.floor(Math.random() * partModes.length)]);
            }}
          >
            Randomize
          </button>
          </div>
        </section>
        <NumberFlowGroup>
          <section className="example-grid" aria-label="NumberFlow examples">
            <article className="card example example-large number-flow-example">
              <span className="section-label">Score</span>
              <NumberFlow {...numberFlowSlowMotionProps} value={flowScore} locales="en-US" animated={animate} />
            </article>

            <article className="card example number-flow-example">
              <span className="section-label">Currency</span>
              <NumberFlow
                {...numberFlowSlowMotionProps}
                value={flowGems}
                locales="en-US"
                format={{ style: 'currency', currency: 'USD', maximumFractionDigits: 0 }}
                animated={animate}
              />
            </article>

            <article className="card example number-flow-example">
              <span className="section-label">Compact</span>
              <NumberFlow
                {...numberFlowSlowMotionProps}
                value={flowGems * 42}
                locales="en-US"
                format={{ notation: 'compact', maximumFractionDigits: 1 }}
                suffix=" views"
                animated={animate}
              />
            </article>

            <article className="card example number-flow-example">
              <span className="section-label">Percent</span>
              <NumberFlow
                {...numberFlowSlowMotionProps}
                value={flowPercent}
                locales="en-US"
                format={{ style: 'percent', maximumFractionDigits: 1 }}
                animated={animate}
              />
            </article>

            <article className="card example number-flow-example">
              <span className="section-label">Signed Decimal</span>
              <NumberFlow
                {...numberFlowSlowMotionProps}
                value={flowTemperature}
                locales="en-US"
                format={{ signDisplay: 'exceptZero', minimumFractionDigits: 1, maximumFractionDigits: 1 }}
                suffix=" deg"
                animated={animate}
              />
            </article>

            <article className="card example number-flow-example">
              <span className="section-label">Level Prefix</span>
              <NumberFlow {...numberFlowSlowMotionProps} value={Math.floor(flowScore / 250) + 1} prefix="Level " animated={animate} />
            </article>

            <article className="card example parts-example number-flow-example">
              <div>
                <span className="section-label">Animated Parts</span>
              </div>
              <NumberFlow
                {...numberFlowSlowMotionProps}
                value={flowPartDisplayValue}
                locales="en-US"
                format={flowPartFormat}
                suffix={flowPartSuffix}
                animated={animate}
              />
              <div className="card-actions">
                <button type="button" className="button button-secondary" onClick={() => setFlowPartValue((value) => (value < 1000 ? 1002 : 998))}>
                  Comma
                </button>
                <button type="button" className="button button-secondary" onClick={cycleFlowPartMode}>
                  Swap
                </button>
              </div>
            </article>
          </section>
        </NumberFlowGroup>
      </section>
    </main>
  );
}

async function renderPlayground() {
  try {
    await document.fonts.load('600 44px "Google Sans Flex Variable"', '0123456789,.$%+-');
  } catch {
    // The system fallback remains usable if the demo font cannot load.
  }

  createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}

void renderPlayground();
