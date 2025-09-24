import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import ZapDisplay from '@/components/zaps/ZapDisplay';
import Image from 'next/image';
import { useZapsSubscription } from '@/hooks/nostrQueries/zaps/useZapsSubscription';
import { getTotalFromZaps } from '@/utils/lightning';
import { useImageProxy } from '@/hooks/useImageProxy';
import { useRouter } from 'next/router';
import { formatTimestampToHowLongAgo } from '@/utils/time';
import { nip19 } from 'nostr-tools';
import { Tag } from 'primereact/tag';
import { Message } from 'primereact/message';
import PromoFreeBadge from '@/components/pricing/PromoFreeBadge';
import useWindowWidth from '@/hooks/useWindowWidth';
import GenericButton from '@/components/buttons/GenericButton';
import { PlayCircle, FileText } from 'lucide-react';

export function CombinedTemplate({ resource, isLesson, showMetaTags }) {
  const { zaps, zapsLoading, zapsError } = useZapsSubscription({ event: resource });
  const [nAddress, setNAddress] = useState(null);
  const [zapAmount, setZapAmount] = useState(0);
  const router = useRouter();
  const { returnImageProxy } = useImageProxy();
  const windowWidth = useWindowWidth();
  const isMobile = windowWidth < 768;

  useEffect(() => {
    if (resource && resource?.d) {
      const nAddress = nip19.naddrEncode({
        pubkey: resource.pubkey,
        kind: resource.kind,
        identifier: resource.d,
      });
      setNAddress(nAddress);
    }
  }, [resource]);

  useEffect(() => {
    if (zaps.length > 0) {
      const total = getTotalFromZaps(zaps, resource);
      setZapAmount(total);
    }
  }, [zaps, resource]);

  const shouldShowMetaTags = topic => {
    if (!showMetaTags) {
      return !['lesson', 'document', 'video', 'course'].includes(topic);
    }
    return true;
  };

  if (zapsError) return <div>Error: {zapsError}</div>;

  return (
    <Card className="overflow-hidden group hover:shadow-xl transition-all duration-300 bg-gray-800 m-2 border-none">
      <div
        className="relative w-full h-0 hover:opacity-70 cursor-pointer"
        style={{ paddingBottom: '56.25%' }}
        onClick={() => router.push(`/details/${nAddress}`)}
      >
        <Image
          alt="resource thumbnail"
          src={returnImageProxy(resource.image)}
          quality={100}
          layout="fill"
          objectFit="cover"
          className="rounded-md"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-primary/80 to-primary-foreground/50" />
        <div className="absolute bottom-4 left-4 flex gap-2">
          <PlayCircle className="w-6 h-6 text-white" />
          <FileText className="w-6 h-6 text-white" />
        </div>
      </div>
      <CardHeader className="flex flex-row justify-between items-center p-4 border-b border-gray-700">
        <div className="flex items-center gap-4">
          <CardTitle className="text-xl sm:text-2xl text-[#f8f8ff]">{resource.title}</CardTitle>
        </div>
        <div className="text-[#f8f8ff]">
          <ZapDisplay
            zapAmount={zapAmount}
            event={resource}
            zapsLoading={zapsLoading && zapAmount === 0}
          />
        </div>
      </CardHeader>
      <CardContent
        className={`${isMobile ? 'px-3' : ''} pt-4 pb-2 w-full flex flex-row justify-between items-center`}
      >
        <div className="flex flex-wrap gap-2 max-w-[65%]">
          {resource?.topics?.map(
            (topic, index) =>
              shouldShowMetaTags(topic) && (
                <Tag size="small" key={index} className="px-2 py-1 text-sm text-[#f8f8ff]">
                  {topic}
                </Tag>
              )
          )}
          {isLesson && showMetaTags && (
            <Tag size="small" className="px-2 py-1 text-sm text-[#f8f8ff]" value="lesson" />
          )}
        </div>
        <Message
          className={`${isMobile ? 'py-1 text-xs' : 'py-2'} whitespace-nowrap flex items-center gap-2`}
          severity="success"
          icon="pi pi-lock-open"
          content={<PromoFreeBadge />}
        />
      </CardContent>
      <CardDescription
        className={`${isMobile ? 'w-full p-3' : 'p-6'} py-2 pt-0 text-base text-neutral-50/90 dark:text-neutral-900/90 overflow-hidden min-h-[4em] flex items-center max-w-[100%]`}
        style={{
          overflow: 'hidden',
          display: '-webkit-box',
          WebkitBoxOrient: 'vertical',
          WebkitLineClamp: '2',
        }}
      >
        <p className="line-clamp-2 text-wrap break-words">
          {(resource.summary || resource.description)?.split('\n').map((line, index) => (
            <span className="text-wrap break-words" key={index}>
              {line}
            </span>
          ))}
        </p>
      </CardDescription>
      <CardFooter
        className={`flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-t border-gray-700 pt-4 ${isMobile ? 'px-3' : ''}`}
      >
        <p className="text-sm text-gray-300">
          {resource?.published_at && resource.published_at !== ''
            ? formatTimestampToHowLongAgo(resource.published_at)
            : formatTimestampToHowLongAgo(resource.created_at)}
        </p>
        <GenericButton
          onClick={() => router.push(`/details/${nAddress}`)}
          size="small"
          label="View"
          icon="pi pi-chevron-right"
          iconPos="right"
          outlined
          className="items-center py-2"
        />
      </CardFooter>
    </Card>
  );
}
