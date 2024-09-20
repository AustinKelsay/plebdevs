import Image from "next/image"
import { useState } from "react"
import { useImageProxy } from "@/hooks/useImageProxy"
import GenericButton from "@/components/buttons/GenericButton"
import { useRouter } from "next/router"
import useWindowWidth from "@/hooks/useWindowWidth"

// With current spacing the title can only be 1 line
const promotions = [
  {
    id: 1,
    category: "PLEBDEVS",
    title: "Developer education & community platform",
    description: "PlebDevs is your gateway to mastering Bitcoin, Lightning, and Nostr technologies. Join our community of aspiring developers and start your journey today!",
    icon: "pi pi-code",
    image: "https://media.istockphoto.com/id/537331500/photo/programming-code-abstract-technology-background-of-software-deve.jpg?s=612x612&w=0&k=20&c=jlYes8ZfnCmD0lLn-vKvzQoKXrWaEcVypHnB5MuO-g8=",
  },
  {
    id: 2,
    category: "COURSES",
    title: "Structured learning paths for new devs",
    description: "Dive into our comprehensive courses covering Bitcoin protocol, Lightning Network, and Nostr. From basics to advanced topics, we've got you covered.",
    icon: "pi pi-book",
    image: "https://media.istockphoto.com/id/1224500457/photo/programming-code-abstract-technology-background-of-software-developer-and-computer-script.jpg?s=612x612&w=0&k=20&c=nHMypkMTU1HUUW85Zt0Ff7MDbq17n0eVeXaoM9Knt4Q=",
  },
  {
    id: 3,
    category: "VIDEOS",
    title: "Hands-on workshops and devleloper video content",
    description: "Watch and learn with our interactive video workshops. Get practical experience building real Bitcoin and Lightning applications.",
    icon: "pi pi-video",
    image: "https://newsroom.siliconslopes.com/content/images/2018/10/code.jpg",
  },
  {
    id: 4,
    category: "DOCUMENTS",
    title: "In-depth Resources and Documentation",
    description: "Access our extensive library of documents, including guides, resources, and best practices for Bitcoin development.",
    icon: "pi pi-file",
    image: "https://img.freepik.com/free-photo/programming-background-with-person-working-with-codes-computer_23-2150010125.jpg",
  },
  {
    id: 5,
    category: "COMMUNITY",
    title: "Join Our Community",
    description: "Connect with other developers, share your projects, and get support from our community of Bitcoin enthusiasts.",
    icon: "pi pi-users",
    image: "https://pikwizard.com/pw/medium/50238b1cad4ff412fdafc1325efa1c9f.jpg",
  },
  {
    id: 6,
    category: "LIGHTNING / NOSTR",
    title: "Lightning and Nostr integrated",
    description: "This platform is the first of its kind to integrate Lightning Network and Nostr protocols, allowing users to send and receive payments and interact with the Nostr network.",
    icon: "pi pi-bolt",
    image: "https://www.financemagnates.com/wp-content/uploads/2016/05/Bicoin-lightning.jpg",
  },
]

