import React from 'react';
import FeaturedCarousel from '../components/HomePage/FeaturedCarousel';
import NewlyUpdated from '../components/HomePage/NewlyUpdated';
import ReadingHistory from '../components/HomePage/ReadingHistory';
import MonthlyRankings from '../components/HomePage/MonthlyRankings';
import RecentComments from '../components/HomePage/RecentComments';
// import './HomePage.css';

const HomePage: React.FC = () => {
  return (
    <main className="flex-1 container px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - 2/3 width */}
          <div className="lg:col-span-2 space-y-6">
            <FeaturedCarousel />
            <NewlyUpdated />
          </div>

          {/* Right Column - 1/3 width */}
          <div className="space-y-6">
            <ReadingHistory />
            <MonthlyRankings />
            <RecentComments />
          </div>
        </div>
    </main>
  );
};

export default HomePage;
