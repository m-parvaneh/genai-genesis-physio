import React, { useState, useEffect, useCallback } from "react";
import q1 from "/q1.mp3";
import q2 from "/q2.mp3";
import q3 from "/q3.mp3";
import { Whisper } from "./whisper";

const AudioPlayer = () => {
  const [audio, setAudio] = useState(null);
  const [questionNumber, setQuestionNumber] = useState(0);
  // useEffect(() => {
  //   setAudio(new Audio(sound));
  //   // only run once on the first render on the client
  // }, []);

  // useEffect(() => {
  //   playAudio();
  // }, [questionNumber]); // Runs when `count` changes

  useEffect(() => playAudio(), [audio]); // Runs when `count` changes

  useEffect(() => {
    const timer = setTimeout(() => {
      console.log(`Waited 500ms, count is now: ${questionNumber}`);
      setAudio();
      if (questionNumber == 1) {
        setAudio(new Audio(q1));
      } else if (questionNumber == 2) {
        setAudio(new Audio(q2));
      } else if (questionNumber == 3) {
        setAudio(new Audio(q3));
      }
    }, 500);

    return () => clearTimeout(timer); // Cleanup on unmount
  }, [questionNumber]); // Runs when `count` changes

  const playAudio = useCallback(() => {
    if (!audio) {
      console.log("dnowondw");
    }

    //audio.crossOrigin = "anonymous";
    try {
      audio.play();
      console.log("Playing audio" + audio);
    } catch (err) {
      console.log("Failed to play, error: " + err);
    }

    console.log("played");
  }, [audio]);

  return (
    <div>
      <Whisper
        setQuestionNumber={setQuestionNumber}
        questionNumber={questionNumber}
      />
    </div>
  );
};

export default AudioPlayer;
