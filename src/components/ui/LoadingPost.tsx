'use client';

import { motion } from 'framer-motion';

export default function LoadingPostComponent() {
  return (
    <motion.div
      key={`loading`}
      className="mb-2 w-full bg-gray-950 py-5 px-5 rounded-[0.8rem] animate-pulse"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="flex gap-5 h-full">
        <div className="flex-shrink-0 w-15 h-15 bg-gray-700 rounded-4xl" />
        <div className="flex-1 space-y-2">
          <div className="h-6 bg-gray-700 rounded w-3/4" />
          <div className="h-4 bg-gray-700 rounded w-1/2" />
          <div className="h-3 bg-gray-700 rounded w-full" />
          <div className="h-4 bg-gray-700 rounded w-1/3 mt-2" />
        </div>
      </div>
    </motion.div>
  );
}