let video;
let poseNet;
let pose = null;
let skeleton = null;
let postureStatus = "Loading model...";

function hideLoadingScreen() {
  const loader = document.getElementById("loadingScreen");
  if (loader) {
    loader.style.display = "none";
  }
}

function setup() {
  // Create responsive p5 canvas
  const canvas = createCanvas(800, 500);
  canvas.parent(document.body);

  // Initialize webcam feed
  video = createCapture(VIDEO, () => {
    console.log("Webcam ready");
  });
  video.size(800, 500);
  video.hide();

  // Initialize PoseNet model
  poseNet = ml5.poseNet(video, () => {
    console.log("PoseNet Model Loaded Successfully");
    hideLoadingScreen();
    postureStatus = "Detecting...";
  });

  // Listen for pose detection events
  poseNet.on("pose", results => {
    if (results && results.length > 0) {
      pose = results[0].pose;
      skeleton = results[0].skeleton;
    } else {
      pose = null;
      skeleton = null;
    }
  });
}

function draw() {
  background(0);

  // Mirror the camera feed and pose drawings horizontally
  push();
  translate(width, 0);
  scale(-1, 1);
  image(video, 0, 0, width, height);

  if (pose) {
    drawKeypoints();
    drawSkeleton();
  }
  pop(); // Restore default coordinate system for text overlay

  // Posture evaluation
  if (pose) {
    detectPosture();
  } else {
    postureStatus = "⚠️ No Person Detected";
  }

  displayPosture();
}

// Draw keypoint dots on joints
function drawKeypoints() {
  fill(0, 255, 0);
  noStroke();

  for (let i = 0; i < pose.keypoints.length; i++) {
    let kp = pose.keypoints[i];
    if (kp.score > 0.5) {
      ellipse(kp.position.x, kp.position.y, 14);
    }
  }
}

// Draw skeleton connection lines
function drawSkeleton() {
  if (!skeleton) return;

  stroke(0, 255, 255);
  strokeWeight(6);
  strokeCap(ROUND);

  for (let i = 0; i < skeleton.length; i++) {
    let a = skeleton[i][0];
    let b = skeleton[i][1];

    line(
      a.position.x,
      a.position.y,
      b.position.x,
      b.position.y
    );
  }
}

// Evaluate shoulder balance and posture
function detectPosture() {
  let leftShoulder = pose.leftShoulder;
  let rightShoulder = pose.rightShoulder;

  // Check if both shoulder points are detected with good confidence
  if (
    leftShoulder &&
    rightShoulder &&
    leftShoulder.confidence > 0.5 &&
    rightShoulder.confidence > 0.5
  ) {
    let shoulderDiff = abs(leftShoulder.y - rightShoulder.y);

    if (shoulderDiff < 25) {
      postureStatus = "✅ Straight Posture";
    } else {
      postureStatus = "❌ Slouched / Tilted Posture";
    }
  } else {
    postureStatus = "⚠️ Adjust Position (Show Shoulders)";
  }
}

// Draw top status bar
function displayPosture() {
  fill(0, 190);
  noStroke();
  rect(0, 0, width, 45);

  textSize(22);
  textAlign(CENTER, CENTER);

  if (postureStatus.includes("Straight")) {
    fill(0, 255, 0);
  } else if (postureStatus.includes("Slouched")) {
    fill(255, 60, 60);
  } else {
    fill(255, 200, 0);
  }

  text(postureStatus, width / 2, 22);
}
