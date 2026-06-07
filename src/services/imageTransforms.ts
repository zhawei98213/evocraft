export type ImageRotationDirection = "left" | "right";

export function getNextImageRotationDegrees(
  currentDegrees: number,
  direction: ImageRotationDirection,
) {
  const delta = direction === "right" ? 90 : -90;
  return (currentDegrees + delta + 360) % 360;
}

export function rotateImageDataUrl(
  imageUri: string,
  direction: ImageRotationDirection,
): Promise<string> {
  if (typeof document === "undefined" || typeof Image === "undefined") {
    return Promise.reject(new Error("image_rotation_failed"));
  }

  const probeCanvas = document.createElement("canvas");
  if (!probeCanvas.getContext("2d")) {
    return Promise.reject(new Error("image_rotation_failed"));
  }

  return new Promise<string>((resolve, reject) => {
    const failRotation = () => reject(new Error("image_rotation_failed"));
    const image = new Image();
    const fallbackTimer = window.setTimeout(failRotation, 5000);

    image.addEventListener(
      "load",
      () => {
        window.clearTimeout(fallbackTimer);
        try {
          const sourceWidth = image.naturalWidth || image.width;
          const sourceHeight = image.naturalHeight || image.height;
          if (!sourceWidth || !sourceHeight) {
            failRotation();
            return;
          }

          const canvas = document.createElement("canvas");
          canvas.width = sourceHeight;
          canvas.height = sourceWidth;
          const context = canvas.getContext("2d");
          if (!context) {
            failRotation();
            return;
          }

          context.translate(canvas.width / 2, canvas.height / 2);
          context.rotate((direction === "right" ? Math.PI : -Math.PI) / 2);
          context.drawImage(image, -sourceWidth / 2, -sourceHeight / 2, sourceWidth, sourceHeight);
          resolve(canvas.toDataURL("image/png"));
        } catch {
          failRotation();
        }
      },
      { once: true },
    );
    image.addEventListener(
      "error",
      () => {
        window.clearTimeout(fallbackTimer);
        failRotation();
      },
      { once: true },
    );
    image.src = imageUri;
  });
}
