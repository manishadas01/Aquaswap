"use client";

import { useState } from "react";
import FloatingLines from "@/components/floating-lines";
import { HeroHeader } from "@/components/hero-header";

const DEFAULT_COLORS = ["#0B3D91", "#1C6DD0", "#3AAED8", "#8FE3CF"];

export function PageShell({ children }: { children: React.ReactNode }) {
  const [colorPreset, setColorPreset] = useState<string[]>(DEFAULT_COLORS);

  return (
    <div className="relative min-h-dvh w-full bg-background">
      {/* Animated Background */}
      <div className="absolute inset-0 z-0">
        <FloatingLines
          linesGradient={colorPreset}
          enabledWaves={["bottom", "middle", "top"]}
          lineCount={[4, 6, 3]}
          lineDistance={[8, 5, 10]}
          animationSpeed={0.8}
          interactive={true}
          bendRadius={5.0}
          bendStrength={-0.5}
          mouseDamping={0.05}
          parallax={true}
          parallaxStrength={0.15}
          mixBlendMode="screen"
        />
      </div>

      <HeroHeader onColorPresetChange={setColorPreset} />

      <div className="relative z-10">{children}</div>
    </div>
  );
}
