import React from "react";
import { DottedGlowBackground } from "./dotted-glow-background";

interface FeatureCardProps {
  title: string;
  description: string;
  icon?: React.ReactNode;
  gradient?: string;
  href?: string;
}

export const FeatureCard = ({
  title,
  description,
  icon,
  gradient = "from-orange-500 to-orange-600",
  href,
}: FeatureCardProps) => {
  const CardWrapper = href ? "a" : "div";
  const cardProps = href ? { href } : {};

  return (
    <CardWrapper
      {...cardProps}
      className="relative flex h-full flex-col overflow-hidden rounded-3xl border border-gray-200 bg-white p-6 shadow-lg ring-1 ring-black/5 transition-all hover:shadow-xl hover:-translate-y-1"
    >
      {icon && (
        <div className={`mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${gradient} text-white shadow-md`}>
          {icon}
        </div>
      )}
      
      <h3 className="mb-3 text-xl font-bold text-gray-900">
        {title}
      </h3>
      
      <p className="flex-1 text-sm text-gray-600 leading-relaxed">
        {description}
      </p>

      {href && (
        <div className="mt-4 flex items-center text-orange-600 font-semibold text-sm">
          Learn more
          <svg className="ml-1 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      )}
      
      <DottedGlowBackground
        className="pointer-events-none"
        opacity={0.3}
        gap={10}
        radius={1.2}
        colorLightVar="--color-neutral-400"
        glowColorLightVar="--color-orange-500"
        backgroundOpacity={0}
        speedMin={0.2}
        speedMax={0.8}
        speedScale={0.5}
      />
    </CardWrapper>
  );
};
