import NumericText from './NumericText';
import { NUMERIC_TEXT_PRESETS } from './motion';

const Numorph = NumericText;
const Numera = NumericText;
const NUMORPH_PRESETS = NUMERIC_TEXT_PRESETS;
const NUMERA_PRESETS = NUMERIC_TEXT_PRESETS;

export { Numorph, Numera, NumericText, NUMORPH_PRESETS, NUMERA_PRESETS, NUMERIC_TEXT_PRESETS };
export default Numorph;
export { useCanAnimate } from './useCanAnimate';
export type {
  NumericTextProps,
  NumericTextProps as NumeraProps,
  NumericTextProps as NumorphProps,
} from './NumericText';
export type {
  NumericTextMotionPreset,
  NumericTextMotionPreset as NumeraMotionPreset,
  NumericTextMotionPreset as NumorphMotionPreset,
  NumericTextPreset,
  NumericTextPreset as NumeraPreset,
  NumericTextPreset as NumorphPreset,
  NumericTextSpring,
  NumericTextSpring as NumeraSpring,
  NumericTextSpring as NumorphSpring,
  NumericTextTiming,
  NumericTextTiming as NumeraTiming,
  NumericTextTiming as NumorphTiming,
  NumericTextVisualTiming,
  NumericTextVisualTiming as NumeraVisualTiming,
  NumericTextVisualTiming as NumorphVisualTiming,
} from './motion';
export type {
  NumericTextTrend,
  NumericTextTrend as NumeraTrend,
  NumericTextTrend as NumorphTrend,
  NumericTextValue,
  NumericTextValue as NumeraValue,
  NumericTextValue as NumorphValue,
} from './formatNumericText';
export type { UseCanAnimateOptions } from './useCanAnimate';
