require('dotenv').config();
const axios = require('axios');
const { Sequelize, DataTypes } = require('sequelize');
const http = require('http');
const https = require('https');

// ===== 1️⃣ Cấu hình Sequelize =====
const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD || '',
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: 'mysql',
    logging: false,
    pool: { max: 10, min: 0, idle: 10000 },
  }
);
const initModels = require('./src/models/index');
const db = initModels(sequelize, DataTypes);

// ===== 2️⃣ Axios instance keep-alive =====
const httpAgent = new http.Agent({ keepAlive: true, maxSockets: 50 });
const httpsAgent = new https.Agent({ keepAlive: true, maxSockets: 50 });
const api = axios.create({ httpAgent, httpsAgent, timeout: 15000 });

// ===== 3️⃣ Hàm tiện ích =====
const delay = (ms) => new Promise((r) => setTimeout(r, ms));
const mapStatus = (s) => (s === 'completed' ? 'Completed' : s === 'ongoing' ? 'In Progress' : 'On Hold');

// ===== Cache genre để không findOrCreate trùng =====
const genreCache = new Map();
async function findOrCreateGenresFast(categories = [], transaction) {
  const uniqueNames = [...new Set(categories.map(c => c.name.trim()).filter(Boolean))];
  const found = [];
  for (const name of uniqueNames) {
    if (genreCache.has(name)) {
      found.push(genreCache.get(name));
      continue;
    }
    const [g] = await db.Genre.findOrCreate({
      where: { name },
      defaults: { name },
      transaction,
    });
    genreCache.set(name, g);
    found.push(g);
  }
  return found;
}

// ===== Lấy chi tiết truyện =====
async function getComicDetails(slug) {
  try {
    const { data } = await api.get(`https://otruyenapi.com/v1/api/truyen-tranh/${slug}`);
    return data.status === 'success' && data.data?.item ? data.data.item : null;
  } catch (err) {
    console.warn(`⚠️ Lỗi lấy chi tiết [${slug}]: ${err.message}`);
    return null;
  }
}

// ===== Lấy ảnh của 1 chương =====
async function getChapterPages(chapterApiUrl) {
  try {
    const { data } = await api.get(chapterApiUrl);
    if (data.status !== 'success' || !data.data?.item) return [];
    const { domain_cdn, item } = data.data;
    const { chapter_path, chapter_image } = item;
    return chapter_image.map(img => ({
      image_page: img.image_page,
      image_url: `${domain_cdn}/${chapter_path}/${img.image_file}`,
    }));
  } catch (err) {
    console.warn(`⚠️ Lỗi lấy ảnh chương: ${err.message}`);
    return [];
  }
}

// ===== Crawl ảnh cho từng chương =====
async function syncChaptersForComic(comicInstance, apiChapters, transaction) {
  if (!apiChapters?.length) return { created: 0, updated: 0, images: 0 };
  const all = apiChapters.flatMap(s => s.server_data || []);

  let created = 0, updated = 0, images = 0;

  // chạy song song có giới hạn 5 chương/lần
  const limit = 5;
  for (let i = 0; i < all.length; i += limit) {
    const batch = all.slice(i, i + limit);
    await Promise.all(batch.map(async ch => {
      const num = parseFloat(ch.chapter_name);
      if (isNaN(num)) return;

      const [chapter, isNew] = await db.Chapter.findOrCreate({
        where: { comicId: comicInstance.comicId, chapterNumber: num },
        defaults: {
          chapterNumber: num,
          title: ch.chapter_title || `Chương ${ch.chapter_name}`,
          comicId: comicInstance.comicId,
        },
        transaction,
      });

      if (isNew) created++; else updated++;

      const hasImage = await db.ChapterImage.findOne({
        where: { chapterId: chapter.chapterId },
        attributes: ['chapterId'],
        transaction,
      });
      if (hasImage) return;

      const imgs = await getChapterPages(ch.chapter_api_data);
      if (imgs.length) {
        const records = imgs.map(i => ({
          chapterId: chapter.chapterId,
          imageUrl: i.image_url,
          pageNumber: i.image_page,
        }));
        await db.ChapterImage.bulkCreate(records, { transaction });
        images += records.length;
      }
    }));
  }

  return { created, updated, images };
}

// ===== Đồng bộ Alternate Names =====
async function syncAlternateNames(comicInstance, names = [], transaction) {
  const clean = names.map(n => n.trim()).filter(Boolean);
  for (const name of clean) {
    await db.AlternateName.findOrCreate({
      where: { comicId: comicInstance.comicId, name },
      defaults: { comicId: comicInstance.comicId, name },
      transaction,
    });
  }
}

// ===== Đồng bộ 1 trang truyện =====
async function syncComicsFromPage(page = 1) {
  console.log(`🚀 Crawl trang ${page}...`);
  const { data } = await api.get(`https://otruyenapi.com/v1/api/danh-sach/dang-phat-hanh?page=${page}`);
  if (data.status !== 'success' || !data.data?.items) return 0;

  const list = data.data.items;
  const cdn = data.data.APP_DOMAIN_CDN_IMAGE;

  // crawl song song 3 truyện/lần
  const limit = 3;
  for (let i = 0; i < list.length; i += limit) {
    const batch = list.slice(i, i + limit);
    await Promise.all(batch.map(async item => {
      const detail = await getComicDetails(item.slug);
      if (!detail) return;

      const t = await db.sequelize.transaction();
      try {
        const comicData = {
          title: detail.name,
          slug: detail.slug,
          status: mapStatus(detail.status),
          coverImage: `${cdn}/uploads/comics/${detail.thumb_url}`,
          author: (detail.author || []).join(', ') || 'Đang cập nhật',
          description: detail.content || '',
          updatedAt: new Date(detail.updatedAt),
        };

        const [comic, created] = await db.Comic.findOrCreate({
          where: { slug: comicData.slug },
          defaults: comicData,
          transaction: t,
        });
        if (!created) await comic.update(comicData, { transaction: t });

        const genres = await findOrCreateGenresFast(detail.category || [], t);
        if (genres.length) await comic.setGenres(genres, { transaction: t });

        await syncAlternateNames(comic, detail.origin_name, t);
        const chapterResult = await syncChaptersForComic(comic, detail.chapters, t);

        await t.commit();
        console.log(`✅ ${created ? 'Mới' : 'Cập nhật'}: "${comic.title}" | ${chapterResult.created}+${chapterResult.updated} chương, ${chapterResult.images} ảnh`);
      } catch (err) {
        await t.rollback();
        console.error(`❌ Lỗi "${item.name}": ${err.message}`);
      }
    }));
  }

  console.log(`✅ Hoàn tất trang ${page}.`);
  return list.length;
}

// ===== 6️⃣ Chạy chính =====
(async () => {
  const startPage = 21, endPage = 30;
  console.log(`🔥 Bắt đầu đồng bộ ${startPage} → ${endPage}`);

  await db.sequelize.authenticate();
  console.log('✅ Kết nối DB thành công.');

  for (let p = startPage; p <= endPage; p++) {
    try {
      await syncComicsFromPage(p);
    } catch (err) {
      console.error(`Dừng tại trang ${p}: ${err.message}`);
      break;
    }
  }

  console.log('🏁 Đồng bộ hoàn tất.');
  process.exit(0);
})();
