import '@tensorflow/tfjs-backend-webgl';
import * as blazeface from '@tensorflow-models/blazeface';
import * as tf from '@tensorflow/tfjs-core';
import tigerImageUrl from "./tiger.png"
import Stats from "stats.js"

const stats = new Stats()
document.body.appendChild(stats.dom)

/**
 * Loads a image from a URL and returns a HTMLImageElement.
 * @param src 
 * @returns 
 */
async function loadImage(src: string): Promise<HTMLImageElement> {
  const img = new Image()
  img.src = src
  return new Promise((resolve, reject) => {
    img.onload = () => resolve(img)
    img.onerror = reject
  })
}

/**
 * Setting parameters.
 * The rendering area is 512x512 square.
 */
const frameWidth = 512
const frameHeight = 512

async function main() {

  await tf.setBackend("webgl")
  const model = await blazeface.load();

  const tigerImage = await loadImage(tigerImageUrl)

  const mainCanvas = document.createElement("canvas")
  const mainContext = mainCanvas.getContext("2d")
  mainCanvas.style.height = "100vh"
  mainCanvas.style.width = "100vw"
  document.querySelector(".container")!.appendChild(mainCanvas)

  const cameraVideo = document.createElement("video");
  cameraVideo.addEventListener("playing", () => {
    mainCanvas.width = frameWidth
    mainCanvas.height = frameHeight
    mainCanvas.style.maxHeight = `calc(100vw * ${frameHeight / frameWidth})`
    mainCanvas.style.maxWidth = `calc(100vh * ${frameWidth / frameHeight})`
    requestAnimationFrame(process)
  })
  cameraVideo.style.position = "absolute";
  cameraVideo.style.right = "0"
  cameraVideo.style.top = "0"
  cameraVideo.style.width = "100px"
  document.body.appendChild(cameraVideo)

  if (navigator.mediaDevices.getUserMedia) {
    navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: "user"
      },
    })
    .then(function (stream) {
      cameraVideo.srcObject = stream;
      cameraVideo.play();
    })
    .catch(function (e) {
      console.log(e)
      console.log("Something went wrong!");
    });
  } else {
    alert("getUserMedia not supported on your browser!");
  }

  async function process () {
    stats.begin()
    const predictions = await model.estimateFaces(cameraVideo)
    if (predictions.length > 0) {
      const p = predictions[0]
      const topLeft = p.topLeft
      mainContext?.fill()
      const bottomRight = p.bottomRight
      if (Array.isArray(topLeft) && Array.isArray(bottomRight)) {
        const w = bottomRight[0] - topLeft[0]
        const h = bottomRight[1] - topLeft[1]
        let cropW = w
        let cropH = h
        let x = topLeft[0]
        let y = topLeft[1]
        if (w > h) {
          cropW = h
          x = topLeft[0] + (w - h) / 2
        } else {
          cropH = w
          y = topLeft[1] + (h - w) / 2
        }
        mainContext?.drawImage(cameraVideo, x, y, cropW, cropH, 171, 110, 170, 170)
        mainContext?.drawImage(tigerImage, 0, 0, tigerImage.width, tigerImage.height)
      }
    }
    stats.end()
    requestAnimationFrame(process)
  }
}
main()