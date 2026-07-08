import NumericText from './NumericText';
import { NUMERIC_TEXT_PRESETS } from './motion';

const Numera = NumericText;
const NUMERA_PRESETS = NUMERIC_TEXT_PRESETS;

export { Numera, NumericText, NUMERA_PRESETS, NUMERIC_TEXT_PRESETS };
export default Numera;
export { useCanAnimate } from './useCanAnimate';
export type { NumericTextProps, NumericTextProps as NumeraProps } from './NumericText';
export type {
  NumericTextMotionPreset,
  NumericTextMotionPreset as NumeraMotionPreset,
  NumericTextPreset,
  NumericTextPreset as NumeraPreset,
  NumericTextSpring,
  NumericTextSpring as NumeraSpring,
  NumericTextTiming,
  NumericTextTiming as NumeraTiming,
  NumericTextVisualTiming,
  NumericTextVisualTiming as NumeraVisualTiming,
} from './motion';
export type {
  NumericTextTrend,
  NumericTextTrend as NumeraTrend,
  NumericTextValue,
  NumericTextValue as NumeraValue,
} from './formatNumericText';
export type { UseCanAnimateOptions } from './useCanAnimate';
