import field from 'src/settings/field'
import { searchKey } from 'src/settings/schema'
import action from 'src/settings/action'

import Base from './Base'
import { clone, objectToFormData, set, unique, withSeparator } from '../Util/general'
import { OPERATORS } from 'src/app/Agnostic/enum'

/**
 * @class {Skeleton}
 */
export default class Skeleton extends Base {
  /**
   * @type {Boolean}
   */
  safe = true

  /**
   * @type {string}
   */
  groupType = 'sections'

  /**
   * @param {string} $key
   * @param {string} label
   * @param {*} type
   * @returns {Schema|Skeleton}
   */
  addField ($key, label = '', type = undefined) {
    if (this.__fields[$key]) {
      throw new Error(`Field '${$key}' already exists`)
    }
    this.__currentField = $key

    const is = this.is
    const attrs = {
      value: undefined,
      disable: false
    }

    const keydown = function ({ $event, field }) {
      if (!field.chars) {
        return
      }

      const key = String($event.key)
      if (key.length > 1) {
        return
      }
      const regex = new RegExp(field.chars)
      if (!regex.test(key)) {
        $event.preventDefault()
        $event.stopPropagation()
      }
    }

    const on = {
      keydown: [keydown]
    }
    const order = Object.keys(this.__fields).length
    const options = {
      label,
      order,
      type,
      scopes: this.scopes
    }

    this.__fields[$key] = field($key, options, attrs, on)
    this.setComponent(is)
    return this
  }

  /**
   * @param {string} $key
   * @returns {Schema|Skeleton}
   */
  getField ($key) {
    if (!this.__fields[$key]) {
      throw new Error(`Field '${$key}' not exists`)
    }
    this.__currentField = $key
    return this
  }

  /**
   * @returns {Object}
   */
  getFields () {
    if (this.safe) {
      return this.$clone(this.__fields)
    }
    return this.__fields
  }

  /**
   * @param {string} id
   * @param {string} label
   * @returns {Schema|Skeleton}
   */
  addAction (id, label = '') {
    if (this.__actions[id]) {
      throw new Error(`Action '${id}' already exists`)
    }
    this.__currentAction = id

    const schema = this
    const handler = function ({ context }) {
      if (!schema[id]) {
        return
      }
      if (typeof schema[id] === 'function') {
        schema[id].call(this, context)
      }
    }
    const order = Object.keys(this.__actions).length
    const scopes = this.scopes
    const positions = []
    const classNames = []
    const attrs = {
      label,
      color: this.constructor.buttons.color,
      textColor: this.constructor.buttons.textColor
    }

    this.__actions[id] = action(id, handler, order, scopes, positions, attrs, classNames)
    return this
  }

  /**
   * @param {string} id
   * @returns {Schema|Skeleton}
   */
  actionClone (id) {
    this.__actions[this.__currentAction] = this.$clone(this.__actions[id])
    return this
  }

  /**
   * @param {string} id
   * @returns {Schema|Skeleton}
   */
  getAction (id) {
    if (!this.__actions[id]) {
      throw new Error(`Action '${id}' not exists`)
    }
    this.__currentAction = id
    return this
  }

  /**
   * @param {string} id
   * @returns {Schema|Skeleton}
   */
  removeAction (id) {
    if (!this.__actions[id]) {
      throw new Error(`Action '${id}' not exists`)
    }
    delete this.__actions[id]
    return this
  }

  /**
   * @param {string[]} actionIds
   * @returns {Schema|Skeleton}
   */
  removeActions (actionIds) {
    for (const id in this.__actions) {
      if (!actionIds.includes(id)) {
        continue
      }
      delete this.__actions[id]
    }
    return this
  }

  /**
   * @param {string[]} actionIds
   * @returns {Schema|Skeleton}
   */
  removeExceptActions (actionIds) {
    for (const id in this.__actions) {
      if (actionIds.includes(id)) {
        continue
      }
      delete this.__actions[id]
    }
    return this
  }

  /**
   * @returns {Array}
   */
  getActions () {
    if (this.safe) {
      return this.$clone(Object.values(this.__actions))
    }
    return Object.values(this.__actions)
  }

  /**
   * @param {string} name
   * @param {function} handler
   * @returns {Schema|Skeleton}
   */
  addHook (name, handler) {
    this.__hooks[name] = handler
    return this
  }

  /**
   * @param {string} name
   * @returns {Schema|Skeleton}
   */
  removeHook (name) {
    delete this.__hooks[name]
    return this
  }

  /**
   * @returns {Object}
   */
  getHooks () {
    if (this.safe) {
      return this.$clone(this.__hooks)
    }
    return this.__hooks
  }

  /**
   * @param {string} name
   * @param {function} handler
   * @param {Options} options
   * @returns {Schema|Skeleton}
   */
  addWatch (name, handler, options = {}) {
    if (!this.__watches[name]) {
      this.__watches[name] = []
    }

    this.__watches[name].push({
      handler,
      options
    })
    return this
  }

  /**
   * @returns {Object}
   */
  getWatches () {
    if (this.safe) {
      return this.$clone(this.__watches)
    }
    return this.__watches
  }

  /**
   * @param {string} id
   * @param {Object} options
   * @returns {Schema|Skeleton}
   */
  addGroup (id, options = {}) {
    this.__groups[id] = {
      label: this.$lang(`domains.${this.constructor.domain}.groups.${id}`),
      ...options
    }
    return this
  }

  /**
   * @returns {Object}
   */
  getGroups () {
    if (this.safe) {
      return this.$clone(this.__groups)
    }
    return this.__groups
  }

