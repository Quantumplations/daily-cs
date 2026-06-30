import { loadFont as loadInter } from '@remotion/google-fonts/Inter';
import { loadFont as loadNotoSansSC } from '@remotion/google-fonts/NotoSansSC';

const inter = loadInter();
const noto = loadNotoSansSC();

export function fontFamily(language: 'en' | 'zh'): string {
  return language === 'zh' ? noto.fontFamily : inter.fontFamily;
}
