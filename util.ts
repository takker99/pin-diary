export const patchLines = (lines: string[], appends: string[]): string[] => {
  let index = 0;
  const result = [] as string[];
  for (let i = 0; i < appends.length; i++) {
    const pos = lines.findIndex((line, j) =>
      j >= index && line.trim() === appends[i].trim()
    );
    if (pos < 0) {
      result.push(appends[i]);
      continue;
    }
    result.push(...lines.slice(index, pos + 1));
    index = pos + 1;
  }
  result.push(...lines.slice(index));
  return result;
};

export const findSplitIndex = (lines: string[], query: string[]) => {
  let index = -1;
  for (const text of query) {
    const pos = lines.findIndex((line, j) =>
      j > index && line.trim() === text.trim()
    );
    if (pos < 0) return -1;
    index = pos;
  }
  return index;
};
