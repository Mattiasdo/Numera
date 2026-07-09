import NumericText from './NumericText';
import { NUMERIC_TEXT_PRESETS } from './motion';

const Numorph = NumericText;
const NUMORPH_PRESETS = NUMERIC_TEXT_PRESETS;

export { Numorph, NUMORPH_PRESETS };
export default Numorph;
export { useCanAnimate } from './useCanAnimate';
export type {
  NumericTextProps,
  NumericTextProps as NumorphProps,
} from './NumericText';
export type {
  NumericTextMotionPreset as NumorphMotionPreset,
  NumericTextPreset as NumorphPreset,
  NumericTextSpring as NumorphSpring,
  NumericTextTiming as NumorphTiming,
  NumericTextVisualTiming as NumorphVisualTiming,
} from './motion';
export type {
  NumericTextTrend as NumorphTrend,
  NumericTextValue as NumorphValue,
} from './formatNumericText';
export type { UseCanAnimateOptions } from './useCanAnimate';
