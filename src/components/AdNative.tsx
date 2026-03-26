import { useEffect, useRef } from "react";

const AdNative = () => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;

    const script = document.createElement("script");
    script.src = "https://pl28984248.profitablecpmratenetwork.com/0996b47df52af7b9abd4e4d8f1f78fdd/invoke.js";
    script.async = true;
    script.setAttribute("data-cfasync", "false");

    ref.current.appendChild(script);

    return () => {
      if (ref.current) ref.current.innerHTML = "";
    };
  }, []);

  return (
    <div
      id="container-0996b47df52af7b9abd4e4d8f1f78fdd"
      ref={ref}
      className="ad-native"
    />
  );
};

export default AdNative;
