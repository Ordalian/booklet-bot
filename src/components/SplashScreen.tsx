import { useState, useEffect } from "react";

interface SplashScreenProps {
  onComplete: () => void;
  duration?: number;
}

const SplashScreen = ({ onComplete, duration = 4000 }: SplashScreenProps) => {
  const [fading, setFading] = useState(false);

  useEffect(() => {
    const fadeTimer = setTimeout(() => setFading(true), duration);
    const removeTimer = setTimeout(() => onComplete(), duration + 600);
    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(removeTimer);
    };
  }, [duration, onComplete]);

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center transition-opacity duration-[600ms] ${
        fading ? "opacity-0" : "opacity-100"
      }`}
      style={{ backgroundColor: "#000000" }}
    >
      <img
        src="/loading.gif"
        alt="Loading..."
        className="w-[80vmin] h-[80vmin] max-w-[600px] max-h-[600px] object-contain"
      />
    </div>
  );
};

export default SplashScreen;
