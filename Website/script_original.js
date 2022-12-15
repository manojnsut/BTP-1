const video = document.getElementById('webcam');
const liveView = document.getElementById('liveView');
const demosSection = document.getElementById('demos');
const DEBUG = false;


const bodyPixProperties = {
  architecture: 'MobileNetV1',
  outputStride: 16,
  multiplier: 0.75,
  quantBytes: 4
};


const segmentationProperties = {
  flipHorizontal: false,
  internalResolution: 'high',
  segmentationThreshold: 0.9
};


const SEARCH_RADIUS = 300;
const SEARCH_OFFSET = SEARCH_RADIUS / 2;

const RESOLUTION_MIN = 20;


function processSegmentation(canvas, segmentation) {
  var ctx = canvas.getContext('2d');
  

  var imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  var data = imageData.data;
  
 
  var liveData = videoRenderCanvasCtx.getImageData(0, 0, canvas.width, canvas.height);
  var dataL = liveData.data;
  

  for (let x = RESOLUTION_MIN; x < canvas.width; x += RESOLUTION_MIN) {
    for (let y = RESOLUTION_MIN; y < canvas.height; y += RESOLUTION_MIN) {
     
      let n = y * canvas.width + x;
      
      let foundBodyPartNearby = false;
      
      
      let yMin = y - SEARCH_OFFSET;
      yMin = yMin < 0 ? 0: yMin;
      
      let yMax = y + SEARCH_OFFSET;
      yMax = yMax > canvas.height ? canvas.height : yMax;
      
      let xMin = x - SEARCH_OFFSET;
      xMin = xMin < 0 ? 0: xMin;
      
      let xMax = x + SEARCH_OFFSET;
      xMax = xMax > canvas.width ? canvas.width : xMax;
      
      for (let i = xMin; i < xMax; i++) {
        for (let j = yMin; j < yMax; j++) {
          
          let offset = j * canvas.width + i;
         
          if (segmentation.data[offset] !== 0) {
            foundBodyPartNearby = true;
            break;
          } 
        }
      }
      
       
      if (!foundBodyPartNearby) {
        for (let i = xMin; i < xMax; i++) {
          for (let j = yMin; j < yMax; j++) {
       
            let offset = j * canvas.width + i;

            data[offset * 4] = dataL[offset * 4];    
            data[offset * 4 + 1] = dataL[offset * 4 + 1];
            data[offset * 4 + 2] = dataL[offset * 4 + 2];
            data[offset * 4 + 3] = 255;            
          }
        }
      } else {
        if (DEBUG) {
          for (let i = xMin; i < xMax; i++) {
            for (let j = yMin; j < yMax; j++) {
             
              let offset = j * canvas.width + i;

              data[offset * 4] = 255;    
              data[offset * 4 + 1] = 0;
              data[offset * 4 + 2] = 0;
              data[offset * 4 + 3] = 255;            
            }
          } 
        }
      }

    }
  }
  ctx.putImageData(imageData, 0, 0);
}



var modelHasLoaded = false;
var model = undefined;

model = bodyPix.load(bodyPixProperties).then(function (loadedModel) {
  model = loadedModel;
  modelHasLoaded = true;

  demosSection.classList.remove('invisible');
});

var previousSegmentationComplete = true;

function hasGetUserMedia() {
  return !!(navigator.mediaDevices &&
    navigator.mediaDevices.getUserMedia);
}


function predictWebcam() {
  if (previousSegmentationComplete) {
  
    videoRenderCanvasCtx.drawImage(video, 0, 0);
    previousSegmentationComplete = false;

    model.segmentPerson(videoRenderCanvas, segmentationProperties).then(function(segmentation) {
      processSegmentation(webcamCanvas, segmentation);
      previousSegmentationComplete = true;
    });
  }

  window.requestAnimationFrame(predictWebcam);
}


function enableCam(event) {
  if (!modelHasLoaded) {
    return;
  }
  
 
  event.target.classList.add('removed');  
  

  const constraints = {
    video: true
  };

  navigator.mediaDevices.getUserMedia(constraints).then(function(stream) {
    video.addEventListener('loadedmetadata', function() {
 
      webcamCanvas.width = video.videoWidth;
      webcamCanvas.height = video.videoHeight;
      videoRenderCanvas.width = video.videoWidth;
      videoRenderCanvas.height = video.videoHeight;
      let webcamCanvasCtx = webcamCanvas.getContext('2d');
      webcamCanvasCtx.drawImage(video, 0, 0);
    });
    
    video.srcObject = stream;
    
    video.addEventListener('loadeddata', predictWebcam);
  });
}



var videoRenderCanvas = document.createElement('canvas');
var videoRenderCanvasCtx = videoRenderCanvas.getContext('2d');

var webcamCanvas = document.createElement('canvas');
webcamCanvas.setAttribute('class', 'overlay');
liveView.appendChild(webcamCanvas);

if (hasGetUserMedia()) {
  const enableWebcamButton = document.getElementById('webcamButton');
  enableWebcamButton.addEventListener('click', enableCam);
} else {
  console.warn('getUserMedia() is not supported by your browser');
}
