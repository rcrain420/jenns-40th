export type Sponsor = {
  name: string;
  logoSrc: string;
  logoWidth: number;
  logoHeight: number;
  href?: string;
};

/** Homepage sponsor logos. Add entries here as more partners come on. */
export const SPONSORS: Sponsor[] = [
  {
    name: "Waterloo Rod Company",
    logoSrc: "/sponsors/waterloo-rod-company.jpg",
    logoWidth: 384,
    logoHeight: 256,
    href: "https://www.waterloorods.com/",
  },
];
