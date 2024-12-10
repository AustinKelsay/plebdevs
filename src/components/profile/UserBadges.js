import React from 'react';
import { Dialog } from 'primereact/dialog';
import Image from 'next/image';

const UserBadges = ({ visible, onHide }) => {
    // Hardcoded badges for now - later we'll fetch from nostr
    const badges = [
        {
            name: "Pleb",
            description: "You are signed up and ready to start your Dev Journey, onwards!",
            image: "https://plebdevs-bucket.nyc3.cdn.digitaloceanspaces.com/images/badges/pleb/lg.png",
            thumbnail: "https://plebdevs-bucket.nyc3.cdn.digitaloceanspaces.com/images/badges/pleb/sm.png",
            awardedOn: "2024-03-15",
            nostrId: "naddr1qq98getnw3e8getnw3eqzqqzyp3t45kgqsssh8xd3v7kkjw6wve3skawzlqjkmt63m2cv4jzaq43uqcyqqq82wgcvg0zv"
        },
        {
            name: "Plebdev",
            description: "You have completed the PlebDevs Starter and taken the first important step on your Dev Journey, congrats!",
            image: "https://plebdevs-bucket.nyc3.cdn.digitaloceanspaces.com/images/badges/plebdev/1012.png",
            thumbnail: "https://plebdevs-bucket.nyc3.cdn.digitaloceanspaces.com/images/badges/plebdev/256.png",
            awardedOn: "2024-03-15",
            nostrId: "naddr1qq98getnw3e8getnw3eqzqqzyp3t45kgqsssh8xd3v7kkjw6wve3skawzlqjkmt63m2cv4jzaq43uqcyqqq82wgcvg0zv"
        },
        {
            name: "Frontend Dev",
            description: "You have completed the Frontend Course and proven your proficiency at writing web apps and deploying Web Apps.",
            image: "https://plebdevs-bucket.nyc3.cdn.digitaloceanspaces.com/images/badges/frontend/lg.png",
            thumbnail: "https://plebdevs-bucket.nyc3.cdn.digitaloceanspaces.com/images/badges/frontend/sm.png",
            awardedOn: "2024-03-15",
            nostrId: "naddr1qq98getnw3e8getnw3eqzqqzyp3t45kgqsssh8xd3v7kkjw6wve3skawzlqjkmt63m2cv4jzaq43uqcyqqq82wgcvg0zv"
        },
        {
            name: "Backend Dev",
            description: "You have completed the Backend Course and demonstrated the ability to build and deploy Servers, API's, and Databases for Application Development.",
            image: "https://plebdevs-bucket.nyc3.cdn.digitaloceanspaces.com/images/badges/backend/lg.png",
            thumbnail: "https://plebdevs-bucket.nyc3.cdn.digitaloceanspaces.com/images/badges/backend/sm.png",
            awardedOn: "2024-03-15",
            nostrId: "naddr1qq98getnw3e8getnw3eqzqqzyp3t45kgqsssh8xd3v7kkjw6wve3skawzlqjkmt63m2cv4jzaq43uqcyqqq82wgcvg0zv"
        }
    ];

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    return (
        <Dialog 
            visible={visible} 
            onHide={onHide}
            header={
                <div className="text-2xl font-bold text-white">
                    Your Badges Collection
                </div>
            }
            className="w-[90vw] md:w-[70vw] lg:w-[50vw]"
            contentClassName="bg-gray-900"
            headerClassName="bg-gray-900 border-b border-gray-700"
        >
            <div className="p-6 bg-gray-900">
                <p className="text-gray-400 mb-6">Showcase your achievements and progress through your dev journey</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {badges.map((badge, index) => (
                        <div 
                            key={index} 
                            className="bg-gray-800 rounded-xl p-6 flex flex-col items-center transform transition-all duration-200 hover:scale-[1.02] hover:shadow-lg"
                        >
                            <div className="relative w-32 h-32 mb-4">
                                <Image 
                                    src={badge.thumbnail} 
                                    alt={badge.name}
                                    layout="fill"
                                    objectFit="contain"
                                />
                            </div>
                            <h3 className="text-white font-semibold text-xl mb-2">{badge.name}</h3>
                            <p className="text-gray-400 text-center text-sm">{badge.description}</p>
                            
                            <div className="mt-4 flex flex-col items-center gap-2 w-full">
                                <div className="bg-blue-500/10 text-blue-400 px-3 py-1 rounded-full text-sm">
                                    Earned on {formatDate(badge.awardedOn)}
                                </div>
                                
                                <a 
                                    href={`https://nostrudel.ninja/#/badges/${badge.nostrId}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-purple-400 hover:text-purple-300 text-sm flex items-center gap-1 transition-colors"
                                >
                                    <i className="pi pi-external-link" />
                                    View on Nostr
                                </a>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </Dialog>
    );
};

export default UserBadges;
