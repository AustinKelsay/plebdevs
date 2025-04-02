import React, { useEffect, useRef } from "react";

const ZapThreadsWrapper = ({
  anchor,
  user,
  relays,
  disable,
  className,
  isAuthorized,
}) => {
  // Create a ref to store the reference to the <div> element
  const zapRef = useRef(null);

  useEffect(() => {
    // Only load the script if the user is authorized
    if (!isAuthorized) {
      return;
    }

    // Create a new <script> element
    const script = document.createElement("script");
    // Set the source URL of the script to load the ZapThreads library
    script.src = "https://unpkg.com/zapthreads/dist/zapthreads.iife.js";
    // Set the script to load asynchronously
    script.async = true;

    // Function to handle the script load event
    const handleScriptLoad = () => {
      // Create a new <zap-threads> element
      const zapElement = document.createElement("zap-threads");
      zapElement.setAttribute("anchor", anchor);

      // Only set user if it exists and is not null
      if (user) {
        zapElement.setAttribute("user", user);
      }

      // Clean up relay URLs
      const cleanRelays = relays
        .split(",")
        .map((relay) => relay.trim())
        .filter((relay) => relay)
        .join(",");
      zapElement.setAttribute("relays", cleanRelays);

      // Always set disable attribute, even if empty
      zapElement.setAttribute("disable", disable || "");

      // Add error handling
      zapElement.addEventListener("error", (e) => {
        console.error("ZapThreads error:", e);
      });

      // Remove any existing <zap-threads> element
      if (zapRef.current) {
        while (zapRef.current.firstChild) {
          zapRef.current.removeChild(zapRef.current.firstChild);
        }
      }

      // Append the new element
      if (zapRef.current) {
        zapRef.current.appendChild(zapElement);
      }
    };

    // Attach the handleScriptLoad function to the script's load event
    script.addEventListener("load", handleScriptLoad);
    script.addEventListener("error", (e) => {
      console.error("Failed to load ZapThreads script:", e);
    });

    // Append the <script> element to the <body> of the document
    document.body.appendChild(script);

    // Cleanup function to remove the <zap-threads> element and the <script> element when the component is unmounted
    return () => {
      if (zapRef.current) {
        while (zapRef.current.firstChild) {
          zapRef.current.removeChild(zapRef.current.firstChild);
        }
      }
      // Remove the <script> element from the <body> of the document
      document.body.removeChild(script);
      // Remove the load event listener from the script
      script.removeEventListener("load", handleScriptLoad);
    };
  }, [anchor, user, relays, disable, isAuthorized]);

  if (!isAuthorized) {
    return null;
  }

  // Render a <div> element and attach the zapRef to it
  return (
    <div className={`overflow-x-hidden ${className || ""}`} ref={zapRef} />
  );
};

export default ZapThreadsWrapper;
