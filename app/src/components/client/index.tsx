import { useEffect, useRef, useState, type Key } from "react";
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

  const handleMouseClick = () => {
    console.log("Mouse Clicked");
    socket.emit("mouse_click", {
      button: "left",
    });
  };
  const handleMouseMove = ({ clientX, clientY }: { clientX: number; clientY: number }) => {
    try {
      console.log("emit mouse_move", clientX, clientY);
      if (!videoRef.current) return;
      const videoRect = videoRef.current.getBoundingClientRect();

      // Mouse position relative to the video element
      const mouseX = clientX - videoRect.left;
      const mouseY = clientY - videoRect.top;

      socket.emit("mouse_move", {
        clientX: mouseX,
        clientY: mouseY,
        clientWidth: videoRect.width,
        clientHeight: videoRect.height,
      });
    } catch (error) {
      console.log("error", error);
    }
  };

  const [isFocus, setIsFocus] = useState(false);
  const latencyRef = useRef<HTMLSpanElement>(null);
  const rtcLatencyRef = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    socket.on("ping_check", (lastPing) => {
      const latency = Date.now() - lastPing;
      if (latencyRef.current) {
        latencyRef.current.innerHTML = `${latency} ms`;
      }
    });

    async function getWebRTCLatency(peerConnection: RTCPeerConnection) {
      const stats = await peerConnection.getStats(null);
      stats.forEach((report) => {
        if (report.type === "inbound-rtp" && report.kind === "video") {
          if (report.jitterBufferDelay && report.jitterBufferEmittedCount > 0) {
            const avgDelaySec = report.jitterBufferDelay / report.jitterBufferEmittedCount;

            if (!rtcLatencyRef.current) return;
            rtcLatencyRef.current.innerHTML = `${(avgDelaySec * 1000).toFixed(2)} ms`;
          }
        }
      });
    }
    let interval: number | null = null;
    interval = setInterval(() => getWebRTCLatency(rtcPeerConnection.current), 250);

    return () => {
      socket.off("ping_check");
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    if (!isFocus) return;
    const keyPressEvent = (e: KeyboardEvent) => {
      console.log('e.key', e.key);
      socket.emit("key_press", { button: e.key });
    };
    window.addEventListener("keydown", keyPressEvent);
    return () => {
      window.removeEventListener("keydown", keyPressEvent);
    };
  }, [isFocus]);

  return (
    <div
      className={`flex gap-8 p-4 flex-col ${isFocus ? "border-2 border-red-500" : ""}`}
      onClick={() => setIsFocus(true)}
    >
      <div className="h-12 flex justify-between bg-amber-600/20 rounded-xl">
        <div>{!isReady && "Electron client - waiting to receive screen stream"}</div>
        <div className="bg-neutral-200 w-40 flex items-center justify-center flex-col">
          <div>
            <span className="bg-green-300 h-2 w-2" />
            <span ref={latencyRef} />
          </div>
          <div>
            <span className="bg-green-300 h-2 w-2" />
            <span ref={rtcLatencyRef} />
          </div>
        </div>
      </div>
      <div
        className="w-full relative ring ring-amber-600 rounded-lg"
        onClick={handleMouseClick}
        onMouseMove={handleMouseMove}
      >
        <span className="pb-[56.25%] block w-full rounded z-[1]" />
        <video ref={videoRef} className="video absolute top-0 left-0 w-full h-full " autoPlay muted>
          video not available
        </video>
      </div>
    </div>
  );
}
