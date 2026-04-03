const CATEGORY_KEYWORDS: Record<string, string[]> = {
  housing: ["rent", "mortgage", "hoa", "property tax", "homeowner", "apartment", "lease"],
  transport: ["gas station", "shell", "exxon", "chevron", "bp ", "fuel", "uber", "lyft", "parking", "toll", "car wash", "jiffy", "autozone", "o'reilly"],
  food: ["grocery", "groceries", "kroger", "walmart", "target", "aldi", "publix", "safeway", "whole foods", "trader joe", "costco", "sam's club", "restaurant", "doordash", "grubhub", "uber eats", "chipotle", "mcdonald", "wendy", "chick-fil-a", "starbucks", "dunkin", "coffee", "pizza", "taco bell", "subway", "panera", "diner", "cafe", "bakery", "food"],
  utilities: ["electric", "power", "water", "sewer", "gas bill", "internet", "comcast", "spectrum", "xfinity", "att", "t-mobile", "verizon", "phone bill", "waste management"],
  subscriptions: ["netflix", "spotify", "hulu", "disney", "apple.com", "amazon prime", "youtube", "hbo", "paramount", "gym", "planet fitness", "anytime fitness", "membership", "subscription"],
  entertainment: ["movie", "theater", "cinema", "concert", "ticketmaster", "live nation", "bar ", "club", "bowling", "golf", "arcade", "gaming", "steam", "playstation", "xbox", "nintendo"],
  insurance: ["insurance", "geico", "usaa ins", "progressive", "allstate", "state farm", "premium", "liberty mutual", "farmers"],
};

export function autoCategory(description: string): string {
  const lower = description.toLowerCase();
  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    for (const keyword of keywords) {
      if (lower.includes(keyword)) return category;
    }
  }
  return "other";
}
