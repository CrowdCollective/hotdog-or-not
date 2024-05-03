import {
  pipeline,
  env
} from 'https://cdn.jsdelivr.net/npm/@xenova/transformers@2.6.0'

// Since we will download the model from the Hugging Face Hub, we can skip the local model check
env.allowLocalModels = false

// Reference the elements that we will need
const status = document.getElementById('status')
const fileUpload = document.getElementById('file-upload')
const imageContainer = document.getElementById('image-container')
// Create a reference to the worker object.
var worker = null

// Create a new object detection pipeline
status.textContent = 'Loading model...'
status.style.color = 'black'
const detector = await pipeline('object-detection', 'Xenova/detr-resnet-50')
const classifier = await pipeline(
  'zero-shot-image-classification',
  'Xenova/clip-vit-large-patch14-336'
)

status.innerHTML = 'Ready'
status.style.color = 'green'

fileUpload.addEventListener('change', function (e) {
  const file = e.target.files[0]
  if (!file) {
    return
  }

  const reader = new FileReader()

  // Set up a callback when the file is loaded
  reader.onload = function (e2) {
    imageContainer.innerHTML = ''
    const image = document.createElement('img')
    image.src = e2.target.result
    imageContainer.appendChild(image)
    detect(image)
    isHotDog(image)
  }
  reader.readAsDataURL(file)
})

async function isHotDog (img) {
  status.innerHTML =
    'Analysing... <img id="svg-spinner" src="img/loading-spinner.svg" />'
  status.style.color = 'black'

  const output = await classifier(
    img.src,
    ['cat', 'dog', 'hot dog', 'sausage'],
    {
      hypothesis_template: 'a {}'
    }
  )

  console.log(output)
  var isHotDog = false
  for (let i = 0; i < output.length; i++) {
    if (output[i].label === 'hot dog' && output[i].score > 0.78) {
      console.log(output[i])
      isHotDog = true
    }
  }

  if (isHotDog) {
    status.textContent = 'Hot dog'
    status.style.color = 'green'
  } else {
    status.textContent = 'Not hot dog'
    status.style.color = 'red'
  }
}

// Detect objects in the image
async function detect (img) {
  const output = await detector(img.src, {
    threshold: 0.5,
    percentage: true
  })
  output.forEach(renderBox)
}

// Render a bounding box and label on the image
function renderBox ({ box, label }) {
  const { xmax, xmin, ymax, ymin } = box

  // Generate a random color for the box
  const color =
    '#' +
    Math.floor(Math.random() * 0xffffff)
      .toString(16)
      .padStart(6, 0)

  // Draw the box
  const boxElement = document.createElement('div')
  boxElement.className = 'bounding-box'
  Object.assign(boxElement.style, {
    borderColor: color,
    left: 100 * xmin + '%',
    top: 100 * ymin + '%',
    width: 100 * (xmax - xmin) + '%',
    height: 100 * (ymax - ymin) + '%'
  })

  // Draw label
  const labelElement = document.createElement('span')
  labelElement.textContent = label
  labelElement.className = 'bounding-box-label'
  labelElement.style.backgroundColor = color

  boxElement.appendChild(labelElement)
  imageContainer.appendChild(boxElement)
}
