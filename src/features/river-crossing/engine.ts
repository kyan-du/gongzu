import type { Bank, ItemId, Level } from './types';

export function opposite(bank: Bank): Bank {
  return bank === 'left' ? 'right' : 'left';
}

export function initialPositions(level: Level): Record<ItemId, Bank> {
  return Object.fromEntries(level.items.map(i => [i.id, 'left'])) as Record<ItemId, Bank>;
}

export function itemName(level: Level, id: ItemId): string {
  return level.items.find(i => i.id === id)?.name || id;
}

export function checkDanger(level: Level, positions: Record<ItemId, Bank>, boatBank: Bank): string | null {
  for (const bank of ['left', 'right'] as Bank[]) {
    if (boatBank === bank) continue;
    const here = level.items.filter(item => positions[item.id] === bank);
    const ids = here.map(i => i.id);

    for (const rule of level.rules) {
      if (rule.kind === 'eats' && ids.includes(rule.predator) && ids.includes(rule.prey)) {
        return `${bank === 'left' ? '左岸' : '右岸'}只剩${itemName(level, rule.predator)}和${itemName(level, rule.prey)}，${itemName(level, rule.predator)}会伤害${itemName(level, rule.prey)}。`;
      }
      if (rule.kind === 'thief' && ids.includes(rule.thief) && !ids.includes(rule.guard) && rule.watched.some(id => ids.includes(id))) {
        return `${bank === 'left' ? '左岸' : '右岸'}小偷离开警察，和家人在一起了。`;
      }
      if (rule.kind === 'outnumber') {
        const safe = here.filter(i => i.group === rule.safeGroup).length;
        const danger = here.filter(i => i.group === rule.dangerGroup).length;
        if (safe > 0 && danger > safe) return `${bank === 'left' ? '左岸' : '右岸'}探险员人数少于野人。`;
      }
      if (rule.kind === 'jealous') {
        for (const child of here.filter(i => i.pair && i.id.startsWith('c'))) {
          const own = child.pair!;
          if (!ids.includes(own) && here.some(i => i.id.startsWith('p') && i.id !== own)) {
            return `${bank === 'left' ? '左岸' : '右岸'}${child.name}离开自己的家长，和别的家长在一起。`;
          }
        }
      }
    }
  }
  return null;
}

export function isWon(level: Level, positions: Record<ItemId, Bank>): boolean {
  return level.items.every(item => positions[item.id] === 'right');
}
