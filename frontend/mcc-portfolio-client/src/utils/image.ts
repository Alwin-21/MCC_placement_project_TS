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
        objectPosition: "center"
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
          objectPosition: "center"
        }
      };
    }

    const cleanUrl = url.substring(0, paramsIndex);
    const searchParams = new URLSearchParams(url.substring(paramsIndex + 1));
    
    const scale = searchParams.get("scale") || "1";
    const rotate = searchParams.get("rotate") || "0";
    const x = searchParams.get("x") || "50";
    const y = searchParams.get("y") || "50";
    const fit = searchParams.get("fit") || "cover";

    return {
      src: cleanUrl,
      style: {
        transform: `scale(${scale}) rotate(${rotate}deg)`,
        objectPosition: `${x}% ${y}%`,
        objectFit: fit as any
      }
    };
  } catch (e) {
    return {
      src: url,
      style: {
        objectFit: "cover" as const,
        objectPosition: "center"
      }
    };
  }
}
