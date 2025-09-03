/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useRef, useState } from "react";
import { useSocket } from "../../hooks/useSocket";

interface IScreen {
  appIcon: string | null;
  display_id: string;
  id: string;
  name: string;
}

export default function Host() {
  console.log("Host rendered");
  const socket = useSocket("https://d09053434fdb.ngrok-free.app/remote-ctrl");
  const [selectedScreen, _setSelectedScreen] = useState({ id: "1" });
  const selectedScreenRef = useRef(selectedScreen);

  const setSelectedScreen = (newSelectedScreen: { id: string }) => {
    selectedScreenRef.current = newSelectedScreen;
    _setSelectedScreen(newSelectedScreen);
  };
  const rtcPeerConnection = useRef(
    new RTCPeerConnection({
      iceServers: [],
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

    if ((window as any).electronAPI?.getScreenId) {
      (window as any).electronAPI.getScreenId((e: unknown, screenId: { id: string }) => {
        console.log("Electron screen ID:", screenId, e);
        getStream(screenId);
      });
    } else {
      alert("Electron client - waiting to receive screen stream");
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

    console.log("rtcPeerConnection", rtcPeerConnection.current);

    return () => {
      socket.off("offer");
      socket.off("answer");
      socket.off("icecandidate");
      socket.off("selectedScreen");
      socket.emit("close");
      rtcPeerConnection.current.onicecandidate = null;
      rtcPeerConnection.current.oniceconnectionstatechange = null;
      rtcPeerConnection.current.onconnectionstatechange = null;
    };
  }, []);

  useEffect(() => {
    (window as any).electronAPI?.getScreens().then((r: IScreen[]) => {
      console.log("function", r);
      setScreen(r);
    });
  }, []);
  const [screens, setScreen] = useState<IScreen[]>([]);

  const onSelectScreen = (id: string) => {
    if ((window as any).electronAPI && (window as any).electronAPI?.selectScreen) {
      (window as any).electronAPI.selectScreen(id);
    }
  };
  return (
    <div className={`flex gap-8 p-4 flex-col`}>
      <div className="flex gap-8 justify-center ">
        {screens?.map((screen) => {
          return (
            <div
              key={screen.id}
              className={[
                "shadow border border-indigo-400 p-6  py-8 rounded-md cursor-pointer hover:bg-indigo-50",
                selectedScreen.id === screen.id ? "ring  ring-indigo-400 bg-indigo-50" : "bg-indigo-200 ",
              ].join(" ")}
              onClick={() => onSelectScreen(screen.id)}
            >
              <h2>{screen.name}</h2>
            </div>
          );
        })}
      </div>
      <span>
        You are the host Screen: <b>{selectedScreen.id}</b>
      </span>
    </div>
  );
}
