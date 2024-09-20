import React, { useState, useEffect } from 'react';
import { Carousel } from 'primereact/carousel';
import { parseEvent } from '@/utils/nostr';
import { DocumentTemplate } from '@/components/content/carousels/templates/DocumentTemplate';
import TemplateSkeleton from '@/components/content/carousels/skeletons/TemplateSkeleton';
import { useDocuments } from '@/hooks/nostr/useDocuments';
import useWindowWidth from '@/hooks/useWindowWidth';
import { Divider } from 'primereact/divider';
const responsiveOptions = [
    {
        breakpoint: '3000px',
        numVisible: 3,
        numScroll: 1
    },
    {
        breakpoint: '1462px',
        numVisible: 2,
        numScroll: 1
    },
    {
        breakpoint: '575px',
        numVisible: 1,
        numScroll: 1
    }
];

export default function DocumentsCarousel() {
    const [processedDocuments, setProcessedDocuments] = useState([]);
    const { documents, documentsLoading, documentsError } = useDocuments()
    const windowWidth = useWindowWidth();
    const isMobileView = windowWidth <= 450;

    useEffect(() => {
        const fetch = async () => {
            try {
                if (documents && documents.length > 0) {
                    const processedDocuments = documents.map(document => parseEvent(document));
                    
                    // Sort documents by created_at in descending order (most recent first)
                    const sortedDocuments = processedDocuments.sort((a, b) => b.created_at - a.created_at);

                    setProcessedDocuments(sortedDocuments);
                } else {
                    console.log('No documents fetched or empty array returned');
                }
            } catch (error) {
                console.error('Error fetching documents:', error);
            }
        };        
        fetch();
    }, [documents]);

    if (documentsError) {
        return <div>Error: {documentsError.message}</div>
    }

    return (
        <>
            <h3 className={`ml-[6%] mt-4 max-mob:text-3xl max-mob:ml-10`}>Documents</h3>
            <Divider className={`${isMobileView ? '' : 'hidden'}`} />
            <Carousel 
                value={documentsLoading || !processedDocuments.length ? [{}, {}, {}] : [...processedDocuments]}
                numVisible={2}
                pt={{
                    previousButton: {
                        className: isMobileView ? 'm-0' : ''
                    },
                    nextButton: {
                        className: isMobileView ? 'm-0' : ''
                    }
                }}
                itemTemplate={(item) => 
                        processedDocuments.length > 0 ? 
                        <DocumentTemplate key={item.id} document={item} /> : 
                        <TemplateSkeleton key={Math.random()} />
                }
                responsiveOptions={responsiveOptions} />
        </>
    );
}