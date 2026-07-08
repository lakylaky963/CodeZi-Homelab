import { evaluateStrings, rank, rankDescription, getCardCodes } from '@pokertools/evaluator'
import { toEvaluatorCard } from './cardUtils.js'

export const evaluateHand = (holeCards, communityCards) => {
  const cards = [...holeCards, ...communityCards].map(toEvaluatorCard)
  if (cards.length < 5) {
    return { score: Number.MAX_SAFE_INTEGER, description: 'Incomplete' }
  }
  const codes = getCardCodes(cards)
  const score = evaluateStrings(cards)
  const description = rankDescription(rank(codes))
  return { score, description }
}
