export type PrivatePrizeContact = {
  sponsor: string;
  contactName: string | null;
  contactEmail: string | null;
};

// Server-only fulfillment contacts. Never import this module from a Client Component.
export const privatePrizeContacts: PrivatePrizeContact[] = [
  { sponsor: "Chocodela", contactName: "Adela Muller", contactEmail: "adela@chocodela.com" },
  { sponsor: "Miriam Mizrachi", contactName: "Miriam Mizrachi", contactEmail: "mimizrahi@yahoo.com" },
  { sponsor: "CNote Academy", contactName: "Chayala Neahous", contactEmail: "info@cnotestudiosnj.com" },
  { sponsor: "Makeup by Sori", contactName: "Sori Weinberger", contactEmail: "sorieisenbach19@gmail.com" },
  { sponsor: "Marcys", contactName: "Chaim Stern", contactEmail: null },
  { sponsor: "Massage by Devorah", contactName: "Devorah", contactEmail: "devorahlmt@gmail.com" },
  { sponsor: "Whoopi", contactName: null, contactEmail: "estie.whoopi@gmail.com" },
  { sponsor: "Piccolino Baby Furniture", contactName: null, contactEmail: "hello@piccolinobaby.com" },
  { sponsor: "Linen & Lounge", contactName: null, contactEmail: "hello@linenandlounge.co" },
];
