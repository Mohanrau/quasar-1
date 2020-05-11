import SchemaField from './Mixins/SchemaFormField'

/**
 * @component {SchemaFormComponents}
 */
export default {
  /**
   */
  name: 'SchemaFormComponents',
  /**
   */
  mixins: [
    SchemaField
  ],
  /**
   */
  props: {
    fields: {
      type: Object,
      default: () => ({})
    },
    domain: {
      type: String,
      required: true
    },
    schema: {
      type: String,
      required: true
    }
  },
  /**
   * @param {function} h
   * @returns {*}
   */
  render (h) {
    const data = { class: 'form form-grid' }
    const children = Object.values(this.fields).map((field) => this.renderField(h, field))

    return h('div', data, children)
  }
}
