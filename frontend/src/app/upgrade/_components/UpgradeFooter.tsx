import { HeadphonesIcon, Mail, Github, BookOpen } from 'lucide-react';

export default function UpgradeFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="mt-24 w-full border-t border-[#e2e2d5] bg-white/40">
      {/* Contact CTA */}
      <div className="max-w-5xl mx-auto pt-12 pb-8 px-6">
        <div className="text-center mb-10">
          <p className="text-[#4a5568] text-xs mb-4 font-mono uppercase tracking-widest">
            如有定制需求或批量采购疑问
          </p>
          <button className="text-[#2c5282] hover:text-[#1a202c] transition-colors flex items-center gap-2 text-sm font-bold border-b border-[#2c5282] pb-1 font-serif mx-auto">
            <HeadphonesIcon className="w-[18px] h-[18px]" />
            联系学术支持团队 / 咨询企业方案
          </button>
        </div>

        {/* Footer grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 border-t border-[#e2e2d5] pt-8">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-6 h-6 bg-[#1a202c] rounded-sm flex items-center justify-center">
                <span className="text-white font-bold text-[9px] font-mono leading-none">S</span>
              </div>
              <span className="font-serif font-bold text-sm text-[#1a202c]">1037Solo · StudySolo</span>
            </div>
            <p className="text-[11px] text-[#4a5568] leading-relaxed font-serif">
              专为学者和专业人士打造的 AI 学习工作流平台。
              <br />
              输入自然语言，生成完整工作流，释放 AI 生产力。
            </p>
          </div>

          {/* Quick links */}
          <div>
            <h4 className="text-xs font-mono font-bold text-[#2c5282] uppercase tracking-widest mb-3">
              快速链接
            </h4>
            <ul className="space-y-2 text-[11px] text-[#4a5568] font-serif">
              <li>
                <a href="/" className="hover:text-[#2c5282] transition-colors flex items-center gap-1.5">
                  <BookOpen className="w-3 h-3" /> 返回首页
                </a>
              </li>
              <li>
                <a href="https://docs.1037solo.com" target="_blank" rel="noopener noreferrer" className="hover:text-[#2c5282] transition-colors flex items-center gap-1.5">
                  <BookOpen className="w-3 h-3" /> 帮助文档
                </a>
              </li>
              <li>
                <a href="https://github.com/AIMFllys/StudySolo" target="_blank" rel="noopener noreferrer" className="hover:text-[#2c5282] transition-colors flex items-center gap-1.5">
                  <Github className="w-3 h-3" /> GitHub
                </a>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-xs font-mono font-bold text-[#2c5282] uppercase tracking-widest mb-3">
              联系我们
            </h4>
            <ul className="space-y-2 text-[11px] text-[#4a5568] font-serif">
              <li className="flex items-center gap-1.5">
                <Mail className="w-3 h-3" /> support@1037solo.com
              </li>
              <li className="text-[10px] text-[#4a5568]/60">
                工作日 9:00-18:00 (UTC+8)
              </li>
            </ul>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-8 pt-6 border-t border-[#e2e2d5] flex flex-col md:flex-row items-center justify-between gap-2">
          <p className="text-[10px] text-[#4a5568]/60 font-mono">
            © {currentYear} 1037Solo. All rights reserved.
          </p>
          <div className="flex items-center gap-4 text-[10px] text-[#4a5568]/60 font-mono">
            <span>服务条款</span>
            <span>·</span>
            <span>隐私政策</span>
            <span>·</span>
            <span>退款政策</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
