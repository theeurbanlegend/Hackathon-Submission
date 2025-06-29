export const adaToLovelace = (ada: number): number => {
  return Math.floor(ada * 1_000_000);
};

export const lovelaceToAda = (lovelace: number): number => {
  return lovelace / 1_000_000;
};
