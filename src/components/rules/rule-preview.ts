import {
  condOpLabel,
  condOpNeedsValue,
  isConditionGroup,
} from '@/mocks'
import type {
  ConditionGroup,
  ConditionLeaf,
  PolicyRule,
  RuleOutcome,
} from '@/mocks'

function previewLeaf(node: ConditionLeaf): string {
  if (!condOpNeedsValue(node.op)) {
    return `${node.field} ${condOpLabel(node.op)}`
  }
  return `${node.field} ${condOpLabel(node.op)} ${node.value}`
}

export function previewCondition(
  node: ConditionLeaf | ConditionGroup,
): string {
  if (!isConditionGroup(node)) return previewLeaf(node)
  if (node.children.length === 0) return 'always'
  const joiner = node.combinator === 'and' ? ' AND ' : ' OR '
  const parts = node.children.map((child) => {
    const text = previewCondition(child)
    if (isConditionGroup(child) && child.children.length > 1) {
      return `(${text})`
    }
    return text
  })
  return parts.join(joiner)
}

export function previewRule(rule: Pick<PolicyRule, 'tool' | 'when' | 'then'>): string {
  return `${rule.tool} when ${previewCondition(rule.when)} → ${rule.then}`
}

export function matchedRuleLabel(
  packName: string,
  version: string,
  ruleName: string,
): string {
  return `pack:${packName}/${version} · ${ruleName}`
}

export function outcomeLabel(outcome: RuleOutcome | 'no_match'): string {
  if (outcome === 'needs_ai') return 'Needs AI'
  if (outcome === 'no_match') return 'No match'
  if (outcome === 'allow') return 'Allow'
  return 'Deny'
}
