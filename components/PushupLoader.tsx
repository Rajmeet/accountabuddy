import React from 'react';
import styles from './PushupLoader.module.css';

const PushupLoader: React.FC = () => {
  return (
    <div className={styles.pushupAnimation}>
      {[...Array(8)].map((_, index) => (
        <img 
          key={index}
          src={`pushups/push_ups00${index + 1}.svg`}
          alt={`Pushup frame ${index + 1}`}
        />
      ))}
    </div>
  );
};

export default PushupLoader;