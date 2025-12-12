"use client";
import React, { useEffect, useRef, useState } from "react";
import { useMotionValueEvent, useScroll } from "framer-motion";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export const HomeAboutSection = ({
  content,
  contentClassName,
}: {
  content: {
    title: string;
    description: string;
    content?: React.ReactNode | any;
  }[];
  contentClassName?: string;
}) => {
  const [activeCard, setActiveCard] = useState(0);
  const [lastValidContent, setLastValidContent] = useState<React.ReactNode | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  // Use scrollYProgress with the component's ref
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start 40%", "end 80%"],
  });

  const cardLength = content.length;

  useMotionValueEvent(scrollYProgress, "change", (latest) => {
    // Calculate which card should be active based on scroll progress
    const progressPerCard = 1 / cardLength;
    const index = Math.floor(latest / progressPerCard);
    setActiveCard(index);
  });

  const backgroundColors = [
    "var(--white)",
    "var(--slate-300)",
    "var(--slate-400)",
    "var(--slate-100)",
  ];

  const linearGradients = [
    "linear-gradient(to bottom right, var(--cyan-500), var(--emerald-500))",
    "linear-gradient(to bottom right, var(--pink-500), var(--indigo-500))",
    "linear-gradient(to bottom right, var(--orange-500), var(--yellow-500))",
  ];

  const [backgroundGradient, setBackgroundGradient] = useState(
    linearGradients[0]
  );

  useEffect(() => {
    setBackgroundGradient(
      linearGradients[activeCard % linearGradients.length]
    );
    // Update lastValidContent when we have valid content
    if (content[activeCard]?.content) {
      setLastValidContent(content[activeCard].content);
    }
  }, [activeCard, content]);

  return (
    <motion.div
      ref={ref}
      animate={{
        backgroundColor: backgroundColors[activeCard % backgroundColors.length],
      }}
      className="flex justify-center relative space-x-20 space-y-20 rounded-md py-20"
    >
      <div className="relative flex items-start px-4">
        <div className="max-w-7xl">
          {content.map((item, index) => (
            <div key={item.title + index} className="my-20">
              <motion.h2
                initial={{ opacity: 0 }}
                animate={{
                  opacity: activeCard === index ? 1 : 0.3,
                }}
                className="text-2xl font-bold text-slate-800"
              >
                {item.title}
              </motion.h2>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{
                  opacity: activeCard === index ? 1 : 0.3,
                }}
                className="text-lg text-slate-900 max-w-sm mt-10"
              >
                {item.description}
              </motion.p>
            </div>
          ))}
          <div className="h-40" />
        </div>
      </div>
      <div
        style={{ background: backgroundGradient }}
        className={cn(
          "hidden lg:block h-[30rem] w-[49rem] rounded-md bg-white sticky top-40 overflow-hidden",
          contentClassName
        )}
      >
        {content[activeCard]?.content ?? lastValidContent}
      </div>
    </motion.div>
  );
};
