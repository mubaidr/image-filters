<template>
  <div>
    <h1 class="title is-1">Median Filter</h1>

    <input type="file" @change="readImages" />

    <br />

    <img :src="originalImg" />
    <br />
    <img :src="modifiedImg" />

    <br />

    <div class="field is-grouped">
      <div class="control">
        <input
          class="input"
          type="number"
          min="0"
          step="1"
          v-model="threshold"
        />
      </div>
      <div class="control">
        <input class="input" type="number" min="0" step="1" v-model="x" />
      </div>
      <div class="control">
        <input class="input" type="number" min="0" step="1" v-model="y" />
      </div>
    </div>

    <strong>{{ barcode }}</strong>

    <br />

    {{ $data }}
  </div>
</template>

<script>
const Jimp = require("jimp")
const jbr = require("javascript-barcode-reader")

import Vue from "vue"
export default Vue.extend({
  data() {
    return {
      x: 1,
      y: 0,
      threshold: 127,
      originalImg: "",
      modifiedImg: "",
      barcode: ""
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
    }
  },

  mounted() {},

  methods: {
    readImages(evt) {
      const file = evt.target.files[0]

      this.originalImg = URL.createObjectURL(file)
      this.drawImages()
    },

    drawImages() {
      let threshold = this.threshold

      Jimp.read(this.originalImg, async (e, image) => {
        image.scan(0, 0, image.bitmap.width, image.bitmap.height, function(
          x,
          y,
          idx
        ) {
          let r = this.bitmap.data[idx + 0]
          let g = this.bitmap.data[idx + 1]
          let b = this.bitmap.data[idx + 2]
          // let alpha = this.bitmap.data[idx + 3]

          let v = 0.2126 * r + 0.7152 * g + 0.0722 * b

          this.bitmap.data[idx + 0] = this.bitmap.data[
            idx + 1
          ] = this.bitmap.data[idx + 2] = v >= threshold ? 255 : 0
        })

        jbr(
          {
            data: image.bitmap.data,
            width: image.bitmap.width,
            height: image.bitmap.height
          },
          {
            barcode: "code-128"
          }
        )
          .then(barcode => {
            this.barcode = barcode
          })
          .catch(err => console.error)

        this.modifiedImg = await image.getBase64Async(Jimp.MIME_PNG)
      })
    }
  }
})
</script>

<style scoped>
img {
  border: 1px solid red;
}
</style>
