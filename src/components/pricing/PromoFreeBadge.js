import React, { useId } from 'react';
import { Tooltip } from 'primereact/tooltip';
import useWindowWidth from '@/hooks/useWindowWidth';
import {
  PROMO_FREE_PRICE_SATS,
  PROMO_PRICING_MESSAGE,
  PROMO_TOOLTIP_POSITION,
} from '@/constants/promoPricing';

const sanitizeId = id => id.replace(/[^a-zA-Z0-9_-]/g, '');

const PromoFreeBadge = ({
  label = 'Free',
  showLabel = true,
  labelClassName = 'font-semibold text-green-400',
  iconClassName = 'pi pi-question-circle text-xs text-sky-300',
  wrapperClassName = 'flex items-center gap-1',
  tooltipPosition = PROMO_TOOLTIP_POSITION,
  showPriceValue = false,
  price = PROMO_FREE_PRICE_SATS,
}) => {
  const rawId = useId();
  const tooltipId = `promo-free-${sanitizeId(rawId)}`;
  const windowWidth = useWindowWidth();
  const isMobile = windowWidth < 768;

  return (
    <span className={wrapperClassName}>
      {showLabel && <span className={labelClassName}>{label}</span>}
      {showPriceValue && (
        <span className="text-xs text-gray-400 line-through">{price} sats</span>
      )}
      <i
        id={tooltipId}
        className={`${iconClassName} cursor-help`}
        data-pr-tooltip={PROMO_PRICING_MESSAGE}
        data-pr-position={tooltipPosition}
      />
      {!isMobile && <Tooltip target={`#${tooltipId}`} position={tooltipPosition} />}
    </span>
  );
};

export default PromoFreeBadge;
