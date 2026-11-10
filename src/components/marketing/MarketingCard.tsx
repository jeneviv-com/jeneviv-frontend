import { ReactNode } from 'react';

interface MarketingCardProps {
  children: ReactNode;
  className?: string;
  variant?: 'bento' | 'security' | 'price' | 'price-dark' | 'collection';
  wide?: boolean;
  reveal?: boolean;
  id?: string;
}

export function MarketingCard({
  children,
  className = '',
  variant = 'bento',
  wide = false,
  reveal = false,
  id,
}: MarketingCardProps) {
  const baseClass = getBaseClass(variant);
  const variantClasses = getVariantClasses(variant, wide);
  const revealClass = reveal ? 'reveal' : '';
  
  return (
    <article 
      id={id}
      className={`${baseClass} ${variantClasses} ${revealClass} ${className}`}
    >
      {children}
    </article>
  );
}

function getBaseClass(variant: string): string {
  switch (variant) {
    case 'bento':
      return 'm-bento-card';
    case 'security':
      return 'm-sec-card';
    case 'price':
    case 'price-dark':
      return 'm-price-card';
    case 'collection':
      return 'm-collection-card';
    default:
      return 'm-bento-card';
  }
}

function getVariantClasses(variant: string, wide: boolean): string {
  const classes = [];
  
  if (variant === 'price-dark') {
    classes.push('dark');
  }
  
  if (wide && variant === 'bento') {
    classes.push('wide');
  }
  
  return classes.join(' ');
}

// Additional specialized card components

interface BentoCardProps extends Omit<MarketingCardProps, 'variant'> {
  eyebrow?: string;
  title?: string;
  description?: string;
  art?: ReactNode;
}

export function BentoCard({
  eyebrow,
  title,
  description,
  art,
  children,
  ...props
}: BentoCardProps) {
  return (
    <MarketingCard variant="bento" {...props}>
      {eyebrow && <span className="m-eyebrow">{eyebrow}</span>}
      {title && <h3>{title}</h3>}
      {description && <p>{description}</p>}
      {art && <div className="m-bento-art">{art}</div>}
      {children}
    </MarketingCard>
  );
}

interface SecurityCardProps extends Omit<MarketingCardProps, 'variant'> {
  icon?: ReactNode;
  title?: string;
  description?: string;
}

export function SecurityCard({
  icon,
  title,
  description,
  children,
  ...props
}: SecurityCardProps) {
  return (
    <MarketingCard variant="security" {...props}>
      {icon && (
        <span className="m-sec-icon">
          {icon}
        </span>
      )}
      {title && <h4>{title}</h4>}
      {description && <p>{description}</p>}
      {children}
    </MarketingCard>
  );
}

interface PriceCardProps extends Omit<MarketingCardProps, 'variant'> {
  badge?: string;
  amount?: ReactNode;
  period?: string;
  description?: string;
  listItems?: string[];
  finePrint?: string;
  button?: ReactNode;
}

export function PriceCard({
  badge,
  amount,
  period,
  description,
  listItems,
  finePrint,
  button,
  children,
  dark = false,
  ...props
}: PriceCardProps & { dark?: boolean }) {
  return (
    <MarketingCard variant={dark ? 'price-dark' : 'price'} {...props}>
      {badge && <span className="m-price-badge">{badge}</span>}
      {amount && (
        <div className="m-price-amount">
          {amount}
          {period && <span>{period}</span>}
        </div>
      )}
      {description && <p className="m-price-note">{description}</p>}
      {listItems && listItems.length > 0 && (
        <ul className="m-price-list">
          {listItems.map((item, index) => (
            <li key={index}>
              <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
                <path d="M13 5L6 12L3 9" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              {item}
            </li>
          ))}
        </ul>
      )}
      {finePrint && <p className="m-price-fine">{finePrint}</p>}
      {button && <div className="m-btn">{button}</div>}
      {children}
    </MarketingCard>
  );
}