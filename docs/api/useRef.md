# useRef()

Creates a ref object for accessing DOM elements or component instances directly.

```tsx
const ref = useRef();
```

## Example

```tsx
import { useRef } from "rask-ui";

function Example() {
  const inputRef = useRef<HTMLInputElement>();

  const focus = () => {
    inputRef.current?.focus();
  };

  return () => (
    <div>
      <input ref={inputRef} type="text" />
      <button onClick={focus}>Focus Input</button>
    </div>
  );
}
```

## Usage

Pass the ref to an element's `ref` prop. The `current` property will be set to the DOM element when mounted and `null` when unmounted.

## assignRef()

A helper utility for manually assigning the value of a ref. This is useful when a child component wants to expose an API to its parent component.

```tsx
import { assignRef, useRef, type Ref } from "rask-ui";

interface VideoPlayerAPI {
  play: () => void;
  pause: () => void;
  seek: (time: number) => void;
}

function VideoPlayer({ apiRef }: { apiRef?: Ref<VideoPlayerAPI> }) {
  const videoRef = useRef<HTMLVideoElement>();

  // Create the API object
  const api: VideoPlayerAPI = {
    play: () => videoRef.current?.play(),
    pause: () => videoRef.current?.pause(),
    seek: (time: number) => {
      if (videoRef.current) {
        videoRef.current.currentTime = time;
      }
    },
  };

  // Assign the API to the parent's ref
  if (apiRef) {
    assignRef(apiRef, api);
  }

  return () => <video ref={videoRef} src="video.mp4" />;
}

function ParentComponent() {
  const playerRef = useRef<VideoPlayerAPI>();

  const handlePlay = () => {
    playerRef.current?.play();
  };

  const handleSeek = () => {
    playerRef.current?.seek(30);
  };

  return () => (
    <div>
      <VideoPlayer apiRef={playerRef} />
      <button onClick={handlePlay}>Play</button>
      <button onClick={handleSeek}>Seek to 30s</button>
    </div>
  );
}
```

## TypeScript

```tsx
// Generic type parameter for specific element types
const inputRef = useRef<HTMLInputElement>();
const divRef = useRef<HTMLDivElement>();
const buttonRef = useRef<HTMLButtonElement>();

// Use the Ref type when passing refs as props
import { type Ref } from "rask-ui";

interface Props {
  inputRef: Ref<HTMLInputElement>;
}
```
