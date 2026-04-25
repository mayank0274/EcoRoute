import React from 'react';
import { Info, Menu } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import AboutContent, { GITHUB_USERNAME } from './AboutContent';
import githubIcon from '@/assets/github.svg';


const GlobalSidebar: React.FC = () => {
  return (
    <div className="fixed top-0 left-0 right-0 z-[9999] p-4 pointer-events-none flex items-start justify-between">
      <Sheet>
        <SheetTrigger asChild>
          <button className="flex w-10 h-10 bg-surface-container-lowest rounded-full items-center justify-center text-secondary shadow-2xl border border-border/40 hover:bg-muted transition-all active:scale-95 shrink-0 pointer-events-auto">
            <Menu size={20} strokeWidth={2.5} />
          </button>
        </SheetTrigger>
        <SheetContent side="left" className="w-[300px] sm:w-[350px] p-0 bg-surface-container-lowest border-r border-border/40 flex flex-col">
          <SheetHeader className="p-6 pb-2">
            <SheetTitle className="text-2xl font-bold tracking-tight text-primary">EcoRoute</SheetTitle>
          </SheetHeader>

          <div className="px-3 py-2 flex-1 overflow-y-auto">
            <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-primary/5 text-primary font-medium border border-primary/10">
              <Info size={18} />
              About
            </div>

            <div className="mt-8 px-3">
              <AboutContent />
            </div>
          </div>
        </SheetContent>
      </Sheet>

      <a
        href={`https://github.com/${GITHUB_USERNAME}`}
        target="_blank"
        rel="noopener noreferrer"
        className="flex w-10 h-10 bg-surface-container-lowest rounded-full items-center justify-center text-secondary shadow-2xl border border-border/40 hover:bg-muted transition-all active:scale-95 shrink-0 pointer-events-auto"
        title={`View this project on GitHub`}
      >
        <img src={githubIcon} alt="GitHub" className="w-5 h-5 opacity-80 group-hover:opacity-100" />
      </a>
    </div>
  );
};

export default GlobalSidebar;
