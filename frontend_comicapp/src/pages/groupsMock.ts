// src/pages/groupsMock.ts
export type GroupRole = "leader" | "member";

export interface GroupMember {
  userId: number;
  username: string;
  avatarUrl?: string;
  role: GroupRole;
  joinedAt: string;
  totalComics?: number;
}

export interface GroupComic {
  comicId: number;
  title: string;
  slug: string;
  coverUrl: string;
  views: number;
  chaptersCount: number;
  isCompleted: boolean;
}

export interface TranslationGroup {
  groupId: number;
  name: string;
  description: string;
  avatarUrl?: string;
  ownerId: number;
  createdAt: string;
  stats: {
    totalComics: number;
    totalViews: number;
    totalMembers: number;
  };
  members: GroupMember[];
  comics: GroupComic[];
}

export const MOCK_GROUPS: TranslationGroup[] = [
  {
    groupId: 1,
    name: "Night Owl Translations",
    description:
      "Nhóm chuyên dịch truyện fantasy, isekai, hệ thống. Chú trọng giữ nguyên phong cách và thuật ngữ gốc.",
    avatarUrl:
      "https://images.pexels.com/photos/46274/pexels-photo-46274.jpeg?auto=compress&cs=tinysrgb&w=600",
    ownerId: 101,
    createdAt: "2024-01-15T10:00:00Z",
    stats: {
      totalComics: 8,
      totalViews: 532_400,
      totalMembers: 4,
    },
    members: [
      {
        userId: 101,
        username: "OwlMaster",
        avatarUrl:
          "https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=600",
        role: "leader",
        joinedAt: "2024-01-15T10:00:00Z",
        totalComics: 6,
      },
      {
        userId: 102,
        username: "Luna",
        avatarUrl:
          "https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=600",
        role: "member",
        joinedAt: "2024-02-01T09:00:00Z",
        totalComics: 3,
      },
      {
        userId: 103,
        username: "Shadow",
        role: "member",
        joinedAt: "2024-03-10T12:30:00Z",
        totalComics: 2,
      },
      {
        userId: 104,
        username: "Neo",
        role: "member",
        joinedAt: "2024-04-05T14:15:00Z",
        totalComics: 1,
      },
    ],
    comics: [
      {
        comicId: 201,
        title: "Isekai Kiếm Sư Toàn Năng",
        slug: "isekai-kiem-su-toan-nang",
        coverUrl:
          "https://images.pexels.com/photos/1153217/pexels-photo-1153217.jpeg?auto=compress&cs=tinysrgb&w=600",
        views: 180_000,
        chaptersCount: 55,
        isCompleted: false,
      },
      {
        comicId: 202,
        title: "Hệ Thống Gacha Hủy Diệt",
        slug: "he-thong-gacha-huy-diet",
        coverUrl:
          "https://images.pexels.com/photos/1904769/pexels-photo-1904769.jpeg?auto=compress&cs=tinysrgb&w=600",
        views: 145_200,
        chaptersCount: 37,
        isCompleted: false,
      },
      {
        comicId: 203,
        title: "Hồi Ức Của Pháp Sư Thời Gian",
        slug: "hoi-uc-cua-phap-su-thoi-gian",
        coverUrl:
          "https://images.pexels.com/photos/3075993/pexels-photo-3075993.jpeg?auto=compress&cs=tinysrgb&w=600",
        views: 96_800,
        chaptersCount: 24,
        isCompleted: false,
      },
    ],
  },
  {
    groupId: 2,
    name: "RomCom House",
    description:
      "Nhóm dịch chuyên mảng romcom, đời thường, học đường. Ưu tiên những bộ nhẹ nhàng, chill, dễ thương.",
    avatarUrl:
      "https://images.pexels.com/photos/196665/pexels-photo-196665.jpeg?auto=compress&cs=tinysrgb&w=600",
    ownerId: 201,
    createdAt: "2023-10-01T08:20:00Z",
    stats: {
      totalComics: 5,
      totalViews: 221_050,
      totalMembers: 3,
    },
    members: [
      {
        userId: 201,
        username: "Cherry",
        role: "leader",
        joinedAt: "2023-10-01T08:20:00Z",
        totalComics: 4,
      },
      {
        userId: 202,
        username: "Mint",
        role: "member",
        joinedAt: "2023-11-12T11:45:00Z",
        totalComics: 2,
      },
      {
        userId: 203,
        username: "Cloud",
        role: "member",
        joinedAt: "2024-01-03T16:30:00Z",
        totalComics: 1,
      },
    ],
    comics: [
      {
        comicId: 301,
        title: "Crush Bên Cạnh Nhà",
        slug: "crush-ben-canh-nha",
        coverUrl:
          "https://images.pexels.com/photos/2078266/pexels-photo-2078266.jpeg?auto=compress&cs=tinysrgb&w=600",
        views: 120_000,
        chaptersCount: 40,
        isCompleted: false,
      },
      {
        comicId: 302,
        title: "Tớ Lỡ Yêu Bạn Thân",
        slug: "to-lo-yeu-ban-than",
        coverUrl:
          "https://images.pexels.com/photos/1449794/pexels-photo-1449794.jpeg?auto=compress&cs=tinysrgb&w=600",
        views: 56_000,
        chaptersCount: 20,
        isCompleted: false,
      },
      {
        comicId: 303,
        title: "Ngày Nắng Em Cười",
        slug: "ngay-nang-em-cuoi",
        coverUrl:
          "https://images.pexels.com/photos/853168/pexels-photo-853168.jpeg?auto=compress&cs=tinysrgb&w=600",
        views: 45_050,
        chaptersCount: 15,
        isCompleted: false,
      },
    ],
  },
];
