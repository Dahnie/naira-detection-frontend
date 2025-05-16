// hooks/useCurrencyCropper.ts
import { useState } from "react";

export function useCurrencyCropper() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cropCurrencyFromImage = async (file: File): Promise<Blob | null> => {
    setLoading(true);
    setError(null);

    try {
      const apiKey = import.meta.env.VITE_ROBOFLOW_API_KEY; // your Roboflow API key
      const model = "naira-currency"; // your model slug
      const version = "1"; // model version
      const url = `https://detect.roboflow.com/${model}/${version}?api_key=${apiKey}`;

      // Convert image to base64
      const base64 = await toBase64(file);

      // Send to Roboflow API
      const response = await fetch(url, {
        method: "POST",
        body: base64,
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      });

      const result = await response.json();
      const box = result.predictions?.[0];
      if (!box) {
        setError("No currency detected.");
        return null;
      }

      const img = new Image();
      img.src = URL.createObjectURL(file);
      await new Promise((res) => (img.onload = res));

      // Crop using bounding box
      const canvas = document.createElement("canvas");
      canvas.width = box.width;
      canvas.height = box.height;

      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Canvas context not available.");

      ctx.drawImage(
        img,
        box.x,
        box.y,
        box.width,
        box.height,
        0,
        0,
        box.width,
        box.height
      );

      return await new Promise((resolve) =>
        canvas.toBlob((blob) => resolve(blob), "image/jpeg")
      );
    } catch (err: any) {
      console.error(err);
      setError("Detection failed.");
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { cropCurrencyFromImage, loading, error };
}

function toBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () =>
      resolve(
        (reader.result as string).replace(/^data:image\/[a-z]+;base64,/, "")
      );
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
}

export const cropCurrencyFromImage = async (
  file: File
): Promise<Blob | null> => {
  //   setLoading(true);
  //   setError(null);

  try {
    const apiKey = import.meta.env.VITE_ROBOFLOW_API_KEY; // your Roboflow API key
    const model = "naira-currency"; // your model slug
    const version = "1"; // model version
    const url = `https://detect.roboflow.com/${model}/${version}?api_key=${apiKey}`;

    // Convert image to base64
    const base64 = await toBase64(file);

    // Send to Roboflow API
    const response = await fetch(url, {
      method: "POST",
      body: base64,
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });

    const result = await response.json();
    const box = result.predictions?.[0];
    if (!box) {
      //   setError("No currency detected.");
      return null;
    }

    const img = new Image();
    img.src = URL.createObjectURL(file);
    await new Promise((res) => (img.onload = res));

    // Crop using bounding box
    const canvas = document.createElement("canvas");
    canvas.width = box.width;
    canvas.height = box.height;

    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas context not available.");

    ctx.drawImage(
      img,
      box.x,
      box.y,
      box.width,
      box.height,
      0,
      0,
      box.width,
      box.height
    );

    return await new Promise((resolve) =>
      canvas.toBlob((blob) => resolve(blob), "image/jpeg")
    );
  } catch (err: any) {
    console.error(err);
    return null;
  } finally {
  }
};