  /**
   * @param {string} field
   * @returns {Schema|Skeleton}
   */
  addAvoid (field) {
    this.__avoids.push(field)
    return this
  }

  /**
   * @returns {Schema|Skeleton}
   */
  fieldAvoid () {
    this.__avoids.push(this.__currentField)
    return this
  }

  /**
   * @return {Array}
   */
  getAvoids () {
    return this.__avoids
  }

  /**
   * @param {Object} record
   * @param {boolean} creating
   * @return {Object}
   */
  prepareRecord (record, creating = false) {
    let data = clone(record)

    if (creating && !this.constructor.useUuid) {
      delete data[this.primaryKey]
    }

    let useDotNotation = false
    let useFormData = false

    const reducer = (accumulator, entry) => {
      const [field, value] = entry
      if (field.indexOf('.') !== -1) {
        useDotNotation = true
      }
      if (value instanceof File) {
        useFormData = true
      }
      if (!this.__avoids.includes(field)) {
        accumulator[field] = value
      }
      return accumulator
    }
    data = Object.entries(data).reduce(reducer, {})

    if (useDotNotation) {
      const applyDotNotation = (accumulator, entry) => {
        const [field, value] = entry
        accumulator = set(accumulator, field, value)
        return accumulator
      }
      data = Object.entries(data).reduce(applyDotNotation, {})
    }

    if (useFormData) {
      data = objectToFormData(data)
    }

    return data
  }

  /**
   * @param {string} $key
   * @return {Schema|Skeleton}
   */
  addSeparator ($key = undefined) {
    const field = $key || unique()
    const path = `separators.${field}`
    const label = this.$lang(`domains.${this.constructor.domain}.${path}`)

    this.addAvoid(path)
    this.addField(path)
      .setIs('AppSeparator')
      .setAttrs({ label })
    return this
  }

  // noinspection JSMethodCanBeStatic
  /**
   * @returns {Object}
   */
  tableEvents () {
    return {}
  }

  // noinspection JSMethodCanBeStatic
  /**
   * @returns {Object}
   */
  formEvents () {
    return {}
  }

  /**
   * @param {Object} options
   * @returns {Object}
   */
  provideArray (options = {}) {
    const fields = this.arrayFields ? this.arrayFields(this.getFields()) : this.$clone(this.getFields())
    return {
      schema: this.constructor.name,
      domain: this.constructor.domain,
      primaryKey: this.primaryKey,
      displayKey: this.displayKey,
      fields: fields,
      ...options
    }
  }

  /**
   * @param {Object} options
   * @returns {*}
   */
  provideRemote (options = {}) {
    const fields = this.remoteFields ? this.remoteFields(this.getFields()) : this.$clone(this.getFields())
    let { widget, path, query } = options
    if (widget === undefined) {
      widget = false
    }
    if (path === undefined) {
      path = ''
    }
    return {
      schema: this.constructor.name,
      widget: widget,
      path: path,
      query: query,
      keyValue: this.primaryKey,
      keyLabel: this.displayKey,
      domain: this.constructor.domain,
      format: (row, value) => value,
      fields: fields,
      remote: (filter, pagination = undefined, query = {}) => {
        const where = {
          ...query,
          [this.displayKey]: withSeparator(filter, OPERATORS.LIKE)
        }
        const parameters = { [searchKey]: where }

        if (pagination) {
          return this.$service()
            .paginate({ ...parameters, pagination })
        }

        // noinspection JSCheckFunctionSignatures
        return this.$service()
          .paginate(parameters)
          .then((response) => response.rows)
      }
    }
  }

  /**
   * @param {string} masterKey
   * @returns {*}
   */
  provideDetail (masterKey) {
    if (!this.constructor.activateEmbed) {
      throw new Error(`Embed is not active on this schema (${this.constructor.domain})`)
    }

    return {
      schema: this.constructor.name,
      masterKey: masterKey,
      groupType: this.groupType,
      domain: this.constructor.domain,
      settings: {
        toast: this.useToast,
        uuid: this.useUuid
      },
      primaryKey: this.primaryKey,
      displayKey: this.displayKey,
      hooks: () => this.getHooks(),
      actions: () => this.getActions(),
      groups: () => this.getGroups(),
      fields: () => this.getFields(),
      watches: () => this.getWatches()
    }
  }

  /**
   * @param {Object} attrs
   * @return {Object}
   */
  provideBuiltIn (attrs = {}) {
    if (!this.constructor.activateBuiltIn) {
      throw new Error(`BuiltIn is not active on this schema (${this.constructor.domain})`)
    }
    return {
      ...this.provide(),
      defaults: {},
      ...attrs
    }
  }

  /**
   * @returns {Object}
   */
  provide () {
    const table = {
      title: this.titleTable,
      on: this.tableEvents()
    }
    const form = {
      title: this.titleForm,
      on: this.formEvents()
    }
    return {
      schema: this.constructor.name,
      groupType: this.groupType,
      path: this.constructor.path,
      domain: this.constructor.domain,
      settings: {
        toast: this.useToast,
        uuid: this.useUuid
      },
      table: Object.assign(table, this.table),
      form: Object.assign(form, this.form),
      primaryKey: this.primaryKey,
      displayKey: this.displayKey,
      hooks: () => this.getHooks(),
      actions: () => this.getActions(),
      groups: () => this.getGroups(),
      fields: () => this.getFields(),
      watches: () => this.getWatches()
    }
  }
}
