/**
 * Client-side diagram download utilities.
 * Supports exporting rendered Mermaid SVGs to SVG files and crisp, high-resolution PNGs.
 */

export const downloadSvg = (containerEl: HTMLDivElement | null, fileName: string) => {
  if (!containerEl) return;
  const svgEl = containerEl.querySelector("svg");
  if (!svgEl) return;

  try {
    const svgClone = svgEl.cloneNode(true) as SVGElement;

    // Ensure XML namespaces are present
    svgClone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    svgClone.setAttribute("xmlns:xlink", "http://www.w3.org/1999/xlink");

    const svgSerializer = new XMLSerializer();
    const svgString = svgSerializer.serializeToString(svgClone);

    const blob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    // Clean filename (remove special chars)
    const safeName = fileName.replace(/[^a-z0-9]/gi, "_").toLowerCase() || "diagram";
    link.download = `${safeName}.svg`;

    document.body.appendChild(link);
    link.click();

    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error("Failed to download SVG:", error);
  }
};

export const downloadPng = (containerEl: HTMLDivElement | null, fileName: string) => {
  if (!containerEl) return;
  const svgEl = containerEl.querySelector("svg");
  if (!svgEl) return;

  try {
    const svgClone = svgEl.cloneNode(true) as SVGElement;
    svgClone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    svgClone.setAttribute("xmlns:xlink", "http://www.w3.org/1999/xlink");

    // Fetch dimensions
    const rect = svgEl.getBoundingClientRect();
    const width = rect.width || 800;
    const height = rect.height || 600;

    svgClone.setAttribute("width", String(width));
    svgClone.setAttribute("height", String(height));

    const svgSerializer = new XMLSerializer();
    const svgString = svgSerializer.serializeToString(svgClone);

    // Convert to a base64 Data URL to load into Image
    const svgBlob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(svgBlob);

    const img = new Image();
    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");

        // Scale factor for high DPI/Retina quality (2x)
        const scale = 2;
        canvas.width = width * scale;
        canvas.height = height * scale;

        const ctx = canvas.getContext("2d");
        if (ctx) {
          // Fill white background so transparent SVGs don't output black/blank backgrounds
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(0, 0, canvas.width, canvas.height);

          ctx.scale(scale, scale);
          ctx.drawImage(img, 0, 0, width, height);

          canvas.toBlob((blob) => {
            if (blob) {
              const pngUrl = URL.createObjectURL(blob);
              const link = document.createElement("a");
              link.href = pngUrl;

              const safeName = fileName.replace(/[^a-z0-9]/gi, "_").toLowerCase() || "diagram";
              link.download = `${safeName}.png`;

              document.body.appendChild(link);
              link.click();

              document.body.removeChild(link);
              URL.revokeObjectURL(pngUrl);
            }
          }, "image/png");
        }
      } catch (err) {
        console.error("Canvas draw failure during PNG export:", err);
      } finally {
        URL.revokeObjectURL(url);
      }
    };
    img.src = url;
  } catch (error) {
    console.error("Failed to download PNG:", error);
  }
};
