import { motion } from "framer-motion";
import DueTodayBanner from "../features/review/DueTodayBanner";
import ReviewQueue from "../features/review/ReviewQueue";

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0 },
};

export default function Review() {
  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-6"
    >
      <motion.div variants={item}>
        <h1 className="text-2xl font-bold text-surface-900">Review</h1>
        <p className="text-sm text-surface-400 mt-0.5">Spaced repetition review queue</p>
      </motion.div>
      <motion.div variants={item}>
        <DueTodayBanner />
      </motion.div>
      <motion.div variants={item}>
        <ReviewQueue />
      </motion.div>
    </motion.div>
  );
}
