import planetNamek from "@/assets/zones/planet-namek.png";
import testingGates from "@/assets/zones/testing-gates.png";
import shibuyaStation from "@/assets/zones/shibuya-station.png";
import scrapIsland from "@/assets/zones/scrap-island.png";
import musutafu from "@/assets/zones/musutafu.png";
import huecoMundo from "@/assets/zones/hueco-mundo.png";
import chuninExam from "@/assets/zones/chunin-exam.png";
import baschool from "@/assets/zones/baschool.png";

export const ZONE_IMAGES: Record<string, string> = {
  "Planet Namek": planetNamek,
  "Testing Gates": testingGates,
  "Shibuya Station": shibuyaStation,
  "Scrap Island": scrapIsland,
  "Musutafu": musutafu,
  "Hueco Mundo": huecoMundo,
  "Chunin Exam Arena": chuninExam,
  "Baschool": baschool,
};

export const ZONE_IMAGE_LIST: string[] = [
  planetNamek,
  testingGates,
  shibuyaStation,
  scrapIsland,
  musutafu,
  huecoMundo,
  chuninExam,
  baschool,
];

const NORMALIZED_ZONE_IMAGES: Record<string, string> = Object.fromEntries(
  Object.entries(ZONE_IMAGES).map(([name, src]) => [
    name.trim().toLowerCase().replace(/\s+/g, " " ),
    src,
  ])
);

export const getZoneImage = (name: string): string | undefined => {
  const normalized = name.trim().toLowerCase().replace(/\s+/g, " ");
  return NORMALIZED_ZONE_IMAGES[normalized] || ZONE_IMAGES[name];
};
