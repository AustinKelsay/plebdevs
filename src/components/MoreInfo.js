import React, { useState, useEffect } from "react";
import { Dialog } from "primereact/dialog";
import { Tooltip } from "primereact/tooltip";
import useWindowWidth from "@/hooks/useWindowWidth";
import styles from "./moreinfo.module.css";

const MoreInfo = ({ tooltip, modalTitle, modalBody, className = "" }) => {
  const [visible, setVisible] = useState(false);
  const windowWidth = useWindowWidth();
  const isMobile = windowWidth < 768;

  // Add blur effect when modal is visible
  useEffect(() => {
    const mainContent = document.querySelector(".main-content");
    if (mainContent) {
      if (visible) {
        mainContent.classList.add(styles.blurredContent);
      } else {
        mainContent.classList.remove(styles.blurredContent);
      }
    }
  }, [visible]);

  const onHide = () => {
    setVisible(false);
  };

  return (
    <>
      <i
        className={`pi pi-question-circle cursor-pointer ${className}`}
        onClick={() => setVisible(true)}
        data-pr-tooltip={tooltip}
        data-pr-position="right"
        data-pr-at="right+5 top"
        data-pr-my="left center-2"
      />
      {!isMobile && <Tooltip target=".pi-question-circle" />}

      <Dialog
        header={modalTitle}
        visible={visible}
        onHide={onHide}
        className="max-w-3xl"
        modal
        dismissableMask // This enables click-outside-to-close
        closeOnEscape // This enables closing with Escape key
        breakpoints={{ "960px": "75vw", "641px": "90vw" }}
        pt={{
          mask: { className: "backdrop-blur-none" }, // Ensures the Dialog's mask doesn't add its own blur
        }}
      >
        {typeof modalBody === "string" ? (
          <p className="text-gray-200">{modalBody}</p>
        ) : (
          modalBody
        )}
      </Dialog>
    </>
  );
};

export default MoreInfo;
