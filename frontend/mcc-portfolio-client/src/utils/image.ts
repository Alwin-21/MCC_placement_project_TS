export interface ImageAdjustments {
  scale: number;
  rotate: number;
  x: number;
  y: number;
  fit: string;
}

export function parseImageAdjustments(url: string | null | undefined) {
  if (!url) {
    return {
      src: "",
      style: {
        objectFit: "cover" as const,
        objectPosition: "center",
        transform: "translate(0%, 0%) rotate(0deg) scale(1)",
        transformOrigin: "center center"
      }
    };
  }

  try {
    const paramsIndex = url.indexOf("?");
    if (paramsIndex === -1) {
      return {
        src: url,
        style: {
          objectFit: "cover" as const,
          objectPosition: "center",
          transform: "translate(0%, 0%) rotate(0deg) scale(1)",
          transformOrigin: "center center"
        }
      };
    }

    const cleanUrl = url.substring(0, paramsIndex);
    const searchParams = new URLSearchParams(url.substring(paramsIndex + 1));
    
    const scale = searchParams.get("scale") || "1";
    const rotate = searchParams.get("rotate") || "0";
    const x = parseFloat(searchParams.get("x") || "50");
    const y = parseFloat(searchParams.get("y") || "50");
    const fit = searchParams.get("fit") || "cover";

    // Convert 0..100 slider range to -50%..+50% translation offset
    const offsetX = x - 50;
    const offsetY = y - 50;

    return {
      src: cleanUrl,
      style: {
        transform: `translate(${offsetX}%, ${offsetY}%) rotate(${rotate}deg) scale(${scale})`,
        transformOrigin: "center center",
        objectPosition: "center",
        objectFit: fit as any
      }
    };
  } catch (e) {
    return {
      src: url,
      style: {
        objectFit: "cover" as const,
        objectPosition: "center",
        transform: "translate(0%, 0%) rotate(0deg) scale(1)",
        transformOrigin: "center center"
      }
    };
  }
}
