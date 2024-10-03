import Image from "next/image"
import { useState, useRef, useEffect } from "react"
import { useImageProxy } from "@/hooks/useImageProxy"
import GenericButton from "@/components/buttons/GenericButton"
import { useRouter } from "next/router"
import useWindowWidth from "@/hooks/useWindowWidth"
import NostrIcon from "../../../../public/images/nostr.png"
import { useToast } from "@/hooks/useToast";

// With current spacing the title can only be 1 line
const promotions = [
  {
    id: 1,
    category: "PLEBDEVS",
    title: "Developer education / community platform",
    description: "PlebDevs is your gateway to mastering Bitcoin, Lightning, and Nostr technologies. Join our community of aspiring developers and start your journey today!",
    icon: "pi pi-code",
    video: "/videos/plebdevs-montage.mp4",
  },
  {
    id: 2,
    category: "CONTENT",
    title: "Comprehensive Learning Resources",
    description: "Access our extensive library of courses, videos, and documents. From structured learning paths to hands-on workshops, we've got everything you need to master Bitcoin, Lightning, and Nostr development.",
    icon: "pi pi-book",
    image: "https://media.istockphoto.com/id/1224500457/photo/programming-code-abstract-technology-background-of-software-developer-and-computer-script.jpg?s=612x612&w=0&k=20&c=nHMypkMTU1HUUW85Zt0Ff7MDbq17n0eVeXaoM9Knt4Q=",
  },
  {
    id: 3,
    category: "COMMUNITY",
    title: "Join Our Community of learners / hackers",
    description: "Connect with other developers, share your projects, and get support from our community of Bitcoin enthusiasts.",
    icon: "pi pi-users",
    image: "https://pikwizard.com/pw/medium/50238b1cad4ff412fdafc1325efa1c9f.jpg",
  },
  {
    id: 4,
    category: "LIGHTNING / NOSTR",
    title: "Lightning and Nostr integrated platform",
    description: "This platform is the first of its kind to integrate Lightning Network and Nostr protocols, allowing users to send and receive payments and interact with the Nostr network.",
    icon: "pi pi-bolt",
    image: "https://www.financemagnates.com/wp-content/uploads/2016/05/Bicoin-lightning.jpg",
  },
]

