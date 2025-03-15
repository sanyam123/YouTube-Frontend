import React from 'react';

function VideoInfo({ videoDetails }) {
  if (!videoDetails) return null;
  
  // Format the published date
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };
  
  return (
    <div className="video-info-container">
      <div className="video-info-grid">
        <div className="video-thumbnail">
          {videoDetails.thumbnailUrl && (
            <img 
              src={videoDetails.thumbnailUrl} 
              alt={`Thumbnail for ${videoDetails.title}`} 
              className="thumbnail-img"
            />
          )}
        </div>
        <div className="video-details">
          <h2 className="video-title">{videoDetails.title}</h2>
          
          <div className="video-metadata">
            <div className="metadata-column">
              {videoDetails.channelTitle && (
                <p className="channel-name">
                  <strong>Channel:</strong> {videoDetails.channelTitle}
                </p>
              )}
              
              {videoDetails.publishedAt && (
                <p className="publish-date">
                  <strong>Published:</strong> {formatDate(videoDetails.publishedAt)}
                </p>
              )}
            </div>
            
            <div className="metadata-column">
              {videoDetails.viewCount && (
                <p className="view-count">
                  <strong>Views:</strong> {parseInt(videoDetails.viewCount).toLocaleString()}
                </p>
              )}
              
              {videoDetails.likeCount && (
                <p className="like-count">
                  <strong>Likes:</strong> {parseInt(videoDetails.likeCount).toLocaleString()}
                </p>
              )}
              
              {videoDetails.duration && (
                <p className="duration">
                  <strong>Duration:</strong> {videoDetails.duration}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default VideoInfo;