import React from 'react';
import type { Condition } from '../data/mockListings';

const CONDITION_STYLES: Record<Condition, string> = {
  New: 'bg-green-100 text-green-800',
  'Like New': 'bg-blue-100 text-blue-800',
  Good: 'bg-yellow-100 text-yellow-800',
  Fair: 'bg-orange-100 text-orange-800',
};

type ConditionBadgeProps = { condition: Condition; className?: string };

export function ConditionBadge({ condition, className = '' }: ConditionBadgeProps) {
  return (
    <span
      className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${CONDITION_STYLES[condition]} ${className}`}
    >
      {condition}
    </span>
  );
}
