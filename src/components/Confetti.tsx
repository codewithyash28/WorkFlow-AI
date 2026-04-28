import React from 'react';
import { motion } from 'motion/react';

interface ParticleProps {
  x: number;
  y: number;
  color: string;
}

export const ConfettiParticle: React.FC<ParticleProps> = ({ x, y, color }) => {
  return (
    <motion.div
      initial={{ x, y, opacity: 1, scale: 1 }}
      animate={{ 
        x: x + (Math.random() - 0.5) * 200, 
        y: y + (Math.random() - 0.5) * 200 - 100,
        opacity: 0,
        scale: 0
      }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      className={`fixed z-[2000] w-2 h-2 rounded-full ${color}`}
      style={{ pointerEvents: 'none' }}
    />
  );
};
