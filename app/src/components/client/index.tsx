import { useEffect, useMemo, useRef, useState } from "react";
import { InputController } from "../../hooks/useController";
import { useSocket } from "../../hooks/useSocket";

export default function Client() {
  const socket = useSocket(`https://20c64e33f1fa.ngrok-free.app/remote-ctrl`);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [screen, setScreenSize] = useState<{ width: number; height: number }>({ width: 0, height: 0 });

  const inputController = useMemo(() => {
    const ip = new InputController();
    return ip;
  }, []);
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

  const handleMouseMove = ({
    clientX,
    clientY,
    movementX,
    movementY,
  }: {
    clientX: number;
    clientY: number;
    movementX: number;
    movementY: number;
  }) => {
    try {
      if (!videoRef.current) return;
      const videoRect = videoRef.current.getBoundingClientRect();
      const mouseX = clientX - videoRect.left;
      const mouseY = clientY - videoRect.top;
      const clientWidth = videoRect.width;
      const clientHeight = videoRect.height;
      const ratioX = screen.width / clientWidth;
      const ratioY = screen.height / clientHeight;
      const hostX = mouseX * ratioX;
      const hostY = mouseY * ratioY;
      inputController.onMouseMove({ clientX, clientY, hostX, hostY, movementX, movementY });
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

    socket.on("selectedScreen", (selectedScreen: { displaySize: { width: number; height: number } }) => {
      setScreenSize(selectedScreen.displaySize);
    });

    return () => {
      socket.off("ping_check");
      clearInterval(interval);
    };
  }, []);

  // useEffect(() => {
  //   if (!isFocus) return;
  //   const keyPressEvent = (e: KeyboardEvent) => {
  //     console.log("e.key", e.key);
  //     const keys = [];
  //     if (e.ctrlKey) keys.push("ctrl");
  //     else if (e.shiftKey) keys.push("shift");
  //     else if (e.altKey) keys.push("alt");
  //     else if (e.metaKey) keys.push("ctrl");
  //     keys.push(e.key.toLowerCase());
  //     if (keys.length > 1) {
  //       socket.emit("key_combo", { button: keys });
  //     } else {
  //       socket.emit("key_press", { button: e.key });
  //     }
  //   };
  //   window.addEventListener("keydown", keyPressEvent);
  //   return () => {
  //     window.removeEventListener("keydown", keyPressEvent);
  //   };
  // }, [isFocus]);

  // const handleScroll = (e: React.WheelEvent<HTMLDivElement>) => {
  //   e.stopPropagation();
  //   socket.emit("mouse_scroll", {
  //     dx: Math.sign(e.deltaX),
  //     dy: -Math.sign(e.deltaY),
  //   });
  // };

  useEffect(() => {
    window.addEventListener("keydown", inputController.onKeyDown);
    window.addEventListener("keyup", inputController.onKeyUp);
    return () => {
      window.removeEventListener("keydown", inputController.onKeyDown);
      window.removeEventListener("keyup", inputController.onKeyUp);
    };
  }, []);

  console.log("inputController", inputController);

  return (
    <div
      className={`flex gap-8 p-4 flex-col overflow-hidden ${isFocus ? "border-2 border-red-500" : ""}`}
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
        onMouseDown={inputController.onMouseDown}
        onMouseUp={inputController.onMouseUp}
        onMouseMove={handleMouseMove}
        onWheel={inputController.onMouseWheel}
      >
        <span className="pb-[56.25%] block w-full rounded z-[1]" />
        <video ref={videoRef} className="video absolute top-0 left-0 w-full h-full " autoPlay muted>
          video not available
        </video>
      </div>
    </div>
  );
}
