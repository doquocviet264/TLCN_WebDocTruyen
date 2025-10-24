// syncComics.js
require('dotenv').config();

const axios = require('axios');
const { Sequelize, DataTypes } = require('sequelize');

// 1) KHỞI TẠO sequelize từ .env
const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,        // nếu có
    dialect: 'mysql',                 // chỉnh theo DB của bạn
    logging: false,
  }
);

// 2) GỌI FACTORY để lấy 'db' đã init models + associations
const initModels = require('./src/models/index'); // <- file bạn gửi
const db = initModels(sequelize, DataTypes);

// === CÁC HÀM HỖ TRỢ ===

const mapStatus = (apiStatus) => {
    switch (apiStatus) {
        case 'ongoing': return 'In Progress';
        case 'completed': return 'Completed';
        default: return 'On Hold';
    }
};

const findOrCreateGenres = async (apiCategories) => {
    const genreInstances = [];
    for (const category of apiCategories) {
        const [genre] = await db.Genre.findOrCreate({
            where: { name: category.name },
            defaults: { name: category.name }
        });
        genreInstances.push(genre);
    }
    return genreInstances;
};

const getComicDetails = async (slug) => {
    try {
        const detailApiUrl = `https://otruyenapi.com/v1/api/truyen-tranh/${slug}`;
        const response = await axios.get(detailApiUrl);
        if (response.data.status === 'success' && response.data.data.item) {
            return response.data.data.item;
        }
        return null;
    } catch (error) {
        console.warn(`Không thể lấy chi tiết cho slug: ${slug}. Lỗi: ${error.message}`);
        return null;
    }
};
const syncAlternateNames = async (comicInstance, alternateNames, transaction) => {
    if (!alternateNames || alternateNames.length === 0) {
        return; // Bỏ qua nếu không có tên khác
    }

    for (const name of alternateNames) {
        if (name && name.trim() !== '') { // Chỉ lưu các tên hợp lệ
            // Tìm hoặc tạo mới để tránh trùng lặp
            await db.AlternateName.findOrCreate({
                where: {
                    comicId: comicInstance.comicId,
                    name: name.trim(),
                },
                transaction,
            });
        }
    }
};

/**
 * Lấy danh sách URL ảnh của một chương từ API
 */
const getChapterPages = async (chapterApiUrl) => {
    try {
        const response = await axios.get(chapterApiUrl);
        if (response.data.status === 'success' && response.data.data && response.data.data.item) {
            const { domain_cdn, item } = response.data.data;
            const { chapter_path, chapter_image } = item;
            
            // Tạo URL đầy đủ cho từng ảnh
            const imagesWithFullUrl = chapter_image.map(image => ({
                image_page: image.image_page,
                image_url: `${domain_cdn}/${chapter_path}/${image.image_file}`
            }));
            
            return imagesWithFullUrl;
        }
        return [];
    } catch (error) {
        console.warn(`    - ↳ ⚠️ Lỗi khi lấy ảnh chương: ${error.message}`);
        return [];
    }
};

/**
 * [CẬP NHẬT] Hàm đồng bộ chương, giờ chỉ crawl URL ảnh
 */
const syncChaptersForComic = async (comicInstance, apiChapters, transaction) => {
    if (!apiChapters || apiChapters.length === 0) {
        return { created: 0, updated: 0, images: 0 };
    }
    
    let createdCount = 0;
    let updatedCount = 0;
    let totalImagesSaved = 0;

    const allChaptersData = apiChapters.flatMap(server => server.server_data || []);

    for (const chapterData of allChaptersData) {
        const chapterNumber = parseFloat(chapterData.chapter_name);
        if (isNaN(chapterNumber)) continue;

        const chapterRecord = {
            chapterNumber,
            title: chapterData.chapter_title || `Chương ${chapterData.chapter_name}`,
            comicId: comicInstance.comicId,
        };
        
        const [chapterInstance, created] = await db.Chapter.findOrCreate({
            where: { comicId: comicInstance.comicId, chapterNumber },
            defaults: chapterRecord,
            transaction
        });

        if (created) createdCount++;
        else updatedCount++;

        // Crawl và lưu URL ảnh cho chương
        const existingImagesCount = await chapterInstance.countChapterImages({ transaction });
        if (existingImagesCount === 0) { // Chỉ crawl nếu chương chưa có ảnh
            console.log(`    - ↳ Đang crawl URL ảnh cho chương ${chapterNumber}...`);
            const chapterImages = await getChapterPages(chapterData.chapter_api_data);

            // Sử dụng bulkCreate để tăng hiệu năng khi insert nhiều ảnh
            const imageRecords = chapterImages.map(image => ({
                chapterId: chapterInstance.chapterId,
                imageUrl: image.image_url,
                pageNumber: image.image_page,
            }));

            if (imageRecords.length > 0) {
                await db.ChapterImage.bulkCreate(imageRecords, { transaction });
                totalImagesSaved += imageRecords.length;
            }
            await new Promise(resolve => setTimeout(resolve, 200)); // Nghỉ nhẹ sau khi crawl 1 chương
        }
    }
    return { created: createdCount, updated: updatedCount, images: totalImagesSaved };
};