const InteractivePromotionalCarousel = () => {
  const [selectedPromotion, setSelectedPromotion] = useState(promotions[0])
  const { returnImageProxy } = useImageProxy();
  const { showToast } = useToast();
  const windowWidth = useWindowWidth();
  const isMobileView = windowWidth <= 1360;
  const router = useRouter();
  const videoRef = useRef(null);

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      showToast("success", "Copied", "Copied Lightning Address to clipboard");
      if (window && window?.webln && window?.webln?.lnurl) {
        await window.webln.enable();
        const result = await window.webln.lnurl("austin@bitcoinpleb.dev");
        if (result && result?.preimage) {
          showToast("success", "Payment Sent", "Thank you for your donation!");
        }
      }
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  useEffect(() => {
    if (videoRef.current && selectedPromotion.video) {
      videoRef.current.play();
    }
  }, [selectedPromotion]);

  return (
    <div className={`flex ${isMobileView ? 'flex-col' : 'flex-row'} bg-gray-900 text-white m-4 mx-14 rounded-lg ${isMobileView ? 'h-auto' : 'h-[620px]'} ${isMobileView ? 'w-full mx-0 ml-0 mt-0' : null}`}>
      <div className={isMobileView ? 'w-full' : 'lg:w-2/3 relative'}>
        {selectedPromotion.video ? (
          <video
            ref={videoRef}
            src={selectedPromotion.video}
            className={`object-cover w-full ${isMobileView ? 'h-[300px]' : 'h-full'} rounded-lg`}
            loop
            muted
            playsInline
          />
        ) : (
          <Image
            src={returnImageProxy(selectedPromotion.image)}
            alt={selectedPromotion.title}
            width={800}
            height={600}
            className={`object-cover w-full ${isMobileView ? 'h-[300px]' : 'h-full'} rounded-lg opacity-75`}
          />
        )}
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
                    case "CONTENT":
                      return (
                        <>
                          <GenericButton onClick={() => router.push('/content?tag=courses')} icon={<i className="pi pi-book pr-2 pb-1" />} label="Courses" className="py-2 font-semibold" size="small" outlined />
                          <GenericButton onClick={() => router.push('/content?tag=videos')} icon={<i className="pi pi-video pr-2" />} label="Videos" className="py-2 font-semibold" size="small" outlined />
                          <GenericButton onClick={() => router.push('/content?tag=documents')} icon={<i className="pi pi-file pr-2 pb-1" />} label="Documents" className="py-2 font-semibold" size="small" outlined />
                        </>
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
                      case "CONTENT":
                        return (
                          <>
                            <GenericButton onClick={() => router.push('/content?tag=courses')} icon={<i className="pi pi-book pr-2 pb-1" />} label="Courses" className="py-2 font-semibold" size="small" outlined />
                            <GenericButton onClick={() => router.push('/content?tag=videos')} icon={<i className="pi pi-video pr-2" />} label="Videos" className="py-2 font-semibold" size="small" outlined />
                            <GenericButton onClick={() => router.push('/content?tag=documents')} icon={<i className="pi pi-file pr-2 pb-1" />} label="Documents" className="py-2 font-semibold" size="small" outlined />
                          </>
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
      <div className={isMobileView ? 'w-full p-4' : 'lg:w-1/3 p-4 space-y-4'}>
        {isMobileView ? (
          <div className="flex overflow-x-auto pb-4 space-x-4">
            {promotions.map((promo) => (
              <div
                key={promo.id}
                className={`flex-shrink-0 w-64 space-y-4 cursor-pointer transition-colors duration-200 bg-gray-800 ${selectedPromotion.id === promo.id ? "bg-gray-800" : "hover:bg-gray-700"
                  } p-4 rounded-lg shadow-lg`}
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
              className={`space-evenly cursor-pointer transition-colors duration-200 bg-gray-800 ${selectedPromotion.id === promo.id ? "bg-gray-800" : "hover:bg-gray-700"
                } p-4 rounded-lg shadow-lg`}
              onClick={() => setSelectedPromotion(promo)}>
              <div className="flex items-center gap-2">
                <i className={`${promo.icon} text-xl text-[#f8f8ff]`}></i>
                <div className="font-semibold text-[#f8f8ff]">{promo.category}</div>
              </div>
              <h4 className="text-white">{promo.title}</h4>
            </div>
          ))
        )}
        <div className="flex flex-col bg-gray-800 p-4 rounded-lg shadow-lg">
          <p>Welcome! 👋</p>
          <p>Plebdevs is open source software and is still in early development. If you have any questions drop an issue on the Github repo, or reach out to me in the Community tab, cheers! - <span className="italic">Austin</span></p>
          <div className="flex flex-wrap gap-4 justify-center mt-2">
            <i
              className="pi pi-github text-gray-300 cursor-pointer text-xl hover:opacity-80"
              onClick={() => window.open('https://github.com/pleb-devs', '_blank')}
              title="Github"
            />
            <i
              className="pi pi-twitter text-blue-400 rounded-full cursor-pointer text-xl hover:opacity-80"
              onClick={() => window.open('https://x.com/pleb_devs', '_blank')}
              title="X"
            />
            <Image
              src={NostrIcon}
              alt="Nostr"
              width={22}
              height={22}
              className="cursor-pointer hover:opacity-80"
              onClick={() => window.open('https://nostr.com/plebdevs@plebdevs.com', '_blank')}
              title="Nostr"
            />
            <i
              className="pi pi-bolt text-yellow-400 cursor-pointer text-xl hover:opacity-80"
              onClick={() => copyToClipboard("austin@bitcoinpleb.dev")}
              title="Donate"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default InteractivePromotionalCarousel;