import React from 'react';
import { ExternalLink } from 'lucide-react';
import githubIcon from '@/assets/github.svg';

export const GITHUB_USERNAME = "mayank0274";

const AboutContent: React.FC = () => {
  return (
    <div className="flex flex-col gap-6 p-1">
      <div className="space-y-3">
        <p className="text-secondary leading-relaxed">
          EcoRoute is a companion for health-conscious travelers.
          By combining routing data with air quality insights, we help you find the cleanest paths in your city.
        </p>
      </div>

      <div className="space-y-4">
        <div className="p-4 rounded-2xl bg-muted/30 border border-border/50">
          <h4 className="font-semibold mb-2">Data Attribution</h4>
          <p className="text-sm text-secondary mb-3">
            Air quality data is provided by the World Air Quality Index project.
          </p>
          <a
            href="https://waqi.info"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary text-sm font-medium flex items-center gap-1.5 hover:underline"
          >
            Visit WAQI.info <ExternalLink size={14} />
          </a>
        </div>

        <div className="p-4 rounded-2xl bg-muted/30 border border-border/50">
          <h4 className="font-semibold mb-2">Developed by</h4>
          <a
            href={`https://github.com/${GITHUB_USERNAME}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 p-2 rounded-xl hover:bg-muted transition-colors group"
          >
            <div className="w-10 h-10 rounded-full bg-surface-container-lowest flex items-center justify-center border border-border/40 text-secondary group-hover:text-primary transition-colors">
              <img src={githubIcon} alt="GitHub" className="w-5 h-5" />
            </div>
            <div>
              <p className="font-medium">@{GITHUB_USERNAME}</p>
              <p className="text-xs text-secondary">View on GitHub</p>
            </div>
          </a>
        </div>
      </div>

      <div className="mt-auto pt-10 text-center">
        <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">
          EcoRoute v1.0.0
        </p>
      </div>
    </div>
  );
};

export default AboutContent;
