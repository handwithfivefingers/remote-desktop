/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useRef, useState } from "react";
import io from "socket.io-client";
const socket = io("https://ef46e582e741.ngrok-free.app/remote-ctrl");
export default function App() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [selectedScreen, _setSelectedScreen] = useState({ id: "1" });
  const selectedScreenRef = useRef(selectedScreen);

  const setSelectedScreen = (newSelectedScreen: { id: string }) => {
    selectedScreenRef.current = newSelectedScreen;
    _setSelectedScreen(newSelectedScreen);
  };
  const rtcPeerConnection = useRef(
    new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.services.mozilla.com" }, { urls: "stun:stun.l.google.com:19302" }],
    })
  );

  const handleStream = (selectedScreen: { id: string }, stream: MediaStream) => {
    setSelectedScreen(selectedScreen);
    socket.emit("selectedScreen", selectedScreen);

    stream.getTracks().forEach((track) => {
      rtcPeerConnection.current.addTrack(track, stream);
    });
  };

  useEffect(() => {
    const getStream = async (selectedScreen: { id: string }) => {
      try {
        console.log("selectedScreen", selectedScreen);
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: {
            mandatory: {
              chromeMediaSource: "desktop",
              chromeMediaSourceId: selectedScreen.id,
            },
          } as MediaTrackConstraints & { mandatory: object },
        });
        handleStream(selectedScreen, stream);
      } catch (e) {
        console.log(e);
      }
    };

    // (window as any).electronAPI?.getScreenId((e: unknown, screenId: { id: string }) => {
    //   console.log("e", e);
    //   getStream(screenId);
    // }) || getUserMedia();

    if ((window as any).electronAPI?.getScreenId) {
      // Electron: Screen Sender (needs permission)
      (window as any).electronAPI.getScreenId((e: unknown, screenId: { id: string }) => {
        console.log("Electron screen ID:", screenId, e);
        getStream(screenId);
      });
    } else {
      // Browser: Pure Receiver (NO permission needed)
      console.log("Browser client - waiting to receive screen stream");
      // Don't call getUserMedia at all!
      rtcPeerConnection.current
        .createOffer({
          offerToReceiveVideo: true,
        })
        .then((sdp) => {
          rtcPeerConnection.current.setLocalDescription(sdp);
          socket.emit("offer", sdp);
        });
    }

    socket.on("offer", async (offerSDP) => {
      console.log("Browser received offer from Electron");
      try {
        await rtcPeerConnection.current.setRemoteDescription(new RTCSessionDescription(offerSDP));
        const answer = await rtcPeerConnection.current.createAnswer();
        await rtcPeerConnection.current.setLocalDescription(answer);
        console.log("Browser sending answer to Electron");
        socket.emit("answer", answer);
      } catch (error) {
        console.error("Error handling offer:", error);
      }
    });
    socket.on("answer", (answerSDP) => {
      console.log("Electron received answer from Browser");
      rtcPeerConnection.current.setRemoteDescription(new RTCSessionDescription(answerSDP));
    });

    socket.on("icecandidate", (icecandidate) => {
      console.log("icecandidate", icecandidate);
      rtcPeerConnection.current.addIceCandidate(new RTCIceCandidate(icecandidate));
    });

    socket.on("selectedScreen", (selectedScreen) => {
      setSelectedScreen(selectedScreen);
    });

    rtcPeerConnection.current.onicecandidate = (e) => {
      if (e.candidate) socket.emit("icecandidate", e.candidate);
    };

    rtcPeerConnection.current.oniceconnectionstatechange = (e) => {
      console.log(e);
    };

    rtcPeerConnection.current.ontrack = (e) => {
      console.log("Browser received screen stream from Electron");
      if (!videoRef.current) return;
      console.log("onTrack", e);
      videoRef.current.srcObject = e.streams[0];
      videoRef.current.onloadedmetadata = () => {
        if (videoRef.current) videoRef.current.play();
      };
    };
    console.log("rtcPeerConnection", rtcPeerConnection.current);
  }, []);

  const handleMouseClick = () => socket.emit("mouse_click", {});

  const handleMouseMove = ({ clientX, clientY }: { clientX: number; clientY: number }) => {
    try {
      console.log("emit mouse_move", clientX, clientY);
      socket.emit("mouse_move", {
        clientX,
        clientY,
        clientWidth: window.innerWidth,
        clientHeight: window.innerHeight,
      });
    } catch (error) {
      console.log("error", error);
    }
  };

  const [isFocus, setIsFocus] = useState(false);
  const handleKeyPress = (e: KeyboardEvent) => {
    if (!isFocus) return;
    console.log("e", e);
    socket.emit("keyPress", { button: e.key });
  };

  useEffect(() => {
    document.addEventListener("keyup", handleKeyPress);
    return () => {
      document.removeEventListener("keyup", handleKeyPress);
    };
  }, []);

  return (
    <div
      className={`flex gap-8 p-4 flex-col bg-red-50 ${isFocus ? "border-2 border-red-500" : ""}`}
      onClick={() => setIsFocus(true)}
    >
      <div className="w-full relative p-4" onClick={handleMouseClick} onMouseMove={handleMouseMove}>
        <span className="pb-[56.25%] block w-full rounded z-[1]" />
        <video ref={videoRef} className="video absolute top-0 left-0 w-full h-full " autoPlay muted>
          video not available
        </video>

        <canvas ref={canvasRef} className="absolute top-0 left-0 w-full h-full" />
      </div>
    </div>
  );
}
