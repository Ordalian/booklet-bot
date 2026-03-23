import { useState, useEffect } from "react";

interface SplashScreenProps {
  onComplete: () => void;
  duration?: number;
}

const SplashScreen = ({ onComplete, duration = 2500 }: SplashScreenProps) => {
  const [fading, setFading] = useState(false);

  useEffect(() => {
    const fadeTimer = setTimeout(() => setFading(true), duration);
    const removeTimer = setTimeout(() => onComplete(), duration + 500);
    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(removeTimer);
    };
  }, [duration, onComplete]);

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-foreground transition-opacity duration-500 ${
        fading ? "opacity-0" : "opacity-100"
      }`}
    >
      <img
        src="/loading.gif"
        alt="Loading..."
        className="max-w-[280px] max-h-[280px] object-contain"
      />
    </div>
  );
};

export default SplashScreen;
