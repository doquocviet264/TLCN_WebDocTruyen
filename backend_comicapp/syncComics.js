const axios = require('axios');
const db = require('./models/index');


//hàm chuyển đổi trạng thái cho phù hợp với db
const mapStatus = (apiStatus) => {
    switch (apiStatus) {
        case 'ongoing': return 'In Progress';
        case 'completed': return 'Completed';
        default: return 'On Hold';
    }
};

const getChapterPage = async (apiChapter) =>{
    
}
//hàm tìm nếu không có thì tạo thể loại
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

// hàm thêm chapter
const syncChaptersForComic = async (comicInstance, apiChapters, transaction) => {
    if (!apiChapters || apiChapters.length === 0) {
        return { created: 0, updated: 0 };
    }
    
    let createdCount = 0;
    let updatedCount = 0;

    const allChaptersData = apiChapters.flatMap(server => server.server_data || []);

    for (const chapterData of allChaptersData) {
        const chapterNumber = parseFloat(chapterData.chapter_name);
        if (isNaN(chapterNumber)) {
            continue;
        }

        const chapterRecord = {
            chapterNumber: chapterNumber,
            title: chapterData.chapter_title || `Chương ${chapterData.chapter_name}`,
            comicId: comicInstance.comicId
        };
        
        const [chapterInstance, created] = await db.Chapter.findOrCreate({
            where: { 
                comicId: comicInstance.comicId,
                chapterNumber: chapterRecord.chapterNumber
            },
            defaults: chapterRecord,
            transaction
        });

        if (created) {
            createdCount++;
        } else {
            await chapterInstance.update(chapterRecord, { transaction });
            updatedCount++;
        }
    }
    return { created: createdCount, updated: updatedCount };
};


// hàm chính

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
        const cdnImageDomain = data.data.APP_DOMAIN_CDN_IMAGE;
        
        for (const comicListItem of comicsFromApi) {
            console.log(`\n--------------------------------------------------`);
            console.log(`Đang xử lý truyện: ${comicListItem.name}`);
            
            const comicDetail = await getComicDetails(comicListItem.slug);
            await new Promise(resolve => setTimeout(resolve, 300));

            if (!comicDetail) {
                console.warn(`Bỏ qua do không lấy được chi tiết.`);
                continue;
            }

            const transaction = await db.sequelize.transaction();
            try {
                const comicData = {
                    title: comicDetail.name,
                    slug: comicDetail.slug,
                    status: mapStatus(comicDetail.status),
                    coverImage: `${cdnImageDomain}/uploads/comics/${comicDetail.thumb_url}`,
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

                const chapterSyncResult = await syncChaptersForComic(comicInstance, comicDetail.chapters, transaction);

                await transaction.commit();
                console.log(`Truyện: ${created ? 'Đã thêm mới' : 'Đã cập nhật'} "${comicInstance.title}"`);
                console.log(`Chương: Thêm mới ${chapterSyncResult.created}, Cập nhật ${chapterSyncResult.updated}.`);

            } catch (error) {
                await transaction.rollback();
                console.error(`Lỗi khi lưu truyện "${comicListItem.name}":`, error.message);
            }
        }
        
        console.log(`\nHoàn tất xử lý trang ${page}.`);
        return comicsFromApi.length;

    } catch (error) {
        console.error(`Không thể lấy danh sách truyện từ API cho trang ${page}:`, error.message);
        throw error;
    }
};



//hàm chạy file
const runSync = async () => {
    const startPage = 2;
    const endPage = 4;

    console.log(`Bắt đầu quá trình đồng bộ từ trang ${startPage} đến ${endPage}.`);
    
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

    console.log('Quá trình đồng bộ đã kết thúc.');
};

runSync().catch(error => {
    console.error("Quá trình đồng bộ gặp lỗi nghiêm trọng:", error);
});