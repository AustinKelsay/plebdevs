import React, { useState, useEffect } from "react";
import { Dialog } from "primereact/dialog";
import { Tooltip } from "primereact/tooltip";
import useWindowWidth from "@/hooks/useWindowWidth";

const MoreInfo = ({ tooltip, modalTitle, modalBody, className = "" }) => {
  const [visible, setVisible] = useState(false);
  const windowWidth = useWindowWidth();
  const isMobile = windowWidth < 768;

  useEffect(() => {
    const mainContent = document.querySelector(".main-content");
    if (mainContent) {
      if (visible) {
        mainContent.classList.add(
          "filter",
          "blur-md",
          "transition-all",
          "duration-200",
          "ease-in-out"
        );
      } else {
        mainContent.classList.remove(
          "filter",
          "blur-md",
          "transition-all",
          "duration-200",
          "ease-in-out"
        );
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
        dismissableMask
        closeOnEscape
        breakpoints={{ "960px": "75vw", "641px": "90vw" }}
        pt={{
          mask: { className: "backdrop-blur-none" },
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
