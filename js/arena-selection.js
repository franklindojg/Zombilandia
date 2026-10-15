import { CUPS_DATA, LEVELS_20 } from './config.js';

// El sector del menú es la fuente de la selección; nunca conservar un nivel
// de otro sector ni iniciar una arena bloqueada como sustituto silencioso.
export function resolveArenaSelection(selection) {
  let index = selection.selectedCupIndex;
  if (!Number.isInteger(index) || !CUPS_DATA[index]) index = 0;
  const levels = LEVELS_20.filter(level => level.cup === index);
  const level = levels.find(level => level.level === selection.selectedLevelNumber) || levels[0];
  selection.selectedCupIndex = index;
  selection.selectedLevelNumber = level.level;
  return { cup: CUPS_DATA[index], level, canStart: level.level <= selection.unlockedMaxLevel };
}

export function selectArenaSector(selection, index) {
  if (Number.isInteger(index) && CUPS_DATA[index]) {
    selection.selectedCupIndex = index;
    selection.selectedLevelNumber = LEVELS_20.find(level => level.cup === index).level;
  }
  return resolveArenaSelection(selection);
}
