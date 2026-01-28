import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "bendbasis",
    short_name: "bendbasis",
    description:
      "Funding arbitrage dashboard for comparing funding rates across exchanges.",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#1c202f",
    icons: [
      {
        src: "/web-app-manifest-512x512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