// === HÀM CHÍNH ===
const syncComicsFromPage = async (page = 1) => {
    try {
        console.log(`🚀 Bắt đầu lấy danh sách truyện từ trang ${page}...`);
        const listApiUrl = `https://otruyenapi.com/v1/api/danh-sach/truyen-moi?page=${page}`;
        const response = await axios.get(listApiUrl);
        const { data } = response;

        if (data.status !== 'success' || !data.data || !data.data.items) {
            console.log(`Trang ${page} không có dữ liệu hợp lệ.`);
            return 0;
        }

        const comicsFromApi = data.data.items;
        
        for (const comicListItem of comicsFromApi) {
            console.log(`\n--------------------------------------------------`);
            console.log(`- Đang xử lý truyện: ${comicListItem.name}`);
            
            const comicDetail = await getComicDetails(comicListItem.slug);
            await new Promise(resolve => setTimeout(resolve, 300));

            if (!comicDetail) {
                console.warn(`- ⚠️ Bỏ qua do không lấy được chi tiết.`);
                continue;
            }

            const transaction = await db.sequelize.transaction();
            try {
                const comicData = {
                    title: comicDetail.name,
                    slug: comicDetail.slug,
                    status: mapStatus(comicDetail.status),
                    coverImage: `${data.data.APP_DOMAIN_CDN_IMAGE}/uploads/comics/${comicDetail.thumb_url}`,
                    author: comicDetail.author.join(', ') || 'Đang cập nhật',
                    description: comicDetail.content || '',
                    updatedAt: new Date(comicDetail.updatedAt)
                };

                const [comicInstance, created] = await db.Comic.findOrCreate({
                    where: { slug: comicData.slug },
                    defaults: comicData,
                    transaction
                });

                if (!created) {
                    await comicInstance.update(comicData, { transaction });
                }
                
                if (comicDetail.category && comicDetail.category.length > 0) {
                    const genreInstances = await findOrCreateGenres(comicDetail.category);
                    await comicInstance.setGenres(genreInstances, { transaction });
                }

                await syncAlternateNames(comicInstance, comicDetail.origin_name, transaction);

                const chapterSyncResult = await syncChaptersForComic(comicInstance, comicDetail.chapters, transaction);

                await transaction.commit();
                console.log(`  - Truyện: ${created ? '🎨 Đã thêm mới' : '🔄 Đã cập nhật'} "${comicInstance.title}"`);
                console.log(`  - Chương: Thêm mới ${chapterSyncResult.created}, Cập nhật ${chapterSyncResult.updated}.`);
                if (chapterSyncResult.images > 0) {
                    console.log(`  - 🏞️  URL Ảnh: Đã lưu ${chapterSyncResult.images} URL mới.`);
                }
            } catch (error) {
                await transaction.rollback();
                console.error(`  - ❌ Lỗi khi lưu truyện "${comicListItem.name}":`, error.message);
            }
        }
        
        console.log(`\n✅ Hoàn tất xử lý trang ${page}.`);
        return comicsFromApi.length;

    } catch (error) {
        console.error(`❌ Không thể lấy danh sách truyện từ API cho trang ${page}:`, error.message);
        throw error;
    }
};

// === HÀM KHỞI ĐỘNG SCRIPT ===
const runSync = async () => {
    const startPage = 3;
    const endPage = 4; // Ví dụ: lấy 2 trang

    console.log(`🔥 Bắt đầu quá trình đồng bộ từ trang ${startPage} đến ${endPage}.`);
    
    await db.sequelize.authenticate();
    console.log('Kết nối database thành công.');

    for (let i = startPage; i <= endPage; i++) {
        try {
            await syncComicsFromPage(i);
        } catch (error) {
            console.error(`Dừng quá trình đồng bộ do có lỗi ở trang ${i}.`);
            break;
        }
    }

    console.log('🏁 Quá trình đồng bộ đã kết thúc.');
};

runSync().catch(error => {
    console.error("Quá trình đồng bộ gặp lỗi nghiêm trọng:", error);
});