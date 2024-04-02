import { useState, useEffect } from "react";

export const useMessagesBoxHeight = () => {
  const [windowHeight, setWindowHeight] = useState<number>(window ? window.innerHeight : 0);
  window.onresize = function (_event) {
    setWindowHeight(window.innerHeight);
  };

  useEffect(() => {
    const footer = document.getElementById("chat-field");
    const avatar = document.getElementById("avatar");
    const videoHeight = avatar ? avatar.offsetHeight : 0;
    const footerHeight = footer ? footer.offsetHeight : 0;
    document.documentElement.style.setProperty(
      "--messages-height",
      `${windowHeight - (videoHeight + footerHeight + 38)}px`
    );
  }, [windowHeight]);
};
