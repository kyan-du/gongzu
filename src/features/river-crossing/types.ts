export type Bank = 'left' | 'right';
export type GameStatus = 'playing' | 'failed' | 'won';
export type ItemId = string;

export type Item = {
  id: ItemId;
  name: string;
  emoji: string;
  weight?: number;
  canDrive?: boolean;
  group?: string;
  pair?: string;
  color: string;
};

export type EatRule = { kind: 'eats'; predator: ItemId; prey: ItemId };
export type ThiefRule = { kind: 'thief'; thief: ItemId; guard: ItemId; watched: ItemId[] };
export type OutnumberRule = { kind: 'outnumber'; safeGroup: string; dangerGroup: string };
export type JealousRule = { kind: 'jealous' };
export type Rule = EatRule | ThiefRule | OutnumberRule | JealousRule;

export type Level = {
  id: string;
  title: string;
  subtitle: string;
  capacity: number;
  maxWeight?: number;
  needsDriver?: boolean;
  items: Item[];
  rules: Rule[];
};

export type MoveRecord = {
  from: Bank;
  to: Bank;
  passengers: ItemId[];
  beforePositions: Record<ItemId, Bank>;
  beforeBoatBank: Bank;
  beforeStatus: GameStatus;
  beforeMessage: string;
};
