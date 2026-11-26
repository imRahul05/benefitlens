export function formatFileSize(bytes: number | null | undefined) {
  if (!bytes) {
    return "Unknown size";
  }

  const units = ["B", "KB", "MB"];
  let value = bytes;
  let unitIndex = 0;

  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }

  return `${value.toFixed(value >= 10 ? 0 : 1)} ${units[unitIndex]}`;
}
