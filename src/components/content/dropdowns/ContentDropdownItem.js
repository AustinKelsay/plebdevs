import React from 'react';
import Image from 'next/image';
import { useImageProxy } from '@/hooks/useImageProxy';
import { formatUnixTimestamp } from '@/utils/time';
import { Tag } from 'primereact/tag';
import { Message } from 'primereact/message';
import PromoFreeBadge from '@/components/pricing/PromoFreeBadge';
import GenericButton from '@/components/buttons/GenericButton';
import useWindowWidth from '@/hooks/useWindowWidth';
import { BookOpen } from 'lucide-react';
import { highlightText, getTextWithMatchContext } from '@/utils/text';
import { generateNaddr } from '@/utils/nostr';

const ContentDropdownItem = ({ content, onSelect }) => {
  const { returnImageProxy } = useImageProxy();
  const windowWidth = useWindowWidth();
  const isMobile = windowWidth <= 600;
  
  // Get match information if available
  const matches = content?._matches || {};
  
  // Handle content selection with naddress
  const handleSelect = () => {
    // Create a copy of the content object with naddress information
    const contentWithNaddr = { ...content };
    
    // If content has pubkey, kind, and identifier (d tag), generate naddr
    if (content.pubkey && content.kind && (content.d || content.identifier)) {
      // Use the appropriate identifier (d tag value)
      const identifier = content.d || content.identifier;
      
      // Generate naddress
      contentWithNaddr.naddress = generateNaddr(
        content.pubkey,
        content.kind,
        identifier
      );
      
      // Log success or failure
      if (contentWithNaddr.naddress) {
        console.log(`Generated naddress for ${content.type || 'content'}: ${contentWithNaddr.naddress}`);
      } else {
        console.warn('Failed to generate naddress:', { pubkey: content.pubkey, kind: content.kind, identifier });
      }
    }
    
    onSelect(contentWithNaddr);
  };

  return (
    <div
      className="group px-6 py-5 border-b border-gray-700/50 cursor-pointer hover:bg-gray-800/30 transition-colors duration-200"
      onClick={handleSelect}
    >
      <div className={`flex ${isMobile ? 'flex-col' : 'flex-row'} gap-5`}>
        <div
          className={`relative ${isMobile ? 'w-full h-40' : 'w-[180px] h-[100px]'} flex-shrink-0 overflow-hidden rounded-lg shadow-lg transition-transform duration-200 group-hover:scale-[1.02]`}
        >
          <Image
            alt="content thumbnail"
            src={returnImageProxy(content?.image)}
            width={isMobile ? 600 : 180}
            height={isMobile ? 240 : 100}
            className="w-full h-full object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-primary/80 to-primary-foreground/50 opacity-50 group-hover:opacity-40 transition-opacity duration-200" />
          <div className="absolute bottom-2 left-2 flex gap-2">
            <BookOpen className="w-5 h-5 text-white drop-shadow-lg" />
          </div>
        </div>

        <div className="flex-1 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-start gap-4 mb-2">
              <h3 className="text-xl font-bold text-[#f8f8ff] group-hover:text-white transition-colors duration-200">
                {matches.title 
                  ? highlightText(
                      content?.title || content?.name, 
                      matches.title.term, 
                      'bg-yellow-500/30 text-white font-bold px-0.5 rounded'
                    )
                  : (content?.title || content?.name)}
              </h3>

              <Message
                severity="success"
                className="py-1 text-xs whitespace-nowrap shadow-sm flex items-center gap-2"
                icon="pi pi-lock-open"
                content={<PromoFreeBadge wrapperClassName="flex items-center gap-1" labelClassName="text-green-400 font-semibold" />}
              />
            </div>

            {content?.summary && (
              <p className="text-neutral-50/80 line-clamp-2 mb-3 text-sm leading-relaxed group-hover:text-neutral-50/90 transition-colors duration-200">
                {matches.description 
                  ? highlightText(
                      getTextWithMatchContext(content.summary, matches.description.term, 60),
                      matches.description.term,
                      'bg-yellow-500/30 text-white font-medium px-0.5 rounded'
                    )
                  : content.summary}
              </p>
            )}
          </div>

          <div>
            <div className="flex flex-wrap gap-2 mb-3">
              {content?.topics?.map(topic => (
                <Tag
                  key={topic}
                  value={topic}
                  className="px-2.5 py-1 text-xs font-medium text-[#f8f8ff] bg-gray-700/50 border border-gray-600/30 rounded-full"
                />
              ))}
            </div>

            <div className="flex justify-between items-center">
              <div className="text-sm text-gray-400 group-hover:text-gray-300 transition-colors duration-200">
                {content?.published_at || content?.created_at
                  ? `Published: ${formatUnixTimestamp(content?.published_at || content?.created_at)}`
                  : 'Not yet published'}
              </div>

              {!isMobile && (
                <GenericButton
                  outlined
                  size="small"
                  label="Open"
                  icon="pi pi-chevron-right"
                  iconPos="right"
                  onClick={e => {
                    e.stopPropagation();
                    handleSelect();
                  }}
                  className="items-center py-1 shadow-sm hover:shadow-md transition-shadow duration-200"
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContentDropdownItem;
