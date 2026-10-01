import type { CSSProperties, ElementType, ReactElement, ReactNode } from 'react';
import styles from './Text.module.css';

export type TextRole = 'display' | 'title' | 'lead' | 'body' | 'label' | 'micro';
export type TextTone = 'ink50' | 'ink100' | 'accent' | 'alarm';

const ROLE_DEFAULT_TAG: Record<TextRole, ElementType> = {
  display: 'h1',
  title: 'h2',
  lead: 'p',
  body: 'p',
  label: 'span',
  micro: 'span',
};

const TONE_CLASS: Record<TextTone, string> = {
  ink50: styles.toneInk50,
  ink100: styles.toneInk100,
  accent: styles.toneAccent,
  alarm: styles.toneAlarm,
};

export type TextProps = {
  role?: TextRole;
  as?: ElementType;
  tone?: TextTone;
  truncate?: boolean;
  className?: string;
  children?: ReactNode;
  id?: string;
  style?: CSSProperties;
};

/** DS-типографика §06: роли display/title/lead/body/label/micro, тон через var(--ds-*). */
export function Text({
  role = 'body',
  as,
  tone = 'ink50',
  truncate = false,
  className,
  children,
  ...rest
}: TextProps): ReactElement {
  const Tag = as ?? ROLE_DEFAULT_TAG[role];
  const classes = [styles[role], TONE_CLASS[tone], truncate ? styles.truncate : null, className]
    .filter(Boolean)
    .join(' ');

  return (
    <Tag className={classes} {...rest}>
      {children}
    </Tag>
  );
}
