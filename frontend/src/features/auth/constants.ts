export const authAnimationStyles = `
@keyframes twinkle {
  0%, 100% { opacity: 0.3; }
  50% { opacity: 1; }
}
@keyframes drift {
  0% { transform: translateY(0); }
  100% { transform: translateY(4px); }
}
@keyframes codeRain {
  0% { transform: translateY(-100%); opacity: 0; }
  10% { opacity: 1; }
  90% { opacity: 1; }
  100% { transform: translateY(100vh); opacity: 0; }
}
`;

export const stars = Array.from({ length: 60 }, (_, index) => ({
  id: index,
  left: `${(index * 17 + 7) % 100}%`,
  top: `${(index * 23 + 13) % 100}%`,
  size: index % 3 === 0 ? 2 : 1,
  delay: `${(index * 0.3) % 4}s`,
  duration: `${2 + (index % 3)}s`,
}));

const codeChars = ['0', '1', '{', '}', '<', '>', '/', '=', ';', 'fn', 'if', '()'];
export const rainColumns = Array.from({ length: 10 }, (_, index) => ({
  id: index,
  left: `${5 + index * 10}%`,
  char: codeChars[index % codeChars.length],
  delay: `${(index * 0.7) % 5}s`,
  duration: `${4 + (index % 3) * 2}s`,
}));

export const brandFeaturePills = [
  { icon: 'auto_awesome', label: '智能大纲' },
  { icon: 'psychology', label: '知识提炼' },
  { icon: 'summarize', label: '总结归纳' },
  { icon: 'style', label: '闪卡生成' },
];
