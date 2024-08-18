import React from "react";
import Image from "next/image";
import { useImageProxy } from "@/hooks/useImageProxy";
import { formatUnixTimestamp } from "@/utils/time";

const SelectedContentItem = ({ content }) => {
    const { returnImageProxy } = useImageProxy();

    return (
        <div className="w-full border-2 rounded-lg border-gray-700 p-2 rounded-tr-none rounded-br-none">
            <div className="flex flex-row gap-4">
                <Image
                    alt="content thumbnail"
                    src={returnImageProxy(content.image)}
                    width={50}
                    height={50}
                    className="w-[100px] h-[100px] object-cover object-center border-round"
                />
                <div className="flex-1 max-w-[80vw]">
                    <div className="text-lg text-900 font-bold">{content.title}</div>
                    <div className="w-full text-sm text-600 text-wrap">{content.summary}</div>
                    <div className="text-sm pt-6 text-gray-500">
                        {content.published_at ? formatUnixTimestamp(content.published_at) : "not yet published"}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SelectedContentItem;