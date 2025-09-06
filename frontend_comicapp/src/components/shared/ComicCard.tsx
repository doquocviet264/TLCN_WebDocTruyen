import React from 'react';
import './ComicCard.css';

// Định nghĩa kiểu props cho ComicCard
interface ComicCardProps {
  title: string;
  chapter: string;
  imageUrl: string;
}

const ComicCard: React.FC<ComicCardProps> = ({ title, chapter, imageUrl }) => {
  return (
    <a href="#" className="comic-card">
      <div className="card-image-container">
        <img src={imageUrl} alt={title} className="card-image" />
        <div className="card-overlay">
          <h4 className="card-title">{title}</h4>
        </div>
      </div>
      <div className="card-info">
        <span className="card-chapter">{chapter}</span>
      </div>
    </a>
  );
};

export default ComicCard;
