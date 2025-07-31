// lib/mentee-data.ts
export interface Mentee {
  id: string;
  name: string;
  topChoices: string[]; // Array of mentor IDs
}

export const menteesData: Mentee[] = [
  {
    id: "mentee1",
    name: "Sophia Long",
    topChoices: ["2", "5", "7"], // Alice, Eve, Grace
  },
  {
    id: "mentee2",
    name: "Liam Dog",
    topChoices: ["2", "1", "8"], // Bob, Alice, Henry
  },
  {
    id: "mentee3",
    name: "Olivia Davis",
    topChoices: ["4", "3", "9"], // Diana, Charlie, Ivy
  },
  {
    id: "mentee4",
    name: "Noah Womp",
    topChoices: ["1", "6", "2"], // Alice, Frank, Bob
  },
  {
    id: "mentee5",
    name: "Emma Liu",
    topChoices: ["1", "5", "4"], // Grace, Eve, Diana
  },
  {
    id: "mentee6",
    name: "Jackson Taylor",
    topChoices: ["3", "9", "6"], // Charlie, Ivy, Frank
  },
  {
    id: "mentee7",
    name: "Ava Haddan",
    topChoices: ["8", "2", "1"], // Henry, Bob, Alice
  },
  {
    id: "mentee8",
    name: "Lucas Miller",
    topChoices: ["5", "1", "4"], // Eve, Grace, Diana
  },
  {
    id: "mentee9",
    name: "LeBron James",
    topChoices: ["7", "2", "3"], // Ivy, Charlie, Henry
  },
  {
    id: "mentee10",
    name: "Mia Hernandez",
    topChoices: ["4", "1", "5"], // Frank, Alice, Eve
  },
];
