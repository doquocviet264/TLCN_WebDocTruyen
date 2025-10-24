import React, { useState, useEffect } from 'react';
import axios from "axios";
import FeaturedCarousel from '../components/HomePage/FeaturedCarousel';
import NewlyUpdated from '../components/HomePage/NewlyUpdated';
import ReadingHistory from '../components/HomePage/ReadingHistory';
import MonthlyRankings from '../components/HomePage/MonthlyRankings';
import RecentComments from '../components/HomePage/RecentComments';
import ComicRow from '../components/HomePage/ComicRow';
import MangaSlider from './mangaslider';
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
    <main className="flex-1 container px-4 py-6">
      {/* FeaturedCarousel full width */}
      <div className="mb-6">
        <MangaSlider className="mt-2" />
        <FeaturedCarousel />
      </div>

      {/* Grid layout cho NewlyUpdated và các phần khác */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - 2/3 width */}
        <div className="lg:col-span-2 space-y-6">
          <NewlyUpdated />
        </div>

        {/* Right Column - 1/3 width */}
        <div className="space-y-6">
          <ReadingHistory />
          <MonthlyRankings />
          <RecentComments />
        </div>
      </div>

      {/* Comic Rows */}
      <div className="mt-10 space-y-8">
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <ComicRow key={i} title="" comics={[]} isLoading={true} />
          ))
        ) : (
          sectionsData && (
            <>
              {/* 3 mục thể loại */}
              {sectionsData.genreSections.map((section, index) => (
                <ComicRow
                  key={section.genre.slug || `genre-${index}`}
                  title={section.genre.name}
                  comics={section.comics}
                />
              ))}

              {/* Mục truyện đã hoàn thành */}
              <ComicRow
                title={sectionsData.completedSection.title}
                comics={sectionsData.completedSection.comics}
              />

              {/* Mục truyện ngẫu nhiên */}
              <ComicRow
                title={sectionsData.randomSection.title}
                comics={sectionsData.randomSection.comics}
              />
            </>
          )
        )}
      </div>
    </main>
  );

};

