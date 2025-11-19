export const groupDetails = {
  name: "The Scanlators",
  stats: {
    totalComics: 12,
    totalViews: 125000,
    totalMembers: 8,
  },
  avatarUrl: "https://via.placeholder.com/150/FF0000/FFFFFF?text=G1", // Added avatarUrl
};

export const groupComics = [
  {
    id: 1,
    title: "The Beginning After The End",
    coverUrl: "https://via.placeholder.com/150/FF0000/FFFFFF?text=TBATE",
    status: "Ongoing",
    lastChapter: 175,
    views: 45000,
  },
  {
    id: 2,
    title: "Solo Leveling",
    coverUrl: "https://via.placeholder.com/150/00FF00/FFFFFF?text=SL",
    status: "Completed",
    lastChapter: 200,
    views: 30000,
  },
  {
    id: 3,
    title: "Omniscient Reader's Viewpoint",
    coverUrl: "https://via.placeholder.com/150/0000FF/FFFFFF?text=ORV",
    status: "Ongoing",
    lastChapter: 100,
    views: 25000,
  },
  {
    id: 4,
    title: "The Legend of the Northern Blade",
    coverUrl: "https://via.placeholder.com/150/FFFF00/000000?text=LNB",
    status: "Ongoing",
    lastChapter: 150,
    views: 15000,
  },
  {
    id: 5,
    title: "A Returner's Magic Should Be Special",
    coverUrl: "https://via.placeholder.com/150/FF00FF/FFFFFF?text=RMSBS",
    status: "Ongoing",
    lastChapter: 200,
    views: 10000,
  },
];

export const groupMembers = [
  {
    id: 1,
    name: "John Doe",
    avatarUrl: "https://via.placeholder.com/40/FF0000/FFFFFF?text=JD",
    role: "Leader",
    joinedAt: "2023-01-15",
  },
  {
    id: 2,
    name: "Jane Smith",
    avatarUrl: "https://via.placeholder.com/40/00FF00/FFFFFF?text=JS",
    role: "Translator",
    joinedAt: "2023-02-20",
  },
  {
    id: 3,
    name: "Peter Jones",
    avatarUrl: "https://via.placeholder.com/40/0000FF/FFFFFF?text=PJ",
    role: "Cleaner",
    joinedAt: "2023-03-10",
  },
  {
    id: 4,
    name: "Mary Johnson",
    avatarUrl: "https://via.placeholder.com/40/FFFF00/000000?text=MJ",
    role: "Typesetter",
    joinedAt: "2023-04-05",
  },
  {
    id: 5,
    name: "David Williams",
    avatarUrl: "https://via.placeholder.com/40/FF00FF/FFFFFF?text=DW",
    role: "Proofreader",
    joinedAt: "2023-05-12",
  },
];

export const recentActivities = [
  {
    id: 1,
    user: "Jane Smith",
    action: "uploaded a new chapter for",
    target: "Solo Leveling",
    timestamp: "2 hours ago",
  },
  {
    id: 2,
    user: "Peter Jones",
    action: "finished cleaning",
    target: "The Beginning After The End Chapter 175",
    timestamp: "5 hours ago",
  },
  {
    id: 3,
    user: "Mary Johnson",
    action: "started typesetting",
    target: "Omniscient Reader's Viewpoint Chapter 100",
    timestamp: "1 day ago",
  },
  {
    id: 4,
    user: "John Doe",
    action: "recruited a new member",
    target: "David Williams",
    timestamp: "2 days ago",
  },
];

export const availableAvatarUrls = [
  "https://via.placeholder.com/150/FF0000/FFFFFF?text=G1",
  "https://via.placeholder.com/150/00FF00/FFFFFF?text=G2",
  "https://via.placeholder.com/150/0000FF/FFFFFF?text=G3",
  "https://via.placeholder.com/150/FFFF00/000000?text=G4",
  "https://via.placeholder.com/150/FF00FF/FFFFFF?text=G5",
];
