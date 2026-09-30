import type { HitoriDifficulty, HitoriPresetConfig } from "./types";
export const HITORI_PRESETS: Record<HitoriDifficulty, HitoriPresetConfig[]> = {
  easy: [
    {
      size: 5,
      label: "5x5 Easy #1",
      grid: [[2,3,5,4,1],[1,5,3,4,4],[5,3,5,1,2],[3,1,2,3,2],[4,2,5,5,3]],
      solution: [["circled","shaded","circled","circled","circled"],["circled","circled","circled","shaded","circled"],["circled","circled","shaded","circled","circled"],["shaded","circled","circled","circled","shaded"],["circled","circled","shaded","circled","circled"]],
    },
    {
      size: 5,
      label: "5x5 Easy #2",
      grid: [[2,5,2,3,2],[4,2,5,1,3],[1,4,3,5,5],[4,3,5,5,2],[5,1,2,3,4]],
      solution: [["circled","circled","shaded","circled","shaded"],["circled","circled","circled","circled","circled"],["circled","circled","circled","shaded","circled"],["shaded","circled","shaded","circled","circled"],["circled","circled","circled","shaded","circled"]],
    },
    {
      size: 5,
      label: "5x5 Easy #3",
      grid: [[4,1,5,2,4],[5,4,4,4,2],[3,4,3,1,5],[1,5,2,3,4],[2,5,1,5,2]],
      solution: [["circled","circled","circled","circled","shaded"],["circled","shaded","circled","shaded","circled"],["circled","circled","shaded","circled","circled"],["circled","circled","circled","circled","circled"],["circled","shaded","circled","circled","shaded"]],
    },
  ],
  medium: [
    {
      size: 6,
      label: "6x6 Medium #1",
      grid: [[6,2,4,5,3,5],[3,5,2,5,4,4],[1,3,5,2,6,2],[4,5,5,3,1,6],[6,4,6,1,5,3],[1,6,3,3,4,6]],
      solution: [["circled","circled","circled","shaded","circled","circled"],["circled","shaded","circled","circled","shaded","circled"],["shaded","circled","circled","shaded","circled","circled"],["circled","circled","shaded","circled","circled","circled"],["shaded","circled","circled","circled","circled","circled"],["circled","circled","circled","shaded","circled","shaded"]],
    },
    {
      size: 6,
      label: "6x6 Medium #2",
      grid: [[3,1,5,6,6,4],[3,4,1,3,6,6],[1,6,2,5,4,3],[5,3,1,6,2,3],[4,2,6,1,5,1],[6,2,3,1,3,6]],
      solution: [["circled","circled","circled","shaded","circled","circled"],["shaded","circled","shaded","circled","shaded","circled"],["circled","circled","circled","circled","circled","circled"],["circled","circled","circled","circled","circled","shaded"],["circled","shaded","circled","shaded","circled","circled"],["circled","circled","shaded","circled","circled","shaded"]],
    },
    {
      size: 6,
      label: "6x6 Medium #3",
      grid: [[3,4,6,5,3,4],[6,4,3,1,2,5],[1,6,2,4,5,3],[2,4,4,1,1,3],[4,5,4,1,3,6],[5,5,1,6,3,2]],
      solution: [["circled","shaded","circled","circled","shaded","circled"],["circled","circled","circled","shaded","circled","circled"],["circled","circled","circled","circled","circled","circled"],["circled","shaded","circled","shaded","circled","shaded"],["circled","circled","shaded","circled","circled","circled"],["circled","shaded","circled","circled","shaded","circled"]],
    },
  ],
  hard: [
    {
      size: 8,
      label: "8x8 Hard #1",
      grid: [[2,1,6,8,3,1,5,6],[1,6,7,7,8,3,1,2],[3,2,1,5,7,7,8,1],[1,8,2,3,4,6,4,7],[8,7,8,1,8,5,2,4],[4,5,8,7,7,1,6,6],[2,4,6,2,6,8,7,3],[8,3,5,5,2,1,4,1]],
      solution: [["circled","circled","circled","circled","circled","shaded","circled","shaded"],["shaded","circled","circled","shaded","circled","circled","circled","circled"],["circled","circled","circled","circled","shaded","circled","circled","shaded"],["circled","circled","circled","circled","circled","circled","shaded","circled"],["shaded","circled","shaded","circled","shaded","circled","circled","circled"],["circled","circled","circled","shaded","circled","circled","circled","shaded"],["shaded","circled","shaded","circled","circled","circled","circled","circled"],["circled","circled","circled","shaded","circled","shaded","circled","circled"]],
    },
    {
      size: 8,
      label: "8x8 Hard #2",
      grid: [[5,1,2,1,4,6,6,3],[4,6,3,2,7,1,1,2],[8,5,8,4,6,2,1,7],[5,2,5,6,6,8,8,1],[6,5,1,5,2,4,7,4],[3,8,6,7,1,6,2,4],[7,7,4,3,3,5,8,6],[7,1,5,8,3,4,7,5]],
      solution: [["circled","shaded","circled","circled","circled","shaded","circled","circled"],["circled","circled","circled","shaded","circled","circled","shaded","circled"],["circled","circled","shaded","circled","circled","circled","circled","circled"],["shaded","circled","circled","circled","shaded","circled","shaded","circled"],["circled","shaded","circled","circled","circled","shaded","circled","circled"],["circled","circled","shaded","circled","circled","circled","circled","shaded"],["shaded","circled","circled","circled","shaded","circled","circled","circled"],["circled","circled","shaded","circled","circled","circled","shaded","circled"]],
    },
  ],
};
