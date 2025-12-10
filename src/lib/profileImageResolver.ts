import { PROFILE_PICTURES, MENTOR_IMAGES } from "@/constants/images";

// Use the first profile picture as default avatar instead of placeholder
const DEFAULT_AVATAR = PROFILE_PICTURES[0].url;
const MENTOR_MAP = MENTOR_IMAGES as Record<string, string>;

/**
 * Resolves a profile picture URL from various formats:
 * - "profile:id" format (e.g., "profile:nobara")
 * - "mentor:key" format (e.g., "mentor:nobara")
 * - Direct URL (http/https or /assets paths)
 * - undefined/null returns default avatar
 * - If username is "Admin", returns admin profile picture
 */
export const resolveProfileImage = (url?: string | null, username?: string | null): string => {
  // Check for admin user first
  if (username === "Admin") {
    const adminPic = PROFILE_PICTURES.find(p => p.id === "admin");
    if (adminPic) return adminPic.url;
  }
  
  if (!url) return DEFAULT_AVATAR;
  
  const normalized = url.trim();
  if (!normalized || normalized === "/placeholder.svg") {
    return DEFAULT_AVATAR;
  }
  
  // Handle profile: prefix
  if (normalized.startsWith('profile:')) {
    const key = normalized.replace('profile:', '');
    const found = PROFILE_PICTURES.find(p => p.id === key);
    return (found?.url as string) || DEFAULT_AVATAR;
  }
  
  // Handle mentor: prefix
  if (normalized.startsWith('mentor:')) {
    const key = normalized.replace('mentor:', '');
    const found = MENTOR_MAP[key];
    return found || DEFAULT_AVATAR;
  }
  
  // Direct URL (already processed or http/https)
  if (normalized.startsWith("http://") || normalized.startsWith("https://")) {
    return normalized;
  }

  // Handle legacy /src/assets/profile-pics/* paths by mapping to known images
  if (normalized.startsWith("/src/assets/profile-pics/")) {
    const filename = normalized.split("/").pop() || "";
    const found = PROFILE_PICTURES.find((p) => p.url.includes(filename));
    return (found?.url as string) || DEFAULT_AVATAR;
  }

  return DEFAULT_AVATAR;
};
/**
 * Converts a profile picture URL to the "profile:id" format for storage
 */
export const getProfileIdFromUrl = (url?: string): string | null => {
  if (!url) return null;
  
  // Already in profile: format
  if (url.startsWith('profile:')) {
    return url;
  }
  
  // Find matching profile picture by URL
  const found = PROFILE_PICTURES.find(p => p.url === url);
  if (found) {
    return `profile:${found.id}`;
  }
  
  // If it's a direct URL that we don't recognize, store it as-is
  return url;
};

/**
 * Maps mentor information to profile picture ID
 */
export const mapMentorToProfileId = (mentor?: { name?: string; image_url?: string }): string | undefined => {
  const normalize = (s: string) => (s || "").toLowerCase().replace(/[^a-z0-9]/g, "");

  const nameToProfileId: Record<string, string> = {
    yujiitadori: "yuji",
    yuji: "yuji",
    sasukeuchiha: "sasuke",
    sasuke: "sasuke",
    sakuraharuno: "sakura",
    sakura: "sakura",
    rukiakuchiki: "rukia",
    rukia: "rukia",
    roymustang: "roy",
    roy: "roy",
    nobarakugisaki: "nobara",
    kugisakinobara: "nobara",
    nobara: "nobara",
    narutouzumaki: "naruto",
    naruto: "naruto",
    monkeydluffy: "luffy",
    luffy: "luffy",
    krillin: "krillin",
    kakashihatake: "kakashi",
    kakashi: "kakashi",
    izukumidoriya: "izuku",
    izuku: "izuku",
    deku: "izuku",
    ichigokurosaki: "ichigo",
    ichigo: "ichigo",
    gonfreecss: "gon",
    gon: "gon",
    hisokamorow: "hisoka",
    hisoka: "hisoka",
    goku: "goku",
    songoku: "goku",
    edwardelric: "edward",
    edward: "edward",
    cell: "cell",
    android18: "c18",
    c18: "c18",
    portgasdace: "ace",
    ace: "ace",
    bakugokatsuki: "bakugo",
    katsukibakugo: "bakugo",
    bakugo: "bakugo",
  };

  // Prefer explicit mentor:image key when present
  let idFromImage: string | undefined;
  if (mentor?.image_url?.startsWith("mentor:")) {
    const raw = normalize(mentor.image_url.slice("mentor:".length));
    const aliasMap: Record<string, string> = { deku: "izuku" };
    idFromImage = aliasMap[raw] || raw;
  }

  const idFromName = nameToProfileId[normalize(mentor?.name || "")];
  return idFromImage || idFromName;
};

/**
 * Gets profile picture object for a mentor
 */
export const getProfilePictureForMentor = (mentor?: { name?: string; image_url?: string }) => {
  const targetId = mapMentorToProfileId(mentor);
  if (!targetId) return undefined;
  return PROFILE_PICTURES.find((pic) => pic.id.toLowerCase() === targetId);
};
