import { useRef, useEffect, useState } from "react";

export const Whisper = ({ setQuestionNumber, questionNumber, ...props }) => {
  const input = useRef();
  const [isRecording, setIsRecording] = useState(false);
  const [audioStream, setAudioStream] = useState(null);
  const [response, setResponse] = useState(null); // Store the API response
  const [socketResponse, setSocketResponse] = useState(0);

  const [recordedMessage, setRecordedMessage] = useState({
    q1: "",
    q2: "",
    q3: "",
  });
  const [blob, setBlob] = useState(null);

  useEffect(() => {
    toggleRecording();
  }, [socketResponse]);

  // Function to update the dictionary
  const updateDictionary = (key, value) => {
    setRecordedMessage((prevDict) => ({
      ...prevDict, // Keep the existing values
      [key]: value, // Update the specified key
    }));
  };

  // Function to call the API
  const fetchTreatment = async (message) => {
    try {
      const res = await fetch("http://localhost:8000/treatment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ questionnaire: message }),
      });

      if (!res.ok) {
        throw new Error("Failed to fetch treatment plan.");
      }
      console.log("Fetching data from LLM");

      const data = await res.json();
      console.log(data);
      setResponse(data); // Store the API response
    } catch (err) {
      console.log("there was an error in the api call to gemini");
    }
  };

  useEffect(() => {
    if (questionNumber == 4) {
      const s =
        "Q1: Let me see if i can help you out! Can you please tell me what kind of problem you're experiencing. Please make sure to tell me what part of your body is affected specifically, like your  neck, lower back, knee, et cetera" +
        ", A: " +
        recordedMessage[1] +
        " Q2: Gotcha, now jow would you describe the severity of your pain? For example, is it more of a dull ache or sharp consistent pain?" +
        ", A: " +
        recordedMessage[2] +
        " Q3: Thank you for letting me know. Finally, are there any activities or movements that trigger the pain or make it worse?" +
        ", A: " +
        recordedMessage[3] +
        ".";
      console.log(s);
      fetchTreatment(s);
    } else {
      console.log(questionNumber);
    }
  }, [recordedMessage]);

  const fakeSocketResponse = () => {
    console.log("cur resp" + socketResponse);
    setSocketResponse((prev) => prev + 1);
  };

  const toggleRecording = async () => {
    if (socketResponse == 0) {
      return;
    }
    if (!isRecording) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
        });
        const mediaRecorder = new MediaRecorder(stream);
        const audioChunks = [];

        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            audioChunks.push(event.data);
          }
        };

        mediaRecorder.onstop = async () => {
          console.log("Recording stopped, processing audio...");
          const audioBlob = new Blob(audioChunks, { type: "audio/wav" });
          setBlob(audioBlob); // Store the file in state

          console.log("Audio blob created:", audioBlob);

          const formData = new FormData();
          formData.append("file", audioBlob, "audio.webm");
          formData.append("model", "whisper-1");

          const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;

          try {
            console.log("Sending request to Whisper API...");
            const response = await fetch(
              "https://api.openai.com/v1/audio/transcriptions",
              {
                method: "POST",
                headers: {
                  Authorization: `Bearer ${OPENAI_API_KEY}`,
                },
                body: formData,
              }
            );

            if (!response.ok) {
              const errorData = await response.json();
              console.error("API Error:", errorData);
              throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            if (data.text) {
              updateDictionary(questionNumber, data.text);
            } else {
              updateDictionary(questionNumber, "did not receive answer");
            }

            console.log("Transcription result:", data);

            setQuestionNumber((prev) => prev + 1);
          } catch (error) {
            console.error("Error transcribing audio:", error);
            alert("Error transcribing audio. Please try again.");
          }
        };

        setAudioStream({ stream, mediaRecorder });
        mediaRecorder.start();
      } catch (error) {
        console.error("Error accessing microphone:", error);
      }
    } else if (audioStream) {
      audioStream.mediaRecorder.stop();
      audioStream.stream.getTracks().forEach((track) => track.stop());
    }
    setIsRecording(!isRecording);
  };

  return (
    <div className="fixed inset-0 z-10 flex flex-col justify-between p-8">
      Recording Status
      {isRecording && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
          <div className="flex items-center gap-3 bg-black/70 px-6 py-4 rounded-full border border-white/20">
            <div className="animate-pulse w-3 h-3 bg-red-500 rounded-full" />
            <span className="text-white">Recording...</span>
          </div>
        </div>
      )}
      {/* Input Area */}
      <div className="flex items-center gap-4 max-w-3xl mx-auto w-full">
        <div className="flex-1 relative">
          <button onClick={fakeSocketResponse}>
            {isRecording ? "Stop Recording" : "Start Recording"}
          </button>
        </div>
      </div>
      {blob && (
        <div>
          <audio controls src={URL.createObjectURL(blob)}></audio>
        </div>
      )}
    </div>
  );
};
