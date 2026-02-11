export function getRatingColor(rating: number): string {
  if (rating >= 8.0) return "bg-green-500";
  if (rating >= 7.0) return "bg-green-600";
  if (rating >= 6.0) return "bg-yellow-500";
  if (rating >= 5.0) return "bg-orange-500";
  return "bg-red-500";
}

export function getRatingTextColor(rating: number): string {
  if (rating >= 8.0) return "text-green-400";
  if (rating >= 7.0) return "text-green-500";
  if (rating >= 6.0) return "text-yellow-400";
  if (rating >= 5.0) return "text-orange-400";
  return "text-red-400";
}

export function getGermanRatingColor(rating: number): string {
  if (rating <= 1.5) return "bg-green-500";
  if (rating <= 2.5) return "bg-green-600";
  if (rating <= 3.5) return "bg-yellow-500";
  if (rating <= 4.5) return "bg-orange-500";
  return "bg-red-500";
}

export function formatDate(dateString: string): string {
  return dateString;
}

export function getRoleBadgeColor(roleKey: string): string {
  switch (roleKey) {
    case "supporter":
      return "bg-blue-600/30 text-blue-400";
    case "journalist":
      return "bg-green-600/30 text-green-400";
    case "analyst":
      return "bg-purple-600/30 text-purple-400";
    default:
      return "bg-gray-600/30 text-gray-400";
  }
}
