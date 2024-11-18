import { signIn, useSession, getSession } from "next-auth/react"
import { useRouter } from "next/router";
import { useState, useEffect } from "react"
import { useNDKContext } from "@/context/NDKContext";
import GenericButton from "@/components/buttons/GenericButton";
import { InputText } from 'primereact/inputtext';

export default function SignIn() {
  const [email, setEmail] = useState("")
  const [showEmailInput, setShowEmailInput] = useState(false)
  const {ndk, addSigner} = useNDKContext();
  const { data: session, status } = useSession();
  const router = useRouter();

  const handleEmailSignIn = async (e) => {
    e.preventDefault()
    await signIn("email", { email, callbackUrl: '/' })
  }

  const handleNostrSignIn = async (e) => {
    e.preventDefault()
    if (!ndk.signer) {
      await addSigner();
    }
    try {
      const user = await ndk.signer.user()
      const pubkey = user?._pubkey
      signIn("nostr", { pubkey })
    } catch (error) {
      console.error("Error signing Nostr event:", error)
    }
  }

  const handleAnonymousSignIn = async (e) => {
    e.preventDefault()
    
    // Check if we have keys in local storage
    const storedPubkey = localStorage.getItem('anonymousPubkey')
    const storedPrivkey = localStorage.getItem('anonymousPrivkey')
    
    const result = await signIn("anonymous", { 
      pubkey: storedPubkey, 
      privkey: storedPrivkey,
      redirect: false
    })

    if (result?.ok) {
      // Fetch the session to get the pubkey and privkey
      const session = await getSession()
      if (session?.pubkey && session?.privkey) {
        localStorage.setItem('anonymousPubkey', session.pubkey)
        localStorage.setItem('anonymousPrivkey', session.privkey)
        router.push('/')
      } else {
        console.error("Pubkey or privkey not found in session")
      }
      // Redirect or update UI as needed
    } else {
      // Handle error
      console.error("Anonymous login failed:", result?.error)
    }
  }

  return (
    <div className="w-[100vw] min-bottom-bar:w-[86vw] mx-auto mt-24 flex flex-col justify-center">
      <h1 className="text-center mb-8">Sign In</h1>
      <GenericButton
        label={"login with nostr"}
        icon="pi pi-user"
        className="text-[#f8f8ff] w-[250px] my-4 mx-auto"
        rounded
        onClick={handleNostrSignIn}
      />
      <GenericButton
        label={"login with email"}
        icon="pi pi-envelope"
        className="text-[#f8f8ff] w-[250px] my-4 mx-auto"
        rounded
        onClick={() => setShowEmailInput(!showEmailInput)}
      />
      <GenericButton
        label={"login with github"}
        icon="pi pi-github"
        className="text-[#f8f8ff] w-[250px] my-4 mx-auto"
        rounded
        onClick={() => signIn("github")}
      />
      {showEmailInput && (
        <form onSubmit={handleEmailSignIn} className="flex flex-col items-center bg-gray-700 w-fit mx-auto p-4 rounded-lg">
          <InputText
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            className="w-[250px] my-4"
          />
          <GenericButton
            type="submit"
            label={"Submit"}
            icon="pi pi-check"
            className="text-[#f8f8ff] w-fit my-4"
            rounded
          />
        </form>
      )}
      <GenericButton
        label={"login anonymously"}
        icon="pi pi-eye-slash"
        className="text-[#f8f8ff] w-[250px] my-4 mx-auto"
        rounded
        onClick={handleAnonymousSignIn}
      />
    </div>
  )
}