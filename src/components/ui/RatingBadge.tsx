import { getRatingColor } from "@/lib/utils";

export default function RatingBadge({
  rating,
  size = "md",
}: {
  rating: number;
  size?: "sm" | "md" | "lg";
}) {
  const sizeClasses = {
    sm: "w-8 h-8 text-xs",
    md: "w-10 h-10 text-sm",
    lg: "w-14 h-14 text-lg",
  };

  return (
    <div
      className={`${getRatingColor(rating)} ${sizeClasses[size]} rounded-lg flex items-center justify-center font-bold text-white`}
    >
      {rating.toFixed(1)}
    </div>
  );
}
