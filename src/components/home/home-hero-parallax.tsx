"use client";
import React from "react";
import {
  motion,
  useScroll,
  useTransform,
  useSpring,
  MotionValue,
} from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { Input } from "../ui/input";
import { Button } from "../ui/button";

const AnimatedCard = ({
  product,
  isActive,
}: {
  product: {
    title: string;
    link: string;
    thumbnail: string;
  };
  isActive: boolean;
}) => {
  return (
    <motion.div
      initial={{
        opacity: 0,
        scale: 0.8,
      }}
      animate={{
        opacity: isActive ? 1 : 0,
        scale: isActive ? 1 : 0.8,
        transition: {
          duration: 0.5,
          ease: "easeInOut"
        }
      }}
      className="relative h-[20rem] md:h-[40rem] w-full md:w-[40rem]"
    >
      <Link href={product.link} className="block h-full">
        <Image
          src={product.thumbnail}
          height={800}
          width={600}
          style={{ objectFit: "cover" }}
          className="h-full w-full rounded-lg shadow-2xl"
          alt={product.title}
        />
      </Link>
    </motion.div>
  );
};

export const HomeHeroParallax = ({
  products,
}: {
  products: {
    title: string;
    link: string;
    thumbnail: string;
  }[];
}) => {
  const firstRow = products.slice(0, 5);
  const secondRow = products.slice(5, 10);
  const thirdRow = products.slice(10, 15);
  const ref = React.useRef(null);
  const [isCardActive] = React.useState(true);
  const [currentProductIndex, setCurrentProductIndex] = React.useState(0);

  React.useEffect(() => {
    const interval = setInterval(() => {
      setCurrentProductIndex((prev) => (prev + 1) % products.length);
    }, 4000);

    return () => clearInterval(interval);
  }, [products.length]);

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });

  const springConfig = { stiffness: 300, damping: 30, bounce: 100 };

  const translateX = useSpring(
    useTransform(scrollYProgress, [0, 1], [0, 1000]),
    springConfig
  );
  const translateXReverse = useSpring(
    useTransform(scrollYProgress, [0, 1], [0, -1000]),
    springConfig
  );
  const rotateX = useSpring(
    useTransform(scrollYProgress, [0, 0.2], [15, 0]),
    springConfig
  );
  const opacity = useSpring(
    useTransform(scrollYProgress, [0, 0.2], [0.2, 1]),
    springConfig
  );
  const rotateZ = useSpring(
    useTransform(scrollYProgress, [0, 0.2], [20, 0]),
    springConfig
  );
  const translateY = useSpring(
    useTransform(scrollYProgress, [0, 0.2], [-700, 200]),
    springConfig
  );

  return (
    <div
      ref={ref}
      className="md:h-[310vh] overflow-hidden antialiased relative flex flex-col self-auto [perspective:1000px] [transform-style:preserve-3d]"
    >
      <div className="relative bg-white min-h-screen flex items-center">
        <div className="container max-w-7xl mx-auto px-4 relative z-30 pb-20">
          <div className="md:grid md:grid-cols-2 md:gap-8 md:items-center">
            <div className="flex flex-col">
              <div className="flex flex-col items-center md:items-start text-center md:text-left max-w-lg md:flex-shrink-0 z-20 pt-16 md:pt-0">
                <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-8xl text-black">
                  Theta Tau
                </h2>
                <p className="mt-4 text-gray-800 md:text-2xl">
                  Connect with like-minded engineers through brotherhood, academic, philanthropic, and professional development opportunities.
                </p>
              </div>
              <div className="block md:hidden mt-8 mb-20">
                <AnimatedCard product={products[currentProductIndex]} isActive={isCardActive} />
              </div>
            </div>
            <div className="hidden md:flex items-center justify-end">
              <AnimatedCard product={products[currentProductIndex]} isActive={isCardActive} />
            </div>
          </div>
        </div>
      </div>
      <motion.div
        style={{
          rotateX,
          rotateZ,
          translateY,
          opacity,
        }}
        className="relative z-20 hidden md:block"
      >
        <motion.div className="flex flex-row-reverse space-x-reverse space-x-20 mb-20">
          {firstRow.map((product) => (
            <ProductCard
              product={product}
              translate={translateX}
              key={product.title}
            />
          ))}
        </motion.div>
        <motion.div className="flex flex-row mb-20 space-x-20">
          {secondRow.map((product) => (
            <ProductCard
              product={product}
              translate={translateXReverse}
              key={product.title}
            />
          ))}
        </motion.div>
        <motion.div className="flex flex-row-reverse space-x-reverse space-x-20">
          {thirdRow.map((product) => (
            <ProductCard
              product={product}
              translate={translateX}
              key={product.title}
            />
          ))}
        </motion.div>
      </motion.div>
    </div>
  );
};

export const ProductCard = ({
  product,
  translate,
}: {
  product: {
    title: string;
    link: string;
    thumbnail: string;
  };
  translate: MotionValue<number>;
}) => {
  return (
    <motion.div
      style={{
        x: translate,
      }}
      whileHover={{
        y: -20,
      }}
      key={product.title}
      className="group/product h-96 w-[30rem] relative flex-shrink-0"
    >
      <Link
        href={product.link}
        className="block group-hover/product:shadow-2xl"
      >
        <Image
          src={product.thumbnail}
          height="600"
          width="600"
          className="object-cover object-left-top absolute h-full w-full inset-0"
          alt={product.title}
        />
      </Link>
      <div className="absolute inset-0 h-full w-full opacity-0 group-hover/product:opacity-30 bg-black pointer-events-none"></div>
      <h2 className="absolute bottom-4 left-4 opacity-0 group-hover/product:opacity-100 text-white text-2xl">
        {product.title}
      </h2>
    </motion.div>
  );
};
