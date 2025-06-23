import { ReactNode } from "react";
import { motion } from "framer-motion";
import './Stat.css';

interface statProps {
  type: ReactNode;
  stat: string;
  text: string;
  delay?: number;
}

const Stat = ({ type, stat, text, delay = 0 }: statProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, x: -30 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{
        duration: 0.6,
        delay,
        ease: "easeOut",
      }}
      className="flex flex-col justify-center items-center text-center"
    >
      {type}
      <h1 className="header-h1">{stat}</h1>
      <p className="header-p">{text}</p>
    </motion.div>
  );
};

export default Stat;
