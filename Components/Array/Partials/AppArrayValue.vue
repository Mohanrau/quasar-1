<template>
  <label class="q-field row q-input q-field--outlined q-field--dense q-field--readonly">
    <div class="q-field__inner relative-position col self-stretch column justify-center">
      <div class="q-field__control relative-position row no-wrap">
        <div class="q-field__control-container col relative-position row no-wrap q-anchor--skip">

          <template v-if="field.$type === 'file'">
            <div class="q-field__native q-placeholder flex row">
              <div class="col-xs-9">{{ input }}</div>
              <div class="col-xs-3">
                <QIcon
                  size="1.8rem"
                  name="cloud_download"
                  class="cursor-pointer"
                  @click="download"
                />
              </div>
            </div>
          </template>

          <div
            v-else
            class="q-field__native q-placeholder"
            v-html="output"
          />
        </div>

      </div>
    </div>
  </label>
</template>

<script type="text/javascript">
import { QIcon } from 'quasar'

export default {
  /**
   */
  name: 'AppArrayValue',
  /**
   */
  components: { QIcon },
  /**
   */
  props: {
    // eslint-disable-next-line vue/require-prop-types
    value: {
      required: true
    },
    field: {
      type: Object,
      required: true
    }
  },
  /**
   */
  computed: {
    output () {
      if (typeof this.field.$layout.tableFormat === 'function') {
        return String(this.field.$layout.tableFormat(this.value))
      }

      if (typeof this.value !== 'undefined' && this.value !== null) {
        return String(this.value)
      }

      return ''
    },
    input () {
      if (typeof this.value !== 'string') {
        return ''
      }
      const name = this.$lang('agnostic.components.file.downloadName')
      const extension = this.value.split('.').pop()
      return `${name}.${extension}`
    }
  },
  methods: {
    /**
     */
    download () {
      const downloadFile = this.field?.attrs?.downloadFile
      if (typeof downloadFile !== 'function') {
        return
      }
      downloadFile(this.value)
    }
  }
}
</script>
