// Adapted from Aceternity UI "SVG Mask Effect" (ui.aceternity.com/components/svg-mask-effect).
import { useRef, useState, type ReactNode } from "react";
import { motion } from "framer-motion";
import { cn } from "../../lib/cn";

/**
 * Hover reveals `revealText` through a circular mask following the cursor.
 * On touch devices a tap toggles the reveal (centred on the tap point).
 */
export function MaskContainer({
  children,
  revealText,
  size = 10,
  revealSize = 520,
  className,
}: {
  children?: ReactNode;
  revealText?: ReactNode;
  size?: number;
  revealSize?: number;
  className?: string;
}) {
  const [hovered, setHovered] = useState(false);
  const [pos, setPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const ref = useRef<HTMLDivElement>(null);

  const track = (clientX: number, clientY: number) => {
    const rect = ref.current?.getBoundingClientRect();
    if (rect) setPos({ x: clientX - rect.left, y: clientY - rect.top });
  };
  const maskSize = hovered ? revealSize : size;

  return (
    <motion.div
      ref={ref}
      className={cn("relative overflow-hidden", className)}
      onPointerMove={(e) => e.pointerType === "mouse" && track(e.clientX, e.clientY)}
      onPointerDown={(e) => {
        if (e.pointerType === "mouse") return;
        track(e.clientX, e.clientY);
        setHovered((h) => !h);
      }}
      animate={{ backgroundColor: hovered ? "#0b0e12" : "#050608" }}
      transition={{ backgroundColor: { duration: 0.3 } }}
    >
      {/* Layer revealed through the mask */}
      <motion.div
        aria-hidden
        className="absolute inset-0 flex items-center justify-center bg-volt-400 [mask-image:url(/mask.svg)] [mask-repeat:no-repeat] [mask-size:40px]"
        animate={{
          maskPosition: `${pos.x - maskSize / 2}px ${pos.y - maskSize / 2}px`,
          maskSize: `${maskSize}px`,
        }}
        transition={{ maskSize: { duration: 0.3, ease: "easeInOut" }, maskPosition: { duration: 0.15, ease: "linear" } }}
      >
        <div
          onPointerEnter={(e) => e.pointerType === "mouse" && setHovered(true)}
          onPointerLeave={(e) => e.pointerType === "mouse" && setHovered(false)}
          className="relative z-20 mx-auto max-w-4xl px-6 text-center"
        >
          {children}
        </div>
      </motion.div>
      <div className="flex h-full w-full items-center justify-center">{revealText}</div>
    </motion.div>
  );
}
