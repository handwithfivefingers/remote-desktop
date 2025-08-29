import { useEffect, useRef, useState } from "react";
import { useSocket } from "../../hooks/useSocket";

export default function Client() {
  const socket = useSocket("https://d09053434fdb.ngrok-free.app/remote-ctrl");
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isReady, setIsReady] = useState(false);
  const rtcPeerConnection = useRef(
    new RTCPeerConnection({
      iceServers: [],
    })
  );

  useEffect(() => {
    const createOffer = async () => {
      try {
        const sdp = await rtcPeerConnection.current.createOffer({
          offerToReceiveVideo: true,
        });
        rtcPeerConnection.current.setLocalDescription(sdp);
        return sdp;
      } catch (error) {
        console.log("Error creating offer:", error);
      }
    };

    createOffer()
      .then((sdp) => {
        socket.emit("offer", sdp);
      })
      .catch((error) => {
        console.log("Error creating offer:", error);
      });

    // alert("Electron client - waiting to receive screen stream");

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

    rtcPeerConnection.current.onicecandidate = (e) => {
      if (e.candidate) socket.emit("icecandidate", e.candidate);
    };

    rtcPeerConnection.current.oniceconnectionstatechange = (pc) => {
      console.log("oniceconnectionstatechange", pc);
    };

    rtcPeerConnection.current.onconnectionstatechange = (pc: Event) => {
      const { target } = pc;
      if (
        (target as RTCPeerConnection).connectionState === "disconnected" ||
        (target as RTCPeerConnection).connectionState === "failed"
      ) {
        setIsReady(false);
      } else {
        setIsReady(true);
      }
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

    socket.on("close", () => {
      setIsReady(false);
    });

    return () => {
      socket.off("offer");
      socket.off("answer");
      socket.off("icecandidate");
      socket.off("close");
      rtcPeerConnection.current.onicecandidate = null;
      rtcPeerConnection.current.oniceconnectionstatechange = null;
      rtcPeerConnection.current.onconnectionstatechange = null;
      rtcPeerConnection.current.ontrack = null;
    };
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

  return (
    <div
      className={`flex gap-8 p-4 flex-col ${isFocus ? "border-2 border-red-500" : ""}`}
      onClick={() => setIsFocus(true)}
    >
      {!isReady && "Electron client - waiting to receive screen stream"}
      <div className="w-full relative p-4" onClick={handleMouseClick} onMouseMove={handleMouseMove}>
        <span className="pb-[56.25%] block w-full rounded z-[1]" />
        <video ref={videoRef} className="video absolute top-0 left-0 w-full h-full " autoPlay muted>
          video not available
        </video>
      </div>
    </div>
  );
}