// todo bigger ore simple CTA to get users into the content
const InteractivePromotionalCarousel = () => {
  const [selectedPromotion, setSelectedPromotion] = useState(promotions[0])
  const { returnImageProxy } = useImageProxy();
  const windowWidth = useWindowWidth();
  const isMobileView = windowWidth <= 1360;
  const router = useRouter();

  return (
    <div className={`flex ${isMobileView ? 'flex-col' : 'flex-row'} bg-gray-900 text-white m-4 mx-14 rounded-lg ${isMobileView ? 'h-auto' : 'h-[620px]'} ${isMobileView ? 'w-full mx-0 ml-0 mt-0' : null}`}>
      <div className={isMobileView ? 'w-full' : 'lg:w-2/3 relative'}>
        <Image
          src={returnImageProxy(selectedPromotion.image)}
          alt={selectedPromotion.title}
          width={800}
          height={600}
          className={`object-cover w-full ${isMobileView ? 'h-[300px]' : 'h-full'} rounded-lg opacity-75`}
        />
        {isMobileView ? (
          <div className="p-6 space-y-2">
            <div className="uppercase text-sm font-bold text-[#f8f8ff]">{selectedPromotion.category}</div>
            <h2 className="text-4xl font-bold leading-tight text-white drop-shadow-lg">
              {selectedPromotion.title}
            </h2>
            <p className="text-lg text-white drop-shadow-md">{selectedPromotion.description}</p>
            <div className={`flex flex-row gap-2 mt-4 ${isMobileView ? 'flex-col' : ''}`}>
              {
                (() => {
                  switch (selectedPromotion.category) {
                    case "PLEBDEVS":
                      return (
                        <div className="flex flex-row gap-2">
                          <GenericButton onClick={() => router.push('/subscribe')} severity="warning" icon={<i className="pi pi-star pr-2 pb-1" />} label="Subscribe" className="w-fit py-2 font-semibold" size="small" outlined />
                          <GenericButton onClick={() => router.push('/content?tag=all')} severity="primary" icon={<i className="pi pi-eye pr-2" />} label="View all content" className="w-fit py-2 font-semibold" size="small" outlined />
                        </div>
                      );
                    case "COURSES":
                      return (
                        <GenericButton onClick={() => router.push('/content?tag=courses')} icon={<i className="pi pi-book pr-2 pb-1" />} label="View All Courses" className="w-fit py-2 font-semibold" size="small" outlined />
                      );
                    case "VIDEOS":
                      return (
                        <GenericButton onClick={() => router.push('/content?tag=videos')} icon={<i className="pi pi-video pr-2" />} label="View All Videos" className="w-fit py-2 font-semibold" size="small" outlined />
                      );
                    case "DOCUMENTS":
                      return (
                        <GenericButton onClick={() => router.push('/content?tag=documents')} icon={<i className="pi pi-file pr-2 pb-1" />} label="View All Documents" className="w-fit py-2 font-semibold" size="small" outlined />
                      );
                    case "COMMUNITY":
                      return (
                        <GenericButton onClick={() => router.push('/feed?channel=global')} icon={<i className="pi pi-users pr-2 pb-1" />} label="Open Community Feed" className="w-fit py-2 font-semibold" size="small" outlined />
                      );
                    case "LIGHTNING / NOSTR":
                      return (
                        <GenericButton onClick={() => router.push('/subscribe')} severity="warning" icon={<i className="pi pi-star pr-2 pb-1" />} label="Subscribe" className="w-fit py-2 font-semibold" size="small" outlined />
                      );
                    default:
                      return null;
                  }
                })()
              }
            </div>
          </div>
        ) : (
          <>
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/70 to-transparent rounded-lg" />
            <div className={`absolute bottom-0 left-0 p-6 space-y-2 ${isMobileView ? 'pb-16' : ''}`}>
              <div className="uppercase text-sm font-bold text-[#f8f8ff]">{selectedPromotion.category}</div>
              <h2 className="text-4xl font-bold leading-tight text-white drop-shadow-lg">
                {selectedPromotion.title}
              </h2>
              <p className="text-lg text-white drop-shadow-md">{selectedPromotion.description}</p>
              <div className="flex flex-row gap-2 mt-4">
                {
                  (() => {
                    switch (selectedPromotion.category) {
                      case "PLEBDEVS":
                        return (
                          <>
                            <GenericButton onClick={() => router.push('/about')} severity="success" icon={<i className="pi pi-question-circle pr-2 pb-[2px]" />} label="Learn More" className="py-2 font-semibold" size="small" outlined />
                            <GenericButton onClick={() => router.push('/subscribe')} severity="warning" icon={<i className="pi pi-star pr-2 pb-1" />} label="Subscribe" className="py-2 font-semibold" size="small" outlined />
                            <GenericButton onClick={() => router.push('/content?tag=all')} severity="primary" icon={<i className="pi pi-eye pr-2" />} label="View all content" className="py-2 font-semibold" size="small" outlined />
                          </>
                        );
                      case "COURSES":
                        return (
                          <GenericButton onClick={() => router.push('/content?tag=courses')} icon={<i className="pi pi-book pr-2 pb-1" />} label="View All Courses" className="py-2 font-semibold" size="small" outlined />
                        );
                      case "VIDEOS":
                        return (
                          <GenericButton onClick={() => router.push('/content?tag=videos')} icon={<i className="pi pi-video pr-2" />} label="View All Videos" className="py-2 font-semibold" size="small" outlined />
                        );
                      case "DOCUMENTS":
                        return (
                          <GenericButton onClick={() => router.push('/content?tag=documents')} icon={<i className="pi pi-file pr-2 pb-1" />} label="View All Documents" className="py-2 font-semibold" size="small" outlined />
                        );
                      case "COMMUNITY":
                        return (
                          <GenericButton onClick={() => router.push('/feed?channel=global')} icon={<i className="pi pi-users pr-2 pb-1" />} label="Open Community Feed" className="py-2 font-semibold" size="small" outlined />
                        );
                      case "LIGHTNING / NOSTR":
                        return (
                          <GenericButton onClick={() => router.push('/subscribe')} severity="warning" icon={<i className="pi pi-star pr-2 pb-1" />} label="Subscribe" className="py-2 font-semibold" size="small" outlined />
                        );
                      default:
                        return null;
                    }
                  })()
                }
              </div>
            </div>
          </>
        )}
      </div>
      <div className={isMobileView ? 'w-full p-4' : 'lg:w-1/3 p-6 space-y-4'}>
        {isMobileView ? (
          <div className="flex overflow-x-auto pb-4 space-x-4">
            {promotions.map((promo) => (
              <div
                key={promo.id}
                className={`flex-shrink-0 w-48 space-y-2 cursor-pointer transition-colors duration-200 ${selectedPromotion.id === promo.id ? "bg-gray-800" : "hover:bg-gray-700"
                  } p-3 rounded-lg shadow-lg`}
                onClick={() => setSelectedPromotion(promo)}>
                <div className="flex items-center gap-2">
                  <i className={`${promo.icon} text-2xl text-[#f8f8ff]`}></i>
                  <div className="text-sm font-bold text-[#f8f8ff]">{promo.category}</div>
                </div>
                <h4 className="text-white font-semibold">{promo.title}</h4>
              </div>
            ))}
          </div>
        ) : (
          promotions.map((promo) => (
            <div
              key={promo.id}
              className={`space-y-2 cursor-pointer transition-colors duration-200 ${selectedPromotion.id === promo.id ? "bg-gray-800" : "hover:bg-gray-700"
                } p-3 rounded-lg shadow-lg`}
              onClick={() => setSelectedPromotion(promo)}>
              <div className="flex items-center gap-2">
                <i className={`${promo.icon} text-2xl text-[#f8f8ff]`}></i>
                <div className="text-sm font-bold text-[#f8f8ff]">{promo.category}</div>
              </div>
              <h4 className="text-white font-semibold">{promo.title}</h4>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default InteractivePromotionalCarousel;