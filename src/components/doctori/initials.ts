export function initials(name: string) {
  return name
    .replace(/^Dr\s+/, '')
    .split(' ')
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
}
