import React, { useState, useRef, useEffect } from 'react';
import { InputText } from 'primereact/inputtext';
import { InputIcon } from 'primereact/inputicon';
import { IconField } from 'primereact/iconfield';
import { Dropdown } from 'primereact/dropdown';
import { OverlayPanel } from 'primereact/overlaypanel';
import ContentDropdownItem from '@/components/content/dropdowns/ContentDropdownItem';
import MessageDropdownItem from '@/components/content/dropdowns/MessageDropdownItem';
import { useContentSearch } from '@/hooks/useContentSearch';
import { useCommunitySearch } from '@/hooks/useCommunitySearch';
import { useRouter } from 'next/router';
import useWindowWidth from '@/hooks/useWindowWidth';

const SearchBar = () => {
    const { searchContent, searchResults: contentResults } = useContentSearch();
    const { searchCommunity, searchResults: communityResults } = useCommunitySearch();
    const router = useRouter();
    const windowWidth = useWindowWidth();
    const [selectedSearchOption, setSelectedSearchOption] = useState({ name: 'Content', code: 'content', icon: 'pi pi-video' });
    const searchOptions = [
        { name: 'Content', code: 'content', icon: 'pi pi-video' },
        { name: 'Community', code: 'community', icon: 'pi pi-users' },
    ];
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const op = useRef(null);

    const selectedOptionTemplate = (option, props) => {
        if (!props?.placeholder) {
            return (
                <div className="flex items-center">
                    <i className={option.icon + ' mr-2'}></i>
                    <span>{option.code}</span>
                </div>
            );
        }
        return <i className={option.icon + ' text-transparent text-xs'} />
    };

    const handleSearch = (e) => {
        const term = e.target.value;
        setSearchTerm(term);
        
        if (selectedSearchOption.code === 'content') {
            searchContent(term);
            setSearchResults(contentResults);
        } else if (selectedSearchOption.code === 'community') {
            searchCommunity(term);
            setSearchResults(communityResults);
        }

        if (term.length > 2) {
            op.current.show(e);
        } else {
            op.current.hide();
        }
    };

    useEffect(() => {
        if (selectedSearchOption.code === 'content') {
            setSearchResults(contentResults);
        } else if (selectedSearchOption.code === 'community') {
            setSearchResults(communityResults);
        }
    }, [selectedSearchOption, contentResults, communityResults]);

    const handleContentSelect = (content) => {
        if (content?.type === 'course') {
            router.push(`/course/${content.id}`);
        } else {
            router.push(`/details/${content.id}`);
        }
        setSearchTerm('');
        searchContent('');
        op.current.hide();
    }

    return (
        <div className={`absolute ${windowWidth < 950 ? "left-[55%]" : "left-[50%]"} transform -translate-x-[50%]`}>
            <IconField iconPosition="left">
                <InputIcon className="pi pi-search"> </InputIcon>
                <InputText 
                    className={`${windowWidth > 845 ? 'w-[300px]' : 'w-[160px]'}`} 
                    value={searchTerm}
                    onChange={handleSearch}
                    placeholder={`Search ${selectedSearchOption.name.toLowerCase()}`} 
                    pt={{
                        root: {
                            className: 'border-none rounded-tr-none rounded-br-none focus:border-none focus:ring-0 pr-0'
                        }
                    }} 
                />

                <Dropdown 
                    pt={{
                        root: {
                            className: 'border-none rounded-tl-none rounded-bl-none bg-gray-900/55 hover:bg-gray-900/30'
                        },
                        input: {
                            className: 'mx-0 px-0 shadow-lg'
                        }
                    }}
                    value={selectedSearchOption} 
                    onChange={(e) => setSelectedSearchOption(e.value)} 
                    options={searchOptions} 
                    optionLabel="name" 
                    placeholder="Search"
                    dropdownIcon={
                        <div className='w-full pr-2 flex flex-row items-center justify-between'>
                            <i className={selectedSearchOption.icon + " text-white"} />
                            <i className="pi pi-chevron-down" />
                        </div>
                    }
                    valueTemplate={selectedOptionTemplate}
                    itemTemplate={selectedOptionTemplate}
                    required
                />
            </IconField>

            <OverlayPanel ref={op} className="w-[600px] max-h-[70vh] overflow-y-auto">
                {searchResults.map((item, index) => (
                    item.type === 'discord' || item.type === 'nostr' || item.type === 'stackernews' ? (
                        <MessageDropdownItem 
                            key={index} 
                            message={item} 
                            onSelect={handleContentSelect}
                        />
                    ) : (
                        <ContentDropdownItem 
                            key={index} 
                            content={item} 
                            onSelect={handleContentSelect}
                        />
                    )
                ))}
                {searchResults.length === 0 && searchTerm.length > 2 && (
                    <div className="p-4 text-center">No results found</div>
                )}
            </OverlayPanel>
        </div>
    );
};

export default SearchBar;
