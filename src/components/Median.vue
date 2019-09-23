<template>
  <div>
    <!-- <h1 class="title is-1">Median Filter</!-->

    <input type="file" class="input" @change="readImages" />

    <br />

    <img :src="originalImg" />
    <br />
    <img :src="modifiedImg" />
    <br />
    <canvas ref="canvas" :width="canvasWidth" :height="canvasHeight" />

    <br />

    <div class="field is-grouped">
      <div class="control">
        <input
          v-model="threshold"
          class="input"
          type="number"
          min="0"
          step="1"
        />
      </div>
      <div class="control">
        <input v-model="x" class="input" type="number" min="0" step="1" />
      </div>
      <div class="control">
        <input v-model="y" class="input" type="number" min="0" step="1" />
      </div>
    </div>

    <strong>{{ barcode }}</strong>

    <!-- <br />

    {{ $data }} -->
  </div>
</template>

<script>
const Jimp = require('jimp')
const jbr = require('javascript-barcode-reader')

/* type {CanvasRenderingContext2d} */
let context2D

function getOtsuThreshold(histogram, width, height) {
  let prbn = 0.0 // First order cumulative
  let meanitr = 0.0 // Second order cumulative
  let meanglb = 0.0 // Global mean level
  let OPT_THRESH_VAL = 0 // Optimum threshold value
  let param1
  let param2 // Parameters required to work out OTSU threshold algorithm
  let param3 = 0.0
  let hist_val = []

  //Normalise histogram values and calculate global mean level
  for (let i = 0; i < 256; i += 1) {
    hist_val[i] = histogram[i] / (width * height)
    meanglb += i * hist_val[i]
  }

  // Implementation of OTSU algorithm
  for (let i = 0; i < 256; i += 1) {
    prbn += hist_val[i]
    meanitr += i * hist_val[i]

    param1 = meanglb * prbn - meanitr
    param2 = (param1 * param1) / (prbn * (1.0 - prbn))

    if (param2 > param3) {
      param3 = param2
      OPT_THRESH_VAL = i // Update the "Weight/Value" as Optimum Threshold value
    }
  }

  return OPT_THRESH_VAL
}

import Vue from 'vue'
export default Vue.extend({
  data() {
    return {
      x: 1,
      y: 0,
      threshold: 127,
      originalImg: '',
      modifiedImg: '',
      barcode: '',
      canvasHeight: 256,
      canvasWidth: 256 * 10,
      histogram: []
    }
  },

  watch: {
    threshold() {
      this.drawImages()
    },

    x() {
      this.drawImages()
    },

    y() {
      this.drawImages()
    },

    histogram() {
      context2D.clearRect(0, 0, this.canvasWidth, this.canvasHeight)

      const histo = this.histogram.filter(val => val)
      // .sort((a, b) => {
      //   return a - b
      // })
      const max = histo[histo.length - 1]

      this.histogram.forEach((count, index) => {
        const scaled = (this.canvasHeight * count) / max

        if (index === parseInt(this.threshold, 10)) {
          context2D.fillStyle = 'red'
        }

        context2D.fillRect(index * 3, this.canvasHeight - scaled, 2, scaled)

        context2D.fillStyle = 'black'
      })
    }
  },

  mounted() {
    context2D = this.$refs.canvas.getContext('2d')
  },

  methods: {
    readImages(evt) {
      const { files } = evt.target
      if (files.length === 0) return

      const file = files[0]
      this.originalImg = URL.createObjectURL(file)
      this.modifiedImg = this.originalImg
      this.drawImages()
    },

    drawImages() {
      let threshold = this.threshold
      this.histogram = []

      Jimp.read(this.originalImg, (e, image) => {
        const histogram = new Array(256).fill(0)

        // apply threshold
        image.scan(0, 0, image.bitmap.width, image.bitmap.height, function(
          x,
          y,
          idx
        ) {
          let r = this.bitmap.data[idx + 0]
          let g = this.bitmap.data[idx + 1]
          let b = this.bitmap.data[idx + 2]

          // let v = Math.round(0.2126 * r + 0.7152 * g + 0.0722 * b)
          let v = (r + g + b) / 3

          //create histogram
          histogram[v] += 1

          v = v >= threshold ? 255 : 0

          this.bitmap.data[idx + 0] = v
          this.bitmap.data[idx + 1] = v
          this.bitmap.data[idx + 2] = v
        })

        // extract barcode
        jbr(
          {
            data: [...image.bitmap.data],
            width: image.bitmap.width,
            height: image.bitmap.height
          },
          {
            barcode: 'code-128'
          }
        )
          .then(barcode => {
            this.barcode = barcode
          })
          .catch(err => console.error(err))

        // update image preview
        image.getBase64Async(Jimp.MIME_PNG).then(modifiedImg => {
          this.modifiedImg = modifiedImg
        })
      })
    }
  }
})
</script>

<style scoped>
img,
canvas {
  border: 1px solid red;
}
</style>
