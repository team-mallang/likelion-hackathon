export function formatCaseNumber(caseNumber: string) {
  const match = /^([A-Z]{2})(\d{4})([A-Z0-9]{4})$/.exec(caseNumber);

  if (!match) {
    return caseNumber;
  }

  return `${match[1]}-${match[2]}-${match[3]}`;
}
