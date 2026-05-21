export interface PhotoItem {
  id: string;
  url: string; // can be static URL, external URL or base64 data string
  caption: string;
}

export interface PartyConfig {
  partyDate: string;
  partyTime: string;
  address: string;
  rsvpDeadline: string;
  clothingSize: string;
  shoeSize: string;
  diaperSize: string;
  pixKey: string;
  photos: PhotoItem[];
  mainPhoto?: string;
}

export interface RsvpEntry {
  id: string;
  name: string;
  isAttending: boolean;
  adults: number;
  children: number;
  childrenAges: string;
  createdAt: string;
}
