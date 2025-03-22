import React, { useState, useEffect } from "react";
import sound from "/sample-3s.mp3";

const AudioPlayer = () => {
  const [audio, setAudio] = useState(null);
  useEffect(() => {
    setAudio(new Audio(sound));
    // only run once on the first render on the client
  }, []);

  const playAudio = async () => {
    //audio.crossOrigin = "anonymous";
    try {
      await audio.play();
      console.log("Playing audio" + audio);
    } catch (err) {
      console.log("Failed to play, error: " + err);
    }

    console.log("plaed");
  };

  return (
    <div>
      <button onClick={playAudio}>Play Sound</button>
    </div>
  );
};

export default AudioPlayer;
