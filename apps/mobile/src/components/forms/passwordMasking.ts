export function maskPasswordForDisplay(value: string, visible: boolean) {
  if (visible || value.length === 0) {
    return value;
  }

  return `${"•".repeat(Math.max(0, value.length - 1))}${value.at(-1)}`;
}

export function getPasswordValueFromDisplayChange(
  value: string,
  displayedValue: string,
  nextDisplayedValue: string,
  visible: boolean,
) {
  if (visible) {
    return nextDisplayedValue;
  }

  const lengthDifference = nextDisplayedValue.length - displayedValue.length;

  if (lengthDifference <= 0) {
    return value.slice(0, Math.max(0, value.length + lengthDifference));
  }

  return value + nextDisplayedValue.slice(displayedValue.length);
}
