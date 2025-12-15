import React, { useState, useEffect } from 'react';
import axios from "axios";
import FeaturedCarousel from '../components/HomePage/FeaturedCarousel';
import NewlyUpdated from '../components/HomePage/NewlyUpdated';
import ReadingHistory from '../components/HomePage/ReadingHistory';
import MonthlyRankings from '../components/HomePage/MonthlyRankings';
import RecentComments from '../components/HomePage/RecentComments';
import ComicRow from '../components/HomePage/ComicRow';
import MangaSlider from '../components/HomePage/mangaslider';
import { cn } from "@/lib/utils"; // Giả sử bạn có utils này (chuẩn shadcn), nếu không có thể bỏ qua

interface GenreSection {
  genre: { name: string; slug: string };
  comics: any[];
}
interface TitledSection {
  title: string;
  comics: any[];
}
interface HomepageSectionsData {
  genreSections: GenreSection[];
  completedSection: TitledSection;
  randomSection: TitledSection;
}
interface HomePageSectionReponse {
  success: boolean;
  data: HomepageSectionsData;
  meta: any;
}

export default function HomePage() {
  const [sectionsData, setSectionsData] = useState<HomepageSectionsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHomepageSections = async () => {
      try {
        setLoading(true);
        const response = await axios.get<HomePageSectionReponse>(`${import.meta.env.VITE_API_URL}/comics/homepage-sections`);
        setSectionsData(response.data.data);
      } catch (error) {
        console.error("Lỗi khi lấy dữ liệu homepage sections:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchHomepageSections();
  }, []);

  return (
    <main className="flex-1 container px-4 py-6 overflow-hidden">
      
      {/* 1. Hero Section: Trượt từ trên xuống */}
      <div className="mb-6 animate-in slide-in-from-top-6 fade-in duration-700 ease-out">
        <MangaSlider className="mt-2" />
        <div className="mt-6">
           <FeaturedCarousel />
        </div>
      </div>

      {/* Grid layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* 2. Left Column: Trượt từ trái sang (hoặc dưới lên) */}
        <div className="lg:col-span-2 space-y-6 animate-in slide-in-from-bottom-8 fade-in duration-700 delay-200 fill-mode-backwards">
          <NewlyUpdated />
        </div>

        {/* 3. Right Column: Trượt từ phải sang (hoặc dưới lên) chậm hơn cột trái 1 chút */}
        <div className="space-y-6 animate-in slide-in-from-bottom-8 fade-in duration-700 delay-300 fill-mode-backwards">
          <ReadingHistory />
          <MonthlyRankings />
          <RecentComments />
        </div>
      </div>

      {/* 4. Comic Rows: Xuất hiện lần lượt (Staggered) */}
      <div className="mt-10 space-y-8">
        {loading ? (
          // Skeleton Loading Animation
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="animate-pulse space-y-4">
               <div className="h-8 w-48 bg-muted rounded-md" />
               <div className="flex gap-4 overflow-hidden">
                  {[...Array(5)].map((_, j) => (
                    <div key={j} className="h-60 w-40 bg-muted rounded-lg flex-shrink-0" />
                  ))}
               </div>
            </div>
          ))
        ) : (
          sectionsData && (
            <>
              {/* Genre Sections: Loop và tăng delay dựa trên index */}
              {sectionsData.genreSections.map((section, index) => (
                <div 
                    key={section.genre.slug || `genre-${index}`}
                    className="animate-in slide-in-from-bottom-10 fade-in duration-700 fill-mode-backwards"
                    style={{ animationDelay: `${(index + 1) * 150}ms` }} // Delay tăng dần: 150ms, 300ms, 450ms...
                >
                  <ComicRow
                    title={section.genre.name}
                    comics={section.comics}
                  />
                </div>
              ))}

              {/* Completed Section */}
              <div 
                className="animate-in slide-in-from-bottom-10 fade-in duration-700 fill-mode-backwards"
                style={{ animationDelay: `${(sectionsData.genreSections.length + 1) * 150}ms` }}
              >
                <ComicRow
                    title={sectionsData.completedSection.title}
                    comics={sectionsData.completedSection.comics}
                />
              </div>

              {/* Random Section */}
              <div 
                className="animate-in slide-in-from-bottom-10 fade-in duration-700 fill-mode-backwards"
                style={{ animationDelay: `${(sectionsData.genreSections.length + 2) * 150}ms` }}
              >
                <ComicRow
                    title={sectionsData.randomSection.title}
                    comics={sectionsData.randomSection.comics}
                />
              </div>
            </>
          )
        )}
      </div>
    </main>
  );
};