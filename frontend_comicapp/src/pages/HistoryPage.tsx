import { useState } from 'react';

interface Story {
  id: number;
  title: string;
  coverImage: string;
  currentChapter: number;
  totalChapters: number;
  readDate: string;
  source: 'device' | 'account';
}

const ReadingHistory = () => {
  const [activeTab, setActiveTab] = useState<'device' | 'account'>('device');
  
  // Dữ liệu mẫu
  const stories: Story[] = [
    {
      id: 1,
      title: 'Thần Đạo Đan Tôn',
      coverImage: 'https://via.placeholder.com/80x100',
      currentChapter: 120,
      totalChapters: 350,
      readDate: '2 giờ trước',
      source: 'device'
    },
    {
      id: 2,
      title: 'Võ Thần Chí Tôn',
      coverImage: 'https://via.placeholder.com/80x100',
      currentChapter: 45,
      totalChapters: 200,
      readDate: '5 giờ trước',
      source: 'device'
    },
    {
      id: 3,
      title: 'Cửu Chuyển Thần Hồn Quyết',
      coverImage: 'https://via.placeholder.com/80x100',
      currentChapter: 78,
      totalChapters: 150,
      readDate: 'Hôm qua',
      source: 'account'
    },
    {
      id: 4,
      title: 'Đấu Phá Thương Khung',
      coverImage: 'https://via.placeholder.com/80x100',
      currentChapter: 210,
      totalChapters: 500,
      readDate: '2 ngày trước',
      source: 'account'
    },
  ];

  const filteredStories = stories.filter(story => story.source === activeTab);

  const deleteStory = (id: number) => {
    // Xử lý xoá truyện khỏi lịch sử
    console.log('Xoá truyện với id:', id);
    // Trong thực tế, bạn sẽ cập nhật state hoặc gọi API ở đây
  };

  return (
    <div className="container mx-auto px-4 py-6 max-w-3xl">
      <h1 className="text-2xl font-bold mb-6 text-gray-800">Lịch sử đọc truyện</h1>
      
      {/* Tabs */}
      <div className="flex border-b border-gray-200 mb-6">
        <button
          className={`py-2 px-4 font-medium ${activeTab === 'device' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}
          onClick={() => setActiveTab('device')}
        >
          Từ thiết bị
        </button>
        <button
          className={`py-2 px-4 font-medium ${activeTab === 'account' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}
          onClick={() => setActiveTab('account')}
        >
          Từ tài khoản
        </button>
      </div>
      
      {/* Danh sách truyện */}
      <div className="space-y-4">
        {filteredStories.length > 0 ? (
          filteredStories.map(story => (
            <div key={story.id} className="flex items-center p-4 bg-white rounded-lg shadow-sm border border-gray-100">
              <img 
                src={story.coverImage} 
                alt={story.title}
                className="w-16 h-20 object-cover rounded-md"
              />
              <div className="ml-4 flex-1">
                <h3 className="font-medium text-gray-900">{story.title}</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Đọc tiếp Chapter {story.currentChapter}/{story.totalChapters}
                </p>
                <p className="text-xs text-gray-400 mt-1">{story.readDate}</p>
              </div>
              <button 
                onClick={() => deleteStory(story.id)}
                className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                aria-label="Xoá khỏi lịch sử"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          ))
        ) : (
          <div className="text-center py-10 text-gray-500">
            Không có lịch sử đọc truyện {activeTab === 'device' ? 'trên thiết bị' : 'từ tài khoản'}
          </div>
        )}
      </div>
    </div>
  );
};

export default ReadingHistory;