import type { ReactNode } from "react";
import type { QuestionIconId, TrustIconId } from "@/brands/types";

type IconProps = {
  className?: string;
};

function Svg({
  className,
  children,
}: IconProps & { children: ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

export function CheckIcon({ className }: IconProps) {
  return (
    <Svg className={className}>
      <path d="M5 12.5 9.5 17 19 7" />
    </Svg>
  );
}

export function ArrowRightIcon({ className }: IconProps) {
  return (
    <Svg className={className}>
      <path d="M5 12h14" />
      <path d="m13 6 6 6-6 6" />
    </Svg>
  );
}

export function ArrowUpIcon({ className }: IconProps) {
  return (
    <Svg className={className}>
      <path d="M12 19V5" />
      <path d="m6 11 6-6 6 6" />
    </Svg>
  );
}

export function ArrowLeftIcon({ className }: IconProps) {
  return (
    <Svg className={className}>
      <path d="M19 12H5" />
      <path d="m11 6-6 6 6 6" />
    </Svg>
  );
}

export function ChatIcon({ className }: IconProps) {
  return (
    <Svg className={className}>
      <path d="M5 5h14a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H9l-4 4v-4H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z" />
    </Svg>
  );
}

export function LeafIcon({ className }: IconProps) {
  return (
    <Svg className={className}>
      <path d="M5 19c8-1 13-7 14-14-7 1-13 6-14 14Z" />
      <path d="M5 19c4-4 8-8 14-14" />
    </Svg>
  );
}

export function ShieldIcon({ className }: IconProps) {
  return (
    <Svg className={className}>
      <path d="M12 3 5 6v6c0 4.2 2.8 7.4 7 8.5 4.2-1.1 7-4.3 7-8.5V6l-7-3Z" />
    </Svg>
  );
}

export function MagnifierIcon({ className }: IconProps) {
  return (
    <Svg className={className}>
      <circle cx="11" cy="11" r="6.5" />
      <path d="m16 16 4 4" />
    </Svg>
  );
}

export function StarIcon({ className }: IconProps) {
  return (
    <Svg className={className}>
      <path d="m12 3.5 2.4 5 5.5.7-4 3.8.9 5.5L12 16.5 7.2 18.5l.9-5.5-4-3.8 5.5-.7L12 3.5Z" />
    </Svg>
  );
}

export function SparkleIcon({ className }: IconProps) {
  return (
    <Svg className={className}>
      <path d="M12 3v4M12 17v4M4.9 6.5l2.8 2.8M16.3 14.7l2.8 2.8M3 12h4M17 12h4M4.9 17.5l2.8-2.8M16.3 9.3l2.8-2.8" />
      <circle cx="12" cy="12" r="2.2" />
    </Svg>
  );
}

export function PeopleIcon({ className }: IconProps) {
  return (
    <Svg className={className}>
      <circle cx="9" cy="8" r="2.4" />
      <path d="M4.8 18c.4-2.6 2.2-4 4.2-4s3.8 1.4 4.2 4" />
      <circle cx="16" cy="9" r="2" />
      <path d="M15.2 18c.3-1.8 1.5-3 3.2-3 1 0 1.8.4 2.4 1.1" />
    </Svg>
  );
}

export function RobotVacuumIcon({ className }: IconProps) {
  return (
    <Svg className={className}>
      <circle cx="12" cy="13" r="7" />
      <circle cx="12" cy="13" r="2.2" />
      <path d="M8 6.5 9.2 4h5.6L16 6.5" />
    </Svg>
  );
}

export function CoffeeIcon({ className }: IconProps) {
  return (
    <Svg className={className}>
      <path d="M6 8h10v6a4 4 0 0 1-4 4H10a4 4 0 0 1-4-4V8Z" />
      <path d="M16 10h2.2a2.3 2.3 0 0 1 0 4.6H16" />
      <path d="M9 4.5c.4.8.4 1.6 0 2.4M12 4.5c.4.8.4 1.6 0 2.4" />
    </Svg>
  );
}

export function CompareIcon({ className }: IconProps) {
  return (
    <Svg className={className}>
      <path d="M7 4v16" />
      <path d="M4 7h6" />
      <path d="M17 20V4" />
      <path d="M14 17h6" />
    </Svg>
  );
}

export function TvIcon({ className }: IconProps) {
  return (
    <Svg className={className}>
      <rect x="3.5" y="6" width="17" height="11.5" rx="1.8" />
      <path d="M9 20h6" />
      <path d="M12 17.5V20" />
    </Svg>
  );
}

export function DishwasherIcon({ className }: IconProps) {
  return (
    <Svg className={className}>
      <rect x="5" y="4" width="14" height="16" rx="1.8" />
      <path d="M5 9h14" />
      <circle cx="8.2" cy="6.5" r="0.7" fill="currentColor" />
      <circle cx="10.4" cy="6.5" r="0.7" fill="currentColor" />
    </Svg>
  );
}

export function AirFryerIcon({ className }: IconProps) {
  return (
    <Svg className={className}>
      <rect x="6" y="5" width="12" height="14" rx="2" />
      <path d="M9 9h6" />
      <path d="M9 12h6" />
      <path d="M9 15h4" />
    </Svg>
  );
}

export function LaptopIcon({ className }: IconProps) {
  return (
    <Svg className={className}>
      <rect x="5" y="5" width="14" height="10" rx="1.4" />
      <path d="M3 18h18" />
      <path d="M7 18l1.2-3h7.6L17 18" />
    </Svg>
  );
}

export function StickVacuumIcon({ className }: IconProps) {
  return (
    <Svg className={className}>
      <path d="M13 3h3v7h-3z" />
      <path d="M14.5 10v7" />
      <path d="M10 20h9l-2.2-3H12L10 20Z" />
    </Svg>
  );
}

const trustIcons: Record<TrustIconId, (props: IconProps) => ReactNode> = {
  independent: ShieldIcon,
  researched: MagnifierIcon,
  trusted: StarIcon,
  australian: PeopleIcon,
};

const questionIcons: Record<
  QuestionIconId,
  (props: IconProps) => ReactNode
> = {
  "robot-vacuum": RobotVacuumIcon,
  coffee: CoffeeIcon,
  compare: CompareIcon,
  tv: TvIcon,
  dishwasher: DishwasherIcon,
  "air-fryer": AirFryerIcon,
  laptop: LaptopIcon,
  "stick-vacuum": StickVacuumIcon,
};

export function TrustIcon({
  id,
  className,
}: {
  id: TrustIconId;
  className?: string;
}) {
  const Icon = trustIcons[id];
  return <Icon className={className} />;
}

export function QuestionIcon({
  id,
  className,
}: {
  id: QuestionIconId;
  className?: string;
}) {
  const Icon = questionIcons[id];
  return <Icon className={className} />;
}
