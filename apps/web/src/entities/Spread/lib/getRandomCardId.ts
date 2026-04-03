export function getRandomCardId(
  selectedCardsIds: Record<string, boolean>
): number {
  const allCards = Array.from({ length: 78 }, (_, i) => i);

  const availableCards = allCards.filter(
    (id) => !selectedCardsIds[id.toString()]
  );

  const randomIndex = Math.floor(Math.random() * availableCards.length);

  return availableCards[randomIndex];
}
